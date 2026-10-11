import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec('/home/1650272.cloudwaysapps.com/mhenvbbpem/public_html/backend/node_modules/pm2/bin/pm2 logs vyra-api --lines 50', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => { conn.end(); })
    .on('data', data => process.stdout.write(data))
    .stderr.on('data', data => process.stderr.write(data));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
