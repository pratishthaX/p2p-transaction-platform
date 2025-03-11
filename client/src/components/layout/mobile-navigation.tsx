import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  onCreateTransaction: () => void;
};

export function MobileNavigation({ onCreateTransaction }: MobileNavProps) {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-10">
      <div className="grid grid-cols-5 h-16">
        <Link href="/">
          <a className={cn(
            "flex flex-col items-center justify-center",
            location === "/" ? "text-primary-600" : "text-gray-500"
          )}>
            <i className="fas fa-home text-lg"></i>
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        
        <Link href="/transactions">
          <a className={cn(
            "flex flex-col items-center justify-center",
            location === "/transactions" ? "text-primary-600" : "text-gray-500"
          )}>
            <i className="fas fa-exchange-alt text-lg"></i>
            <span className="text-xs mt-1">Transactions</span>
          </a>
        </Link>
        
        <button 
          onClick={onCreateTransaction}
          className="flex flex-col items-center justify-center"
        >
          <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white -mt-5">
            <i className="fas fa-plus text-lg"></i>
          </div>
        </button>
        
        <Link href="/balance">
          <a className={cn(
            "flex flex-col items-center justify-center",
            location === "/balance" ? "text-primary-600" : "text-gray-500"
          )}>
            <i className="fas fa-wallet text-lg"></i>
            <span className="text-xs mt-1">Balance</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className={cn(
            "flex flex-col items-center justify-center",
            location === "/profile" ? "text-primary-600" : "text-gray-500"
          )}>
            <i className="fas fa-user text-lg"></i>
            <span className="text-xs mt-1">Profile</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
