"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  Calendar,
  MessageCircle,
  Share2,
  Heart,
  Users,
  Award,
  Shield,
  Loader2,
} from "lucide-react"
import { ChatModal } from "@/components/chat-modal"
import { BookingModal } from "@/components/booking-modal"
import { AuthModal } from "@/components/auth/login-modal"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"
import type { Database } from "@/types/database"

type Service = Database["public"]["Tables"]["services"]["Row"] & {
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
    verified: boolean
    business_name: string | null
    business_description: string | null
    years_experience: number | null
    created_at: string
  }
}

type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  }
}

export default function ServiceDetailsPage() {
  const params = useParams()
  const serviceId = params.id as string

  const [service, setService] = useState<Service | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails()
      fetchReviews()
      incrementViews()
    }
  }, [serviceId])

  const fetchServiceDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          profiles!services_provider_id_fkey (
            id,
            full_name,
            avatar_url,
            verified,
            business_name,
            business_description,
            years_experience,
            created_at
          )
        `)
        .eq("id", serviceId)
        .single()

      if (error) {
        console.error("Error fetching service:", error)
        return
      }

      setService(data)
    } catch (error) {
      console.error("Error fetching service:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles!reviews_customer_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error fetching reviews:", error)
        return
      }

      setReviews(data || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const incrementViews = async () => {
    try {
      await supabase.rpc("increment_service_views", { service_id: serviceId })
    } catch (error) {
      console.error("Error incrementing views:", error)
    }
  }

  const handleChatClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsChatOpen(true)
  }

  const handleBookingClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsBookingOpen(true)
  }

  const formatPrice = (service: Service) => {
    if (service.pricing_type === "custom") {
      return "Custom Quote"
    }

    const symbol = service.currency === "USD" ? "$" : service.currency
    const suffix = service.pricing_type === "hourly" ? "/hr" : ""
    return `${symbol}${service.pricing_amount}${suffix}`
  }

  const formatAvailability = (service: Service) => {
    const days = service.availability_days.join(", ")
    return `${days}: ${service.availability_start} - ${service.availability_end}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-brand-dark mb-4">Service Not Found</h1>
          <p className="text-gray-600">The service you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative">
                <img
                  src={service.images?.[0] || "/placeholder.svg?height=400&width=600"}
                  alt={service.title}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button size="icon" variant="secondary" className="bg-white/90 hover:bg-white">
                    <Heart size={16} />
                  </Button>
                  <Button size="icon" variant="secondary" className="bg-white/90 hover:bg-white">
                    <Share2 size={16} />
                  </Button>
                </div>
                {service.profiles?.verified && (
                  <Badge className="absolute top-4 left-4 bg-green-500 text-white">
                    <CheckCircle size={12} className="mr-1" />
                    Verified Provider
                  </Badge>
                )}
              </div>
              {service.images && service.images.length > 1 && (
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-2">
                    {service.images.slice(1, 5).map((image, index) => (
                      <img
                        key={index}
                        src={image || "/placeholder.svg"}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Service Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-brand-dark mb-2">{service.title}</h1>
                    <p className="text-gray-600 mb-2">{service.category}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-1" />
                        {service.location_city}, {service.location_state}
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        Usually responds within 2 hours
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center mb-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-bold text-lg">{service.rating}</span>
                      <span className="text-gray-500 ml-1">({service.review_count} reviews)</span>
                    </div>
                    <p className="text-2xl font-bold text-brand-primary">{formatPrice(service)}</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">{service.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Award className="w-6 h-6 text-brand-primary mx-auto mb-2" />
                    <div className="font-bold text-lg">{service.profiles?.years_experience || 0}</div>
                    <div className="text-sm text-gray-600">Years Experience</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Users className="w-6 h-6 text-brand-primary mx-auto mb-2" />
                    <div className="font-bold text-lg">{service.views}</div>
                    <div className="text-sm text-gray-600">Profile Views</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Shield className="w-6 h-6 text-brand-primary mx-auto mb-2" />
                    <div className="font-bold text-lg">{service.rating > 0 ? "100%" : "New"}</div>
                    <div className="text-sm text-gray-600">Satisfaction Rate</div>
                  </div>
                </div>

                {/* Features */}
                {service.features && service.features.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-3">Key Features</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {service.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                <div>
                  <h3 className="font-bold text-lg mb-2">Availability</h3>
                  <p className="text-gray-600">{formatAvailability(service)}</p>
                  <p className="text-sm text-gray-500 mt-1">Service radius: {service.service_radius} miles</p>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="reviews">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reviews">Reviews ({service.review_count})</TabsTrigger>
                    <TabsTrigger value="about">About Provider</TabsTrigger>
                  </TabsList>

                  <TabsContent value="reviews" className="mt-6">
                    <div className="space-y-6">
                      {reviews.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No reviews yet</p>
                          <p className="text-sm">Be the first to leave a review!</p>
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                            <div className="flex items-start gap-4">
                              <Avatar>
                                <AvatarImage src={review.profiles?.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{review.profiles?.full_name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">{review.profiles?.full_name || "Anonymous"}</h4>
                                  <span className="text-sm text-gray-500">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                {review.comment && <p className="text-gray-700">{review.comment}</p>}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="about" className="mt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={service.profiles?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{service.profiles?.full_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg mb-1">
                          {service.profiles?.business_name || service.profiles?.full_name || "Service Provider"}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          Member since {new Date(service.profiles?.created_at || "").getFullYear()}
                        </p>
                        {service.profiles?.business_description && (
                          <p className="text-gray-700">{service.profiles.business_description}</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Contact Provider</h3>
                <div className="space-y-3">
                  <Button className="w-full bg-brand-primary hover:bg-brand-secondary" onClick={handleBookingClick}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" onClick={handleChatClick}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                </div>
                {!isAuthenticated && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Sign in to book appointments and send messages
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-medium">2 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Starting Price:</span>
                    <span className="font-medium text-brand-primary">{formatPrice(service)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium">{service.profiles?.years_experience || 0} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Radius:</span>
                    <span className="font-medium">{service.service_radius} miles</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Service Area</h3>
                <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p>Map showing service area</p>
                    <p className="text-sm">
                      {service.location_city}, {service.location_state}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAuthenticated && service && (
        <>
          <ChatModal
            providerId={service.provider_id}
            providerName={service.profiles?.business_name || service.profiles?.full_name || "Provider"}
            providerAvatar={service.profiles?.avatar_url}
            serviceId={service.id}
            serviceName={service.title}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />

          <BookingModal
            serviceId={service.id}
            providerId={service.provider_id}
            providerName={service.profiles?.business_name || service.profiles?.full_name || "Provider"}
            serviceName={service.title}
            basePrice={formatPrice(service)}
            isOpen={isBookingOpen}
            onClose={() => setIsBookingOpen(false)}
          />
        </>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
