import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface TransactionHistoryItem {
  id: number;
  type: 'credit' | 'debit' | 'pending';
  description: string;
  amount: number;
  date: string;
}

interface BalanceData {
  balance: number;
}

export default function Balance() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addFundsDialogOpen, setAddFundsDialogOpen] = useState(false);
  const { toast } = useToast();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch user balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery<BalanceData>({
    queryKey: ["/api/balance"],
    // queryFn set in queryClient.ts
  });
  
  // Fetch transaction history
  const { data: transactionHistory, isLoading: historyLoading } = useQuery<TransactionHistoryItem[]>({
    queryKey: ["/api/balance/history"],
    // queryFn set in queryClient.ts
  });

  // Form validation schema
  const formSchema = z.object({
    amount: z
      .string()
      .refine((val) => !isNaN(Number(val)), {
        message: "Amount must be a number",
      })
      .refine((val) => Number(val) > 0, {
        message: "Amount must be greater than 0",
      })
      .refine((val) => Number(val) <= 10000, {
        message: "Amount must be less than or equal to $10,000",
      }),
  });

  function CheckoutForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Payment successful
        onSuccess();
        toast({
          title: "Payment Successful",
          description: "Your funds will be added to your balance shortly.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}

// Initialize form and state
const [clientSecret, setClientSecret] = useState("");
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    amount: "",
  },
});

// Create payment intent mutation
const createPaymentIntentMutation = useMutation({
  mutationFn: async (data: { amount: number }) => {
    const response = await apiRequest("POST", "/api/balance/create-payment-intent", data);
    return response.json();
  },
  onSuccess: (data) => {
    setClientSecret(data.clientSecret);
  },
  onError: (error: Error) => {
    toast({
      title: "Error",
      description: error.message || "Failed to initialize payment. Please try again.",
      variant: "destructive",
    });
  },
});

// Submit handler
const onSubmit = (values: z.infer<typeof formSchema>) => {
  const amount = parseFloat(values.amount);
  createPaymentIntentMutation.mutate({ amount });
};

  // Format date to readable format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />
        
        {/* Balance Content */}
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
              <h3 className="text-2xl font-bold leading-6 text-gray-900">My Balance</h3>
              <div className="mt-3 sm:mt-0 sm:ml-4">
                <Button 
                  onClick={() => setAddFundsDialogOpen(true)}
                  className="inline-flex items-center"
                >
                  <i className="fas fa-plus -ml-1 mr-2"></i>
                  Add Funds
                </Button>
              </div>
            </div>

            {/* Balance Summary */}
            <div className="mt-6">
              <Card>
                <CardHeader className="pb-0">
                  <h4 className="text-lg font-medium text-gray-900">Available Balance</h4>
                </CardHeader>
                <CardContent className="pt-2">
                  {balanceLoading ? (
                    <Skeleton className="h-12 w-48" />
                  ) : (
                    <div className="text-4xl font-bold text-gray-900">${balanceData?.balance.toFixed(2) || '0.00'}</div>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    This is your available balance for transactions. Add funds to increase your balance.
                  </p>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 flex justify-end space-x-2 p-4">
                  <Button 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => window.open('https://www.example.com/transaction-history', '_blank')}
                  >
                    Download Statement
                  </Button>
                  <Button onClick={() => setAddFundsDialogOpen(true)}>
                    Add Funds
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Transaction History */}
            <div className="mt-8">
              <Card>
                <CardHeader className="px-5 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-medium leading-6 text-gray-900">Transaction History</h4>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {historyLoading ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                <Skeleton className="h-4 w-48" />
                              </div>
                            </td>
                          </tr>
                        ) : !transactionHistory || transactionHistory.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                              No transaction history
                            </td>
                          </tr>
                        ) : (
                          transactionHistory.map((transaction: any) => (
                            <tr key={transaction.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(transaction.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {transaction.description}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${transaction.type === 'credit' ? 'text-green-600' : (transaction.type === 'debit' ? 'text-red-600' : 'text-gray-600')}`}>
                                {transaction.type === 'credit' ? '+' : (transaction.type === 'debit' ? '-' : '')}${transaction.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>


          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileNavigation onCreateTransaction={() => {}} />
        
        {/* Add Funds Dialog */}
        <Dialog open={addFundsDialogOpen} onOpenChange={setAddFundsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds</DialogTitle>
            </DialogHeader>
            {!clientSecret ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500">$</span>
                            </div>
                            <Input
                              placeholder="0.00"
                              className="pl-7"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setAddFundsDialogOpen(false)}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createPaymentIntentMutation.isPending}
                    >
                      {createPaymentIntentMutation.isPending ? "Processing..." : "Continue"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm
                  amount={parseFloat(form.getValues("amount"))}
                  onSuccess={() => {
                    setAddFundsDialogOpen(false);
                    setClientSecret("");
                    form.reset();
                    queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
                  }}
                />
              </Elements>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
