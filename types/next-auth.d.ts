import { DefaultSession, DefaultUser } from "next-auth"
import { Role, AppMode } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      appMode: AppMode
      trialEndsAt: Date | null
      trialGenerations: number
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: Role
    appMode: AppMode
    trialEndsAt: Date | null
    trialGenerations: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    appMode: AppMode
  }
}

