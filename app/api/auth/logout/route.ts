import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, deleteSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value

    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.json({ message: 'Выход выполнен успешно' })
    
    response.cookies.delete('auth-token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Ошибка при выходе' },
      { status: 500 }
    )
  }
}


