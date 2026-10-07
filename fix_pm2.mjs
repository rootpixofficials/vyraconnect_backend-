import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /home/master/applications/mhenvbbpem/public_html/backend
    
    export PATH=$PATH:/usr/bin:/home/master/.nvm/versions/node/v20.5.1/bin
    
    # Fix permissions
    chmod +x node_modules/.bin/*
    
    # Delete crashing pm2 tasks
    node node_modules/pm2/bin/pm2 delete vyra-api
    
    # Start fresh production-like runner
    node node_modules/pm2/bin/pm2 start node_modules/tsx/dist/cli.mjs --name "vyra-api" -- src/app.ts
    
    node node_modules/pm2/bin/pm2 save
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
