import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export function ActiveTransactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    // queryFn set in queryClient.ts
  });
  
  const completeTransaction = async (transactionId: number) => {
    try {
      await apiRequest("PUT", `/api/transactions/${transactionId}/status`, { status: 'completed' });
      
      toast({
        title: "Transaction Completed",
        description: "The transaction has been marked as completed.",
      });
      
      // Invalidate transactions cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete transaction. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const releaseFunds = async (transactionId: number) => {
    try {
      await apiRequest("POST", `/api/transactions/${transactionId}/release`, {});
      
      toast({
        title: "Funds Released",
        description: "The funds have been released to the seller.",
      });
      
      // Invalidate transactions and balance cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to release funds. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Filter active transactions
  const activeTransactions = transactions ? 
    transactions.filter((t: any) => ['pending', 'in_progress', 'awaiting_delivery', 'ready_for_release', 'disputed'].includes(t.status)) : [];
  
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'pending':
      case 'in_progress':
      case 'awaiting_delivery':
        return 'bg-amber-100 text-amber-800';
      case 'ready_for_release':
        return 'bg-green-100 text-green-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
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
      case 'disputed': return 'Dispute';
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
    <Card>
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Active Transactions</h3>
      </CardHeader>
      <CardContent className="px-5 pt-3 pb-5">
        <div className="overflow-hidden max-h-[400px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map(i => (
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
                  <div className="flex justify-end space-x-2 mt-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTransactions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-500">No active transactions found</p>
              <Button 
                className="mt-4"
                variant="outline"
                asChild
              >
                <Link href="/transactions">Create a new transaction</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {activeTransactions.map((transaction: any) => (
                <li key={transaction.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <i className="fas fa-user text-slate-500"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        With {transaction.buyerId === user?.id ? 'Seller' : 'Buyer'} #{transaction.buyerId === user?.id ? transaction.sellerId : transaction.buyerId}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(transaction.status)}`}>
                        {getStatusDisplay(transaction.status)}
                      </span>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-gray-900">${transaction.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Started: {getTimeAgo(transaction.createdAt)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/transactions/${transaction.id}`}>
                        <i className="fas fa-eye mr-1"></i> Details
                      </Link>
                    </Button>
                    {transaction.status === 'ready_for_release' && transaction.buyerId === user?.id && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => releaseFunds(transaction.id)}
                      >
                        <i className="fas fa-check mr-1"></i> Release Funds
                      </Button>
                    )}
                    {transaction.status === 'disputed' && (
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700"
                        asChild
                      >
                        <Link href={`/transactions/${transaction.id}`}>
                          <i className="fas fa-flag mr-1"></i> View Dispute
                        </Link>
                      </Button>
                    )}
                    {(transaction.status === 'in_progress' || transaction.status === 'awaiting_delivery') && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <i className="fas fa-comment mr-1"></i> Message
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 text-center">
          <Link href="/transactions">
            <a className="text-sm font-medium text-primary-600 hover:text-primary-500">
              View all transactions
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
