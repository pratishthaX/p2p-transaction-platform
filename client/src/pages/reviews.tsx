import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function Reviews() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("received");
  const { user } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch user reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["/api/reviews", user?.id],
    enabled: !!user?.id,
    // queryFn set in queryClient.ts
  });

  // Mock reviews data for now (would be replaced with actual API data)
  const mockReviews = [
    {
      id: 1,
      reviewerId: 2,
      reviewerName: "Jason Kim",
      revieweeId: 1,
      transactionId: 101,
      transactionTitle: "Consulting Service",
      rating: 5,
      comment: "Great consulting service! John was very professional and provided valuable insights for our project. Would definitely work with again.",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      reviewerId: 3,
      reviewerName: "Robert Wilson",
      revieweeId: 1,
      transactionId: 102,
      transactionTitle: "E-book Purchase",
      rating: 4,
      comment: "The e-book was delivered promptly and contained exactly what was promised. Very satisfied with this transaction.",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      reviewerId: 4,
      reviewerName: "Lisa Wang",
      revieweeId: 1,
      transactionId: 103,
      transactionTitle: "Website Template",
      rating: 4.5,
      comment: "The website template is beautiful and well-documented. John was helpful with a few customization questions I had after purchase.",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      reviewerId: 1,
      reviewerName: "John Smith",
      revieweeId: 2,
      transactionId: 104,
      transactionTitle: "Mobile App Design",
      rating: 5,
      comment: "Jason did an exceptional job on our mobile app design. The designs were creative, intuitive, and exactly what we were looking for.",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      reviewerId: 1,
      reviewerName: "John Smith",
      revieweeId: 3,
      transactionId: 105,
      transactionTitle: "SEO Services",
      rating: 4,
      comment: "Robert provided solid SEO services that helped improve our site's ranking. Good communication throughout the project.",
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Filter reviews based on active tab
  const filteredReviews = mockReviews.filter(review => 
    activeTab === "received" 
      ? review.revieweeId === user?.id
      : review.reviewerId === user?.id
  );

  // Calculate average rating
  const calculateAverageRating = (reviews: typeof mockReviews) => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  // Render stars based on rating
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

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'unknown time ago';
    }
  };

  // Calculate the average rating for received reviews
  const avgRating = parseFloat(calculateAverageRating(mockReviews.filter(r => r.revieweeId === user?.id))) || 0;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />
        
        {/* Reviews Content */}
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <div className="pb-5 border-b border-gray-200">
              <h3 className="text-2xl font-bold leading-6 text-gray-900">Reviews</h3>
            </div>

            {/* Rating Summary */}
            <div className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Your Overall Rating</h4>
                      <div className="flex items-center">
                        <div className="text-4xl font-bold text-gray-900 mr-2">
                          {calculateAverageRating(mockReviews.filter(r => r.revieweeId === user?.id))}
                        </div>
                        <div className="flex text-amber-400 text-xl">
                          {renderStars(avgRating)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Based on {mockReviews.filter(r => r.revieweeId === user?.id).length} reviews</p>
                    </div>
                    
                    <div className="flex flex-col space-y-2 w-full md:w-2/3 lg:w-1/2">
                      {[5, 4, 3, 2, 1].map(rating => {
                        const count = mockReviews.filter(r => r.revieweeId === user?.id && Math.floor(r.rating) === rating).length;
                        const percentage = mockReviews.filter(r => r.revieweeId === user?.id).length > 0 
                          ? (count / mockReviews.filter(r => r.revieweeId === user?.id).length) * 100 
                          : 0;
                        
                        return (
                          <div key={rating} className="flex items-center">
                            <div className="flex items-center w-16">
                              <span className="text-sm text-gray-600 mr-1">{rating}</span>
                              <i className="fas fa-star text-amber-400 text-sm"></i>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mx-2">
                              <div 
                                className="bg-amber-400 h-2.5 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="w-8 text-xs text-gray-500">{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reviews List */}
            <div className="mt-8">
              <Card>
                <CardHeader className="px-5 py-4 border-b border-gray-200">
                  <div>
                    <Tabs defaultValue="received" value={activeTab} onValueChange={setActiveTab}>
                      <TabsList>
                        <TabsTrigger value="received">Reviews Received</TabsTrigger>
                        <TabsTrigger value="given">Reviews Given</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {activeTab === "received" ? (
                    // Reviews Received Tab
                    isLoading ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-48" />
                        ))}
                      </div>
                    ) : filteredReviews.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-gray-500">You haven't received any reviews yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredReviews.map(review => (
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
                              For: {review.transactionTitle}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    // Reviews Given Tab
                    isLoading ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-48" />
                        ))}
                      </div>
                    ) : filteredReviews.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-gray-500">You haven't given any reviews yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredReviews.map(review => (
                          <div key={review.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                    <i className="fas fa-user text-slate-500"></i>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">User #{review.revieweeId}</p>
                                  <div className="mt-1 flex items-center">
                                    <div className="flex text-amber-400 text-xs">
                                      {renderStars(review.rating)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">{getTimeAgo(review.createdAt)}</div>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">{review.comment}</p>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              For: {review.transactionTitle}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileNavigation onCreateTransaction={() => {}} />
      </div>
    </div>
  );
}
