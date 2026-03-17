const prisma = require('../models/prisma');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const getTransactionsData = async (startDate, endDate) => {
  const where = {};
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
    };
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
      items: {
        include: { product: { select: { name: true } } }
      }
    }
  });
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ===== EXPORT PDF =====
const exportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const transactions = await getTransactionsData(startDate, endDate);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=laporan-transaksi.pdf');
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('Laporan Transaksi', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('POS System — Sistem Kasir UMKM', { align: 'center' });
    if (startDate && endDate) {
      doc.fontSize(9).text(`Periode: ${startDate} s/d ${endDate}`, { align: 'center' });
    }
    doc.moveDown(1);

    // Summary
    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalPrice, 0);
    doc.fontSize(10).font('Helvetica-Bold').text(`Total Transaksi: ${transactions.length}`);
    doc.text(`Total Pendapatan: ${formatCurrency(totalRevenue)}`);
    doc.moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    const col = { id: 40, date: 110, cashier: 250, items: 350, method: 420, total: 490 };

    doc.fontSize(8).font('Helvetica-Bold');
    doc.rect(40, tableTop - 4, 515, 18).fill('#f1f5f9');
    doc.fillColor('#334155');
    doc.text('ID', col.id, tableTop, { width: 60 });
    doc.text('Tanggal', col.date, tableTop, { width: 130 });
    doc.text('Kasir', col.cashier, tableTop, { width: 90 });
    doc.text('Item', col.items, tableTop, { width: 60 });
    doc.text('Bayar', col.method, tableTop, { width: 60 });
    doc.text('Total', col.total, tableTop, { width: 70, align: 'right' });
    doc.moveDown(0.5);

    // Table Rows
    doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
    transactions.forEach((t, i) => {
      const y = doc.y;

      if (y > 750) {
        doc.addPage();
      }

      if (i % 2 === 0) {
        doc.rect(40, doc.y - 2, 515, 16).fill('#f8fafc');
        doc.fillColor('#1e293b');
      }

      const currentY = doc.y;
      doc.text(`#${t.id}`, col.id, currentY, { width: 60 });
      doc.text(formatDate(t.createdAt), col.date, currentY, { width: 130 });
      doc.text(t.user.name, col.cashier, currentY, { width: 90 });
      doc.text(`${t.items.length}`, col.items, currentY, { width: 60 });
      doc.text(t.paymentMethod, col.method, currentY, { width: 60 });
      doc.text(formatCurrency(t.totalPrice), col.total, currentY, { width: 70, align: 'right' });
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (error) {
    console.error('PDF Export Error:', error);
    res.status(500).json({ message: 'Gagal mengexport PDF.' });
  }
};

// ===== EXPORT EXCEL =====
const exportExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const transactions = await getTransactionsData(startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POS System';

    // ---- Sheet 1: Ringkasan Transaksi ----
    const sheet = workbook.addWorksheet('Transaksi');

    // Header styling
    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Tanggal', key: 'date', width: 22 },
      { header: 'Kasir', key: 'cashier', width: 18 },
      { header: 'Jumlah Item', key: 'itemCount', width: 14 },
      { header: 'Metode Bayar', key: 'method', width: 16 },
      { header: 'Total (Rp)', key: 'total', width: 18 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, size: 10 };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };

    transactions.forEach((t) => {
      sheet.addRow({
        id: t.id,
        date: formatDate(t.createdAt),
        cashier: t.user.name,
        itemCount: t.items.length,
        method: t.paymentMethod,
        total: t.totalPrice
      });
    });

    // Total row
    const totalRow = sheet.addRow({
      id: '', date: '', cashier: '', itemCount: 'TOTAL:',
      method: `${transactions.length} transaksi`,
      total: transactions.reduce((sum, t) => sum + t.totalPrice, 0)
    });
    totalRow.font = { bold: true };

    // Format number column
    sheet.getColumn('total').numFmt = '#,##0';

    // ---- Sheet 2: Detail Item ----
    const detailSheet = workbook.addWorksheet('Detail Item');
    detailSheet.columns = [
      { header: 'Transaksi ID', key: 'txId', width: 14 },
      { header: 'Tanggal', key: 'date', width: 22 },
      { header: 'Produk', key: 'product', width: 25 },
      { header: 'Qty', key: 'qty', width: 8 },
      { header: 'Harga Satuan', key: 'price', width: 16 },
      { header: 'Subtotal', key: 'subtotal', width: 16 },
    ];
    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };

    transactions.forEach((t) => {
      t.items.forEach((item) => {
        detailSheet.addRow({
          txId: `#${t.id}`,
          date: formatDate(t.createdAt),
          product: item.product.name,
          qty: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        });
      });
    });

    detailSheet.getColumn('price').numFmt = '#,##0';
    detailSheet.getColumn('subtotal').numFmt = '#,##0';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=laporan-transaksi.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel Export Error:', error);
    res.status(500).json({ message: 'Gagal mengexport Excel.' });
  }
};

module.exports = { exportPDF, exportExcel };
