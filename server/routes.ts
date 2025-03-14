import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertTransactionSchema, insertDisputeSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Use JSON parser for all non-webhook routes
const jsonParser = express.json();
const webhookParser = express.raw({ type: 'application/json' });

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is an admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Admin access required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // User lookup route
  app.get("/api/user/:identifier", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      // Try to find user by username first
      let user = await storage.getUserByUsername(identifier);
      
      // If not found, try by email
      if (!user) {
        user = await storage.getUserByEmail(identifier);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error finding user" });
    }
  });

  // User balance routes
  app.get("/api/balance", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json({ balance: user.balance });
    } catch (error) {
      res.status(500).json({ message: "Error fetching balance" });
    }
  });
  
  // Transaction history endpoint for balance page
  app.get("/api/balance/history", isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      
      // Transform transactions into the format needed for the balance page
      const transactionHistory = transactions.map(transaction => {
        const isCredit = 
          (transaction.buyerId === req.user.id && transaction.status === 'cancelled') ||
          (transaction.sellerId === req.user.id && transaction.status === 'completed');
        
        const isDebit = 
          (transaction.buyerId === req.user.id && 
           (transaction.status === 'pending' || 
            transaction.status === 'in_progress' || 
            transaction.status === 'awaiting_delivery' || 
            transaction.status === 'ready_for_release' || 
            transaction.status === 'completed'));
        
        const type = isCredit ? 'credit' : (isDebit ? 'debit' : 'pending');
        
        let description = transaction.title;
        if (transaction.buyerId === req.user.id) {
          description = `Payment for: ${transaction.title}`;
        } else if (transaction.sellerId === req.user.id) {
          description = `Received payment for: ${transaction.title}`;
        }
        
        if (transaction.status === 'cancelled') {
          description = `Refund for cancelled transaction: ${transaction.title}`;
        }
        
        return {
          id: transaction.id,
          type,
          description,
          amount: transaction.amount,
          date: transaction.createdAt,
        };
      });
      
      res.json(transactionHistory);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction history" });
    }
  });
  
  // Create Stripe payment intent
  app.post("/api/balance/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects amounts in cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: req.user?.id.toString(),
          type: 'balance_add'
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Error creating payment intent" 
      });
    }
  });

  // Stripe webhook to handle successful payments
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig || '',
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Invalid signature'}`);
      return;
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const userId = parseInt(paymentIntent.metadata.userId);
      const amount = paymentIntent.amount / 100; // Convert back from cents

      if (paymentIntent.metadata.type === 'balance_add') {
        try {
          const user = await storage.getUser(userId);
          if (!user) {
            throw new Error('User not found');
          }
          const newBalance = user.balance + amount;
          await storage.updateUserBalance(userId, newBalance);
        } catch (error) {
          console.error('Error processing successful payment:', error);
          res.status(500).json({ message: "Error processing payment" });
          return;
        }
      }
    }

    res.json({ received: true });
  });

  // Transaction routes
  app.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      // Check balance if user is buyer
      if (req.user.id === validatedData.buyerId) {
        if (req.user.balance < validatedData.amount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }
        
        // Create transaction
        const transaction = await storage.createTransaction(validatedData);
        
        // Create escrow
        await storage.createEscrow({
          transactionId: transaction.id,
          amount: transaction.amount
        });
        
        // Deduct from buyer's balance
        const newBalance = req.user.balance - transaction.amount;
        await storage.updateUserBalance(req.user.id, newBalance);
        
        res.status(201).json(transaction);
      } else {
        // If user is seller, just create the transaction
        const transaction = await storage.createTransaction(validatedData);
        res.status(201).json(transaction);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating transaction" });
      }
    }
  });
  
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });
  
  app.get("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(parseInt(req.params.id));
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Check if user is involved in the transaction
      if (transaction.buyerId !== req.user.id && transaction.sellerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to view this transaction" });
      }
      
      // Get escrow information
      const escrow = await storage.getEscrowByTransactionId(transaction.id);
      
      // Get dispute information
      const dispute = await storage.getDisputeByTransactionId(transaction.id);
      
      // Get review information
      const review = await storage.getTransactionReview(transaction.id);
      
      res.json({
        transaction,
        escrow,
        dispute,
        review
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction details" });
    }
  });
  
  app.put("/api/transactions/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const transactionId = parseInt(req.params.id);
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Check if user is allowed to update status
      if (transaction.buyerId !== req.user.id && transaction.sellerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to update this transaction" });
      }
      
      // Update transaction status
      const updatedTransaction = await storage.updateTransactionStatus(transactionId, status);
      
      res.json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ message: "Error updating transaction status" });
    }
  });

  // Escrow routes
  app.post("/api/transactions/:id/release", isAuthenticated, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Only buyer or admin can release funds
      if (transaction.buyerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only buyer or admin can release funds" });
      }
      
      const escrow = await storage.getEscrowByTransactionId(transactionId);
      if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
      }
      
      if (escrow.released) {
        return res.status(400).json({ message: "Funds already released" });
      }
      
      // Release escrow
      await storage.releaseEscrow(escrow.id);
      
      // Update transaction status
      await storage.updateTransactionStatus(transactionId, 'completed');
      
      // Add funds to seller's balance
      const seller = await storage.getUser(transaction.sellerId);
      const newSellerBalance = seller.balance + escrow.amount;
      await storage.updateUserBalance(transaction.sellerId, newSellerBalance);
      
      res.json({ message: "Funds released successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error releasing funds" });
    }
  });

  // Dispute routes
  app.post("/api/disputes", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDisputeSchema.parse(req.body);
      
      const transaction = await storage.getTransaction(validatedData.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Check if user is involved in the transaction
      if (transaction.buyerId !== req.user.id && transaction.sellerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to raise dispute for this transaction" });
      }
      
      // Check if dispute already exists
      const existingDispute = await storage.getDisputeByTransactionId(validatedData.transactionId);
      if (existingDispute) {
        return res.status(400).json({ message: "Dispute already exists for this transaction" });
      }
      
      // Update transaction status
      await storage.updateTransactionStatus(validatedData.transactionId, 'disputed');
      
      // Create dispute
      const dispute = await storage.createDispute({
        ...validatedData,
        raisedById: req.user.id
      });
      
      res.status(201).json(dispute);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating dispute" });
      }
    }
  });
  
  app.get("/api/disputes", isAdmin, async (req, res) => {
    try {
      const disputes = await storage.getAllOpenDisputes();
      res.json(disputes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching disputes" });
    }
  });
  
  app.post("/api/disputes/:id/resolve", isAdmin, async (req, res) => {
    try {
      const { resolution, winner } = req.body;
      const disputeId = parseInt(req.params.id);
      
      if (!resolution || !winner) {
        return res.status(400).json({ message: "Resolution and winner are required" });
      }
      
      const dispute = await storage.getDispute(disputeId);
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }
      
      if (dispute.isResolved) {
        return res.status(400).json({ message: "Dispute already resolved" });
      }
      
      // Get the transaction
      const transaction = await storage.getTransaction(dispute.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Get escrow
      const escrow = await storage.getEscrowByTransactionId(dispute.transactionId);
      if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
      }
      
      // Resolve dispute
      await storage.resolveDispute(disputeId, resolution, req.user.id);
      
      // Handle funds based on winner
      if (winner === 'buyer') {
        // Return funds to buyer
        const buyer = await storage.getUser(transaction.buyerId);
        const newBuyerBalance = buyer.balance + escrow.amount;
        await storage.updateUserBalance(transaction.buyerId, newBuyerBalance);
        
        // Release escrow
        await storage.releaseEscrow(escrow.id);
        
        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, 'cancelled');
      } else if (winner === 'seller') {
        // Release funds to seller
        const seller = await storage.getUser(transaction.sellerId);
        const newSellerBalance = seller.balance + escrow.amount;
        await storage.updateUserBalance(transaction.sellerId, newSellerBalance);
        
        // Release escrow
        await storage.releaseEscrow(escrow.id);
        
        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, 'completed');
      }
      
      res.json({ message: "Dispute resolved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error resolving dispute" });
    }
  });

  // Review routes
  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      
      const transaction = await storage.getTransaction(validatedData.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Check if transaction is completed
      if (transaction.status !== 'completed') {
        return res.status(400).json({ message: "Cannot review an incomplete transaction" });
      }
      
      // Check if user is involved in the transaction
      if (transaction.buyerId !== req.user.id && transaction.sellerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to review this transaction" });
      }
      
      // Check if review already exists
      const existingReview = await storage.getTransactionReview(validatedData.transactionId);
      if (existingReview) {
        return res.status(400).json({ message: "Review already exists for this transaction" });
      }
      
      // Create review
      const review = await storage.createReview({
        ...validatedData,
        reviewerId: req.user.id
      });
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating review" });
      }
    }
  });
  
  app.get("/api/reviews/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });
  
  // Get all reviews for the authenticated user
  app.get("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const reviews = await storage.getUserReviews(req.user.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
