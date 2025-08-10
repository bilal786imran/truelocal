"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, DollarSign, Calendar, Star, Shield, Zap, TrendingUp } from "lucide-react"
import { serviceCategories } from "@/data/services"

const benefits = [
  {
    icon: Users,
    title: "Connect with Customers",
    description: "Access thousands of potential customers in your area",
  },
  {
    icon: DollarSign,
    title: "Grow Your Income",
    description: "Set your own rates and increase your earning potential",
  },
  {
    icon: Calendar,
    title: "Flexible Schedule",
    description: "Work when you want and manage your own calendar",
  },
  {
    icon: Star,
    title: "Build Your Reputation",
    description: "Collect reviews and showcase your expertise",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Get paid safely and on time through our platform",
  },
  {
    icon: Zap,
    title: "Easy Management",
    description: "Manage bookings, messages, and payments in one place",
  },
]

const steps = [
  {
    step: 1,
    title: "Create Your Profile",
    description: "Tell us about your services and experience",
  },
  {
    step: 2,
    title: "Verify Your Identity",
    description: "Complete our verification process for trust and safety",
  },
  {
    step: 3,
    title: "Start Getting Bookings",
    description: "Customers can find and book your services",
  },
]

export default function BecomeProviderPage() {
  const [formData, setFormData] = useState({
    businessName: "",
    category: "",
    specificService: "",
    description: "",
    experience: "",
    location: "",
    phone: "",
    email: "",
    website: "",
    agreeToTerms: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    // Handle form submission
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-primary to-brand-secondary py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in">
            Grow Your Business with TrueLocal
          </h1>
          <p className="text-xl text-brand-light mb-8 animate-fade-in">
            Join thousands of service providers who trust TrueLocal to connect with customers and grow their business.
            Switch to provider mode anytime from your account settings!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center text-white">
              <div className="text-3xl font-bold mb-2">1,200+</div>
              <div className="text-brand-light">Active Providers</div>
            </div>
            <div className="text-center text-white">
              <div className="text-3xl font-bold mb-2">$2.5M+</div>
              <div className="text-brand-light">Earned by Providers</div>
            </div>
            <div className="text-center text-white">
              <div className="text-3xl font-bold mb-2">4.8★</div>
              <div className="text-brand-light">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-brand-dark mb-12">Why Choose TrueLocal?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-8 h-8 text-brand-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-brand-dark">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-brand-dark mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  {step.step}
                </div>
                <h3 className="font-bold text-lg mb-2 text-brand-dark">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full">
                    <div className="w-full h-0.5 bg-brand-primary/30"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-brand-dark">Start Your Journey Today</CardTitle>
              <p className="text-center text-gray-600">
                Fill out the form below to create your provider profile. You can also switch to provider mode anytime
                from your account settings after signing up.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                    <Input
                      value={formData.businessName}
                      onChange={(e) => handleInputChange("businessName", e.target.value)}
                      placeholder="Enter your business name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Category *</label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
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
                </div>

                {/* Add specific service selection */}
                {formData.category && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specific Service *</label>
                    {formData.category === "Other" ? (
                      <Input
                        value={formData.specificService || ""}
                        onChange={(e) => handleInputChange("specificService", e.target.value)}
                        placeholder="Please specify the service you offer"
                        required
                      />
                    ) : (
                      <Select
                        value={formData.specificService || ""}
                        onValueChange={(value) => handleInputChange("specificService", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your specific service" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceCategories
                            .find((cat) => cat.category === formData.category)
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Description *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your services and what makes you unique"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                    <Select
                      value={formData.experience}
                      onValueChange={(value) => handleInputChange("experience", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="2-5">2-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Location *</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="City, State"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website (Optional)</label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{" "}
                    <a href="#" className="text-brand-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-brand-primary hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-primary hover:bg-brand-secondary h-12 text-lg"
                  disabled={!formData.agreeToTerms}
                >
                  Create Provider Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-brand-dark mb-12">Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <img src="/placeholder.svg?height=60&width=60" alt="Sarah" className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h4 className="font-bold">Sarah's Cleaning Service</h4>
                    <p className="text-sm text-gray-600">Home Services</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  "TrueLocal helped me grow my cleaning business from 5 to 50 regular clients in just 6 months!"
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  300% increase in bookings
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <img src="/placeholder.svg?height=60&width=60" alt="Mike" className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h4 className="font-bold">Mike's Auto Repair</h4>
                    <p className="text-sm text-gray-600">Auto Services</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  "The platform is so easy to use. I can manage my schedule and get paid automatically."
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="w-4 h-4 mr-1" />
                  $15K+ monthly revenue
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <img src="/placeholder.svg?height=60&width=60" alt="Lisa" className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h4 className="font-bold">Lisa Photography</h4>
                    <p className="text-sm text-gray-600">Photography</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  "I love how I can showcase my portfolio and connect with clients who value quality work."
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Star className="w-4 h-4 mr-1" />
                  4.9 average rating
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
