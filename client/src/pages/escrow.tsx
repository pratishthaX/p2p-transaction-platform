import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

export default function Escrow() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const { user } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const openTransactionDialog = () => {
    setTransactionDialogOpen(true);
  };

  // Fetch all transactions that have escrow
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    // queryFn set in queryClient.ts
  });

  // Filter only transactions with active escrow (not released and not cancelled)
  const escrowTransactions = transactions 
    ? transactions.filter((t: any) => 
        ['pending', 'in_progress', 'awaiting_delivery', 'ready_for_release', 'disputed'].includes(t.status) && 
        t.buyerId === user?.id
      )
    : [];

  // Calculate total in escrow
  const totalInEscrow = escrowTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Unknown date';
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
        
        {/* Escrow Content */}
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
              <h3 className="text-2xl font-bold leading-6 text-gray-900">Escrow Management</h3>
              <div className="mt-3 sm:mt-0 sm:ml-4">
                <Button 
                  onClick={openTransactionDialog}
                  className="inline-flex items-center"
                >
                  <i className="fas fa-plus -ml-1 mr-2"></i>
                  New Transaction
                </Button>
              </div>
            </div>

            {/* Escrow Overview */}
            <div className="mt-6">
              <Card>
                <CardHeader className="pb-0">
                  <h4 className="text-lg font-medium text-gray-900">Total in Escrow</h4>
                </CardHeader>
                <CardContent className="pt-2">
                  {isLoading ? (
                    <Skeleton className="h-12 w-48" />
                  ) : (
                    <div className="text-4xl font-bold text-gray-900">${totalInEscrow.toFixed(2)}</div>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    This is the total amount of funds currently held in escrow for your active transactions.
                  </p>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 p-4">
                  <div className="text-sm text-gray-600">
                    <i className="fas fa-shield-alt text-primary-500 mr-2"></i>
                    Funds in escrow are securely held until transaction conditions are met.
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Active Escrow Transactions */}
            <div className="mt-8">
              <Card>
                <CardHeader className="px-5 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-medium leading-6 text-gray-900">Active Escrow Transactions</h4>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : escrowTransactions.length === 0 ? (
                    <div className="p-10 text-center">
                      <p className="text-gray-500 mb-4">You don't have any active transactions with funds in escrow.</p>
                      <Button onClick={openTransactionDialog}>Create a Transaction</Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Seller
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {escrowTransactions.map((transaction: any) => (
                            <tr key={transaction.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{transaction.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">Seller #{transaction.sellerId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">${transaction.amount.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge 
                                  variant="outline" 
                                  className={transaction.status === 'ready_for_release' 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : transaction.status === 'disputed'
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : 'bg-amber-100 text-amber-800 border-amber-200'
                                  }
                                >
                                  {transaction.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/transactions/${transaction.id}`}>
                                    View Details
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* How Escrow Works */}
            <div className="mt-8">
              <Card>
                <CardHeader className="px-5 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-medium leading-6 text-gray-900">How Escrow Works</h4>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
                        <i className="fas fa-money-bill-wave"></i>
                      </div>
                      <h5 className="font-medium text-gray-900 mb-2">1. Buyer Sends Funds</h5>
                      <p className="text-sm text-gray-600">
                        When a transaction is created, the buyer's funds are securely held in escrow.
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
                        <i className="fas fa-box"></i>
                      </div>
                      <h5 className="font-medium text-gray-900 mb-2">2. Seller Provides Service/Product</h5>
                      <p className="text-sm text-gray-600">
                        The seller delivers the agreed-upon product or service to the buyer.
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <h5 className="font-medium text-gray-900 mb-2">3. Buyer Approves & Releases Funds</h5>
                      <p className="text-sm text-gray-600">
                        After confirming receipt and satisfaction, the buyer releases the funds to the seller.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    <i className="fas fa-exclamation-circle text-amber-500 mr-2"></i>
                    If a dispute arises, our team can help mediate and resolve the issue. 
                    <a href="#" className="text-primary-600 ml-1">Learn more about our dispute resolution process.</a>
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileNavigation onCreateTransaction={openTransactionDialog} />
        
        {/* Transaction Dialog */}
        <TransactionDialog 
          open={transactionDialogOpen} 
          onOpenChange={setTransactionDialogOpen} 
        />
      </div>
    </div>
  );
}
