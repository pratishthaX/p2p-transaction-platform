import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountSummary() {
  const { user } = useAuth();
  
  // Get balance data
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/balance"],
    // queryFn set in queryClient.ts
  });
  
  // Get transactions data
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    // queryFn set in queryClient.ts
  });
  
  // Calculate values for the cards
  const availableBalance = balanceData ? balanceData.balance : 0;
  
  const activeTransactions = transactionsData ? 
    transactionsData.filter((t: any) => ['pending', 'in_progress', 'awaiting_delivery', 'ready_for_release', 'disputed'].includes(t.status)).length : 0;
  
  const inEscrow = transactionsData ? 
    transactionsData
      .filter((t: any) => ['pending', 'in_progress', 'awaiting_delivery', 'ready_for_release', 'disputed'].includes(t.status) && t.buyerId === user?.id)
      .reduce((sum: number, t: any) => sum + t.amount, 0) : 0;
  
  // Calculate user rating
  const userRating = 4.8; // This would come from API in a real implementation

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Available Balance */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <i className="fas fa-wallet text-primary-600"></i>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Available Balance</dt>
                <dd>
                  {balanceLoading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    <div className="text-lg font-bold text-gray-900">${availableBalance.toFixed(2)}</div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href="/balance">
              <a className="font-medium text-primary-600 hover:text-primary-500">
                Add funds
              </a>
            </Link>
          </div>
        </CardFooter>
      </Card>

      {/* Escrow Balance */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
              <i className="fas fa-shield-alt text-indigo-600"></i>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">In Escrow</dt>
                <dd>
                  {balanceLoading || transactionsLoading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    <div className="text-lg font-bold text-gray-900">${inEscrow.toFixed(2)}</div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href="/escrow">
              <a className="font-medium text-primary-600 hover:text-primary-500">
                View escrow details
              </a>
            </Link>
          </div>
        </CardFooter>
      </Card>

      {/* Active Transactions */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-amber-100 rounded-md p-3">
              <i className="fas fa-exchange-alt text-amber-600"></i>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Transactions</dt>
                <dd>
                  {transactionsLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <div className="text-lg font-bold text-gray-900">{activeTransactions}</div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href="/transactions">
              <a className="font-medium text-primary-600 hover:text-primary-500">
                View all transactions
              </a>
            </Link>
          </div>
        </CardFooter>
      </Card>

      {/* User Rating */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <i className="fas fa-star text-green-600"></i>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">User Rating</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 flex items-center">
                    {userRating}/5
                    <div className="ml-2 flex text-amber-400">
                      <i className="fas fa-star text-sm"></i>
                      <i className="fas fa-star text-sm"></i>
                      <i className="fas fa-star text-sm"></i>
                      <i className="fas fa-star text-sm"></i>
                      <i className="fas fa-star-half-alt text-sm"></i>
                    </div>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href="/reviews">
              <a className="font-medium text-primary-600 hover:text-primary-500">
                See 32 reviews
              </a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
