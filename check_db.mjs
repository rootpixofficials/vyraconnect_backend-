import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('✅ SSH Ready. Checking available databases...');
  conn.exec('mysql -u master_zqpqahqrbk -pWYAkcTs7fgV8 -e "SHOW DATABASES;"', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('DATABASES:', data.toString()))
    .stderr.on('data', (data) => console.error(data.toString()));
  });
}).connect({
  host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8'
});
