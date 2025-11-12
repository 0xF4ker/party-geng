import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: false, // We're handling auth via tRPC/session
  }
})

// Database types for realtime
export type RealtimeMessage = {
  id: string
  text: string
  conversationId: string
  senderId: string
  createdAt: string
}

export type RealtimeConversation = {
  id: string
  updatedAt: string
}
