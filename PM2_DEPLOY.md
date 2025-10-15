# Nova TV PM2 部署指南

使用 PM2 进行生产环境部署的安全指南。

## 📋 项目信息

- **项目名称**: Nova TV
- **默认端口**: 3000
- **初始密码**: 1234
- **访问地址**: http://localhost:3000
- **登录页面**: http://localhost:3000/login
- **PM2 进程名**: nova-tv

## 🔒 安全的密码管理

### ❌ 错误做法（不要这样做）

```javascript
// 不要在配置文件中硬编码密码
PASSWORD: '你的真实密码'
```

### ✅ 正确做法

1. **使用环境变量**

   ```bash
   # 在服务器上设置环境变量
   export PASSWORD=你的真实密码
   ```

2. **使用 .env 文件**
   ```bash
   # 创建 .env 文件（不要提交到 Git）
   echo "PASSWORD=你的真实密码" > .env
   echo ".env" >> .gitignore
   ```

## 🚀 部署步骤

### 1. 克隆项目并构建

```bash
git clone <你的仓库地址> nova-tv
cd nova-tv
cp .env.example .env
# 编辑 .env 文件设置你的密码
pnpm install
pnpm build
```

### 2. 设置环境变量

```bash
# 方法一：临时设置（重启后失效）
export PASSWORD=你的密码

# 方法二：永久设置
echo 'export PASSWORD=你的密码' >> ~/.bashrc
source ~/.bashrc

# 方法三：使用 .env 文件
echo "PASSWORD=你的密码" > .env
```

### 3. 使用 PM2 启动应用

```bash
# 使用默认配置启动
pm2 start ecosystem.config.cjs

# 或者指定配置文件
pm2 start ecosystem.config.cjs --env production
```

### 4. 查看应用状态

```bash
pm2 status
pm2 logs nova-tv
```

## ⚙️ 配置文件说明

`ecosystem.config.cjs` 已配置为从环境变量读取敏感信息：

```bash
# ecosystem.config.cjs 配置示例
PASSWORD: process.env.PASSWORD || '1234',  # 从环境变量读取密码
NEXT_PUBLIC_IMAGE_PROXY: process.env.NEXT_PUBLIC_IMAGE_PROXY || '/api/image-proxy?url=',
NEXT_PUBLIC_STORAGE_TYPE: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage'
```

## 🔧 常用 PM2 命令

```bash
# 启动应用
pm2 start ecosystem.config.cjs

# 重启应用
pm2 restart nova-tv

# 停止应用
pm2 stop nova-tv

# 删除应用
pm2 delete nova-tv

# 保存当前进程列表
pm2 save

# 设置开机自启
pm2 startup
pm2 save
```

## 🐛 故障排除

### 1. 密码不生效

```bash
# 检查环境变量是否设置
echo $PASSWORD

# 检查 PM2 进程的环境变量
pm2 env 0
```

### 2. 应用无法启动

```bash
# 查看详细日志
pm2 logs nova-tv --err

# 检查端口占用
netstat -tlnp | grep 3000
```

### 3. 内存不足

```bash
# 查看内存使用情况
pm2 monit

# 调整内存限制
# 编辑 ecosystem.config.cjs 中的 max_memory_restart
```

## 🔄 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建
pnpm build

# 重启应用
pm2 restart nova-tv
```

## 🛡️ 安全最佳实践

1. **永远不要**将 `.env` 文件提交到 Git
2. **永远不要**在配置文件中硬编码密码
3. 定期更换密码
4. 使用强密码
5. 限制服务器访问权限

## 📋 环境变量清单

创建 `.env` 文件时，可以包含以下变量：

```env
# 访问密码（必填）
# 如果不设置，将使用默认密码 1234
PASSWORD=你的安全密码

# 图片代理地址（可选）
# 用于代理外部图片资源，防止跨域问题
NEXT_PUBLIC_IMAGE_PROXY=/api/image-proxy?url=

# 存储类型（可选）
# 可选值：localstorage, sessionstorage, redis
# 默认使用 localstorage
NEXT_PUBLIC_STORAGE_TYPE=localstorage
```

## 🔐 账户信息

**重要提醒**：

- 首次部署后请立即修改默认密码
- 默认密码仅用于初始设置和测试
- 生产环境请使用强密码（至少8位，包含字母和数字）

**首次登录步骤**：

1. 访问 http://localhost:3000/login
2. 输入默认密码：1234
3. 登录后立即在设置中修改密码

## 🌐 Nginx 反向代理配置

如果使用 Nginx，可以这样配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 监控和日志

```bash
# 实时监控
pm2 monit

# 查看日志
pm2 logs nova-tv

# 日志文件位置
~/.pm2/logs/nova-tv-out.log
~/.pm2/logs/nova-tv-error.log
```
