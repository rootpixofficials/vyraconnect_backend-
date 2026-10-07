import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /home/master/applications/mhenvbbpem/public_html/backend
    
    echo "APP.TS FILE:"
    cat src/app.ts
    
    echo "PM2 LOGS:"
    /home/master/.nvm/versions/node/v20.5.1/bin/pm2 logs vyra-api --lines 50 --nostream
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
