import { supabase } from "./supabase"
import type { Database } from "@/types/database"

type Conversation = Database["public"]["Tables"]["conversations"]["Row"] & {
  customer_profile: {
    full_name: string | null
    avatar_url: string | null
  } | null
  provider_profile: {
    full_name: string | null
    avatar_url: string | null
  } | null
  service: {
    title: string
  } | null
}

type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  sender_profile: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

  export const getConversations = async (userId: string, userType: "customer" | "provider") => {
    const query = supabase.from("conversations").select(`
        *,
        customer_profile:profiles!conversations_customer_id_fkey(full_name, avatar_url),
        provider_profile:profiles!conversations_provider_id_fkey(full_name, avatar_url),
        service:services(title)
      `)
     .or(`customer_id.eq.${userId},provider_id.eq.${userId}`)

    // if (userType === "customer") {
    // } else {
    // }

    const { data, error } = await query.order("updated_at", { ascending: false })

    if (error) {
      throw error
    }

    return data as Conversation[]
  }

export const getMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender_profile:profiles!messages_sender_id_fkey(full_name, avatar_url)
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    throw error
  }

  return data as Message[]
}

export const sendMessage = async (conversationId: string, senderId: string, message: string) => {
  // Insert the message
  const { data: messageData, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message,
    })
    .select()
    .single()

  if (messageError) {
    throw messageError
  }

  // Update conversation with last message and unread counts
  const { data: conversation } = await supabase
    .from("conversations")
    .select("customer_id, provider_id")
    .eq("id", conversationId)
    .single()

  if (conversation) {
    const isCustomerSending = conversation.customer_id === senderId
    const updateData = {
      last_message: message,
      last_message_at: new Date().toISOString(),
      ...(isCustomerSending
        ? {
            provider_unread: supabase.rpc("increment_unread", {
              conversation_id: conversationId,
              field: "provider_unread",
            }),
          }
        : {
            customer_unread: supabase.rpc("increment_unread", {
              conversation_id: conversationId,
              field: "customer_unread",
            }),
          }),
    }

    await supabase.from("conversations").update(updateData).eq("id", conversationId)
  }

  return messageData
}

export const markAsRead = async (conversationId: string, userId: string, userType: "customer" | "provider") => {
  const updateField = userType === "customer" ? "customer_unread" : "provider_unread"

  await supabase
    .from("conversations")
    .update({ [updateField]: 0 })
    .eq("id", conversationId)
}

export const createConversation = async (
  customerId: string,
  providerId: string,
  serviceId?: string,
  initialMessage?: string,
) => {
  // Check if conversation already exists
  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("customer_id", customerId)
    .eq("provider_id", providerId)
    .single()

  if (existingConversation) {
    return existingConversation.id
  }

  // Create new conversation
  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      customer_id: customerId,
      provider_id: providerId,
      service_id: serviceId,
      last_message: initialMessage,
      last_message_at: initialMessage ? new Date().toISOString() : null,
      provider_unread: initialMessage ? 1 : 0,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  // Send initial message if provided
  if (initialMessage) {
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: customerId,
      message: initialMessage,
    })
  }

  return conversation.id
}

// Create RPC function for incrementing unread count
export const createIncrementUnreadFunction = async () => {
  const { error } = await supabase.rpc("create_increment_unread_function")
  if (error) {
    console.error("Error creating increment function:", error)
  }
}
