import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "fas fa-home" },
  { label: "Transactions", href: "/transactions", icon: "fas fa-exchange-alt" },
  { label: "My Balance", href: "/balance", icon: "fas fa-wallet" },
  { label: "Escrow", href: "/escrow", icon: "fas fa-shield-alt" },
  { label: "Reviews", href: "/reviews", icon: "fas fa-star" },
];

const accountNavItems: NavItem[] = [
  { label: "Profile", href: "/profile", icon: "fas fa-user-circle" },
  { label: "Settings", href: "/settings", icon: "fas fa-cog" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white shadow-md z-10">
      <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-primary-600 flex items-center justify-center text-white font-bold">
              EH
            </div>
            <h1 className="text-xl font-bold text-primary-800">EscrowHub</h1>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 px-4 space-y-1">
            {mainNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location === item.href
                      ? "text-primary-600 bg-primary-50"
                      : "text-slate-600 hover:bg-slate-100 hover:text-primary-600"
                  )}
                >
                  <i
                    className={cn(
                      item.icon,
                      "mr-3",
                      location === item.href
                        ? "text-primary-500"
                        : "text-slate-400"
                    )}
                  ></i>
                  {item.label}
                </a>
              </Link>
            ))}
            
            <div className="pt-5 mt-5 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Account
              </h3>
            </div>
            
            {accountNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location === item.href
                      ? "text-primary-600 bg-primary-50"
                      : "text-slate-600 hover:bg-slate-100 hover:text-primary-600"
                  )}
                >
                  <i
                    className={cn(
                      item.icon,
                      "mr-3",
                      location === item.href
                        ? "text-primary-500"
                        : "text-slate-400"
                    )}
                  ></i>
                  {item.label}
                </a>
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
              disabled={logoutMutation.isPending}
            >
              <i className="fas fa-sign-out-alt mr-3 text-red-500"></i>
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
