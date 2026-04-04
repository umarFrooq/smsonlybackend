const PDFDocument = require('pdfkit');

const buildDateSheetsPDF = (dataCallback, endCallback, dateSheets, exam) => {
  const doc = new PDFDocument({ margin: 40 });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  // Header
  doc.fontSize(18).text(exam ? `DateSheets - ${exam.name || exam.title}` : 'DateSheets', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1);

  // Table header
  const tableTop = doc.y + 10;
  const left = 40;
  const rowHeight = 22;
  const colWidths = [200, 80, 60, 60, 80, 80]; // Subject, Date, Start, End, Room, Status

  const drawRow = (y, cols, isHeader = false) => {
    doc.fontSize(isHeader ? 11 : 10);
    cols.forEach((text, i) => {
      const x = left + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(text, x + 4, y + 6, { width: colWidths[i] - 8, align: 'left' });
    });
    doc.moveTo(left, y + rowHeight - 4).lineTo(left + colWidths.reduce((a, b) => a + b, 0), y + rowHeight - 4).strokeColor('#eeeeee').stroke();
  };

  drawRow(tableTop, ['Subject', 'Date', 'Start', 'End', 'Room', 'Status'], true);

  let y = tableTop + rowHeight;

  if (!Array.isArray(dateSheets) || dateSheets.length === 0) {
    doc.fontSize(10).text('No date sheets available.', left, y + 4);
    y += rowHeight;
  } else {
    dateSheets.forEach((ds) => {
      const subject = ds.subjectTitle || ds.subject || '';
      const date = ds.date ? new Date(ds.date).toLocaleDateString() : (ds.dateDisplay || '');
      const start = ds.startTime || ds.start || '';
      const end = ds.endTime || ds.end || '';
      const room = ds.roomNumber || ds.room || ds.room || '';
      const status = ds.status || '';
      drawRow(y, [subject, date, start, end, room, status], false);
      y += rowHeight;
      // Add new page if near bottom
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 40;
      }
    });
  }

  doc.end();
};

module.exports = { buildDateSheetsPDF };
