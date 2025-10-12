import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, deleteSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ message: 'Выход выполнен успешно' })
  
  try {
    const token = req.cookies.get('auth-token')?.value

    if (token) {
      await deleteSession(token)
    }
  } catch (error) {
    console.error('Logout error:', error)
  }
  
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })

  return response
}


