import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /home/master/applications/mhenvbbpem/public_html/backend
    
    export PATH=$PATH:/usr/bin:/home/master/.nvm/versions/node/v20.5.1/bin
    
    # 1. Update the .env file with the actual MySQL URL
    cat << 'EOF' > .env
PORT=5000
DATABASE_URL="mysql://mhenvbbpem:2WBJ6hsYN6@localhost:3306/mhenvbbpem"
JWT_SECRET="your-super-secure-jwt-secret-key"
TEST_OTP="1234"
NODE_ENV="production"
FRONTEND_URL="http://vyraconnect.in/scan"
EOF

    # 2. Pull the latest code
    git pull origin main
    
    # 3. Clean up the old SQLite db file
    rm -f dev.db
    
    # 4. Generate Prisma client for MySQL
    npx prisma generate
    
    # 5. Push schema to MySQL to create tables
    npx prisma db push --accept-data-loss
    
    # 6. Seed the admin user
    node node_modules/tsx/dist/cli.mjs src/seedAdmin.ts
    
    # 7. Restart the backend process
    node node_modules/pm2/bin/pm2 restart vyra-api
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
