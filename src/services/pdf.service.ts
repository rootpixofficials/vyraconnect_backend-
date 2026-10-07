import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { QrCode } from '@prisma/client';
import QRCode from 'qrcode';

export class PdfService {
  static async generateBatchPdf(batchId: string, qrCodes: QrCode[], batchCode: string): Promise<string> {
    const pdfsDir = path.join(process.cwd(), 'public', 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true });
    }
    
    const fileName = `batch-${batchCode}-${Date.now()}.pdf`;
    const filePath = path.join(pdfsDir, fileName);

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        doc.fontSize(20).text(`QR Code Batch: ${batchCode}`, { align: 'center' });
        doc.moveDown();

        const qrSize = 100;
        const marginX = 20;
        const marginY = 40;
        let x = 50;
        let y = doc.y;

        for (const qr of qrCodes) {
          if (x + qrSize > doc.page.width - 50) {
            x = 50;
            y += qrSize + marginY;
          }
          if (y + qrSize > doc.page.height - 50) {
            doc.addPage();
            x = 50;
            y = 50;
          }
          
          const qrDataUrl = await QRCode.toDataURL(qr.qr_url, { margin: 1 });
          const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
          const imgBuffer = Buffer.from(base64Data, 'base64');
          
          doc.image(imgBuffer, x, y, { width: qrSize, height: qrSize });
          doc.fontSize(8).text(qr.qr_serial, x, y + qrSize + 5, { width: qrSize, align: 'center' });
          
          x += qrSize + marginX;
        }

        doc.end();
        writeStream.on('finish', () => resolve(`/pdfs/${fileName}`));
        writeStream.on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }
}
