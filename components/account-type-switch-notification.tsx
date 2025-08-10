"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AccountTypeSwitchNotificationProps {
  show: boolean
  userType: "customer" | "provider"
  onClose: () => void
}

export function AccountTypeSwitchNotification({ show, userType, onClose }: AccountTypeSwitchNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <Card className="border-green-200 bg-green-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-800">
                Switched to {userType === "provider" ? "Provider" : "Customer"} Mode
              </p>
              <p className="text-sm text-green-600">
                {userType === "provider"
                  ? "You can now create listings and manage services"
                  : "You can now book services and connect with providers"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsVisible(false)
                onClose()
              }}
              className="h-6 w-6 text-green-600 hover:bg-green-100"
            >
              <X size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
