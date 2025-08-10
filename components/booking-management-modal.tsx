"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, Phone, Mail, User, DollarSign, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { updateBookingStatus } from "@/lib/bookings"

interface BookingManagementModalProps {
  booking: any
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function BookingManagementModal({ booking, isOpen, onClose, onUpdate }: BookingManagementModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [totalAmount, setTotalAmount] = useState(booking?.total_amount?.toString() || "")
  const [notes, setNotes] = useState("")

  const handleStatusUpdate = async (status: "confirmed" | "completed" | "cancelled") => {
    if (!booking) return

    setIsUpdating(true)
    try {
      const amount = status === "completed" && totalAmount ? Number.parseFloat(totalAmount) : undefined
      await updateBookingStatus(booking.id, status, amount)
      onUpdate()
      onClose()
    } catch (error) {
      console.error("Error updating booking:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-orange-100 text-orange-800"
      case "emergency":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!booking) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Booking Details</span>
            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
            {booking.urgency !== "normal" && (
              <Badge className={getUrgencyColor(booking.urgency)}>{booking.urgency}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{booking.services?.title}</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{format(new Date(booking.booking_date), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{booking.booking_time}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Information
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={booking.customer_profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>{booking.customer_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{booking.customer_name}</p>
                  <p className="text-sm text-gray-600">Customer</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{booking.customer_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{booking.customer_email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Address */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Service Address
            </h4>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{booking.service_address}</p>
          </div>

          {/* Service Details */}
          {booking.service_details && (
            <div>
              <h4 className="font-semibold mb-3">Service Details</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{booking.service_details}</p>
            </div>
          )}

          {/* Pricing */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Service Type:</span>
                <span className="font-medium">{booking.services?.pricing_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Base Price:</span>
                <span className="font-medium">
                  {booking.services?.pricing_amount
                    ? `$${booking.services.pricing_amount}${booking.services.pricing_type === "hourly" ? "/hr" : ""}`
                    : "Custom Quote"}
                </span>
              </div>

              {booking.status === "confirmed" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Final Amount (for completion)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter final amount"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                  />
                </div>
              )}

              {booking.total_amount && (
                <div className="flex items-center justify-between font-semibold text-lg border-t pt-3">
                  <span>Total Amount:</span>
                  <span className="text-brand-primary">${booking.total_amount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="font-semibold mb-3">Internal Notes</h4>
            <Textarea
              placeholder="Add notes about this booking..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Booking Timeline */}
          <div>
            <h4 className="font-semibold mb-3">Timeline</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Booking created:</span>
                <span>{format(new Date(booking.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
              {booking.updated_at !== booking.created_at && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Last updated:</span>
                  <span>{format(new Date(booking.updated_at), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {booking.status === "pending" && (
              <>
                <Button
                  onClick={() => handleStatusUpdate("confirmed")}
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirm Booking
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("cancelled")}
                  disabled={isUpdating}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline Booking
                </Button>
              </>
            )}

            {booking.status === "confirmed" && (
              <Button
                onClick={() => handleStatusUpdate("completed")}
                disabled={isUpdating}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Mark as Completed
              </Button>
            )}

            {booking.status === "completed" && (
              <div className="flex-1 text-center py-2 text-green-600 font-medium">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Booking Completed
              </div>
            )}

            {booking.status === "cancelled" && (
              <div className="flex-1 text-center py-2 text-red-600 font-medium">
                <XCircle className="w-4 h-4 inline mr-2" />
                Booking Cancelled
              </div>
            )}

            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
