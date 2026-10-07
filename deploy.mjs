import { Client } from 'ssh2';

const conn = new Client();

console.log('Connecting to remote server (178.128.241.178)...');

conn.on('ready', () => {
  console.log('✅ SSH Connection Established. Running deployment script...');
  
  const script = `
    echo "--- Pulling from GitHub ---"
    cd ~
    rm -rf vyraconnect_backend-
    git clone https://github.com/rootpixofficials/vyraconnect_backend-.git
    cd vyraconnect_backend-
    
    echo "--- Installing Dependencies ---"
    npm install
    
    echo "--- Configuring Database (.env) ---"
    # Using local mysql socket/port on the server
    echo 'DATABASE_URL="mysql://master_zqpqahqrbk:WYAkcTs7fgV8@127.0.0.1:3306/vyraconnect"' > .env
    echo 'PORT=5000' >> .env
    
    echo "--- Pushing Schema & Generating Prisma Client ---"
    npx prisma generate
    
    # Try creating the DB if it doesn't exist via a quick mysql command
    mysql -u master_zqpqahqrbk -pWYAkcTs7fgV8 -e "CREATE DATABASE IF NOT EXISTS vyraconnect;"
    
    npx prisma db push --accept-data-loss
    
    echo "--- Seeding Admin User ---"
    npm install -g tsx pm2
    npx tsx src/seedAdmin.ts
    
    echo "--- Starting Application via PM2 ---"
    pm2 stop vyra-api || true
    pm2 start src/app.ts --name "vyra-api" --interpreter tsx
    pm2 save
    
    echo "✅ DEPLOYMENT COMPLETE!"
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Deployment stream closed. Code:', code);
      conn.end();
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.error(data.toString());
    });
  });
}).connect({
  host: '178.128.241.178',
  port: 22,
  username: 'master_zqpqahqrbk',
  password: 'WYAkcTs7fgV8'
});
