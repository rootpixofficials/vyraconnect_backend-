import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /home/1650272.cloudwaysapps.com/ewccqhxqex/public_html
    
    export PATH=$PATH:/usr/bin:/home/master/.nvm/versions/node/v20.5.1/bin
    
    # 1. Clean directory
    rm -rf *
    
    # 2. Clone frontend repo
    git clone https://github.com/rootpixofficials/vyraconnect_frontend-.git frontend
    cd frontend
    
    # 3. Setup ENV
    echo 'NEXT_PUBLIC_API_URL="http://api.vyraconnect.in"' > .env.local
    
    # 4. Install & Build
    npm install
    npm run build
    
    # 5. Start PM2 on port 3001
    PORT=3001 node /home/1650272.cloudwaysapps.com/mhenvbbpem/public_html/backend/node_modules/pm2/bin/pm2 start npm --name "vyra-frontend" -- start || \
    PORT=3001 node /home/1650272.cloudwaysapps.com/mhenvbbpem/public_html/backend/node_modules/pm2/bin/pm2 restart vyra-frontend
    
    # 6. Setup Reverse Proxy
    cd /home/1650272.cloudwaysapps.com/ewccqhxqex/public_html
    cat << 'EOF' > .htaccess
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/.*
RewriteRule ^(.*)$ http://127.0.0.1:3001/$1 [P,L]
EOF

    echo "DEPLOYMENT COMPLETED!"
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
