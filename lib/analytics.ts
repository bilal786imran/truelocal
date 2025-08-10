import { supabase } from "./supabase"
import type { Database } from "@/types/database"

type Booking = Database["public"]["Tables"]["bookings"]["Row"]
type Service = Database["public"]["Tables"]["services"]["Row"]

export interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  averageRating: number
  responseRate: number
  completedJobs: number
  pendingBookings: number
  monthlyRevenue: number
  monthlyBookings: number
  topServices: Array<{
    service_id: string
    title: string
    booking_count: number
    revenue: number
  }>
  recentActivity: Array<{
    type: "booking" | "review" | "message"
    title: string
    description: string
    timestamp: string
    status?: string
  }>
  bookingTrends: Array<{
    date: string
    bookings: number
    revenue: number
  }>
  ratingDistribution: Array<{
    rating: number
    count: number
  }>
}

export const getDashboardStats = async (userId: string, userType: "customer" | "provider"): Promise<DashboardStats> => {
  try {
    const [bookingsData, servicesData, reviewsData, conversationsData, recentBookingsData] = await Promise.all([
      getBookingsStats(userId, userType),
      getServicesStats(userId, userType),
      getReviewsStats(userId, userType),
      getConversationsStats(userId, userType),
      getRecentBookings(userId, userType),
    ])

    // Calculate booking trends (last 30 days)
    const bookingTrends = await getBookingTrends(userId, userType)

    // Get top services
    const topServices = await getTopServices(userId, userType)

    // Get recent activity
    const recentActivity = await getRecentActivity(userId, userType)

    // Get rating distribution
    const ratingDistribution = await getRatingDistribution(userId, userType)

    return {
      totalBookings: bookingsData.total,
      totalRevenue: bookingsData.revenue,
      averageRating: reviewsData.averageRating,
      responseRate: conversationsData.responseRate,
      completedJobs: bookingsData.completed,
      pendingBookings: bookingsData.pending,
      monthlyRevenue: bookingsData.monthlyRevenue,
      monthlyBookings: bookingsData.monthlyBookings,
      topServices,
      recentActivity,
      bookingTrends,
      ratingDistribution,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    throw error
  }
}

const getBookingsStats = async (userId: string, userType: "customer" | "provider") => {
  const column = userType === "customer" ? "customer_id" : "provider_id"

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("status, total_amount, created_at")
    .eq(column, userId)

  if (error) throw error

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const stats = bookings?.reduce(
    (acc, booking) => {
      const amount = booking.total_amount || 0
      const bookingDate = new Date(booking.created_at)

      acc.total += 1
      acc.revenue += amount

      if (booking.status === "completed") {
        acc.completed += 1
      } else if (booking.status === "pending") {
        acc.pending += 1
      }

      if (bookingDate >= startOfMonth) {
        acc.monthlyBookings += 1
        acc.monthlyRevenue += amount
      }

      return acc
    },
    {
      total: 0,
      revenue: 0,
      completed: 0,
      pending: 0,
      monthlyBookings: 0,
      monthlyRevenue: 0,
    },
  ) || {
    total: 0,
    revenue: 0,
    completed: 0,
    pending: 0,
    monthlyBookings: 0,
    monthlyRevenue: 0,
  }

  return stats
}

const getServicesStats = async (userId: string, userType: "customer" | "provider") => {
  if (userType === "customer") {
    return { totalServices: 0, activeServices: 0 }
  }

  const { data: services, error } = await supabase.from("services").select("status").eq("provider_id", userId)

  if (error) throw error

  const stats = services?.reduce(
    (acc, service) => {
      acc.total += 1
      if (service.status === "active") {
        acc.active += 1
      }
      return acc
    },
    { total: 0, active: 0 },
  ) || { total: 0, active: 0 }

  return { totalServices: stats.total, activeServices: stats.active }
}

const getReviewsStats = async (userId: string, userType: "customer" | "provider") => {
  const column = userType === "customer" ? "customer_id" : "provider_id"

  const { data: reviews, error } = await supabase.from("reviews").select("rating").eq(column, userId)

  if (error) throw error

  if (!reviews || reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0 }
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
  }
}

const getConversationsStats = async (userId: string, userType: "customer" | "provider") => {
  const column = userType === "customer" ? "customer_id" : "provider_id"

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("created_at, last_message_at")
    .eq(column, userId)

  if (error) throw error

  // Calculate response rate (conversations with responses within 24 hours)
  const responseRate = conversations?.reduce(
    (acc, conv) => {
      if (conv.last_message_at) {
        const created = new Date(conv.created_at)
        const lastMessage = new Date(conv.last_message_at)
        const diffHours = (lastMessage.getTime() - created.getTime()) / (1000 * 60 * 60)

        if (diffHours <= 24) {
          acc.responded += 1
        }
      }
      acc.total += 1
      return acc
    },
    { responded: 0, total: 0 },
  ) || { responded: 0, total: 0 }

  return {
    responseRate: responseRate.total > 0 ? Math.round((responseRate.responded / responseRate.total) * 100) : 100,
  }
}

const getRecentBookings = async (userId: string, userType: "customer" | "provider") => {
  const column = userType === "customer" ? "customer_id" : "provider_id"

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      *,
      services (title),
      customer_profile:profiles!bookings_customer_id_fkey (full_name),
      provider_profile:profiles!bookings_provider_id_fkey (full_name)
    `)
    .eq(column, userId)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) throw error

  return bookings || []
}

const getBookingTrends = async (userId: string, userType: "customer" | "provider") => {
  const column = userType === "customer" ? "customer_id" : "provider_id"
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("created_at, total_amount")
    .eq(column, userId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true })

  if (error) throw error

  // Group by date
  const trends =
    bookings?.reduce(
      (acc, booking) => {
        const date = new Date(booking.created_at).toISOString().split("T")[0]
        if (!acc[date]) {
          acc[date] = { bookings: 0, revenue: 0 }
        }
        acc[date].bookings += 1
        acc[date].revenue += booking.total_amount || 0
        return acc
      },
      {} as Record<string, { bookings: number; revenue: number }>,
    ) || {}

  // Convert to array and fill missing dates
  const result = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    result.push({
      date: dateStr,
      bookings: trends[dateStr]?.bookings || 0,
      revenue: trends[dateStr]?.revenue || 0,
    })
  }

  return result
}

const getTopServices = async (userId: string, userType: "customer" | "provider") => {
  if (userType === "customer") return []

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      service_id,
      total_amount,
      services (title)
    `)
    .eq("provider_id", userId)
    .eq("status", "completed")

  if (error) throw error

  const serviceStats =
    data?.reduce(
      (acc, booking) => {
        const serviceId = booking.service_id
        if (!acc[serviceId]) {
          acc[serviceId] = {
            service_id: serviceId,
            title: booking.services?.title || "Unknown Service",
            booking_count: 0,
            revenue: 0,
          }
        }
        acc[serviceId].booking_count += 1
        acc[serviceId].revenue += booking.total_amount || 0
        return acc
      },
      {} as Record<string, any>,
    ) || {}

  return Object.values(serviceStats)
    .sort((a: any, b: any) => b.booking_count - a.booking_count)
    .slice(0, 5)
}

const getRecentActivity = async (userId: string, userType: "customer" | "provider") => {
  const activities = []

  // Get recent bookings
  const column = userType === "customer" ? "customer_id" : "provider_id"
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      services (title),
      customer_profile:profiles!bookings_customer_id_fkey (full_name),
      provider_profile:profiles!bookings_provider_id_fkey (full_name)
    `)
    .eq(column, userId)
    .order("created_at", { ascending: false })
    .limit(5)

  bookings?.forEach((booking) => {
    const otherParty =
      userType === "customer" ? booking.provider_profile?.full_name : booking.customer_profile?.full_name

    activities.push({
      type: "booking" as const,
      title: `Booking ${booking.status}`,
      description: `${booking.services?.title} with ${otherParty}`,
      timestamp: booking.created_at,
      status: booking.status,
    })
  })

  // Get recent reviews
  const reviewColumn = userType === "customer" ? "customer_id" : "provider_id"
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      *,
      services (title),
      customer_profile:profiles!reviews_customer_id_fkey (full_name),
      provider_profile:profiles!reviews_provider_id_fkey (full_name)
    `)
    .eq(reviewColumn, userId)
    .order("created_at", { ascending: false })
    .limit(3)

  reviews?.forEach((review) => {
    const otherParty = userType === "customer" ? review.provider_profile?.full_name : review.customer_profile?.full_name

    activities.push({
      type: "review" as const,
      title: `${userType === "customer" ? "Review left" : "Review received"}`,
      description: `${review.rating} stars for ${review.services?.title}`,
      timestamp: review.created_at,
    })
  })

  // Sort by timestamp and return top 10
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)
}

const getRatingDistribution = async (userId: string, userType: "customer" | "provider") => {
  const column = userType === "customer" ? "customer_id" : "provider_id"

  const { data: reviews, error } = await supabase.from("reviews").select("rating").eq(column, userId)

  if (error) throw error

  const distribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: reviews?.filter((r) => r.rating === rating).length || 0,
  }))

  return distribution
}

// Real-time subscription for dashboard updates
export const subscribeToDashboardUpdates = (
  userId: string,
  userType: "customer" | "provider",
  onUpdate: () => void,
) => {
  const channels = []

  // Subscribe to bookings changes
  const bookingsChannel = supabase
    .channel(`dashboard-bookings-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookings",
        filter: userType === "customer" ? `customer_id=eq.${userId}` : `provider_id=eq.${userId}`,
      },
      onUpdate,
    )
    .subscribe()

  channels.push(bookingsChannel)

  // Subscribe to reviews changes
  const reviewsChannel = supabase
    .channel(`dashboard-reviews-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reviews",
        filter: userType === "customer" ? `customer_id=eq.${userId}` : `provider_id=eq.${userId}`,
      },
      onUpdate,
    )
    .subscribe()

  channels.push(reviewsChannel)

  // Subscribe to services changes (providers only)
  if (userType === "provider") {
    const servicesChannel = supabase
      .channel(`dashboard-services-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
          filter: `provider_id=eq.${userId}`,
        },
        onUpdate,
      )
      .subscribe()

    channels.push(servicesChannel)
  }

  return () => {
    channels.forEach((channel) => supabase.removeChannel(channel))
  }
}
