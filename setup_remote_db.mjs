import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH Ready. Executing Node.js DB setup script...');
  const script = `
    cd /home/master/vyraconnect_backend-
    npm install mysql2
    cat << 'EOF' > setup-db.js
const mysql = require('mysql2/promise');

async function setup() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'master_zqpqahqrbk',
      password: 'WYAkcTs7fgV8'
    });

    console.log("✅ Connected to MySQL successfully via Node.js!");

    const [dbs] = await connection.query('SHOW DATABASES;');
    console.log("Available databases:", dbs.map(d => d.Database).join(', '));

    try {
      await connection.query('CREATE DATABASE IF NOT EXISTS vyraconnect;');
      console.log("✅ Database 'vyraconnect' created or already exists.");
    } catch (createErr) {
      console.log("⚠️ Could not create 'vyraconnect'. Will use the first available user database.");
    }

    await connection.end();
  } catch (error) {
    console.error("❌ MySQL Connection Failed:", error.message);
  }
}
setup();
EOF
    node setup-db.js
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log(data.toString()))
    .stderr.on('data', (data) => console.error(data.toString()));
  });
}).connect({
  host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8'
});
