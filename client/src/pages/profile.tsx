import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

export default function Profile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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

  // Mock transactions for the profile page
  const recentTransactions = [
    {
      id: 1,
      title: "Website Development",
      counterparty: "Alex Johnson",
      amount: 450,
      status: "Completed",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      title: "Logo Design",
      counterparty: "Emma Thompson",
      amount: 120,
      status: "Completed",
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      id: 3,
      title: "Content Writing",
      counterparty: "Michael Brown",
      amount: 85,
      status: "Completed",
      date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    },
  ];

  // Mock reviews for the profile page
  const recentReviews = [
    {
      id: 1,
      from: "Jason Kim",
      rating: 5,
      comment: "Great consulting service! Very professional and provided valuable insights.",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      from: "Lisa Wang",
      rating: 4.5,
      comment: "The website template is beautiful and well-documented. Very helpful with customization questions.",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />
        
        {/* Profile Content */}
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <div className="pb-5 border-b border-gray-200">
              <h3 className="text-2xl font-bold leading-6 text-gray-900">My Profile</h3>
            </div>

            {/* Profile Overview */}
            <div className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                      <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold">
                        {user?.username.substring(0, 2).toUpperCase() || "JS"}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{user?.username || "John Smith"}</h3>
                      <div className="flex items-center mb-2">
                        <div className="flex text-amber-400 mr-1">
                          {renderStars(4.8)}
                        </div>
                        <span className="text-sm text-gray-600">4.8/5 (32 reviews)</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center mb-1">
                          <i className="fas fa-envelope mr-2"></i>
                          <span>{user?.email || "john.smith@example.com"}</span>
                        </div>
                        <div className="flex items-center mb-1">
                          <i className="fas fa-user-tag mr-2"></i>
                          <span className="capitalize">{user?.role || "buyer/seller"}</span>
                        </div>
                        <div className="flex items-center">
                          <i className="fas fa-calendar-alt mr-2"></i>
                          <span>Member since {user?.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : "January 2023"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <Button>Edit Profile</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details Tabs */}
            <div className="mt-8">
              <Tabs defaultValue="details">
                <TabsList className="mb-6">
                  <TabsTrigger value="details">Profile Details</TabsTrigger>
                  <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h4>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                          <Input value={user?.username || "johnsmith"} readOnly className="bg-gray-50" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <Input value={user?.email || "john.smith@example.com"} readOnly className="bg-gray-50" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <Input value="John Smith" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <Input value="+1 (555) 123-4567" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                          <Textarea 
                            rows={4} 
                            placeholder="Tell others about yourself..." 
                            value="Professional software developer with experience in web and mobile application development. Passionate about creating efficient, user-friendly solutions."
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-gray-50 flex justify-end p-4">
                      <Button>Save Changes</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="transactions">
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-medium leading-6 text-gray-900">Transaction History</h4>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Transaction
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Counterparty
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
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentTransactions.map((transaction) => (
                              <tr key={transaction.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{transaction.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{transaction.counterparty}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">${transaction.amount.toFixed(2)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    transaction.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {transaction.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {formatDistanceToNow(transaction.date, { addSuffix: true })}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {recentTransactions.length === 0 && (
                          <div className="text-center py-10">
                            <p className="text-gray-500">No transaction history available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="reviews">
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-medium leading-6 text-gray-900">Reviews</h4>
                    </CardHeader>
                    <CardContent className="p-6">
                      {recentReviews.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-gray-500">No reviews yet</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {recentReviews.map((review) => (
                            <div key={review.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start">
                                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                    <i className="fas fa-user text-slate-500"></i>
                                  </div>
                                  <div className="ml-3">
                                    <div className="flex items-center">
                                      <h5 className="text-sm font-medium text-gray-900 mr-2">{review.from}</h5>
                                      <div className="flex text-amber-400 text-xs">
                                        {renderStars(review.rating)}
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDistanceToNow(review.date, { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileNavigation onCreateTransaction={() => {}} />
      </div>
    </div>
  );
}
