"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  getMessages,
  sendMessage,
  markAsRead,
  createConversation,
} from "@/lib/chat";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ChatModalProps {
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  serviceId?: string;
  serviceName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatModal({
  providerId,
  providerName,
  providerAvatar,
  serviceId,
  serviceName,
  isOpen,
  onClose,
}: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      initializeChat();
    }
  }, [isOpen, user, providerId]);

  useEffect(() => {
    if (conversationId) {
      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMessage = payload.new as any;
            // Only add message if it's not from current user (to avoid duplicates)
            if (newMessage.sender_id !== user?.id) {
              fetchMessages();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (user.id === providerId) {
        console.warn("You cannot start a chat with yourself");
        return;
      }
      // Create or get existing conversation
      const convId = await createConversation(
        user.id,
        providerId,
        serviceId,
        serviceName
          ? `Hi! I'm interested in your ${serviceName} service.`
          : undefined
      );

      setConversationId(convId);
      await fetchMessages(convId);

      // Mark as read
      await markAsRead(convId, user.id, profile?.user_type || "customer");
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId?: string) => {
    const id = convId || conversationId;
    if (!id) return;

    try {
      const messagesData = await getMessages(id);
      setMessages(messagesData);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage("");

    // Optimistically add message to UI
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      sender_profile: {
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
      },
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await sendMessage(conversationId, user.id, messageText);
      // Refresh messages to get the real message with proper ID
      await fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticMessage.id)
      );
      setNewMessage(messageText); // Restore message text
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, "h:mm a");
    } else if (diffInHours < 48) {
      return "Yesterday " + format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={providerAvatar || "/placeholder.svg"} />
              <AvatarFallback>{providerName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">{providerName}</DialogTitle>
              <p
                className={`text-sm ${
                  isOnline ? "text-green-600" : "text-gray-500"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={16} />
          </Button>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div className="flex items-end space-x-2 max-w-[80%]">
                      {message.sender_id !== user?.id && (
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={
                              message.sender_profile?.avatar_url ||
                              providerAvatar ||
                              "/placeholder.svg"
                            }
                          />
                          <AvatarFallback className="text-xs">
                            {message.sender_profile?.full_name?.[0] ||
                              providerName[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? "bg-brand-primary text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.message}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_id === user?.id
                              ? "text-brand-light"
                              : "text-gray-500"
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-brand-primary hover:bg-brand-secondary"
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
