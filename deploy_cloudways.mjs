import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /home/master/applications/mhenvbbpem/public_html/backend
    
    # Create the correct .env file for the Cloudways database!
    cat << 'EOF' > .env
DATABASE_URL="mysql://mhenvbbpem:w1234567890@127.0.0.1:3306/mhenvbbpem"
PORT=5000
EOF

    export PATH=$PATH:/usr/bin:/home/master/.nvm/versions/node/v20.5.1/bin
    
    # Fix execution permissions
    npm install pm2
    chmod -R +x node_modules/.bin/
    
    # Generate Prisma
    node node_modules/.bin/prisma generate
    
    # Start app via PM2 using node explicitly
    node node_modules/.bin/pm2 stop vyra-api || true
    node node_modules/.bin/pm2 start node_modules/tsx/dist/cli.mjs --name "vyra-api" -- src/app.ts
    node node_modules/.bin/pm2 save
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
