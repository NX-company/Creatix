import { DefaultSession, DefaultUser } from "next-auth"
import { Role, AppMode } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      appMode: AppMode
      freeGenerationsRemaining: number
      freeGenerationsUsed: number
      subscriptionStatus: string | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: Role
    appMode: AppMode
    freeGenerationsRemaining: number
    freeGenerationsUsed: number
    subscriptionStatus: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    appMode: AppMode
    freeGenerationsRemaining: number
    freeGenerationsUsed: number
    subscriptionStatus: string | null
  }
}

