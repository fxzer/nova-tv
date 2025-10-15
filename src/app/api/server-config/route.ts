import type { NextRequest } from 'next/server'
import process from 'node:process'
import { NextResponse } from 'next/server'

import { getConfig } from '@/lib/config'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  console.warn('server-config called: ', request.url)

  const config = await getConfig()
  const result = {
    SiteName: config.SiteConfig.SiteName,
    StorageType: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage',
  }
  return NextResponse.json(result)
}
