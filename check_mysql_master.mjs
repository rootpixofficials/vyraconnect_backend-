import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    mysql -u master_zqpqahqrbk -pWYAkcTs7fgV8 -e "SHOW DATABASES;" 2>/dev/null || echo "Cannot login with master password"
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
