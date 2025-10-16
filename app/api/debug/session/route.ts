import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'

export async function GET(request: Request) {
  try {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    return NextResponse.json({
      token: token ? {
        id: token.id,
        email: token.email,
        role: token.role,
        appMode: token.appMode,
      } : null,
      message: token ? 'Token found' : 'No token'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

