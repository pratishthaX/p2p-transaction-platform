import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const transactionSchema = z.object({
  transactionType: z.enum(["buy", "sell"]),
  otherParty: z.string().min(3, "Please enter a valid username"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export function TransactionDialog({ open, onOpenChange }: TransactionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get balance data
  const { data: balanceData } = useQuery({
    queryKey: ["/api/balance"],
    // queryFn set in queryClient.ts
  });
  
  // Form setup
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactionType: "buy",
      otherParty: "",
      title: "",
      amount: "",
      description: "",
    },
  });
  
  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (values: z.infer<typeof transactionSchema>) => {
      const otherUserResponse = await apiRequest("GET", `/api/user/${values.otherParty}`, null);
      const otherUser = await otherUserResponse.json();
      
      let buyerId, sellerId;
      if (values.transactionType === "buy") {
        buyerId = user?.id;
        sellerId = otherUser.id;
      } else {
        buyerId = otherUser.id;
        sellerId = user?.id;
      }
      
      const transactionData = {
        title: values.title,
        description: values.description,
        amount: parseFloat(values.amount),
        buyerId,
        sellerId,
      };
      
      const response = await apiRequest("POST", "/api/transactions", transactionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Created",
        description: "Your transaction has been created successfully.",
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: z.infer<typeof transactionSchema>) => {
    // Check if user has sufficient balance when buying
    if (values.transactionType === "buy") {
      const amount = parseFloat(values.amount);
      const balance = balanceData?.balance || 0;
      
      if (amount > balance) {
        toast({
          title: "Insufficient Balance",
          description: `You need $${amount.toFixed(2)} but only have $${balance.toFixed(2)} available.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    createTransactionMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogTitle>New Transaction</DialogTitle>
        <DialogDescription>
          Create a new transaction to buy or sell goods or services.
        </DialogDescription>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="buy">I'm Buying</SelectItem>
                      <SelectItem value="sell">I'm Selling</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="otherParty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username/Email of Other Party</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter username or email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What are you buying/selling?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this transaction is for..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTransactionMutation.isPending}
              >
                {createTransactionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Transaction"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
