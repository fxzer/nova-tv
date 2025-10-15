module.exports = {
  apps: [{
    name: 'nova-tv',
    script: '.next/standalone/m/nova-tv/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
      PASSWORD: process.env.PASSWORD || '1234',
      NEXT_PUBLIC_IMAGE_PROXY: process.env.NEXT_PUBLIC_IMAGE_PROXY || '/api/image-proxy?url=',
      NEXT_PUBLIC_STORAGE_TYPE: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}