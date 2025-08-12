"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Grid3X3,
  UserPlus,
  MessageCircle,
  Calendar,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/login-modal";
import { supabase } from "@/lib/supabase";
import { AddListingModal } from "./add-listing-modal";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, profile, signOut, isAuthenticated } = useAuth();
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && profile) {
      fetchUnreadCount();

      // Subscribe to conversation changes
      const channel = supabase
        .channel("conversations")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter:
              profile.user_type === "customer"
                ? `customer_id=eq.${user.id}`
                : `provider_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, user, profile]);

  const fetchUnreadCount = async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase.rpc("get_total_unread_count", {
        user_id: user.id,
        user_type: profile.user_type,
      });

      if (error) {
        console.error("Error fetching unread count:", error);
        return;
      }

      setUnreadCount(data || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-brand-dark">
                TrueLocal
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="flex items-center space-x-1 text-gray-700 hover:text-brand-primary transition-colors duration-200"
              >
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link
                href="/services"
                className="flex items-center space-x-1 text-gray-700 hover:text-brand-primary transition-colors duration-200"
              >
                <Grid3X3 size={18} />
                <span>Services</span>
              </Link>
              <a
                onClick={() => setIsAddListingOpen(true)}
                className="flex items-center space-x-1 text-gray-700 hover:text-brand-primary transition-colors duration-200"
              >
                <UserPlus size={18} />
                <span>Become a Provider</span>
              </a>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Chat Icon */}
                  <Link href="/chat">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative hover:bg-brand-light"
                    >
                      <MessageCircle size={20} className="text-gray-600" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-brand-primary text-white text-xs">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>

                  {/* Appointments Icon */}
                  <Link href="/account?tab=appointments">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative hover:bg-brand-light"
                    >
                      <Calendar size={20} className="text-gray-600" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-brand-primary text-white text-xs">
                        2
                      </Badge>
                    </Button>
                  </Link>

                  {/* Account Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-2 hover:bg-brand-light"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={profile?.avatar_url || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {profile?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block text-sm font-medium">
                          {profile?.full_name}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-medium">
                          {profile?.full_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {profile?.user_type === "provider"
                            ? "Provider Mode"
                            : "Customer Mode"}
                        </p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/account">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account?tab=profile">
                          Profile & Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/chat">
                          <div className="flex items-center justify-between w-full">
                            <span>Messages</span>
                            {unreadCount > 0 && (
                              <Badge className="bg-brand-primary text-white text-xs">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account?tab=appointments">
                          Appointments
                        </Link>
                      </DropdownMenuItem>
                      {profile?.user_type === "provider" && (
                        <DropdownMenuItem asChild>
                          <Link href="/account?tab=listings">My Listings</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={signOut}
                        className="text-red-600"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-brand-primary hover:bg-brand-secondary text-white"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 animate-slide-in">
              <div className="flex flex-col space-y-4">
                <Link
                  href="/"
                  className="flex items-center space-x-2 text-gray-700 hover:text-brand-primary transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home size={18} />
                  <span>Home</span>
                </Link>
                <Link
                  href="/services"
                  className="flex items-center space-x-2 text-gray-700 hover:text-brand-primary transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Grid3X3 size={18} />
                  <span>Services</span>
                </Link>
                <a
                  className="flex items-center space-x-2 text-gray-700 hover:text-brand-primary transition-colors duration-200"
                  onClick={() => {
                    setIsAddListingOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <UserPlus size={18} />
                  <span>Become a Provider</span>
                </a>
                {isAuthenticated && (
                  <Link
                    href="/chat"
                    className="flex items-center justify-between text-gray-700 hover:text-brand-primary transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <MessageCircle size={18} />
                      <span>Messages</span>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="bg-brand-primary text-white text-xs">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Link>
                )}
                {!isAuthenticated && (
                  <Button
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-brand-primary hover:bg-brand-secondary text-white w-full"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <AddListingModal
        isOpen={isAddListingOpen}
        onClose={() => setIsAddListingOpen(false)}
        onSuccess={() => {
          console.log("Listing created successfully!");
        }}
      />
    </>
  );
}
