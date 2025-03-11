import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HeaderProps = {
  onMenuToggle: () => void;
};

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  const getUserInitials = () => {
    if (!user || !user.username) return "U";
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 h-16 bg-white shadow-sm flex">
      <button
        type="button"
        className="md:hidden px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        onClick={onMenuToggle}
      >
        <i className="fas fa-bars"></i>
      </button>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <div className="max-w-2xl w-full">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <Input
                  className="block w-full bg-gray-100 border border-gray-200 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Search transactions..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <span className="sr-only">View notifications</span>
            <div className="relative">
              <i className="fas fa-bell text-xl"></i>
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-xs font-medium text-white">
                3
              </span>
            </div>
          </Button>

          {/* Profile dropdown */}
          <div className="ml-3 relative">
            <div>
              <Button
                variant="ghost"
                className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                  {getUserInitials()}
                </div>
                <span className="ml-2 text-gray-700 font-medium hidden md:block">
                  {user?.username || "User"}
                </span>
                <i className="fas fa-chevron-down ml-1 text-gray-400 hidden md:block"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
