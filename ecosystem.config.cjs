module.exports = {
  apps: [
    {
      name: 'nocomment-isp-backend',
      script: 'server.js',
      cwd: 'C:/www.nocomment.isp.com.lb/backend',
      interpreter: 'node',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'nocomment-isp-frontend',
      script: 'C:/www.nocomment.isp.com.lb/frontend/node_modules/vite/bin/vite.js',
      cwd: 'C:/www.nocomment.isp.com.lb/frontend',
      interpreter: 'node',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
}
