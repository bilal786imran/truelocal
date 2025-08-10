"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { serviceCategories } from "@/data/services"
import { X, Plus, Upload, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { uploadServiceImage } from "@/lib/storage"

interface AddListingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddListingModal({ isOpen, onClose, onSuccess }: AddListingModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const [listingData, setListingData] = useState({
    title: "",
    category: "",
    specificService: "",
    description: "",
    pricing: {
      type: "hourly" as "hourly" | "fixed" | "custom",
      amount: "",
      currency: "USD",
    },
    location: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      serviceRadius: "10",
    },
    availability: {
      days: [] as string[],
      hours: {
        start: "09:00",
        end: "17:00",
      },
    },
    images: [] as File[],
    features: [] as string[],
    requirements: "",
    isActive: true,
  })

  const [newFeature, setNewFeature] = useState("")

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setListingData((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }))
    } else {
      setListingData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleDayToggle = (day: string) => {
    setListingData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        days: prev.availability.days.includes(day)
          ? prev.availability.days.filter((d) => d !== day)
          : [...prev.availability.days, day],
      },
    }))
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setListingData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setListingData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setListingData((prev) => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 5), // Max 5 images
    }))
  }

  const removeImage = (index: number) => {
    setListingData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!user) {
      setError("You must be logged in to create a listing")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create the service record first
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .insert({
          provider_id: user.id,
          title: listingData.title,
          description: listingData.description,
          category: listingData.category,
          specific_service: listingData.specificService,
          pricing_type: listingData.pricing.type,
          pricing_amount: listingData.pricing.type !== "custom" ? Number.parseFloat(listingData.pricing.amount) : null,
          currency: listingData.pricing.currency,
          location_address: listingData.location.address,
          location_city: listingData.location.city,
          location_state: listingData.location.state,
          location_zip: listingData.location.zipCode,
          service_radius: Number.parseInt(listingData.location.serviceRadius),
          availability_days: listingData.availability.days,
          availability_start: listingData.availability.hours.start,
          availability_end: listingData.availability.hours.end,
          features: listingData.features,
          requirements: listingData.requirements,
          status: "active",
        })
        .select()
        .single()

      if (serviceError) {
        throw serviceError
      }

      // Upload images if any
      const imageUrls: string[] = []
      if (listingData.images.length > 0) {
        for (let i = 0; i < listingData.images.length; i++) {
          const file = listingData.images[i]
          try {
            const imageUrl = await uploadServiceImage(file, user.id, service.id, i)
            imageUrls.push(imageUrl)
          } catch (uploadError) {
            console.error("Error uploading image:", uploadError)
          }
        }

        // Update service with image URLs
        if (imageUrls.length > 0) {
          await supabase.from("services").update({ images: imageUrls }).eq("id", service.id)
        }
      }

      onSuccess()
      onClose()

      // Reset form
      setCurrentStep(1)
      setListingData({
        title: "",
        category: "",
        specificService: "",
        description: "",
        pricing: { type: "hourly", amount: "", currency: "USD" },
        location: { address: "", city: "", state: "", zipCode: "", serviceRadius: "10" },
        availability: { days: [], hours: { start: "09:00", end: "17:00" } },
        images: [],
        features: [],
        requirements: "",
        isActive: true,
      })

      // Show success message
      alert("Listing created successfully! It's now visible to customers.")
    } catch (error: any) {
      setError(error.message || "Failed to create listing")
    } finally {
      setIsSubmitting(false)
    }
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Service Listing</DialogTitle>
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step ? "bg-brand-primary text-white" : "bg-gray-200 text-gray-600"
                    }`}
                >
                  {step}
                </div>
                {step < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
        )}

        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Title *</label>
                <Input
                  value={listingData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Professional Plumbing Services"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <Select value={listingData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category.category} value={category.category}>
                          {category.icon} {category.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {listingData.category && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specific Service *</label>
                    {listingData.category === "Other" ? (
                      <Input
                        value={listingData.specificService}
                        onChange={(e) => handleInputChange("specificService", e.target.value)}
                        placeholder="Specify your service"
                        required
                      />
                    ) : (
                      <Select
                        value={listingData.specificService}
                        onValueChange={(value) => handleInputChange("specificService", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose service" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceCategories
                            .find((cat) => cat.category === listingData.category)
                            ?.services.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <Textarea
                  value={listingData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your service, experience, and what makes you unique..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Images</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <Upload size={16} />
                      Upload Images (Max 5)
                    </label>
                  </div>
                  {listingData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {listingData.images.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file) || "/placeholder.svg"}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Features</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a key feature or benefit"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature} size="icon" variant="outline">
                      <Plus size={16} />
                    </Button>
                  </div>
                  {listingData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {listingData.features.map((feature, index) => (
                        <div
                          key={index}
                          className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {feature}
                          <button type="button" onClick={() => removeFeature(index)}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Location */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing & Location</h3>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Pricing Structure</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Type</label>
                      <Select
                        value={listingData.pricing.type}
                        onValueChange={(value) => handleInputChange("pricing.type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly Rate</SelectItem>
                          <SelectItem value="fixed">Fixed Price</SelectItem>
                          <SelectItem value="custom">Custom Quote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {listingData.pricing.type !== "custom" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {listingData.pricing.type === "hourly" ? "Rate per Hour" : "Fixed Price"}
                        </label>
                        <div className="flex gap-2">
                          <Select
                            value={listingData.pricing.currency}
                            onValueChange={(value) => handleInputChange("pricing.currency", value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">$</SelectItem>
                              <SelectItem value="EUR">€</SelectItem>
                              <SelectItem value="GBP">£</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={listingData.pricing.amount}
                            onChange={(e) => handleInputChange("pricing.amount", e.target.value)}
                            placeholder="0.00"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Service Location</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <Input
                        value={listingData.location.address}
                        onChange={(e) => handleInputChange("location.address", e.target.value)}
                        placeholder="Street address"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                        <Input
                          value={listingData.location.city}
                          onChange={(e) => handleInputChange("location.city", e.target.value)}
                          placeholder="City"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                        <Input
                          value={listingData.location.state}
                          onChange={(e) => handleInputChange("location.state", e.target.value)}
                          placeholder="State"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                        <Input
                          value={listingData.location.zipCode}
                          onChange={(e) => handleInputChange("location.zipCode", e.target.value)}
                          placeholder="ZIP"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Radius (miles)</label>
                      <Select
                        value={listingData.location.serviceRadius}
                        onValueChange={(value) => handleInputChange("location.serviceRadius", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 miles</SelectItem>
                          <SelectItem value="10">10 miles</SelectItem>
                          <SelectItem value="25">25 miles</SelectItem>
                          <SelectItem value="50">50 miles</SelectItem>
                          <SelectItem value="100">100+ miles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Availability & Final Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Availability & Final Details</h3>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Working Days</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {days.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={listingData.availability.days.includes(day)}
                          onCheckedChange={() => handleDayToggle(day)}
                        />
                        <label htmlFor={day} className="text-sm">
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Working Hours</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <Input
                        type="time"
                        value={listingData.availability.hours.start}
                        onChange={(e) => handleInputChange("availability.hours.start", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <Input
                        type="time"
                        value={listingData.availability.hours.end}
                        onChange={(e) => handleInputChange("availability.hours.end", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                <Textarea
                  value={listingData.requirements}
                  onChange={(e) => handleInputChange("requirements", e.target.value)}
                  placeholder="Any special requirements, equipment needed, or preparation instructions for customers..."
                  rows={3}
                />
              </div>

              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Listing Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span>{listingData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span>{listingData.specificService}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pricing:</span>
                      <span>
                        {listingData.pricing.type === "custom"
                          ? "Custom Quote"
                          : `${listingData.pricing.currency === "USD" ? "$" : listingData.pricing.currency}${listingData.pricing.amount
                          }${listingData.pricing.type === "hourly" ? "/hr" : ""}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span>
                        {listingData.location.city}, {listingData.location.state}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Days:</span>
                      <span>{listingData.availability.days.length} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => (currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose())}
              className="bg-transparent"
              disabled={isSubmitting}
            >
              {currentStep > 1 ? "Previous" : "Cancel"}
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-brand-primary hover:bg-brand-secondary"
                disabled={
                  (currentStep === 1 && (!listingData.title || !listingData.category || !listingData.description)) ||
                  (currentStep === 2 &&
                    listingData.pricing.type !== "custom" &&
                    !listingData.pricing.amount &&
                    (!listingData.location.city || !listingData.location.state))
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-brand-primary hover:bg-brand-secondary"
                disabled={listingData.availability.days.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Listing"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
