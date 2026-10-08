import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /home/1650272.cloudwaysapps.com/mhenvbbpem/public_html/backend
    
    export PATH=$PATH:/usr/bin:/home/master/.nvm/versions/node/v20.5.1/bin
    
    # 1. Update the .env file to use the live secure domain
    sed -i 's|FRONTEND_URL="http://localhost:3000/scan"|FRONTEND_URL="https://vyraconnect.in/scan"|g' .env
    
    # 2. Restart the backend API
    node node_modules/pm2/bin/pm2 restart vyra-api
    
    # 3. Create a quick script to fix the existing database QRs
    cat << 'EOF' > fix_db.ts
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

async function fix() {
  const qrs = await prisma.qrCode.findMany({
    where: {
      qr_url: { contains: 'localhost:3000' }
    }
  });

  console.log(\`Found \${qrs.length} QR codes pointing to localhost. Fixing...\`);

  for (const qr of qrs) {
    const newUrl = qr.qr_url.replace('http://localhost:3000/scan', 'https://vyraconnect.in/scan');
    const newBase64 = await QRCode.toDataURL(newUrl, { errorCorrectionLevel: 'H' });
    
    await prisma.qrCode.update({
      where: { id: qr.id },
      data: { 
        qr_url: newUrl,
        qr_image_base64: newBase64
      }
    });
    console.log(\`Fixed QR: \${qr.qr_serial}\`);
  }
  
  console.log('All localhost QRs successfully converted to https://vyraconnect.in/scan');
}

fix().catch(console.error).finally(() => prisma.$disconnect());
EOF

    # 4. Run the fix script
    npx tsx fix_db.ts
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
    .on('data', (data) => console.log('STDOUT: ' + data.toString()))
    .stderr.on('data', (data) => console.error('STDERR: ' + data.toString()));
  });
}).connect({ host: '178.128.241.178', port: 22, username: 'master_zqpqahqrbk', password: 'WYAkcTs7fgV8' });
