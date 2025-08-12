"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  Users,
  CheckCircle,
  Grid,
  List,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles: {
    full_name: string | null;
    verified: boolean;
  };
};

const categories = [
  "All Categories",
  "Home Repair & Maintenance",
  "Cleaning Services",
  "Beauty & Personal Care",
  "IT & Electronics",
  "Moving & Transportation",
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);

    try {
      // First, get services only
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (servicesError) {
        console.error("Error fetching services:", servicesError.message);
        setServices([]);
        return;
      }

      if (!servicesData?.length) {
        setServices([]);
        return;
      }

      // Fetch related profiles separately to avoid join issues
      const providerIds = [
        ...new Set(servicesData.map((s) => s.provider_id).filter(Boolean)),
      ];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, verified")
        .in("id", providerIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError.message);
      }

      // Merge profiles into services
      const merged = servicesData.map((service) => ({
        ...service,
        profiles: profilesData?.find((p) => p.id === service.provider_id) || {
          full_name: null,
          verified: false,
        },
      }));

      setServices(merged);
    } catch (err) {
      console.error("Unexpected error fetching services:", err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    if (
      selectedCategory !== "All Categories" &&
      service.category !== selectedCategory
    ) {
      return false;
    }
    if (verifiedOnly && !service.profiles?.verified) {
      return false;
    }
    if (
      searchQuery &&
      !service.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !service.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (
      locationQuery &&
      !service.location_city
        .toLowerCase()
        .includes(locationQuery.toLowerCase()) &&
      !service.location_state
        .toLowerCase()
        .includes(locationQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSearch = () => {
    // Search is handled by the filter effect
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <section className="bg-white border-b border-gray-200 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-brand-dark mb-6">
            Find Services
          </h1>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search services..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Location"
                className="pl-10 h-12 w-full lg:w-64"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
            <Button
              className="h-12 px-8 bg-brand-primary hover:bg-brand-secondary"
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal size={16} />
                Filters
              </Button>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {filteredServices.length} services found
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid size={16} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg animate-fade-in">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={verifiedOnly}
                    onCheckedChange={(checked) =>
                      setVerifiedOnly(checked as boolean)
                    }
                  />
                  <label htmlFor="verified" className="text-sm font-medium">
                    Verified providers only
                  </label>
                </div>

                <Select>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.0">4.0+ Stars</SelectItem>
                    <SelectItem value="3.5">3.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">$ - Budget</SelectItem>
                    <SelectItem value="medium">$$ - Standard</SelectItem>
                    <SelectItem value="high">$$$ - Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Services Grid/List */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {viewMode === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service) => (
                <Link key={service.id} href={`/services/${service.id}`}>
                  <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group overflow-hidden">
                    <div className="relative">
                      <img
                        src={
                          service.images?.[0] ||
                          "/placeholder.svg?height=200&width=300"
                        }
                        alt={service.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {service.profiles?.verified && (
                        <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                          <CheckCircle size={12} className="mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-brand-dark group-hover:text-brand-primary transition-colors">
                          {service.title}
                        </h3>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {service.rating}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{service.category}</p>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-brand-primary">
                          {service.pricing_type === "custom"
                            ? "Custom Quote"
                            : `$${service.pricing_amount}${
                                service.pricing_type === "hourly" ? "/hr" : ""
                              }`}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin size={12} className="mr-1" />
                          {service.location_city}, {service.location_state}
                        </div>
                      </div>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Users size={12} className="mr-1" />
                        {service.review_count} reviews
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredServices.map((service) => (
                <Link key={service.id} href={`/services/${service.id}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="relative w-full md:w-48 h-32 flex-shrink-0">
                          <img
                            src={
                              service.images?.[0] ||
                              "/placeholder.svg?height=200&width=300"
                            }
                            alt={service.title}
                            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                          />
                          {service.profiles?.verified && (
                            <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                              <CheckCircle size={12} className="mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-xl text-brand-dark group-hover:text-brand-primary transition-colors">
                              {service.title}
                            </h3>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">
                                {service.rating}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-2">
                            {service.category}
                          </p>
                          <p className="text-gray-500 mb-4">
                            {service.description}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-lg text-brand-primary">
                              {service.pricing_type === "custom"
                                ? "Custom Quote"
                                : `$${service.pricing_amount}${
                                    service.pricing_type === "hourly"
                                      ? "/hr"
                                      : ""
                                  }`}
                            </span>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <MapPin size={12} className="mr-1" />
                                {service.location_city},{" "}
                                {service.location_state}
                              </div>
                              <div className="flex items-center">
                                <Users size={12} className="mr-1" />
                                {service.review_count} reviews
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No services found matching your criteria.
              </p>
              <Button
                className="mt-4 bg-brand-primary hover:bg-brand-secondary"
                onClick={() => {
                  setSelectedCategory("All Categories");
                  setVerifiedOnly(false);
                  setSearchQuery("");
                  setLocationQuery("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
