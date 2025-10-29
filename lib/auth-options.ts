import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
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
    async signIn({ user, account, profile }) {
      console.log('🔐 Sign in attempt:', {
        provider: account?.provider,
        email: user.email,
        name: user.name
      })

      if (account?.provider === "google" && user.email) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!dbUser) {
            // Create new Google user with proper defaults
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                username: user.email.split('@')[0],
                image: user.image || null,
                role: 'USER',
                appMode: 'FREE',
                freeGenerationsRemaining: 20,
                freeGenerationsUsed: 0,
                emailVerified: new Date()
              }
            })
            console.log('✅ Created new Google user:', user.email)

            // Create Account record
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                refresh_token: account.refresh_token,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | null
              }
            })
          } else {
            // Update existing user data
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                name: user.name || dbUser.name,
                image: user.image || dbUser.image,
                username: dbUser.username || user.email.split('@')[0],
                role: dbUser.role || 'USER',
                appMode: dbUser.appMode || 'FREE',
                freeGenerationsRemaining: dbUser.freeGenerationsRemaining ?? 20,
                freeGenerationsUsed: dbUser.freeGenerationsUsed ?? 0
              }
            })

            // Update or create Account record
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId
                }
              },
              create: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                refresh_token: account.refresh_token,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | null
              },
              update: {
                access_token: account.access_token,
                expires_at: account.expires_at,
                refresh_token: account.refresh_token,
                id_token: account.id_token,
                session_state: account.session_state as string | null
              }
            })
            console.log('✅ Updated Google user:', user.email)
          }

          // Update user object for JWT
          user.id = dbUser.id
          user.role = dbUser.role as any
          user.appMode = dbUser.appMode as any
          user.freeGenerationsRemaining = dbUser.freeGenerationsRemaining
          user.freeGenerationsUsed = dbUser.freeGenerationsUsed
          user.subscriptionStatus = dbUser.subscriptionStatus
        } catch (error) {
          console.error('❌ Error setting up Google user:', error)
          return false
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
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15 // 15 minutes
      }
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15 // 15 minutes
      }
    },
    nonce: {
      name: `next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

