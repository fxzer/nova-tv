module.exports = {
  apps: [{
    name: 'nova-tv',
    script: '.next/standalone/m/nova-tv/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '0.0.0.0',
      PASSWORD: '8888',
      NEXT_PUBLIC_STORAGE_TYPE: 'localstorage'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}