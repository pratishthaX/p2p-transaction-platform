import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function Transactions() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openTransactionDialog = () => {
    setTransactionDialogOpen(true);
  };

  // Fetch all transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    // queryFn set in queryClient.ts
  });

  // Filter transactions based on active tab
  const filteredTransactions = transactions 
    ? transactions.filter((t: any) => {
        if (activeTab === "all") return true;
        if (activeTab === "active") return ["pending", "in_progress", "awaiting_delivery", "ready_for_release", "disputed"].includes(t.status);
        if (activeTab === "completed") return t.status === "completed";
        if (activeTab === "cancelled") return t.status === "cancelled";
        return true;
      })
    : [];

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'pending':
      case 'in_progress':
      case 'awaiting_delivery':
        return 'bg-amber-100 text-amber-800';
      case 'ready_for_release':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'awaiting_delivery': return 'Awaiting Delivery';
      case 'ready_for_release': return 'Ready for Release';
      case 'completed': return 'Completed';
      case 'disputed': return 'Dispute';
      case 'cancelled': return 'Cancelled';
      default: return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'unknown time ago';
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
        
        {/* Transactions Content */}
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
              <h3 className="text-2xl font-bold leading-6 text-gray-900">Transactions</h3>
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

            {/* Transactions List */}
            <div className="mt-6">
              <Card>
                <CardHeader className="px-5 py-4 border-b border-gray-200">
                  <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="all">All Transactions</TabsTrigger>
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                      <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="p-5">
                  {isLoading ? (
                    <div className="space-y-6 py-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-gray-500">No transactions found</p>
                      <Button 
                        className="mt-4"
                        onClick={openTransactionDialog}
                      >
                        Create a new transaction
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Title
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Party
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredTransactions.map((transaction: any) => (
                            <tr key={transaction.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{transaction.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {transaction.buyerId === user?.id ? 'Seller' : 'Buyer'} #{transaction.buyerId === user?.id ? transaction.sellerId : transaction.buyerId}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">${transaction.amount.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(transaction.status)}`}>
                                  {getStatusDisplay(transaction.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{getTimeAgo(transaction.createdAt)}</div>
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
