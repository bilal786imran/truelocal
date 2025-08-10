"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createBooking } from "@/lib/bookings"
import { createConversation } from "@/lib/chat"

interface BookingModalProps {
  serviceId: string
  providerId: string
  providerName: string
  serviceName: string
  basePrice: string
  isOpen: boolean
  onClose: () => void
}

const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"]

export function BookingModal({
  serviceId,
  providerId,
  providerName,
  serviceName,
  basePrice,
  isOpen,
  onClose,
}: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, profile } = useAuth()

  const [bookingData, setBookingData] = useState({
    customerName: profile?.full_name || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
    address: "",
    serviceDetails: "",
    urgency: "normal" as "normal" | "urgent" | "emergency",
  })

  const handleBooking = async () => {
    if (!user) {
      setError("You must be logged in to book a service")
      return
    }

    if (!selectedDate || !selectedTime) {
      setError("Please select date and time")
      return
    }

    if (!bookingData.customerName || !bookingData.phone || !bookingData.email || !bookingData.address) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Use the new createBooking function
      const booking = await createBooking({
        customer_id: user.id,
        provider_id: providerId,
        service_id: serviceId,
        customer_name: bookingData.customerName,
        customer_phone: bookingData.phone,
        customer_email: bookingData.email,
        service_address: bookingData.address,
        service_details: bookingData.serviceDetails,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: selectedTime,
        urgency: bookingData.urgency,
      })

      // Create or update conversation
      const conversationId = await createConversation(
        user.id,
        providerId,
        serviceId,
        `New booking request for ${serviceName} on ${format(selectedDate, "MMM d, yyyy")} at ${selectedTime}`,
      )

      onClose()
      setBookingData({
        customerName: profile?.full_name || "",
        phone: profile?.phone || "",
        email: profile?.email || "",
        address: "",
        serviceDetails: "",
        urgency: "normal",
      })
      setSelectedDate(undefined)
      setSelectedTime("")

      // Show success message
      alert("Booking request sent successfully! The provider will confirm shortly.")
    } catch (error: any) {
      setError(error.message || "Failed to create booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setBookingData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Book Appointment</DialogTitle>
          <p className="text-gray-600">
            {serviceName} with {providerName}
          </p>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
        )}

        <div className="space-y-6">
          {/* Service Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{serviceName}</h3>
                  <p className="text-sm text-gray-600">Provider: {providerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-primary">{basePrice}</p>
                  <p className="text-xs text-gray-500">Starting price</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date and Time Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Time *</label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Information</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <Input
                  value={bookingData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <Input
                  type="tel"
                  value={bookingData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <Input
                type="email"
                value={bookingData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Address *</label>
              <Textarea
                value={bookingData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter the address where service is needed"
                rows={2}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Details</label>
              <Textarea
                value={bookingData.serviceDetails}
                onChange={(e) => handleInputChange("serviceDetails", e.target.value)}
                placeholder="Describe what you need help with..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
              <Select value={bookingData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal - Within a few days</SelectItem>
                  <SelectItem value="urgent">Urgent - Within 24 hours</SelectItem>
                  <SelectItem value="emergency">Emergency - ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Booking Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span>{serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span>{providerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>
                    {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Not selected"} at{" "}
                    {selectedTime || "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Starting Price:</span>
                  <span className="text-brand-primary">{basePrice}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              className="flex-1 bg-brand-primary hover:bg-brand-secondary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Booking Request"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
