"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Star, MapPin, DollarSign, Calendar, Settings, BarChart3, Trash2, Play, Pause, Edit } from "lucide-react"
import { format } from "date-fns"
import { updateListingStatus, deleteListing } from "@/lib/listings"
import { useToast } from "@/hooks/use-toast"

interface ListingManagementModalProps {
    listing: any
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void
}

export function ListingManagementModal({ listing, isOpen, onClose, onUpdate }: ListingManagementModalProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const { toast } = useToast()

    const handleStatusUpdate = async (status: "active" | "paused" | "inactive") => {
        if (!listing) return

        setIsUpdating(true)
        try {
            await updateListingStatus(listing.id, status)
            onUpdate()
            toast({
                title: "Listing Updated",
                description: `Listing has been ${status}.`,
            })
        } catch (error) {
            console.error("Error updating listing:", error)
            toast({
                title: "Error",
                description: "Failed to update listing status.",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDelete = async () => {
        if (!listing) return

        const confirmed = confirm("Are you sure you want to delete this listing? This action cannot be undone.")
        if (!confirmed) return

        setIsUpdating(true)
        try {
            await deleteListing(listing.id)
            onUpdate()
            onClose()
            toast({
                title: "Listing Deleted",
                description: "Your listing has been permanently deleted.",
            })
        } catch (error) {
            console.error("Error deleting listing:", error)
            toast({
                title: "Error",
                description: "Failed to delete listing.",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800"
            case "paused":
                return "bg-yellow-100 text-yellow-800"
            case "inactive":
                return "bg-gray-100 text-gray-800"
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

    if (!listing) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <span>{listing.title}</span>
                        <Badge className={getStatusColor(listing.status)}>{listing.status}</Badge>
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Listing Images */}
                        {listing.images && listing.images.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg">Images</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {listing.images.map((image: string, index: number) => (
                                        <img
                                            key={index}
                                            src={image || "/placeholder.svg"}
                                            alt={`${listing.title} - Image ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Basic Information */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg">Service Details</h4>
                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Category</p>
                                        <p className="font-medium">{listing.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Specific Service</p>
                                        <p className="font-medium">{listing.specific_service}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Description</p>
                                        <p className="text-gray-700">{listing.description}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg">Location & Pricing</h4>
                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        <span>
                                            {listing.location_city}, {listing.location_state}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-gray-500" />
                                        <span className="font-semibold">
                                            {listing.pricing_type === "custom"
                                                ? "Custom Quote"
                                                : `${formatCurrency(listing.pricing_amount)}${listing.pricing_type === "hourly" ? "/hr" : ""}`}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Service Area</p>
                                        <p className="font-medium">{listing.service_area_radius} miles radius</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Availability */}
                        {listing.availability && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg">Availability</h4>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        {Object.entries(listing.availability).map(([day, hours]: [string, any]) => (
                                            <div key={day}>
                                                <p className="font-medium capitalize">{day}</p>
                                                <p className="text-gray-600">{hours.available ? `${hours.start} - ${hours.end}` : "Closed"}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Requirements */}
                        {listing.requirements && listing.requirements.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg">Requirements</h4>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <ul className="list-disc list-inside space-y-1">
                                        {listing.requirements.map((req: string, index: number) => (
                                            <li key={index} className="text-gray-700">
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        Total Views
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{listing.views || 0}</div>
                                    <p className="text-xs text-gray-600">All time views</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Star className="w-4 h-4" />
                                        Rating
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{listing.rating || "N/A"}</div>
                                    <p className="text-xs text-gray-600">{listing.review_count || 0} reviews</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Created
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm font-bold">{format(new Date(listing.created_at), "MMM d, yyyy")}</div>
                                    <p className="text-xs text-gray-600">Updated {format(new Date(listing.updated_at), "MMM d, yyyy")}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Performance Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-gray-500">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                                    <p>Detailed analytics coming soon</p>
                                    <p className="text-sm">Track views, bookings, and performance metrics</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        <div className="space-y-6">
                            {/* Status Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        Listing Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Current Status</p>
                                            <p className="text-sm text-gray-600">
                                                Your listing is currently <span className="font-medium">{listing.status}</span>
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(listing.status)}>{listing.status}</Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {listing.status !== "active" && (
                                            <Button
                                                onClick={() => handleStatusUpdate("active")}
                                                disabled={isUpdating}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Activate
                                            </Button>
                                        )}

                                        {listing.status === "active" && (
                                            <Button
                                                onClick={() => handleStatusUpdate("paused")}
                                                disabled={isUpdating}
                                                variant="outline"
                                                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                            >
                                                <Pause className="w-4 h-4 mr-2" />
                                                Pause
                                            </Button>
                                        )}

                                        {listing.status !== "inactive" && (
                                            <Button
                                                onClick={() => handleStatusUpdate("inactive")}
                                                disabled={isUpdating}
                                                variant="outline"
                                                className="text-gray-600 border-gray-200 hover:bg-gray-50"
                                            >
                                                Deactivate
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button variant="outline" className="flex-1 bg-transparent">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Listing
                                        </Button>
                                        <Button
                                            onClick={handleDelete}
                                            disabled={isUpdating}
                                            variant="outline"
                                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Listing
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
