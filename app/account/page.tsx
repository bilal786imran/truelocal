"use client";


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Calendar,
  MessageCircle,
  Settings,
  Star,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AddListingModal } from "@/components/add-listing-modal";
import { AuthModal } from "@/components/auth/login-modal";
import { AccountTypeSwitchNotification } from "@/components/account-type-switch-notification";
import { BookingDetailsModal } from "@/components/booking-details-modal";
import {
  getDashboardStats,
  subscribeToDashboardUpdates,
  type DashboardStats,
} from "@/lib/analytics";
import {
  getBookings,
  getBookingStats,
  updateBookingStatus,
  type BookingFilters,
} from "@/lib/bookings";
import {
  getUserListings,
  getListingStats,
  subscribeToListingUpdates,
  type ListingFilters,
} from "@/lib/listings";
import { ListingManagementModal } from "@/components/listing-management-modal";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, profile, isAuthenticated, switchUserType } = useAuth();

  const [showSwitchNotification, setShowSwitchNotification] = useState(false);
  const [previousUserType, setPreviousUserType] = useState<
    "customer" | "provider" | null
  >(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    business_name: "",
    business_description: "",
    avatar_url: "",
  });

  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Bookings state
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingStats, setBookingStats] = useState<any>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingFilters, setBookingFilters] = useState<BookingFilters>({});
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);

  // Listings state
  const [listings, setListings] = useState<any[]>([]);
  const [listingStats, setListingStats] = useState<any>(null);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingFilters, setListingFilters] = useState<ListingFilters>({});
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
      console.log(user, isAuthenticated);
    }
  }, [isAuthenticated, user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    if (!error && data) {
      setFormData({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        business_name: data.business_name || "",
        business_description: data.business_description || "",
        avatar_url: data.avatar_url || "",
      });
    }
  };
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      const ext = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;

      // Optional: Remove existing file with same name before upload
      // await supabase.storage.from("avatars").remove([fileName]);
      console.log(fileName);

      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: true, // works only if your Supabase version supports it
        });
      console.log("@Uploaded", data);

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        return;
      }

      // Correct way to get public URL
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      if (!publicData?.publicUrl) {
        console.error("Public URL could not be generated");
        return;
      }

      const publicUrl = publicData.publicUrl;

      // Update local state
      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));

      // Save URL to profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError.message);
      } else {
        await fetchProfile(); // Refresh profile data
      }
    } catch (error) {
      console.error("Unexpected upload error:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        business_name: formData.business_name,
        business_description: formData.business_description,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Profile update error:", error);
    } else {
      fetchProfile();
    }
  };

  useEffect(() => {
    if (
      user &&
      profile &&
      previousUserType &&
      profile.user_type !== previousUserType
    ) {
      setShowSwitchNotification(true);
    }
    if (profile) {
      setPreviousUserType(profile.user_type);
    }
  }, [profile]);

  useEffect(() => {
    if (isAuthenticated && user && profile) {
      fetchDashboardData();

      // Subscribe to real-time updates
      const unsubscribe = subscribeToDashboardUpdates(
        user.id,
        profile.user_type,
        () => {
          fetchDashboardData();
        }
      );

      return unsubscribe;
    }
  }, [isAuthenticated, user, profile]);

  useEffect(() => {
    if (activeTab === "appointments" && isAuthenticated && user && profile) {
      fetchBookings();
    }
  }, [activeTab, isAuthenticated, user, profile, bookingFilters]);

  useEffect(() => {
    if (
      activeTab === "listings" &&
      isAuthenticated &&
      user &&
      profile?.user_type === "provider"
    ) {
      fetchListings();
    }
  }, [activeTab, isAuthenticated, user, profile, listingFilters]);

  useEffect(() => {
    if (isAuthenticated && user && profile?.user_type === "provider") {
      // Subscribe to listing updates
      const unsubscribe = subscribeToListingUpdates(user.id, () => {
        if (activeTab === "listings") {
          fetchListings();
        }
      });

      return unsubscribe;
    }
  }, [isAuthenticated, user, profile, activeTab]);

  const fetchDashboardData = async () => {
    if (!user || !profile) return;

    try {
      setDashboardLoading(true);
      const stats = await getDashboardStats(user.id, profile.user_type);
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!user || !profile) return;

    try {
      setBookingsLoading(true);
      const [bookingsData, statsData] = await Promise.all([
        getBookings(user.id, profile.user_type, bookingFilters),
        getBookingStats(user.id, profile.user_type),
      ]);

      setBookings(bookingsData);
      setBookingStats(statsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchListings = async () => {
    if (!user || !profile || profile.user_type !== "provider") return;

    try {
      setListingsLoading(true);
      const [listingsData, statsData] = await Promise.all([
        getUserListings(user.id, listingFilters),
        getListingStats(user.id),
      ]);

      setListings(listingsData);
      setListingStats(statsData);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setListingsLoading(false);
    }
  };

  const handleBookingStatusUpdate = async (
    bookingId: string,
    status: any,
    totalAmount?: number
  ) => {
    try {
      await updateBookingStatus(bookingId, status, totalAmount);
      await fetchBookings(); // Refresh bookings
      await fetchDashboardData(); // Refresh dashboard stats
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  const handleBookingView = (booking: any) => {
    setSelectedBooking(booking);
    setIsBookingDetailsOpen(true);
  };

  const handleListingClick = (listing: any) => {
    setSelectedListing(listing);
    setIsListingModalOpen(true);
  };

  const handleAuthSuccess = (userData: any) => {
    setIsAuthModalOpen(false);
  };

  const handleAddListingClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (profile?.user_type !== "provider") {
      switchUserType("provider");
    }
    setIsAddListingOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle size={16} />;
      case "pending":
        return <Clock size={16} />;
      case "completed":
        return <CheckCircle size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark mb-2">
            Account Dashboard
          </h1>
          <p className="text-gray-600">
            {profile?.user_type === "provider"
              ? "Manage your services, bookings, and business analytics"
              : "Track your bookings and manage your profile"}
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 size={16} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings size={16} />
              Profile
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <MessageCircle size={16} />
              Inbox
            </TabsTrigger>
            <TabsTrigger
              value="appointments"
              className="flex items-center gap-2"
            >
              <Calendar size={16} />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <Users size={16} />
              Listings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              </div>
            ) : dashboardStats ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Total Bookings
                          </p>
                          <p className="text-2xl font-bold text-brand-dark">
                            {dashboardStats.totalBookings}
                          </p>
                          <div className="flex items-center mt-1">
                            {getChangeIcon(dashboardStats.monthlyBookings)}
                            <p className="text-sm text-green-600 ml-1">
                              {dashboardStats.monthlyBookings} this month
                            </p>
                          </div>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                          <Calendar size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Revenue
                          </p>
                          <p className="text-2xl font-bold text-brand-dark">
                            {formatCurrency(dashboardStats.totalRevenue)}
                          </p>
                          <div className="flex items-center mt-1">
                            {getChangeIcon(dashboardStats.monthlyRevenue)}
                            <p className="text-sm text-green-600 ml-1">
                              {formatCurrency(dashboardStats.monthlyRevenue)}{" "}
                              this month
                            </p>
                          </div>
                        </div>
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                          <DollarSign size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Average Rating
                          </p>
                          <p className="text-2xl font-bold text-brand-dark">
                            {dashboardStats.averageRating}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Based on reviews
                          </p>
                        </div>
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                          <Star size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Response Rate
                          </p>
                          <p className="text-2xl font-bold text-brand-dark">
                            {dashboardStats.responseRate}%
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Within 24 hours
                          </p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                          <MessageCircle size={24} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts and Analytics */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Booking Trends */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp size={20} />
                        Booking Trends (30 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center text-gray-500">
                          <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                          <p>Booking trends chart</p>
                          <p className="text-sm">
                            {dashboardStats.bookingTrends.reduce(
                              (sum, day) => sum + day.bookings,
                              0
                            )}{" "}
                            total bookings
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Services */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star size={20} />
                        Top Performing Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardStats.topServices.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>No completed bookings yet</p>
                            <p className="text-sm">
                              Complete some bookings to see your top services
                            </p>
                          </div>
                        ) : (
                          dashboardStats.topServices.map((service, index) => (
                            <div
                              key={service.service_id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold">
                                    {service.title}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {service.booking_count} bookings
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-brand-primary">
                                  {formatCurrency(service.revenue)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock size={20} />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardStats.recentActivity.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No recent activity</p>
                          <p className="text-sm">
                            Your recent bookings and reviews will appear here
                          </p>
                        </div>
                      ) : (
                        dashboardStats.recentActivity.map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                          >
                            <div
                              className={`p-2 rounded-full ${
                                activity.type === "booking"
                                  ? "bg-blue-100 text-blue-600"
                                  : activity.type === "review"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-green-100 text-green-600"
                              }`}
                            >
                              {activity.type === "booking" ? (
                                <Calendar size={16} />
                              ) : activity.type === "review" ? (
                                <Star size={16} />
                              ) : (
                                <MessageCircle size={16} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">
                                  {activity.title}
                                </h4>
                                <span className="text-sm text-gray-500">
                                  {format(
                                    new Date(activity.timestamp),
                                    "MMM d, h:mm a"
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {activity.description}
                              </p>
                              {activity.status && (
                                <Badge
                                  className={`mt-2 ${getStatusColor(
                                    activity.status
                                  )}`}
                                >
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Unable to load dashboard data</p>
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage
                      src={formData.avatar_url || "/placeholder.svg"}
                    />
                    <AvatarFallback>
                      {formData.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="avatar-upload"
                      onChange={handleAvatarChange}
                    />
                    <label htmlFor="avatar-upload">
                      <Button variant="outline" asChild>
                        <span>Change Photo</span>
                      </Button>
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                {profile?.user_type === "provider" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name
                      </label>
                      <Input defaultValue={profile?.business_name || ""} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Description
                      </label>
                      <Textarea
                        defaultValue={profile?.business_description || ""}
                        rows={4}
                      />
                    </div>
                  </>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors">
                          <input
                            type="radio"
                            name="userType"
                            value="customer"
                            checked={profile?.user_type === "customer"}
                            onChange={(e) =>
                              switchUserType(
                                e.target.value as "customer" | "provider"
                              )
                            }
                            className="mr-3"
                          />
                          <div>
                            <div className="font-medium">Customer</div>
                            <div className="text-sm text-gray-500">
                              Book services and connect with providers
                            </div>
                          </div>
                        </label>
                      </div>
                      <div className="flex-1">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors">
                          <input
                            type="radio"
                            name="userType"
                            value="provider"
                            checked={profile?.user_type === "provider"}
                            onChange={(e) =>
                              switchUserType(
                                e.target.value as "customer" | "provider"
                              )
                            }
                            className="mr-3"
                          />
                          <div>
                            <div className="font-medium">Service Provider</div>
                            <div className="text-sm text-gray-500">
                              Offer services and manage bookings
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  className="bg-brand-primary hover:bg-brand-secondary"
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Messages</span>
                  <Button asChild variant="outline">
                    <a href="/chat">Open Full Chat</a>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg mb-2">Your messages appear here</p>
                  <p className="text-sm">
                    Use the full chat interface to manage all your conversations
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-brand-dark">
                Appointments
              </h2>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select
                  value={bookingFilters.status || "all"}
                  onValueChange={(value) =>
                    setBookingFilters((prev) => ({
                      ...prev,
                      status: value === "all" ? undefined : (value as any),
                    }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Search bookings..."
                  value={bookingFilters.search || ""}
                  onChange={(e) =>
                    setBookingFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  className="w-48"
                />
              </div>
            </div>

            {/* Booking Stats */}
            {bookingStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {bookingStats.pending}
                    </div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {bookingStats.confirmed}
                    </div>
                    <div className="text-sm text-gray-600">Confirmed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {bookingStats.completed}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-brand-primary">
                      {formatCurrency(bookingStats.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bookings List */}
            <Card>
              <CardContent className="p-6">
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg mb-2">No appointments found</p>
                    <p className="text-sm">
                      {profile?.user_type === "provider"
                        ? "Customers will book your services and appointments will appear here"
                        : "Book services to see your appointments here"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {booking.services?.title}
                              </h3>
                              <Badge
                                className={`${getStatusColor(
                                  booking.status
                                )} flex items-center gap-1`}
                              >
                                {getStatusIcon(booking.status)}
                                {booking.status}
                              </Badge>
                              {booking.urgency !== "normal" && (
                                <Badge
                                  variant="outline"
                                  className="text-red-600 border-red-200"
                                >
                                  {booking.urgency}
                                </Badge>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p>
                                  <strong>Customer:</strong>{" "}
                                  {booking.customer_name}
                                </p>
                                <p>
                                  <strong>Phone:</strong>{" "}
                                  {booking.customer_phone}
                                </p>
                                <p>
                                  <strong>Email:</strong>{" "}
                                  {booking.customer_email}
                                </p>
                              </div>
                              <div>
                                <p>
                                  <strong>Date:</strong>{" "}
                                  {format(
                                    new Date(booking.booking_date),
                                    "MMM d, yyyy"
                                  )}
                                </p>
                                <p>
                                  <strong>Time:</strong> {booking.booking_time}
                                </p>
                                <p>
                                  <strong>Address:</strong>{" "}
                                  {booking.service_address}
                                </p>
                              </div>
                            </div>

                            {booking.service_details && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm">
                                  <strong>Details:</strong>{" "}
                                  {booking.service_details}
                                </p>
                              </div>
                            )}

                            {booking.total_amount && (
                              <div className="mt-3">
                                <p className="font-semibold text-brand-primary">
                                  Total: {formatCurrency(booking.total_amount)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 ml-4">
                            {profile?.user_type === "provider" && (
                              <>
                                {booking.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleBookingStatusUpdate(
                                          booking.id,
                                          "confirmed"
                                        )
                                      }
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleBookingStatusUpdate(
                                          booking.id,
                                          "cancelled"
                                        )
                                      }
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      Decline
                                    </Button>
                                  </>
                                )}

                                {booking.status === "confirmed" && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const amount = prompt(
                                        "Enter total amount (optional):"
                                      );
                                      const totalAmount = amount
                                        ? Number.parseFloat(amount)
                                        : undefined;
                                      handleBookingStatusUpdate(
                                        booking.id,
                                        "completed",
                                        totalAmount
                                      );
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Complete
                                  </Button>
                                )}
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBookingView(booking)}
                            >
                              <Eye size={14} className="mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-brand-dark">
                My Listings
              </h2>

              <div className="flex flex-wrap gap-2">
                <Select
                  value={listingFilters.status || "all"}
                  onValueChange={(value) =>
                    setListingFilters((prev) => ({
                      ...prev,
                      status: value === "all" ? undefined : (value as any),
                    }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Search listings..."
                  value={listingFilters.search || ""}
                  onChange={(e) =>
                    setListingFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  className="w-48"
                />

                <Button
                  className="bg-brand-primary hover:bg-brand-secondary"
                  onClick={handleAddListingClick}
                >
                  <Plus size={16} className="mr-2" />
                  Create Listing
                </Button>
              </div>
            </div>

            {profile?.user_type !== "provider" ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-blue-800 mb-2">
                      Switch to Provider Mode
                    </h3>
                    <p className="text-blue-700 mb-4">
                      Switch to provider mode to create and manage service
                      listings.
                    </p>
                    <Button
                      onClick={() => switchUserType("provider")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Switch to Provider Mode
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Listing Stats */}
                {listingStats && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-brand-primary">
                          {listingStats.total}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Listings
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {listingStats.active}
                        </div>
                        <div className="text-sm text-gray-600">Active</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {listingStats.paused}
                        </div>
                        <div className="text-sm text-gray-600">Paused</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {listingStats.totalViews}
                        </div>
                        <div className="text-sm text-gray-600">Total Views</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {listingStats.averageRating.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">Avg Rating</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Listings List */}
                <Card>
                  <CardContent className="p-6">
                    {listingsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                      </div>
                    ) : listings.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-lg mb-2">No listings found</p>
                        <p className="text-sm">
                          {listingFilters.search || listingFilters.status
                            ? "Try adjusting your filters or create your first listing"
                            : "Create your first listing to start receiving bookings"}
                        </p>
                        <Button
                          className="mt-4 bg-brand-primary hover:bg-brand-secondary"
                          onClick={handleAddListingClick}
                        >
                          <Plus size={16} className="mr-2" />
                          Create Your First Listing
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {listings.map((listing) => (
                          <div
                            key={listing.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleListingClick(listing)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex gap-4 flex-1">
                                <img
                                  src={
                                    listing.images?.[0] ||
                                    "/placeholder.svg?height=80&width=120"
                                  }
                                  alt={listing.title}
                                  className="w-20 h-16 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">
                                      {listing.title}
                                    </h3>
                                    <Badge
                                      className={getStatusColor(listing.status)}
                                    >
                                      {listing.status}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600 mb-2">
                                    {listing.category} •{" "}
                                    {listing.specific_service}
                                  </p>
                                  <p className="text-sm text-gray-500 line-clamp-2">
                                    {listing.description}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <MapPin size={12} />
                                      {listing.location_city},{" "}
                                      {listing.location_state}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Eye size={12} />
                                      {listing.views} views
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Star size={12} />
                                      {listing.rating} ({listing.review_count}{" "}
                                      reviews)
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-semibold text-brand-primary text-lg">
                                  {listing.pricing_type === "custom"
                                    ? "Custom Quote"
                                    : `$${listing.pricing_amount}${
                                        listing.pricing_type === "hourly"
                                          ? "/hr"
                                          : ""
                                      }`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Updated{" "}
                                  {format(
                                    new Date(listing.updated_at),
                                    "MMM d"
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Listing Modal */}
      <AddListingModal
        isOpen={isAddListingOpen}
        onClose={() => setIsAddListingOpen(false)}
        onSuccess={() => {
          console.log("Listing created successfully!");
          fetchDashboardData();
          fetchListings();
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Account Type Switch Notification */}
      <AccountTypeSwitchNotification
        show={showSwitchNotification}
        userType={profile?.user_type || "customer"}
        onClose={() => setShowSwitchNotification(false)}
      />

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={isBookingDetailsOpen}
          onClose={() => {
            setIsBookingDetailsOpen(false);
            setSelectedBooking(null);
          }}
          onUpdate={() => {
            fetchBookings();
            fetchDashboardData();
          }}
          userType={profile?.user_type || "customer"}
        />
      )}

      {/* Listing Management Modal */}
      {selectedListing && (
        <ListingManagementModal
          listing={selectedListing}
          isOpen={isListingModalOpen}
          onClose={() => {
            setIsListingModalOpen(false);
            setSelectedListing(null);
          }}
          onUpdate={() => {
            fetchListings();
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
