import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export function ReviewsSection() {
  const { user } = useAuth();
  
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["/api/reviews", user?.id],
    enabled: !!user?.id,
    // queryFn set in queryClient.ts
  });
  
  // Mock data for reviews (would be replaced with real data)
  const mockReviews = [
    {
      id: 1,
      reviewerId: 2,
      reviewerName: "Jason Kim",
      transactionId: 101,
      transactionTitle: "Consulting Service",
      amount: 350,
      rating: 5,
      comment: "Great consulting service! John was very professional and provided valuable insights for our project. Would definitely work with again.",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      reviewerId: 3,
      reviewerName: "Robert Wilson",
      transactionId: 102,
      transactionTitle: "E-book Purchase",
      amount: 25,
      rating: 4,
      comment: "The e-book was delivered promptly and contained exactly what was promised. Very satisfied with this transaction.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      reviewerId: 4,
      reviewerName: "Lisa Wang",
      transactionId: 103,
      transactionTitle: "Website Template",
      amount: 85,
      rating: 4.5,
      comment: "The website template is beautiful and well-documented. John was helpful with a few customization questions I had after purchase.",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
  
  const displayReviews = reviews || mockReviews;
  const totalRating = displayReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
  const averageRating = displayReviews.length ? (totalRating / displayReviews.length).toFixed(1) : "0.0";
  
  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'unknown time ago';
    }
  };
  
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-star"></i>);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt"></i>);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star text-gray-300"></i>);
    }
    
    return stars;
  };

  return (
    <Card>
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Reviews</h3>
        <span className="flex items-center text-sm">
          <div className="flex text-amber-400 mr-1">
            {renderStars(parseFloat(averageRating))}
          </div>
          <span className="font-medium">{averageRating}</span>
          <span className="text-gray-500">/5 ({displayReviews.length} reviews)</span>
        </span>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full mt-2" />
                <Skeleton className="h-3 w-1/3 mt-2" />
              </div>
            ))}
          </div>
        ) : displayReviews.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-500">No reviews yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayReviews.map((review: any) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <i className="fas fa-user text-slate-500"></i>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{review.reviewerName}</p>
                    <div className="mt-1 flex items-center">
                      <div className="flex text-amber-400 text-xs">
                        {renderStars(review.rating)}
                      </div>
                      <span className="ml-1 text-xs text-gray-500">{getTimeAgo(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">{review.comment}</p>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  For: {review.transactionTitle} • ${review.amount}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 text-center">
          <Link href="/reviews">
            <a className="text-sm font-medium text-primary-600 hover:text-primary-500">
              View all reviews
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
