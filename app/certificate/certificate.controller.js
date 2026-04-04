const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const certificateService = require('./certificate.service');
const ApiError = require('../../utils/ApiError');
const PDFDocument = require('pdfkit');
const User = require('../user/user.model');

// Template handlers
const createTemplateHandler = catchAsync(async (req, res) => {
  const data = req.body;
  data.createdBy = req.user && req.user.id;
  if (req.schoolId) data.schoolId = req.schoolId;
  const tpl = await certificateService.createTemplate(data);
  res.status(httpStatus.CREATED).send(tpl);
});

const listTemplatesHandler = catchAsync(async (req, res) => {
  const filter = {};
  if (req.schoolId) filter.schoolId = req.schoolId;
  const options = { limit: req.query.limit || 50, page: req.query.page || 1 };
  const list = await certificateService.listTemplates(filter, options);
  res.send(list);
});

const getTemplateHandler = catchAsync(async (req, res) => {
  const tpl = await certificateService.getTemplateById(req.params.templateId, req.schoolId);
  if (!tpl) throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  res.send(tpl);
});

const updateTemplateHandler = catchAsync(async (req, res) => {
  const tpl = await certificateService.updateTemplate(req.params.templateId, req.body, req.schoolId);
  res.send(tpl);
});

const deleteTemplateHandler = catchAsync(async (req, res) => {
  const tpl = await certificateService.deleteTemplate(req.params.templateId, req.schoolId);
  res.send(tpl);
});

// Generate from template (renders HTML -> PDF and stores record)
const generateHandler = catchAsync(async (req, res) => {
  const { templateId, studentId, certificateType, extraData } = req.body;
  // If a certificate already exists for this student+type, return it instead of creating a new one
  const GeneratedCertificate = require('./generated.model');
  const typeToUse = certificateType || 'certificate';
  const filter = { studentId, certificateType: typeToUse };
  if (req.schoolId) filter.schoolId = req.schoolId;

  const existing = await GeneratedCertificate.findOne(filter);
  if (existing) {
    // Return existing certificate record; frontend can download using its id
    return res.status(httpStatus.OK).send(existing);
  }

  const generated = await certificateService.generateCertificate({
    templateId,
    studentId,
    generatedBy: req.user && req.user.id,
    certificateType,
    schoolId: req.schoolId,
    extraData,
  });
  res.status(httpStatus.CREATED).send(generated);
});

// Get existing generated certificate by studentId and optional certificateType
const getGeneratedHandler = catchAsync(async (req, res) => {
  const GeneratedCertificate = require('./generated.model');
  const { studentId, certificateType } = req.query;
  if (!studentId) return res.status(httpStatus.BAD_REQUEST).send({ message: 'studentId is required' });
  const typeToUse = certificateType || 'certificate';
  const filter = { studentId, certificateType: typeToUse };
  if (req.schoolId) filter.schoolId = req.schoolId;
  const existing = await GeneratedCertificate.findOne(filter);
  if (!existing) return res.status(httpStatus.NOT_FOUND).send({});
  return res.send(existing);
});

// Preview arbitrary HTML or template render as PDF (returns PDF buffer)
const previewHandler = catchAsync(async (req, res) => {
  const { templateId, html: rawHtml, studentId, extraData } = req.body;
  let htmlToRender = rawHtml;

  if (templateId) {
    const tpl = await certificateService.getTemplateById(templateId, req.schoolId);
    if (!tpl) throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
    // If a studentId is provided, fetch student to populate placeholders
    let student = extraData?.student || null;
    if (studentId) {
      const User = require('../user/user.model');
      const filter = { _id: studentId };
      if (req.schoolId) filter.schoolId = req.schoolId;
      student = await User.findOne(filter).lean();
    }
    const data = {
      student,
      school: extraData?.school || {},
      issuedAt: new Date().toLocaleDateString(),
      certificate: { serialNumber: extraData?.serialNumber || `PREVIEW-${Date.now()}` },
      ...extraData,
    };
    const tplCompiler = require('handlebars').compile(tpl.html || '');
    htmlToRender = tplCompiler(data);
  }

  if (!htmlToRender) throw new ApiError(httpStatus.BAD_REQUEST, 'No HTML provided for preview');

  const pdfBuffer = await certificateService.renderHtmlToPdfBuffer(htmlToRender, { format: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
  res.send(pdfBuffer);
});

// Preview as HTML instead of PDF (for debugging/fallback)
const previewHtmlHandler = catchAsync(async (req, res) => {
  const { templateId, html: rawHtml, studentId, extraData } = req.body;
  let htmlToRender = rawHtml;

  if (templateId) {
    const tpl = await certificateService.getTemplateById(templateId, req.schoolId);
    if (!tpl) throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
    // If a studentId is provided, fetch student to populate placeholders
    let student = extraData?.student || null;
    if (studentId) {
      const User = require('../user/user.model');
      const filter = { _id: studentId };
      if (req.schoolId) filter.schoolId = req.schoolId;
      student = await User.findOne(filter).lean();
    }
    const data = {
      student: student || { fullname: 'John Doe Sample' },
      school: extraData?.school || { name: 'Sample School', logo: 'https://via.placeholder.com/80' },
      issuedAt: new Date().toLocaleDateString(),
      certificate: { serialNumber: extraData?.serialNumber || `PREVIEW-${Date.now()}` },
      course: { name: 'Sample Course' },
      completion: { date: new Date().toLocaleDateString() },
      ...extraData,
    };
    const tplCompiler = require('handlebars').compile(tpl.html || '');
    htmlToRender = tplCompiler(data);
  }

  if (!htmlToRender) throw new ApiError(httpStatus.BAD_REQUEST, 'No HTML provided for preview');

  // Decode HTML entities for proper display
  const decodedHtml = htmlToRender.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Certificate Preview</title>
      <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
        .preview-container { background: white; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
        .header { background: #2196F3; color: white; padding: 10px 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">Certificate HTML Preview (Fallback Mode)</div>
      <div class="preview-container">
        ${decodedHtml}
      </div>
    </body>
    </html>
  `);
});

// Download generated certificate
const downloadGeneratedHandler = catchAsync(async (req, res) => {
  const GeneratedCertificate = require('./generated.model');
  const fs = require('fs');
  const path = require('path');
  
  const { certificateId } = req.params;
  
  // Get certificate record from database
  const filter = { _id: certificateId };
  if (req.schoolId) filter.schoolId = req.schoolId;
  const cert = await GeneratedCertificate.findOne(filter);
  if (!cert) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Certificate not found');
  }

  // Construct current expected absolute path using fileName and current CWD
  // this handles cases where the project was moved to a different drive/folder
  const expectedFilePath = path.join(process.cwd(), 'uploads', 'certificates', cert.fileName || '');
  let fileToStream = cert.filePath;

  // Try local expected path first, fallback to DB stored path
  if (fs.existsSync(expectedFilePath)) {
    fileToStream = expectedFilePath;
  } else if (!fileToStream || !fs.existsSync(fileToStream)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Certificate file not found');
  }

  // Set headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${cert.fileName || 'certificate.pdf'}"`);
  
  // Stream the file
  const fileStream = fs.createReadStream(fileToStream);
  fileStream.pipe(res);
});

// Legacy PDF generator / download for a student's certificate (on-the-fly)
const generateCertificate = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const filter = { _id: studentId };
  if (req.schoolId) filter.schoolId = req.schoolId;
  const student = await User.findOne(filter).populate('schoolId');
  if (!student) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'Student not found' });
  }
  const school = student.schoolId;
  if (!school) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'School not found' });
  }

  // Create PDF
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate_${student.fullname}.pdf"`);

  // Gold border
  doc.save();
  doc.lineWidth(4).rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke('#bfa14a');
  doc.restore();

  // Watermark (light text in background)
  doc.fontSize(80).fillColor('#f5e6b2').opacity(0.15).text('CERTIFICATE', 0, doc.page.height / 2 - 100, {
    align: 'center',
    rotate: -10,
  });
  doc.opacity(1);

  // School logo at top center
  if (school.logo) {
    try {
      doc.image(school.logo, doc.page.width / 2 - 60, 70, { width: 120, align: 'center' });
    } catch (e) {}
  }

  // School name
  doc.fontSize(32).font('Times-Bold').fillColor('#bfa14a').text(school.name || 'School', 0, 210, { align: 'center' });

  // Certificate title
  doc.moveDown(1);
  doc.fontSize(28).font('Times-Bold').fillColor('#222').text('Certificate of Achievement', { align: 'center', underline: true });

  // Main content
  doc.moveDown(2);
  doc.fontSize(18).font('Times-Roman').fillColor('#333').text('This is to certify that', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(30).font('Times-Bold').fillColor('#222').text(student.fullname, { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(18).font('Times-Roman').fillColor('#333').text('has successfully completed the requirements.', { align: 'center' });

  // Details
  doc.moveDown(2);
  doc.fontSize(16).font('Times-Roman').fillColor('#222').text(`Registration No: ${student.registrationNumber || 'N/A'}`, { align: 'center' });
  doc.text(`Grade: ${student.gradeId?.name || 'N/A'}`, { align: 'center' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

  // Signature area
  doc.moveDown(5);
  doc.fontSize(16).font('Times-Italic').fillColor('#bfa14a').text('_________________________', doc.page.width / 2 - 100, doc.page.height - 150, { align: 'center' });
  doc.fontSize(14).font('Times-Roman').fillColor('#222').text('Authorized Signature', doc.page.width / 2 - 60, doc.page.height - 130, { align: 'center' });

  doc.end();
  doc.pipe(res);
});

// Student certificate upload/update/delete handlers (use certificateService functions)
const uploadCertificate = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const certificate = await certificateService.uploadCertificate(studentId, req, req.user);
  res.status(httpStatus.CREATED).send(certificate);
});

const updateCertificate = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const certificate = await certificateService.updateCertificate(studentId, req, req.user);
  res.send(certificate);
});

const deleteCertificate = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  await certificateService.deleteCertificate(studentId, req.schoolId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTemplateHandler,
  listTemplatesHandler,
  getTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  generateHandler,
  previewHandler,
  previewHtmlHandler,
  getGeneratedHandler,
  downloadGeneratedHandler,
  generateCertificate,
  uploadCertificate,
  updateCertificate,
  deleteCertificate,
};
