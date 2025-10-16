import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role || 'USER'
        token.appMode = (user.appMode || 'FREE').toLowerCase()
        token.trialEndsAt = user.trialEndsAt || null
        token.trialGenerations = user.trialGenerations || 0
      }
      
      if (trigger === 'update' && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              role: true,
              appMode: true,
              trialEndsAt: true,
              trialGenerations: true,
            }
          })
          
          if (dbUser) {
            token.role = dbUser.role
            token.appMode = dbUser.appMode.toLowerCase()
            token.trialEndsAt = dbUser.trialEndsAt
            token.trialGenerations = dbUser.trialGenerations
            console.log(`🔄 Token updated for user ${dbUser.id}: appMode=${dbUser.appMode}, trialGenerations=${dbUser.trialGenerations}, trialEndsAt=${dbUser.trialEndsAt}`)
          }
        } catch (error) {
          console.error('Error refreshing token from DB:', error)
        }
      }
      
      return token
    },
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = (token.id || user?.id) as string
        session.user.role = (token.role || user?.role || 'USER') as string
        session.user.appMode = (token.appMode || user?.appMode || 'FREE') as string
        session.user.trialEndsAt = (token.trialEndsAt || user?.trialEndsAt || null) as Date | null
        session.user.trialGenerations = (token.trialGenerations || user?.trialGenerations || 0) as number
      }
      return session
    },
    async signIn({ user, account }) {
      console.log('🔐 Sign in attempt:', {
        provider: account?.provider,
        email: user.email,
        name: user.name
      })
      
      if (account?.provider === "google" && user.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          })
          
          console.log('👤 Found user in DB:', dbUser ? 'Yes' : 'No')
          
          if (dbUser && !dbUser.trialEndsAt) {
            const trialEndsAt = new Date()
            trialEndsAt.setDate(trialEndsAt.getDate() + 3)
            
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                trialEndsAt,
                trialGenerations: 0,
                role: 'USER',
                appMode: 'FREE',
                username: dbUser.username || user.email.split('@')[0]
              }
            })
            
            console.log('✅ Trial set for user:', user.email)
          }
        } catch (error) {
          console.error('❌ Error setting trial for Google user:', error)
        }
      }
      return true
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development',
}

