import { type User, type InsertUser, type Transaction, type InsertTransaction, 
  type Escrow, type InsertEscrow, type Dispute, type InsertDispute, 
  type Review, type InsertReview } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define the Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction>;
  
  // Escrow methods
  createEscrow(escrow: InsertEscrow): Promise<Escrow>;
  getEscrow(id: number): Promise<Escrow | undefined>;
  getEscrowByTransactionId(transactionId: number): Promise<Escrow | undefined>;
  releaseEscrow(id: number): Promise<Escrow>;
  
  // Dispute methods
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDispute(id: number): Promise<Dispute | undefined>;
  getDisputeByTransactionId(transactionId: number): Promise<Dispute | undefined>;
  resolveDispute(id: number, resolution: string, resolvedById: number): Promise<Dispute>;
  getAllOpenDisputes(): Promise<Dispute[]>;
  
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getReview(id: number): Promise<Review | undefined>;
  getUserReviews(userId: number): Promise<Review[]>;
  getTransactionReview(transactionId: number): Promise<Review | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private escrows: Map<number, Escrow>;
  private disputes: Map<number, Dispute>;
  private reviews: Map<number, Review>;
  
  sessionStore: session.SessionStore;
  
  // Auto-incrementing IDs
  private userIdCounter: number;
  private transactionIdCounter: number;
  private escrowIdCounter: number;
  private disputeIdCounter: number;
  private reviewIdCounter: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.escrows = new Map();
    this.disputes = new Map();
    this.reviews = new Map();
    
    this.userIdCounter = 1;
    this.transactionIdCounter = 1;
    this.escrowIdCounter = 1;
    this.disputeIdCounter = 1;
    this.reviewIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Create admin user
    this.createUser({
      username: 'admin',
      password: '$2b$10$EwtnzBHTHQrndnaPP/UA3.vcIxHZ2tZqEv9uK9Rwwr9QGWU1b2aCG', // "adminpass"
      email: 'admin@escrowhub.com',
      role: 'admin'
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      balance: 0, 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserBalance(id: number, amount: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    user.balance = amount;
    this.users.set(id, user);
    return user;
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.buyerId === userId || transaction.sellerId === userId
    );
  }
  
  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }
    
    transaction.status = status;
    transaction.updatedAt = new Date();
    this.transactions.set(id, transaction);
    return transaction;
  }

  // Escrow methods
  async createEscrow(insertEscrow: InsertEscrow): Promise<Escrow> {
    const id = this.escrowIdCounter++;
    const now = new Date();
    const escrow: Escrow = {
      ...insertEscrow,
      id,
      released: false,
      releaseDate: null,
      createdAt: now
    };
    this.escrows.set(id, escrow);
    return escrow;
  }
  
  async getEscrow(id: number): Promise<Escrow | undefined> {
    return this.escrows.get(id);
  }
  
  async getEscrowByTransactionId(transactionId: number): Promise<Escrow | undefined> {
    return Array.from(this.escrows.values()).find(
      (escrow) => escrow.transactionId === transactionId
    );
  }
  
  async releaseEscrow(id: number): Promise<Escrow> {
    const escrow = await this.getEscrow(id);
    if (!escrow) {
      throw new Error(`Escrow with ID ${id} not found`);
    }
    
    escrow.released = true;
    escrow.releaseDate = new Date();
    this.escrows.set(id, escrow);
    return escrow;
  }

  // Dispute methods
  async createDispute(insertDispute: InsertDispute): Promise<Dispute> {
    const id = this.disputeIdCounter++;
    const now = new Date();
    const dispute: Dispute = {
      ...insertDispute,
      id,
      resolution: null,
      resolvedById: null,
      isResolved: false,
      createdAt: now,
      updatedAt: now
    };
    this.disputes.set(id, dispute);
    return dispute;
  }
  
  async getDispute(id: number): Promise<Dispute | undefined> {
    return this.disputes.get(id);
  }
  
  async getDisputeByTransactionId(transactionId: number): Promise<Dispute | undefined> {
    return Array.from(this.disputes.values()).find(
      (dispute) => dispute.transactionId === transactionId
    );
  }
  
  async resolveDispute(id: number, resolution: string, resolvedById: number): Promise<Dispute> {
    const dispute = await this.getDispute(id);
    if (!dispute) {
      throw new Error(`Dispute with ID ${id} not found`);
    }
    
    dispute.resolution = resolution;
    dispute.resolvedById = resolvedById;
    dispute.isResolved = true;
    dispute.updatedAt = new Date();
    this.disputes.set(id, dispute);
    return dispute;
  }
  
  async getAllOpenDisputes(): Promise<Dispute[]> {
    return Array.from(this.disputes.values()).filter(
      (dispute) => !dispute.isResolved
    );
  }

  // Review methods
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const now = new Date();
    const review: Review = {
      ...insertReview,
      id,
      createdAt: now
    };
    this.reviews.set(id, review);
    return review;
  }
  
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }
  
  async getUserReviews(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.revieweeId === userId
    );
  }
  
  async getTransactionReview(transactionId: number): Promise<Review | undefined> {
    return Array.from(this.reviews.values()).find(
      (review) => review.transactionId === transactionId
    );
  }
}

export const storage = new MemStorage();
