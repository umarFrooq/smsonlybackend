const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateSalarySlip = (payroll) => {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, `../../../public/salary-slips/salary-slip-${payroll.teacherId}-${payroll.month}-${payroll.year}.pdf`);

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(25).text('Salary Slip', { align: 'center' });
  doc.fontSize(12).text(`Month: ${payroll.month}/${payroll.year}`);
  doc.moveDown();
  doc.text(`Teacher: ${payroll.teacherId.fullname}`);
  doc.text(`Basic Salary: ${payroll.basicSalary}`);
  doc.text(`Allowances: ${payroll.allowances}`);
  doc.text(`Deductions: ${payroll.deductions}`);
  doc.text(`Net Salary: ${payroll.netSalary}`);
  doc.end();

  return filePath;
};

module.exports = {
  generateSalarySlip,
};
