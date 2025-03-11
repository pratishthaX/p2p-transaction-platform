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

// Simulated transactions for transaction history display
const mockTransactionHistory = [
  {
    id: 1,
    type: 'credit',
    description: 'Added funds via credit card',
    amount: 500.00,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    type: 'debit',
    description: 'Payment for Website Development',
    amount: 280.00,
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    type: 'credit',
    description: 'Received payment for Logo Design',
    amount: 150.00,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    type: 'credit',
    description: 'Refund for cancelled transaction',
    amount: 75.00,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    type: 'debit',
    description: 'Payment for Digital Marketing',
    amount: 350.00,
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function Balance() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addFundsDialogOpen, setAddFundsDialogOpen] = useState(false);
  const { toast } = useToast();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch user balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/balance"],
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

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  });

  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      const response = await apiRequest("POST", "/api/balance/add", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Funds Added",
        description: "Your funds have been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      setAddFundsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add funds. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addFundsMutation.mutate({
      amount: parseFloat(values.amount),
    });
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
                        {mockTransactionHistory.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.description}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods */}
            <div className="mt-8">
              <Card>
                <CardHeader className="px-5 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-medium leading-6 text-gray-900">Payment Methods</h4>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="border rounded-lg p-4 flex-1 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <i className="fas fa-credit-card"></i>
                          </div>
                          <h5 className="text-gray-900 font-medium ml-3">Credit/Debit Card</h5>
                        </div>
                        <div className="text-sm text-primary-600 font-medium">Default</div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>•••• •••• •••• 1234</p>
                        <p>Expires: 09/24</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 flex-1 border-dashed flex items-center justify-center">
                      <Button variant="outline" className="w-full">
                        <i className="fas fa-plus mr-2"></i>
                        Add Payment Method
                      </Button>
                    </div>
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
                    disabled={addFundsMutation.isPending}
                  >
                    {addFundsMutation.isPending ? "Processing..." : "Add Funds"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
