import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /home/master/applications/mhenvbbpem/public_html/backend
    
    export PATH=$PATH:/usr/bin:/home/master/.nvm/versions/node/v20.5.1/bin
    
    # 1. Install pm2 locally
    npm install pm2 tsx
    
    # 2. Fix the .env file properly
    echo 'PORT=5000' > .env
    echo 'DATABASE_URL="mysql://mhenvbbpem:2WBJ6hsYN6@localhost:3306/mhenvbbpem"' >> .env
    echo 'JWT_SECRET="your-super-secure-jwt-secret-key"' >> .env
    echo 'TEST_OTP="1234"' >> .env
    echo 'NODE_ENV="production"' >> .env
    echo 'FRONTEND_URL="http://vyraconnect.in/scan"' >> .env
    
    # 3. Push schema
    npx prisma db push --accept-data-loss
    npx prisma generate
    
    # 4. Start PM2
    node node_modules/pm2/bin/pm2 start node_modules/tsx/dist/cli.mjs --name "vyra-api" -- src/app.ts || node node_modules/pm2/bin/pm2 restart vyra-api
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
