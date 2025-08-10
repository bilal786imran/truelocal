"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
    Calendar,
    Clock,
    MapPin,
    Phone,
    Mail,
    User,
    DollarSign,
    CheckCircle,
    XCircle,
    AlertCircle,
    MessageCircle,
    Star,
    Copy,
    ExternalLink,
} from "lucide-react"
import { format } from "date-fns"
import { updateBookingStatus } from "@/lib/bookings"
import { useToast } from "@/hooks/use-toast"

interface BookingDetailsModalProps {
    booking: any
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void
    userType: "customer" | "provider"
}

export function BookingDetailsModal({ booking, isOpen, onClose, onUpdate, userType }: BookingDetailsModalProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const { toast } = useToast()

    const handleStatusUpdate = async (status: "confirmed" | "completed" | "cancelled") => {
        if (!booking) return

        setIsUpdating(true)
        try {
            let totalAmount: number | undefined

            if (status === "completed") {
                const amount = prompt("Enter total amount (optional):")
                totalAmount = amount ? Number.parseFloat(amount) : undefined
            }

            await updateBookingStatus(booking.id, status, totalAmount)
            onUpdate()
            toast({
                title: "Booking Updated",
                description: `Booking has been ${status}.`,
            })
        } catch (error) {
            console.error("Error updating booking:", error)
            toast({
                title: "Error",
                description: "Failed to update booking status.",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast({
            title: "Copied",
            description: "Information copied to clipboard.",
        })
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "confirmed":
                return <CheckCircle size={16} />
            case "pending":
                return <Clock size={16} />
            case "completed":
                return <CheckCircle size={16} />
            case "cancelled":
                return <XCircle size={16} />
            default:
                return <AlertCircle size={16} />
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount)
    }

    if (!booking) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <span>Booking Details</span>
                        <Badge className={`${getStatusColor(booking.status)} flex items-center gap-1`}>
                            {getStatusIcon(booking.status)}
                            {booking.status}
                        </Badge>
                        {booking.urgency !== "normal" && (
                            <Badge className={getUrgencyColor(booking.urgency)}>{booking.urgency}</Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Service Information */}
                    <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 p-6 rounded-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-brand-dark mb-2">{booking.services?.title}</h3>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-brand-primary" />
                                        <span className="font-medium">{format(new Date(booking.booking_date), "EEEE, MMMM d, yyyy")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-brand-primary" />
                                        <span className="font-medium">{booking.booking_time}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Booking ID</p>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{booking.id.slice(0, 8)}</code>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(booking.id)} className="h-6 w-6 p-0">
                                        <Copy size={12} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer/Provider Information */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-brand-primary" />
                                Customer Information
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={booking.customer_profile?.avatar_url || "/placeholder.svg"} />
                                        <AvatarFallback>{booking.customer_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{booking.customer_name}</p>
                                        <p className="text-sm text-gray-600">Customer</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm">{booking.customer_phone}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(booking.customer_phone)}
                                            className="h-6 w-6 p-0"
                                        >
                                            <Copy size={12} />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm">{booking.customer_email}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(booking.customer_email)}
                                            className="h-6 w-6 p-0"
                                        >
                                            <Copy size={12} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Provider Info */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                <Star className="w-5 h-5 text-brand-primary" />
                                Provider Information
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={booking.provider_profile?.avatar_url || "/placeholder.svg"} />
                                        <AvatarFallback>{booking.provider_profile?.full_name?.[0] || "P"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{booking.provider_profile?.full_name}</p>
                                        <p className="text-sm text-gray-600">
                                            {booking.provider_profile?.business_name || "Service Provider"}
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-gray-500" />
                                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                                        Contact Provider
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Service Location */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-brand-primary" />
                            Service Location
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start justify-between">
                                <p className="text-gray-700 flex-1">{booking.service_address}</p>
                                <Button variant="outline" size="sm" className="ml-4 bg-transparent">
                                    <ExternalLink size={14} className="mr-1" />
                                    View Map
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Service Details */}
                    {booking.service_details && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg">Service Details & Requirements</h4>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700 whitespace-pre-wrap">{booking.service_details}</p>
                            </div>
                        </div>
                    )}

                    {/* Pricing Information */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-brand-primary" />
                            Pricing Information
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Service Type</p>
                                    <p className="font-semibold capitalize">{booking.services?.pricing_type || "Custom"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Base Price</p>
                                    <p className="font-semibold">
                                        {booking.services?.pricing_amount
                                            ? `${formatCurrency(booking.services.pricing_amount)}${booking.services.pricing_type === "hourly" ? "/hr" : ""}`
                                            : "Custom Quote"}
                                    </p>
                                </div>
                            </div>

                            {booking.total_amount && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-semibold">Total Amount:</span>
                                        <span className="text-xl font-bold text-brand-primary">{formatCurrency(booking.total_amount)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Booking Timeline */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Booking Timeline</h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <div className="flex-1">
                                    <p className="font-medium">Booking Created</p>
                                    <p className="text-sm text-gray-600">
                                        {format(new Date(booking.created_at), "MMMM d, yyyy 'at' h:mm a")}
                                    </p>
                                </div>
                            </div>

                            {booking.updated_at !== booking.created_at && (
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <div className="flex-1">
                                        <p className="font-medium">Last Updated</p>
                                        <p className="text-sm text-gray-600">
                                            {format(new Date(booking.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {booking.status === "completed" && (
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                    <div className="flex-1">
                                        <p className="font-medium">Service Completed</p>
                                        <p className="text-sm text-gray-600">Service has been marked as completed</p>
                                    </div>
                                </div>
                            )}

                            {booking.status === "cancelled" && (
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <div className="flex-1">
                                        <p className="font-medium">Booking Cancelled</p>
                                        <p className="text-sm text-gray-600">This booking has been cancelled</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {userType === "provider" && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                            {booking.status === "pending" && (
                                <>
                                    <Button
                                        onClick={() => handleStatusUpdate("confirmed")}
                                        disabled={isUpdating}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
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
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark as Completed
                                </Button>
                            )}

                            {(booking.status === "completed" || booking.status === "cancelled") && (
                                <div className="flex-1 text-center py-3">
                                    <Badge className={`${getStatusColor(booking.status)} text-base px-4 py-2`}>
                                        {getStatusIcon(booking.status)}
                                        <span className="ml-2">
                                            {booking.status === "completed" ? "Service Completed" : "Booking Cancelled"}
                                        </span>
                                    </Badge>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Customer Actions */}
                    {userType === "customer" && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                            <Button variant="outline" className="flex-1 bg-transparent">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Contact Provider
                            </Button>

                            {booking.status === "pending" && (
                                <Button
                                    onClick={() => handleStatusUpdate("cancelled")}
                                    disabled={isUpdating}
                                    variant="outline"
                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Booking
                                </Button>
                            )}

                            {booking.status === "completed" && (
                                <Button className="flex-1 bg-brand-primary hover:bg-brand-secondary">
                                    <Star className="w-4 h-4 mr-2" />
                                    Leave Review
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Close Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
