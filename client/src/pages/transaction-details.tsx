import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function TransactionDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch transaction details
  const { data, isLoading } = useQuery({
    queryKey: [`/api/transactions/${id}`],
    // queryFn set in queryClient.ts
  });

  // Function to update transaction status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PUT", `/api/transactions/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Transaction status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Function to release funds
  const releaseFundsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/transactions/${id}/release`, {});
    },
    onSuccess: () => {
      toast({
        title: "Funds Released",
        description: "The funds have been released to the seller.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to release funds",
        variant: "destructive",
      });
    },
  });

  // Review form schema
  const reviewSchema = z.object({
    rating: z.string().transform(val => parseInt(val)),
    comment: z.string().min(10, "Comment must be at least 10 characters"),
  });

  // Review form
  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: "5",
      comment: "",
    },
  });

  // Submit review
  const submitReviewMutation = useMutation({
    mutationFn: async (values: z.infer<typeof reviewSchema>) => {
      const transaction = data?.transaction;
      const revieweeId = transaction.buyerId === user?.id ? transaction.sellerId : transaction.buyerId;
      
      await apiRequest("POST", "/api/reviews", {
        transactionId: parseInt(id),
        reviewerId: user?.id,
        revieweeId,
        rating: values.rating,
        comment: values.comment,
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${id}`] });
      setReviewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const onSubmitReview = (values: z.infer<typeof reviewSchema>) => {
    submitReviewMutation.mutate(values);
  };

  // Dispute form schema
  const disputeSchema = z.object({
    reason: z.string().min(20, "Reason must be at least 20 characters"),
  });

  // Dispute form
  const disputeForm = useForm<z.infer<typeof disputeSchema>>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      reason: "",
    },
  });

  // Submit dispute
  const submitDisputeMutation = useMutation({
    mutationFn: async (values: z.infer<typeof disputeSchema>) => {
      await apiRequest("POST", "/api/disputes", {
        transactionId: parseInt(id),
        raisedById: user?.id,
        reason: values.reason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Dispute Raised",
        description: "Your dispute has been submitted and will be reviewed by our team.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setDisputeDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to raise dispute",
        variant: "destructive",
      });
    },
  });

  const onSubmitDispute = (values: z.infer<typeof disputeSchema>) => {
    submitDisputeMutation.mutate(values);
  };

  // Function to handle actions based on current status and user role
  const handleAction = (action: string) => {
    switch(action) {
      case 'accept':
        updateStatusMutation.mutate('in_progress');
        break;
      case 'deliver':
        updateStatusMutation.mutate('ready_for_release');
        break;
      case 'release':
        setDialogOpen(true);
        break;
      case 'dispute':
        setDisputeDialogOpen(true);
        break;
      case 'review':
        setReviewDialogOpen(true);
        break;
      case 'cancel':
        updateStatusMutation.mutate('cancelled');
        break;
      default:
        break;
    }
  };

  // Get action buttons based on current status and user role
  const getActionButtons = () => {
    if (!data || !user) return null;

    const { transaction } = data;
    const isBuyer = transaction.buyerId === user.id;
    const isSeller = transaction.sellerId === user.id;

    switch(transaction.status) {
      case 'pending':
        return (
          <>
            {isSeller && (
              <Button onClick={() => handleAction('accept')}>Accept Transaction</Button>
            )}
            {(isBuyer || isSeller) && (
              <Button variant="outline" onClick={() => handleAction('cancel')}>Cancel</Button>
            )}
          </>
        );
      case 'in_progress':
      case 'awaiting_delivery':
        return (
          <>
            {isSeller && (
              <Button onClick={() => handleAction('deliver')}>Mark as Delivered</Button>
            )}
            {(isBuyer || isSeller) && (
              <Button variant="destructive" onClick={() => handleAction('dispute')}>Raise Dispute</Button>
            )}
          </>
        );
      case 'ready_for_release':
        return (
          <>
            {isBuyer && (
              <Button onClick={() => handleAction('release')}>Release Funds</Button>
            )}
            {(isBuyer || isSeller) && (
              <Button variant="destructive" onClick={() => handleAction('dispute')}>Raise Dispute</Button>
            )}
          </>
        );
      case 'completed':
        // Check if user has already reviewed
        const hasReviewed = data.review && data.review.reviewerId === user.id;
        return (
          <>
            {!hasReviewed && (
              <Button onClick={() => handleAction('review')}>Leave Review</Button>
            )}
          </>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">In Progress</Badge>;
      case 'awaiting_delivery':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Awaiting Delivery</Badge>;
      case 'ready_for_release':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Ready for Release</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'disputed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Disputed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="md:pl-64 flex flex-col flex-1">
          <Header onMenuToggle={toggleSidebar} />
          <main className="flex-1 pb-8">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="md:pl-64 flex flex-col flex-1">
          <Header onMenuToggle={toggleSidebar} />
          <main className="flex-1 pb-8">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-900">Transaction not found</h3>
                <p className="mt-2 text-gray-500">The transaction you're looking for doesn't exist or you don't have permission to view it.</p>
                <Button className="mt-4" onClick={() => navigate('/transactions')}>Back to Transactions</Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { transaction, escrow, dispute, review } = data;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />
        
        {/* Transaction Details Content */}
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Back button and Title */}
            <div className="flex items-center mb-6">
              <Button variant="outline" size="sm" className="mr-4" onClick={() => navigate('/transactions')}>
                <i className="fas fa-arrow-left mr-2"></i> Back
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
            </div>

            {/* Transaction Information */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{transaction.title}</h3>
                      <p className="text-gray-500 text-sm mt-1">ID: #{transaction.id}</p>
                    </div>
                    {getStatusBadge(transaction.status)}
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                        <p className="text-gray-900">{transaction.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Amount</h4>
                          <p className="text-xl font-bold text-gray-900">${transaction.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Created Date</h4>
                          <p className="text-gray-900">{formatDate(transaction.createdAt)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Buyer</h4>
                          <p className="text-gray-900">User #{transaction.buyerId}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Seller</h4>
                          <p className="text-gray-900">User #{transaction.sellerId}</p>
                        </div>
                      </div>

                      {escrow && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Escrow Status</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={escrow.released ? "bg-green-100 text-green-800 border-green-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
                              {escrow.released ? "Released" : "Held in Escrow"}
                            </Badge>
                            {escrow.released && (
                              <span className="text-sm text-gray-500">Released on {formatDate(escrow.releaseDate)}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {dispute && (
                        <div className="border rounded-md p-4 bg-red-50 border-red-200">
                          <h4 className="text-sm font-medium text-red-800 mb-1">Dispute Information</h4>
                          <p className="text-gray-800 mb-2">{dispute.reason}</p>
                          <div className="text-sm text-gray-500">
                            Raised by User #{dispute.raisedById} on {formatDate(dispute.createdAt)}
                          </div>
                          {dispute.isResolved && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium text-green-800">Resolution</h5>
                              <p className="text-gray-800">{dispute.resolution}</p>
                              <div className="text-sm text-gray-500">
                                Resolved by Admin #{dispute.resolvedById} on {formatDate(dispute.updatedAt)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {review && (
                        <div className="border rounded-md p-4 bg-green-50 border-green-200">
                          <h4 className="text-sm font-medium text-green-800 mb-1">Review</h4>
                          <div className="flex items-center mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i 
                                key={i} 
                                className={`${i < review.rating ? 'fas' : 'far'} fa-star text-amber-400`}
                              ></i>
                            ))}
                            <span className="ml-2 text-gray-700">{review.rating}/5</span>
                          </div>
                          <p className="text-gray-800 mb-1">{review.comment}</p>
                          <div className="text-sm text-gray-500">
                            By User #{review.reviewerId} on {formatDate(review.createdAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 flex justify-end space-x-2 p-4">
                    {getActionButtons()}
                  </CardFooter>
                </Card>
              </div>

              {/* Transaction Timeline */}
              <div>
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900">Transaction Timeline</h3>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ol className="relative border-l border-gray-200">
                      <li className="mb-10 ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-primary-100 rounded-full -left-3 ring-8 ring-white">
                          <i className="fas fa-plus text-xs text-primary-600"></i>
                        </span>
                        <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900">Transaction Created</h3>
                        <time className="block mb-2 text-xs font-normal leading-none text-gray-500">{formatDate(transaction.createdAt)}</time>
                        <p className="text-sm text-gray-500">Transaction was created with an amount of ${transaction.amount.toFixed(2)}</p>
                      </li>

                      {transaction.status !== 'pending' && (
                        <li className="mb-10 ml-6">
                          <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
                            <i className="fas fa-handshake text-xs text-blue-600"></i>
                          </span>
                          <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900">Transaction Accepted</h3>
                          <time className="block mb-2 text-xs font-normal leading-none text-gray-500">After creation</time>
                          <p className="text-sm text-gray-500">Transaction was accepted by the seller and moved to in-progress</p>
                        </li>
                      )}

                      {(transaction.status === 'ready_for_release' || transaction.status === 'completed' || transaction.status === 'disputed') && (
                        <li className="mb-10 ml-6">
                          <span className="absolute flex items-center justify-center w-6 h-6 bg-amber-100 rounded-full -left-3 ring-8 ring-white">
                            <i className="fas fa-box text-xs text-amber-600"></i>
                          </span>
                          <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900">Ready for Release</h3>
                          <time className="block mb-2 text-xs font-normal leading-none text-gray-500">After in-progress</time>
                          <p className="text-sm text-gray-500">Seller marked the transaction as delivered and ready for release</p>
                        </li>
                      )}

                      {transaction.status === 'disputed' && (
                        <li className="mb-10 ml-6">
                          <span className="absolute flex items-center justify-center w-6 h-6 bg-red-100 rounded-full -left-3 ring-8 ring-white">
                            <i className="fas fa-exclamation-triangle text-xs text-red-600"></i>
                          </span>
                          <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900">Dispute Raised</h3>
                          <time className="block mb-2 text-xs font-normal leading-none text-gray-500">{formatDate(dispute?.createdAt)}</time>
                          <p className="text-sm text-gray-500">A dispute was raised by User #{dispute?.raisedById}</p>
                        </li>
                      )}

                      {transaction.status === 'completed' && (
                        <li className="mb-10 ml-6">
                          <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-8 ring-white">
                            <i className="fas fa-check text-xs text-green-600"></i>
                          </span>
                          <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900">Transaction Completed</h3>
                          <time className="block mb-2 text-xs font-normal leading-none text-gray-500">{escrow?.releaseDate ? formatDate(escrow.releaseDate) : 'Unknown'}</time>
                          <p className="text-sm text-gray-500">Funds were released from escrow to the seller</p>
                        </li>
                      )}

                      {transaction.status === 'cancelled' && (
                        <li className="mb-10 ml-6">
                          <span className="absolute flex items-center justify-center w-6 h-6 bg-red-100 rounded-full -left-3 ring-8 ring-white">
                            <i className="fas fa-times text-xs text-red-600"></i>
                          </span>
                          <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900">Transaction Cancelled</h3>
                          <time className="block mb-2 text-xs font-normal leading-none text-gray-500">{formatDate(transaction.updatedAt)}</time>
                          <p className="text-sm text-gray-500">The transaction was cancelled</p>
                        </li>
                      )}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileNavigation onCreateTransaction={() => {}} />
        
        {/* Release Funds Confirmation Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Release Funds</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to release the funds? This action cannot be undone.</p>
              <p className="mt-2 font-medium">Amount: ${transaction.amount.toFixed(2)}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => releaseFundsMutation.mutate()}
                disabled={releaseFundsMutation.isPending}
              >
                {releaseFundsMutation.isPending ? "Processing..." : "Release Funds"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave a Review</DialogTitle>
            </DialogHeader>
            <Form {...reviewForm}>
              <form onSubmit={reviewForm.handleSubmit(onSubmitReview)} className="space-y-4">
                <FormField
                  control={reviewForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-4">
                          <select
                            className="select"
                            {...field}
                          >
                            <option value="1">1 - Poor</option>
                            <option value="2">2 - Fair</option>
                            <option value="3">3 - Good</option>
                            <option value="4">4 - Very Good</option>
                            <option value="5">5 - Excellent</option>
                          </select>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <i
                                key={star}
                                className={`${parseInt(field.value) >= star ? 'fas' : 'far'} fa-star text-amber-400 cursor-pointer`}
                                onClick={() => reviewForm.setValue('rating', star.toString())}
                              ></i>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reviewForm.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comment</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your experience with this transaction..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
                  <Button 
                    type="submit"
                    disabled={submitReviewMutation.isPending}
                  >
                    {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dispute Dialog */}
        <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raise a Dispute</DialogTitle>
            </DialogHeader>
            <Form {...disputeForm}>
              <form onSubmit={disputeForm.handleSubmit(onSubmitDispute)} className="space-y-4">
                <FormField
                  control={disputeForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Dispute</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please explain the issue in detail..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide as much detail as possible to help resolve the dispute quickly.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>Cancel</Button>
                  <Button 
                    type="submit"
                    disabled={submitDisputeMutation.isPending}
                  >
                    {submitDisputeMutation.isPending ? "Submitting..." : "Submit Dispute"}
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
