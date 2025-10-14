import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"

const authOptions: NextAuthOptions = {
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
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
        session.user.role = user.role || 'USER'
        session.user.appMode = user.appMode || 'FREE'
        session.user.trialEndsAt = user.trialEndsAt || null
        session.user.trialGenerations = user.trialGenerations || 0
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
          // Don't block sign in on error
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
    strategy: "database",
  },
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

