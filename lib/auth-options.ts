import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import bcrypt from 'bcryptjs'

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
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        })

        if (!user || !user.password || !user.isActive) {
          return null
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password)

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          appMode: user.appMode,
          freeGenerationsRemaining: user.freeGenerationsRemaining,
          freeGenerationsUsed: user.freeGenerationsUsed,
          subscriptionStatus: user.subscriptionStatus
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role || 'USER'
        token.appMode = (user.appMode || 'FREE') as any
        token.freeGenerationsRemaining = user.freeGenerationsRemaining || 0
        token.freeGenerationsUsed = user.freeGenerationsUsed || 0
        token.subscriptionStatus = user.subscriptionStatus || null
      }

      if (trigger === 'update' && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              role: true,
              appMode: true,
              freeGenerationsRemaining: true,
              freeGenerationsUsed: true,
              subscriptionStatus: true,
            }
          })

          if (dbUser) {
            token.role = dbUser.role
            token.appMode = dbUser.appMode as any
            token.freeGenerationsRemaining = dbUser.freeGenerationsRemaining
            token.freeGenerationsUsed = dbUser.freeGenerationsUsed
            token.subscriptionStatus = dbUser.subscriptionStatus
            console.log(`🔄 Token updated for user ${dbUser.id}: appMode=${dbUser.appMode}, freeGens=${dbUser.freeGenerationsRemaining}`)
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
        session.user.role = (token.role || user?.role || 'USER') as any
        session.user.appMode = (token.appMode || user?.appMode || 'FREE') as any
        session.user.freeGenerationsRemaining = (token.freeGenerationsRemaining || user?.freeGenerationsRemaining || 0) as number
        session.user.freeGenerationsUsed = (token.freeGenerationsUsed || user?.freeGenerationsUsed || 0) as number
        session.user.subscriptionStatus = (token.subscriptionStatus || user?.subscriptionStatus || null) as string | null
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

          // Set up new Google users with FREE mode and 20 generations
          if (dbUser && dbUser.freeGenerationsRemaining === null) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                freeGenerationsRemaining: 20,
                freeGenerationsUsed: 0,
                role: 'USER',
                appMode: 'FREE',
                username: dbUser.username || user.email.split('@')[0]
              }
            })

            console.log('✅ Free generations set for Google user:', user.email)
          }
        } catch (error) {
          console.error('❌ Error setting up Google user:', error)
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

