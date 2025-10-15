# Nova TV Docker 部署指南

这是一个使用 Docker 和 Docker Compose 来快速部署 Nova TV 应用的指南。

## 📋 项目信息

- **项目名称**: Nova TV
- **默认端口**: 3000
- **初始密码**: 1234
- **访问地址**: http://localhost:3000
- **登录页面**: http://localhost:3000/login

## 🚀 快速部署

### 方法一：使用 Docker Compose（推荐）

1. **克隆项目**

   ```bash
   git clone <你的仓库地址> nova-tv
   cd nova-tv
   ```

2. **创建环境变量文件（可选）**

   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置你的配置
   ```

3. **构建并启动服务**

   ```bash
   docker-compose up -d
   ```

4. **访问应用**
   - 应用地址：http://localhost:3000
   - 默认密码：1234（可在 .env 文件中修改）

### 方法二：使用 Docker 命令

1. **构建镜像**

   ```bash
   docker build -t nova-tv .
   ```

2. **运行容器**
   ```bash
   docker run -d \
     --name nova-tv \
     -p 3000:3000 \
     -e PASSWORD=1234 \
     -e NEXT_PUBLIC_IMAGE_PROXY=/api/image-proxy?url= \
     nova-tv
   ```

## ⚙️ 环境变量配置

创建 `.env` 文件来自定义配置：

```env
# 访问密码（必填）
# 如果不设置，将使用默认密码 1234
PASSWORD=你的自定义密码

# 图片代理地址（可选）
# 用于代理外部图片资源，防止跨域问题
NEXT_PUBLIC_IMAGE_PROXY=/api/image-proxy?url=

# 存储类型（可选）
# 可选值：localstorage, sessionstorage, redis
# 默认使用 localstorage
NEXT_PUBLIC_STORAGE_TYPE=localstorage

# Docker 环境标识（内部使用）
# 用于标识应用运行在 Docker 容器中
DOCKER_ENV=true
```

## 🔐 账户信息

**重要提醒**：

- 首次部署后请立即修改默认密码
- 默认密码仅用于初始设置和测试
- 生产环境请使用强密码

## 📋 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 1GB 可用内存
- 至少 2GB 可用磁盘空间

## 🔧 常用命令

### 使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build

# 查看服务状态
docker-compose ps
```

### 使用 Docker 命令

```bash
# 查看容器日志
docker logs nova-tv

# 进入容器
docker exec -it nova-tv sh

# 停止容器
docker stop nova-tv

# 删除容器
docker rm nova-tv
```

## 🐛 故障排除

### 1. 容器无法启动

```bash
# 检查容器日志
docker-compose logs nova-tv
```

### 2. 端口冲突

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - '8080:3000' # 将外部端口改为 8080
```

### 3. 内存不足

增加 Docker 内存限制或优化系统内存使用。

### 4. 权限问题

确保当前用户有权限访问 Docker：

```bash
sudo usermod -aG docker $USER
```

## 🔄 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 🌐 生产环境部署

### 使用 Nginx 反向代理

创建 Nginx 配置文件 `/etc/nginx/sites-available/nova-tv`：

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 使用 HTTPS（推荐）

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📊 监控

应用包含健康检查端点，可以通过以下方式监控：

```bash
curl http://localhost:3000/login
```

## 💾 备份

如果需要持久化数据，可以挂载 volumes：

```yaml
volumes:
  - ./data:/app/data
```

## 🆘 获取帮助

如果遇到问题，请：

1. 查看容器日志：`docker-compose logs`
2. 检查系统资源：`docker stats`
3. 验证网络连接：`curl http://localhost:3000`
