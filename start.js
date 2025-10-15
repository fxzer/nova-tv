#!/usr/bin/env node

import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 调用 generate-manifest.js 生成 manifest.json
async function generateManifest() {
  try {
    const generateManifestScript = path.join(
      __dirname,
      'scripts',
      'generate-manifest.js',
    )
    await import(generateManifestScript)
  }
  catch (error) {
    console.error('❌ Error calling generate-manifest.js:', error)
    throw error
  }
}

generateManifest()

import('./server.js')

// 每 1 秒轮询一次，直到请求成功
const TARGET_URL = `http://${process.env.HOSTNAME || 'localhost'}:${
  process.env.PORT || 3000
}/login`

const intervalId = setInterval(() => {
  const req = http.get(TARGET_URL, (res) => {
    // 当返回 2xx 状态码时认为成功，然后停止轮询
    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
      clearInterval(intervalId)

      // 服务器启动后，立即执行一次 cron 任务
      executeCronJob()

      // 然后设置每小时执行一次 cron 任务
      setInterval(
        () => {
          executeCronJob()
        },
        60 * 60 * 1000,
      ) // 每小时执行一次
    }
  })

  req.setTimeout(2000, () => {
    req.destroy()
  })
}, 1000)

// 执行 cron 任务的函数
function executeCronJob() {
  const cronUrl = `http://${process.env.HOSTNAME || 'localhost'}:${
    process.env.PORT || 3000
  }/api/cron`

  const req = http.get(cronUrl, (res) => {
    let data = ''

    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        // Cron job 执行成功
      }
      else {
        console.error('Cron job failed:', res.statusCode, data)
      }
    })
  })

  req.on('error', (err) => {
    console.error('Error executing cron job:', err)
  })

  req.setTimeout(30000, () => {
    console.error('Cron job timeout')
    req.destroy()
  })
}
