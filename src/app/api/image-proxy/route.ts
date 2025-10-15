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

    // 限制域名白名单，防止滥用
    const allowedDomains = [
      // 豆瓣相关域名
      'doubanio.com',
      'douban.com',
      'img1.doubanio.com',
      'img2.doubanio.com',
      'img3.doubanio.com',
      'img9.doubanio.com',
      'movie.douban.com',

      // 其他图片域名
      'yczy5.com',
      'mtzy0.com',
      'img.jisuimage.com',
      'yzzy8.com',
      'btzy8.com',
      'ztzy8.com',
      'cjtt.com',
      'kkzy8.com',
      'bttuku.com',
      'img.liangnizi.com',
      'tu.52av.one',
      'p1.so.tn',
      'p2.so.tn',
      'p3.so.tn',
      'ikgambwqeqnv.com',
      'tu.ikgambwqeqnv.com',
      'imgwolong.com',

      // API站点域名（来自config.json）
      'caiji.dyttzyapi.com',
      'json.heimuer.xyz',
      'heimuer.tv',
      'cj.rycjapi.com',
      'bfzyapi.com',
      'tyyszy.com',
      'ffzy5.tv',
      '360zy.com',
      'caiji.maotaizy.cc',
      'wolongzyw.com',
      'jszyapi.com',
      'dbzy.tv',
      'mozhuazy.com',
      'www.mdzyapi.com',
      'api.zuidapi.com',
      'm3u8.apiyhzy.com',
      'api.wujinapi.me',
      'wwzy.tv',
      'ikunzyapi.com',
      'cj.lziapi.com',
      'zy.xmm.hk',
    ]

    // 检查是否为允许的域名
    const isAllowedDomain = allowedDomains.some(domain => url.hostname.includes(domain))

    if (!isAllowedDomain) {
      return NextResponse.json({ error: '不允许的图片域名' }, { status: 403 })
    }

    // 动态设置 Referer 头
    const hostname = url.hostname

    // 特殊 Referer 配置
    const specialReferers: Record<string, string> = {
      'douban.com': 'https://movie.douban.com/',
      'doubanio.com': 'https://movie.douban.com/',
      'heimuer.xyz': 'https://heimuer.tv/',
      'heimuer.tv': 'https://heimuer.tv/',
    }

    // 检查是否有特殊配置
    let referer: string | undefined
    for (const [domain, specialReferer] of Object.entries(specialReferers)) {
      if (hostname.includes(domain)) {
        referer = specialReferer
        break
      }
    }

    // 默认使用域名本身作为 Referer
    if (!referer) {
      const baseDomain = hostname.replace(/^[^.]+\./, '')
      referer = `https://www.${baseDomain}/`
    }

    // 获取图片
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer,
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      // 设置超时时间
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      console.error(`图片代理 HTTP 错误: ${response.status} ${response.statusText} for URL: ${imageUrl}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer()

    // 检查是否为有效的图片数据
    if (imageBuffer.byteLength === 0) {
      throw new Error('图片数据为空')
    }

    // 获取内容类型
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // 设置缓存头
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable', // 缓存1天
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Image-Proxy': 'true',
    })

    console.log(`成功代理图片: ${imageUrl} (${contentType}, ${imageBuffer.byteLength} bytes)`)

    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    })
  }
  catch (error) {
    console.error(`图片代理错误 for ${imageUrl}:`, error)

    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : '获取图片失败'

    return NextResponse.json(
      {
        error: errorMessage,
        imageUrl,
        timestamp: new Date().toISOString(),
      },
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
