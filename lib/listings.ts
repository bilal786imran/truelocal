import { supabase } from "./supabase";
import type { Database } from "@/types/database";

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles: {
    full_name: string | null;
    business_name: string | null;
    avatar_url: string | null;
  } | null;
};

export interface ListingFilters {
  status?: "active" | "paused" | "inactive";
  category?: string;
  search?: string;
  location?: string;
}

export const getUserListings = async (
  userId: string,
  filters: ListingFilters = {}
): Promise<Service[]> => {
  let query = supabase
    .from("services")
    .select(
      `
      *,
      profiles (full_name, business_name, avatar_url)
    `
    )
    .eq("provider_id", userId);

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;

  // Apply search filter (client-side for complex search)
  let filteredData = data || [];
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredData = filteredData.filter(
      (listing) =>
        listing.title.toLowerCase().includes(searchLower) ||
        listing.description.toLowerCase().includes(searchLower) ||
        listing.category.toLowerCase().includes(searchLower) ||
        listing.specific_service.toLowerCase().includes(searchLower)
    );
  }

  return filteredData;
};

export const getListingStats = async (userId: string) => {
  const { data, error } = await supabase
    .from("services")
    .select("status, views, rating, review_count")
    .eq("provider_id", userId);

  if (error) throw error;

  const stats = data?.reduce(
    (acc, listing) => {
      acc.total += 1;
      acc.totalViews += listing.views || 0;

      switch (listing.status) {
        case "active":
          acc.active += 1;
          break;
        case "paused":
          acc.paused += 1;
          break;
        case "inactive":
          acc.inactive += 1;
          break;
      }

      // Calculate average rating
      if (listing.rating && listing.review_count > 0) {
        acc.totalRating += listing.rating * listing.review_count;
        acc.totalReviews += listing.review_count;
      }

      return acc;
    },
    {
      total: 0,
      active: 0,
      paused: 0,
      inactive: 0,
      totalViews: 0,
      totalRating: 0,
      totalReviews: 0,
      averageRating: 0,
    }
  ) || {
    total: 0,
    active: 0,
    paused: 0,
    inactive: 0,
    totalViews: 0,
    totalRating: 0,
    totalReviews: 0,
    averageRating: 0,
  };

  // Calculate average rating
  stats.averageRating =
    stats.totalReviews > 0 ? stats.totalRating / stats.totalReviews : 0;

  return stats;
};

export const updateListingStatus = async (
  listingId: string,
  status: "active" | "paused" | "inactive"
) => {
  const { data, error } = await supabase
    .from("services")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteListing = async (listingId: string) => {
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", listingId);

  if (error) throw error;
};

export const getListingById = async (
  listingId: string
): Promise<Service | null> => {
  const { data, error } = await supabase
    .from("services")
    .select(
      `
      *,
      profiles (full_name, business_name, avatar_url)
    `
    )
    .eq("id", listingId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
};

// Real-time subscription for listing updates
export const subscribeToListingUpdates = (
  userId: string,
  onUpdate: (listing: any) => void
) => {
  const channel = supabase
    .channel(`listings-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "services",
        filter: `provider_id=eq.${userId}`,
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
