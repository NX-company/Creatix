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
      if (account?.provider === "google" && user.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          })
          
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
          }
        } catch (error) {
          console.error('Error setting trial for Google user:', error)
        }
      }
      return true
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "database",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

