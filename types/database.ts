export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          user_type: "customer" | "provider"
          phone: string | null
          business_name: string | null
          business_description: string | null
          service_area: string | null
          years_experience: number | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          user_type?: "customer" | "provider"
          phone?: string | null
          business_name?: string | null
          business_description?: string | null
          service_area?: string | null
          years_experience?: number | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          user_type?: "customer" | "provider"
          phone?: string | null
          business_name?: string | null
          business_description?: string | null
          service_area?: string | null
          years_experience?: number | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          provider_id: string
          title: string
          description: string
          category: string
          specific_service: string
          pricing_type: "hourly" | "fixed" | "custom"
          pricing_amount: number | null
          currency: string
          location_address: string | null
          location_city: string
          location_state: string
          location_zip: string | null
          service_radius: number
          availability_days: string[]
          availability_start: string
          availability_end: string
          features: string[]
          requirements: string | null
          images: string[]
          status: "active" | "paused" | "inactive"
          views: number
          rating: number
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          title: string
          description: string
          category: string
          specific_service: string
          pricing_type: "hourly" | "fixed" | "custom"
          pricing_amount?: number | null
          currency?: string
          location_address?: string | null
          location_city: string
          location_state: string
          location_zip?: string | null
          service_radius: number
          availability_days: string[]
          availability_start: string
          availability_end: string
          features?: string[]
          requirements?: string | null
          images?: string[]
          status?: "active" | "paused" | "inactive"
          views?: number
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          title?: string
          description?: string
          category?: string
          specific_service?: string
          pricing_type?: "hourly" | "fixed" | "custom"
          pricing_amount?: number | null
          currency?: string
          location_address?: string | null
          location_city?: string
          location_state?: string
          location_zip?: string | null
          service_radius?: number
          availability_days?: string[]
          availability_start?: string
          availability_end?: string
          features?: string[]
          requirements?: string | null
          images?: string[]
          status?: "active" | "paused" | "inactive"
          views?: number
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          provider_id: string
          service_id: string
          customer_name: string
          customer_phone: string
          customer_email: string
          service_address: string
          service_details: string | null
          booking_date: string
          booking_time: string
          urgency: "normal" | "urgent" | "emergency"
          status: "pending" | "confirmed" | "completed" | "cancelled"
          total_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          provider_id: string
          service_id: string
          customer_name: string
          customer_phone: string
          customer_email: string
          service_address: string
          service_details?: string | null
          booking_date: string
          booking_time: string
          urgency?: "normal" | "urgent" | "emergency"
          status?: "pending" | "confirmed" | "completed" | "cancelled"
          total_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          provider_id?: string
          service_id?: string
          customer_name?: string
          customer_phone?: string
          customer_email?: string
          service_address?: string
          service_details?: string | null
          booking_date?: string
          booking_time?: string
          urgency?: "normal" | "urgent" | "emergency"
          status?: "pending" | "confirmed" | "completed" | "cancelled"
          total_amount?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          customer_id: string
          provider_id: string
          service_id: string | null
          last_message: string | null
          last_message_at: string | null
          customer_unread: number
          provider_unread: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          provider_id: string
          service_id?: string | null
          last_message?: string | null
          last_message_at?: string | null
          customer_unread?: number
          provider_unread?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          provider_id?: string
          service_id?: string | null
          last_message?: string | null
          last_message_at?: string | null
          customer_unread?: number
          provider_unread?: number
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          message?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          customer_id: string
          provider_id: string
          service_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          customer_id: string
          provider_id: string
          service_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          customer_id?: string
          provider_id?: string
          service_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
