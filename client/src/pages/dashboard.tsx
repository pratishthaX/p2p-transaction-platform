import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { AccountSummary } from "@/components/dashboard/account-summary";
import { ActiveTransactions } from "@/components/dashboard/active-transactions";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { ReviewsSection } from "@/components/dashboard/reviews-section";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const openTransactionDialog = () => {
    setTransactionDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />
        
        {/* Dashboard Content */}
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Dashboard Header */}
            <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
              <h3 className="text-2xl font-bold leading-6 text-gray-900">Dashboard</h3>
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

            {/* Account Summary */}
            <div className="mt-6">
              <AccountSummary />
            </div>

            {/* Transaction Lists */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ActiveTransactions />
              <TransactionHistory />
            </div>

            {/* Reviews Section */}
            <div className="mt-8">
              <ReviewsSection />
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
