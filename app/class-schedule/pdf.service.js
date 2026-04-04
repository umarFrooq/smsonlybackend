const PDFDocument = require('pdfkit');

const buildTimetablePDF = (dataCallback, endCallback, schedules) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  // Header
  doc.fontSize(20).text('Class Timetable', { align: 'center' });
  doc.moveDown(2);

  // Table setup
  const tableTop = doc.y;
  const tableLeft = 50;
  const rowHeight = 25;

  // Increase column widths so all fields are visible
  const colWidths = [100, 80, 80, 100, 80, 120, 100]; 
  // Subject, Grade, Section, Teacher, Day, Time, Branch

  const drawTableRow = (y, items, isHeader = false) => {
    doc.fontSize(isHeader ? 12 : 10);
    items.forEach((item, i) => {
      const x = tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(item, x + 2, y, {
        width: colWidths[i] - 4,
        align: 'left'
      });
    });
    // Draw bottom line
    doc.moveTo(tableLeft, y + rowHeight - 5)
       .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), y + rowHeight - 5)
       .stroke();
  };

  // Table Header
  drawTableRow(tableTop, ['Subject', 'Grade', 'Section', 'Teacher', 'Day', 'Time', 'Branch'], true);

  // Table Rows
  let y = tableTop + rowHeight;
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  daysOfWeek.forEach(day => {
    const daySchedules = schedules.filter(item => item.dayOfWeek === day);
    if (daySchedules.length > 0) {
      // Sort by time
      daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime)).forEach(item => {
        const row = [
          item.subjectId?.title || 'N/A',
          item.gradeId?.title || 'N/A',
          item.section || 'N/A',
          item.teacherId?.fullname || 'N/A',
          item.dayOfWeek,
          `${item.startTime} - ${item.endTime}`,
          item.branchId?.name || 'N/A'
        ];
        drawTableRow(y, row);
        y += rowHeight;
      });
    }
  });

  doc.end();
};

module.exports = { buildTimetablePDF };
