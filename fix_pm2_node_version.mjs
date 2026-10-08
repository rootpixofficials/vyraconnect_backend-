import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /home/1650272.cloudwaysapps.com/ewccqhxqex/public_html/frontend
    
    # Delete the crashing process
    /home/1650272.cloudwaysapps.com/mhenvbbpem/public_html/backend/node_modules/pm2/bin/pm2 delete vyra-frontend
    
    # Create a start script
    cat << 'EOF' > start.sh
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20.18.0
npm start
EOF
    chmod +x start.sh
    
    # Start via the script
    PORT=3001 /home/1650272.cloudwaysapps.com/mhenvbbpem/public_html/backend/node_modules/pm2/bin/pm2 start ./start.sh --name "vyra-frontend"
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
