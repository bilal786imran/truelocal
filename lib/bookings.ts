import { supabase } from "./supabase"
import type { Database } from "@/types/database"

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  services: {
    title: string
    pricing_type: string
    pricing_amount: number | null
  } | null
  customer_profile: {
    full_name: string | null
    avatar_url: string | null
    phone: string | null
    email: string
  } | null
  provider_profile: {
    full_name: string | null
    avatar_url: string | null
    business_name: string | null
  } | null
}

export interface BookingFilters {
  status?: "pending" | "confirmed" | "completed" | "cancelled"
  dateFrom?: string
  dateTo?: string
  serviceId?: string
  search?: string
}

export const getBookings = async (
  userId: string,
  userType: "customer" | "provider",
  filters: BookingFilters = {},
): Promise<Booking[]> => {
  const column = userType === "customer" ? "customer_id" : "provider_id"

  let query = supabase
    .from("bookings")
    .select(`
      *,
      services (title, pricing_type, pricing_amount),
      customer_profile:profiles!bookings_customer_id_fkey (full_name, avatar_url, phone, email),
      provider_profile:profiles!bookings_provider_id_fkey (full_name, avatar_url, business_name)
    `)
    .eq(column, userId)

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  if (filters.dateFrom) {
    query = query.gte("booking_date", filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte("booking_date", filters.dateTo)
  }

  if (filters.serviceId) {
    query = query.eq("service_id", filters.serviceId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error

  // Apply search filter (client-side for complex search)
  let filteredData = data || []
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filteredData = filteredData.filter(
      (booking) =>
        booking.services?.title.toLowerCase().includes(searchLower) ||
        booking.customer_name.toLowerCase().includes(searchLower) ||
        booking.service_address.toLowerCase().includes(searchLower) ||
        booking.service_details?.toLowerCase().includes(searchLower),
    )
  }

  return filteredData
}

export const updateBookingStatus = async (
  bookingId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  totalAmount?: number,
) => {
  const updateData: any = { status, updated_at: new Date().toISOString() }

  if (totalAmount !== undefined) {
    updateData.total_amount = totalAmount
  }

  const { data, error } = await supabase.from("bookings").update(updateData).eq("id", bookingId).select().single()

  if (error) throw error

  return data
}

export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      services (title, pricing_type, pricing_amount),
      customer_profile:profiles!bookings_customer_id_fkey (full_name, avatar_url, phone, email),
      provider_profile:profiles!bookings_provider_id_fkey (full_name, avatar_url, business_name)
    `)
    .eq("id", bookingId)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw error
  }

  return data
}

export const createBooking = async (bookingData: {
  customer_id: string
  provider_id: string
  service_id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  service_address: string
  service_details?: string
  booking_date: string
  booking_time: string
  urgency: "normal" | "urgent" | "emergency"
}) => {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      ...bookingData,
      status: "pending",
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export const cancelBooking = async (bookingId: string, reason?: string) => {
  const { data, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      service_details: reason ? `Cancelled: ${reason}` : "Cancelled by user",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select()
    .single()

  if (error) throw error

  return data
}

export const getBookingStats = async (userId: string, userType: "customer" | "provider") => {
  const column = userType === "customer" ? "customer_id" : "provider_id"

  const { data, error } = await supabase.from("bookings").select("status, total_amount, created_at").eq(column, userId)

  if (error) throw error

  const now = new Date()
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const stats = data?.reduce(
    (acc, booking) => {
      const bookingDate = new Date(booking.created_at)

      acc.total += 1
      acc.totalRevenue += booking.total_amount || 0

      switch (booking.status) {
        case "pending":
          acc.pending += 1
          break
        case "confirmed":
          acc.confirmed += 1
          break
        case "completed":
          acc.completed += 1
          break
        case "cancelled":
          acc.cancelled += 1
          break
      }

      if (bookingDate >= startOfWeek) {
        acc.thisWeek += 1
      }

      if (bookingDate >= startOfMonth) {
        acc.thisMonth += 1
      }

      return acc
    },
    {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      thisWeek: 0,
      thisMonth: 0,
      totalRevenue: 0,
    },
  ) || {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalRevenue: 0,
  }

  return stats
}

// Real-time subscription for booking updates
export const subscribeToBookingUpdates = (
  userId: string,
  userType: "customer" | "provider",
  onUpdate: (booking: any) => void,
) => {
  const channel = supabase
    .channel(`bookings-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookings",
        filter: userType === "customer" ? `customer_id=eq.${userId}` : `provider_id=eq.${userId}`,
      },
      (payload) => {
        onUpdate(payload)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
