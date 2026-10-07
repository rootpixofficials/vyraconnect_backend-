import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec('cat /home/master/applications/mhenvbbpem/.my.cnf', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
