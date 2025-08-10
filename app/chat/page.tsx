"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, MoreVertical, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/login-modal";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from "@/lib/chat";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Conversation {
  id: string;
  customer_id: string;
  provider_id: string;
  service_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  customer_unread: number;
  provider_unread: number;
  customer_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  provider_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  service: {
    title: string;
  } | null;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function ChatPage() {
  const channelRef = useRef<any>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user, profile, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    fetchConversations();
  }, [isAuthenticated, profile]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      markConversationAsRead();

      // Clean up previous subscription if it exists
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Subscribe to messages for this conversation
      channelRef.current = supabase
        .channel(`messages:${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload) => {
            const incoming = payload.new as any;
            if (incoming.sender_id !== user?.id) {
              setMessages((prev) => [...prev, incoming]); // push new msg without refetch
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedConversation?.id, user?.id]);

  const fetchConversations = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      const data = await getConversations(user.id, profile.user_type);
      setConversations(data);
      console.log(data);

      // Select first conversation if none selected
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId?: string) => {
    const convId = conversationId || selectedConversation?.id;
    if (!convId) return;

    try {
      setMessagesLoading(true);
      const data = await getMessages(convId);
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const markConversationAsRead = async (conversationId?: string) => {
    const convId = conversationId || selectedConversation?.id;
    if (!convId || !user || !profile) return;

    try {
      await markAsRead(convId, user.id, profile.user_type);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === convId
            ? {
                ...conv,
                customer_unread:
                  profile.user_type === "customer" ? 0 : conv.customer_unread,
                provider_unread:
                  profile.user_type === "provider" ? 0 : conv.provider_unread,
              }
            : conv
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return;

    const messageText = newMessage.trim();
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      sender_profile: {
        full_name: profile?.full_name || "You",
        avatar_url: profile?.avatar_url || null,
      },
    };

    // Add message instantly
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    // Update conversation instantly
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              last_message: messageText,
              last_message_at: new Date().toISOString(),
            }
          : conv
      )
    );

    try {
      await sendMessage(selectedConversation.id, user.id, messageText);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleConversationSelect = async (conversation: any) => {
    setSelectedConversation(conversation);
    setMessages([]); // clear old chat while loading new
    await fetchMessages(conversation?.id);
    await markConversationAsRead(conversation?.id);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (!profile) return null;
    console.log("profle", profile);

    if (profile?.id === conversation?.customer_id) {
      return {
        name: conversation.provider_profile?.full_name || "Provider",
        avatar: conversation.provider_profile?.avatar_url,
      };
    } else {
      return {
        name: conversation.customer_profile?.full_name || "Customer",
        avatar: conversation.customer_profile?.avatar_url,
      };
    }
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (!profile) return 0;
    return profile.user_type === "customer"
      ? conversation.customer_unread
      : conversation.provider_unread;
  };

  const formatMessageTime = (timestamp: string | null) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return format(date, "h:mm a");
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const participant = getOtherParticipant(conv);
    return participant?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-brand-dark mb-4">
            Sign in to access your messages
          </h1>
          <p className="text-gray-600 mb-8">
            Connect with service providers and manage your conversations
          </p>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl h-full mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-brand-dark mb-4">
                  Messages
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="p-2">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No conversations yet</p>
                      <p className="text-sm">
                        Start chatting with service providers!
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const participant = getOtherParticipant(conversation);
                      const unreadCount = getUnreadCount(conversation);

                      return (
                        <div
                          key={conversation.id}
                          onClick={() => handleConversationSelect(conversation)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConversation?.id === conversation.id
                              ? "bg-brand-primary/10 border border-brand-primary/20"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="relative">
                            <Avatar>
                              <AvatarImage
                                src={participant?.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {participant?.name[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-sm truncate">
                                {participant?.name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(
                                  conversation.last_message_at
                                )}
                              </span>
                            </div>
                            {conversation.service && (
                              <p className="text-xs text-gray-500 mb-1">
                                Re: {conversation.service.title}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.last_message || "No messages yet"}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <Badge className="bg-brand-primary text-white text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-2">
            <CardContent className="p-0 flex flex-col h-full">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage
                            src={
                              getOtherParticipant(selectedConversation)
                                ?.avatar || "/placeholder.svg"
                            }
                          />
                          <AvatarFallback>
                            {getOtherParticipant(selectedConversation)
                              ?.name[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {getOtherParticipant(selectedConversation)?.name}
                        </h3>
                        <p className="text-sm text-green-600">Online</p>
                        {selectedConversation.service && (
                          <p className="text-xs text-gray-500">
                            Re: {selectedConversation.service.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical size={16} />
                    </Button>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                      </div>
                    ) : (
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
                                      "/placeholder.svg"
                                    }
                                  />
                                  <AvatarFallback className="text-xs">
                                    {message.sender_profile?.full_name?.[0] ||
                                      "U"}
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
                                  {format(
                                    new Date(message.created_at),
                                    "h:mm a"
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          (e.preventDefault(), handleSendMessage())
                        }
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
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">
                      Select a conversation to start chatting
                    </p>
                    <p className="text-sm">
                      Choose from your existing conversations on the left
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
