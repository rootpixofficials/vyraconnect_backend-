import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /home/master/applications/mhenvbbpem/public_html/backend
    
    export PATH=$PATH:/usr/bin:/home/master/.nvm/versions/node/v20.5.1/bin
    
    # Change Prisma schema to SQLite
    sed -i 's/provider = "mysql"/provider = "sqlite"/g' prisma/schema.prisma
    sed -i 's/url      = env("DATABASE_URL")/url      = "file:.\/dev.db"/g' prisma/schema.prisma
    
    # Generate Prisma for SQLite
    node node_modules/prisma/build/index.js generate
    
    # Push SQLite database and Seed
    node node_modules/prisma/build/index.js db push --accept-data-loss
    node node_modules/tsx/dist/cli.mjs src/seedAdmin.ts
    
    # Restart API
    node node_modules/pm2/bin/pm2 restart vyra-api
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
