import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return NextResponse.json({ error: '缺少图片URL参数' }, { status: 400 })
  }

  try {
    // 验证URL格式
    const url = new URL(imageUrl)

    // 只允许常见的图片域名
    const allowedDomains = [
      'doubanio.com',
      'img1.doubanio.com',
      'img2.doubanio.com',
      'img3.doubanio.com',
      'img9.doubanio.com',
      'movie.douban.com',
    ]

    if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
      return NextResponse.json({ error: '不允许的图片域名' }, { status: 403 })
    }

    // 获取图片
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://movie.douban.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      // 设置超时时间
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer()

    // 获取内容类型
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // 设置缓存头
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable', // 缓存1天
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    })

    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    })
  }
  catch (error) {
    console.error('图片代理错误:', error)
    return NextResponse.json(
      { error: '获取图片失败' },
      { status: 500 },
    )
  }
}

// 支持预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
