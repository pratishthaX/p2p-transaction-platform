import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export function TransactionHistory() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    // queryFn set in queryClient.ts
  });
  
  // Sort transactions by date (newest first) and take recent ones
  const recentActivity = transactions ? 
    [...transactions]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6) : [];
  
  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'unknown time ago';
    }
  };
  
  const getActivityIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return 'fas fa-check bg-green-100 text-green-600';
      case 'pending':
      case 'in_progress':
      case 'awaiting_delivery':
      case 'ready_for_release':
        return 'fas fa-shield-alt bg-amber-100 text-amber-600';
      case 'disputed':
        return 'fas fa-exclamation-triangle bg-red-100 text-red-600';
      case 'cancelled':
        return 'fas fa-times bg-red-100 text-red-600';
      default:
        return 'fas fa-circle bg-gray-100 text-gray-600';
    }
  };
  
  const getActivityText = (transaction: any) => {
    switch(transaction.status) {
      case 'completed':
        return `${transaction.title} - Transaction completed`;
      case 'pending':
        return `${transaction.title} - Transaction created`;
      case 'in_progress':
        return `${transaction.title} - Transaction in progress`;
      case 'awaiting_delivery':
        return `${transaction.title} - Awaiting delivery`;
      case 'ready_for_release':
        return `${transaction.title} - Ready for release`;
      case 'disputed':
        return `${transaction.title} - Dispute raised`;
      case 'cancelled':
        return `${transaction.title} - Transaction cancelled`;
      default:
        return `${transaction.title} - ${transaction.status}`;
    }
  };
  
  const getAmountColor = (status: string, buyerId: number, userId: number) => {
    if (status === 'completed') {
      return buyerId === userId ? 'text-red-600' : 'text-green-600';
    }
    if (status === 'cancelled') {
      return 'text-red-600';
    }
    if (['pending', 'in_progress', 'awaiting_delivery', 'ready_for_release', 'disputed'].includes(status)) {
      return buyerId === userId ? 'text-amber-600' : 'text-gray-600';
    }
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
      </CardHeader>
      <CardContent className="px-5 pt-3 pb-5">
        <div className="overflow-hidden max-h-[400px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4 py-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((transaction: any) => (
                <li key={transaction.id} className="py-3">
                  <div className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getActivityIcon(transaction.status).split(' ').slice(1).join(' ')}`}>
                      <i className={`${getActivityIcon(transaction.status).split(' ')[0]} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{getActivityText(transaction)}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        With User #{transaction.buyerId === 1 ? transaction.sellerId : transaction.buyerId} • {getTimeAgo(transaction.updatedAt)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-sm font-medium ${getAmountColor(transaction.status, transaction.buyerId, 1)}`}>
                        {transaction.status === 'completed' ? 
                          (transaction.buyerId === 1 ? '-' : '+') : 
                          (transaction.buyerId === 1 ? '-' : '')}
                        ${transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 text-center">
          <Link href="/transactions">
            <a className="text-sm font-medium text-primary-600 hover:text-primary-500">
              View all activity
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
