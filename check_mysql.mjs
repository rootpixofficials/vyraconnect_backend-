import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cat /home/master/.my.cnf 2>/dev/null || echo "No .my.cnf"
    mysql -e "SHOW DATABASES;" 2>/dev/null || echo "Cannot run mysql without password"
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
