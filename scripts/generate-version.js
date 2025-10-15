#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取当前时间并格式化为 YYYYMMDDHHMMSS 格式
function generateVersion() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  const version = `${year}${month}${day}${hours}${minutes}${seconds}`

  return version
}

// 生成版本号
const currentVersion = generateVersion()

// 读取现有的 version.ts 文件
const versionFilePath = path.join(__dirname, '..', 'src', 'lib', 'version.ts')
const fileContent = fs.readFileSync(versionFilePath, 'utf8')

// 使用正则表达式替换 CURRENT_VERSION 的值
const updatedContent = fileContent.replace(
  /const CURRENT_VERSION = '.*?'/,
  `const CURRENT_VERSION = '${currentVersion}'`,
)

// 写入更新后的内容
fs.writeFileSync(versionFilePath, updatedContent, 'utf8')

// 将版本号写入根目录下的 VERSION.txt 文件
const versionTxtPath = path.join(__dirname, '..', 'VERSION.txt')
fs.writeFileSync(versionTxtPath, currentVersion, 'utf8')

console.warn(`版本号已更新为: ${currentVersion}`)
console.warn(`文件已更新: ${versionFilePath}`)
console.warn(`VERSION.txt 已更新: ${versionTxtPath}`)
