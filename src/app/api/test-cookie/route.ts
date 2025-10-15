import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({ ok: true })

  const testValue = JSON.stringify({ role: 'user', password: '8888' })
  const encodedValue = encodeURIComponent(testValue)

  response.cookies.set('auth', encodedValue, {
    path: '/',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sameSite: 'lax',
    httpOnly: false,
    secure: false,
  })

  console.log('Setting cookie:', encodedValue)

  return response
}
