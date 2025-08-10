"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import {
  Search,
  MapPin,
  Star,
  Users,
  CheckCircle,
  ArrowRight,
  Home,
  Car,
  Scissors,
  Camera,
  Laptop,
  Heart,
} from "lucide-react"
import { serviceCategories } from "@/data/services"

// Remove the old categories array and use:
const displayCategories = serviceCategories.slice(0, 6).map((category, index) => ({
  name: category.category,
  icon:
    category.category === "Home Repair & Maintenance"
      ? Home
      : category.category === "Moving & Transportation"
        ? Car
        : category.category === "Beauty & Personal Care"
          ? Scissors
          : category.category === "Event & Occasional Services"
            ? Camera
            : category.category === "IT & Electronics"
              ? Laptop
              : Heart,
  count: Math.floor(Math.random() * 200) + 50, // Random count for demo
  color: [
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-pink-100 text-pink-600",
    "bg-purple-100 text-purple-600",
    "bg-orange-100 text-orange-600",
    "bg-red-100 text-red-600",
  ][index],
}))

const featuredProviders = [
  {
    id: 1,
    name: "Mike's Plumbing Services",
    category: "Home Services",
    rating: 4.9,
    reviews: 127,
    image: "/placeholder.svg?height=200&width=300",
    price: "From $75/hr",
    location: "Downtown",
    verified: true,
  },
  {
    id: 2,
    name: "Elite Auto Repair",
    category: "Auto Services",
    rating: 4.8,
    reviews: 89,
    image: "/placeholder.svg?height=200&width=300",
    price: "From $90/hr",
    location: "Midtown",
    verified: true,
  },
  {
    id: 3,
    name: "Bella Beauty Salon",
    category: "Beauty & Spa",
    rating: 4.9,
    reviews: 203,
    image: "/placeholder.svg?height=200&width=300",
    price: "From $45/hr",
    location: "Uptown",
    verified: true,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-primary to-brand-secondary py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Find Local Service Providers
          </h1>
          <p className="text-xl text-brand-light mb-8 max-w-2xl mx-auto animate-fade-in">
            Connect with trusted professionals in your area for all your service needs
          </p>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="What service do you need?"
                  className="pl-10 h-12 border-0 focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter your location"
                  className="pl-10 h-12 border-0 focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <Button className="h-12 px-8 bg-brand-primary hover:bg-brand-secondary transition-colors duration-200">
                Search Services
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-brand-dark mb-12">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {displayCategories.map((category, index) => (
              <Link key={category.name} href="/services">
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}
                    >
                      <category.icon size={24} />
                    </div>
                    <h3 className="font-semibold text-brand-dark mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.count} providers</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-brand-dark">Featured Providers</h2>
            <Link href="/services">
              <Button
                variant="outline"
                className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white bg-transparent"
              >
                View All <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProviders.map((provider) => (
              <Link key={provider.id} href={`/services/${provider.id}`}>
                <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group overflow-hidden">
                  <div className="relative">
                    <img
                      src={provider.image || "/placeholder.svg"}
                      alt={provider.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {provider.verified && (
                      <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                        <CheckCircle size={12} className="mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-brand-dark group-hover:text-brand-primary transition-colors">
                        {provider.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{provider.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{provider.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-brand-primary">{provider.price}</span>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={12} className="mr-1" />
                        {provider.location}
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Users size={12} className="mr-1" />
                      {provider.reviews} reviews
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-brand-dark">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">1,200+</div>
              <div className="text-brand-light">Service Providers</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">15,000+</div>
              <div className="text-brand-light">Happy Customers</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-brand-light">Service Categories</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">4.8</div>
              <div className="text-brand-light">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Grow Your Business?</h2>
          <p className="text-xl text-brand-light mb-8">
            Join thousands of service providers who trust TrueLocal to connect with customers
          </p>
          <Link href="/become-provider">
            <Button
              size="lg"
              className="bg-white text-brand-primary hover:bg-brand-light transition-colors duration-200"
            >
              Become a Provider Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
