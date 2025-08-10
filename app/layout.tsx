import type React from "react";
import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";
import Chatbot from "@/components/Chatbot";

export const metadata: Metadata = {
  title: "TrueLocal - Find Local Service Providers",
  description:
    "Connect with trusted professionals in your area for all your service needs",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Chatbot />
      </body>
    </html>
  );
}
