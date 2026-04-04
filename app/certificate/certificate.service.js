const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');
const CertificateTemplate = require('./certificate.template.model');
const GeneratedCertificate = require('./generated.model');
const User = require('../user/user.model');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');
const S3Util = require('../../config/s3.file.system');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'certificates');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Template CRUD
const createTemplate = async (data) => {
  const tpl = await CertificateTemplate.create(data);
  return tpl;
};

const listTemplates = async (filter = {}, options = {}) => {
  const res = await CertificateTemplate.paginate(filter, options);
  return res;
};

const getTemplateById = async (id, schoolId) => {
  const filter = { _id: id };
  if (schoolId) filter.schoolId = schoolId;
  return CertificateTemplate.findOne(filter);
};

const updateTemplate = async (id, updateBody, schoolId) => {
  const tpl = await getTemplateById(id, schoolId);
  if (!tpl) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  }
  Object.assign(tpl, updateBody);
  await tpl.save();
  return tpl;
};

const deleteTemplate = async (id, schoolId) => {
  const tpl = await getTemplateById(id, schoolId);
  if (!tpl) throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
  await tpl.remove();
  return tpl;
};

// Generate certificate from template (Handlebars -> HTML -> PDF via Puppeteer)
async function generateCertificate({ templateId, studentId, generatedBy, certificateType, schoolId, extraData = {} }) {
  const tpl = await getTemplateById(templateId, schoolId);
  if (!tpl) throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');

  const student = await User.findOne({ _id: studentId, schoolId: schoolId || tpl.schoolId }).lean();
  if (!student) throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');

  // Prepare data for template
  const data = {
    student,
    school: extraData.school || {},
    issuedAt: new Date().toLocaleDateString(),
    certificate: {
      serialNumber: extraData.serialNumber || `CERT-${Date.now()}`,
    },
    ...extraData,
  };

  // Compile handlebars template
  const template = handlebars.compile(tpl.html || '');
  const html = template(data);

  // Render PDF via puppeteer (robust: sanitize HTML, increase timeouts, ensure browser closed)
  const fileName = `${certificateType || tpl.type}-${studentId}-${Date.now()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  
  let browser;
  try {
    // Remove script tags and decode HTML entities if template was stored escaped
    let sanitizedBody = (html || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    // Decode common HTML entities that may have been stored escaped
    sanitizedBody = sanitizedBody
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    // Wrap compiled template into a full HTML document to ensure proper parsing
    const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <style>html,body{margin:0;padding:0;}</style>
      </head><body>${sanitizedBody}</body></html>`;

    // In non-production, save the rendered HTML for debugging so we can inspect what puppeteer receives
    try {
      if (process.env.NODE_ENV !== 'production') {
        const debugPath = path.join(UPLOAD_DIR, `debug-${studentId || 'unknown'}-${Date.now()}.html`);
        fs.writeFileSync(debugPath, fullHtml);
        console.log('Wrote debug HTML to', debugPath);
      }
    } catch (e) {
      console.warn('Failed to write debug HTML file', e.message);
    }

    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    // Longer timeouts for complex templates/assets
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    // Ensure CSS/media is applied as on-screen
    try { await page.emulateMediaType('screen'); } catch (e) { /* ignore */ }
    // Set content and wait for network to be idle (assets loaded)
    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 60000 });

    await page.pdf({ path: filePath, format: tpl.meta?.pageSize || 'A4', printBackground: true });
  } catch (err) {
    console.error('Error rendering certificate to PDF:', err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to render certificate PDF: ${err.message}`);
  } finally {
    try { if (browser) await browser.close(); } catch (e) { console.error('Failed to close browser', e); }
  }

  // Save metadata (upsert). Handle possible duplicate-key race conditions gracefully.
  let generated;
  try {
    generated = await GeneratedCertificate.findOneAndUpdate(
      { studentId, certificateType },
      {
        templateId: tpl._id,
        certificateType: certificateType || tpl.type,
        studentId,
        schoolId: tpl.schoolId,
        filePath,
        fileName,
        generatedBy,
        generatedAt: new Date(),
        status: 'generated',
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Handle duplicate key error which can occur during concurrent upserts
    if (err && err.code === 11000) {
      console.warn('Duplicate key error when saving generated certificate, fetching existing record', err.message);
      // Try to fetch the existing document and return it so caller can proceed to download
      const existing = await GeneratedCertificate.findOne({ studentId, certificateType });
      if (existing) return existing;
      // If for some reason it still doesn't exist, rethrow a conflict ApiError
      throw new ApiError(httpStatus.CONFLICT, 'Certificate already exists for this student and type');
    }

    // Re-throw other errors as internal server error
    console.error('Error saving generated certificate metadata:', err);
    throw err;
  }

  return generated;
}

// Render arbitrary HTML to PDF buffer (used for preview)
async function renderHtmlToPdfBuffer(html, options = {}) {
  let browser;
  try {
    const sanitizedHtml = (html || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(options.timeout || 60000);
    page.setDefaultTimeout(options.timeout || 60000);
    try { await page.setJavaScriptEnabled(false); } catch (e) { /* ignore */ }
    await page.setContent(sanitizedHtml, { waitUntil: 'networkidle0', timeout: options.timeout || 60000 });
    const pdfBuffer = await page.pdf({ format: options.format || 'A4', printBackground: true });
    return pdfBuffer;
  } catch (err) {
    console.error('Error rendering HTML to PDF buffer:', err);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to render preview PDF: ${err.message}`);
  } finally {
    try { if (browser) await browser.close(); } catch (e) { console.error('Failed to close browser', e); }
  }
}

// Student certificate upload/update/delete (S3-backed via multer-s3 middleware)
const uploadCertificate = async (studentId, req, adminUser) => {
  const schoolId = adminUser.role !== 'rootUser' ? adminUser.schoolId : undefined;
  const filter = { _id: studentId };
  if (schoolId) filter.schoolId = schoolId;

  const student = await User.findOne(filter).lean();
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  if (student.certificate && student.certificate.url) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Student already has a certificate. Use the update route to replace it.');
  }

  if (!req.files || !req.files.certificateImage || !req.files.certificateImage[0]) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Certificate image is required.');
  }

  const certificateFile = req.files.certificateImage[0];
  const certificateUrl = certificateFile.location || certificateFile.path; // multer-s3 uses .location, local uses .path

  // Use a direct update to avoid running document validation hooks that may fail
  const updated = await User.findByIdAndUpdate(
    studentId,
    {
      $set: {
        certificate: {
          url: certificateUrl,
          uploadedAt: new Date(),
          uploadedBy: adminUser._id,
        },
      },
    },
    { new: true, runValidators: false }
  ).lean();

  return updated;
};

const updateCertificate = async (studentId, req, adminUser) => {
  const schoolId = adminUser.role !== 'rootUser' ? adminUser.schoolId : undefined;
  const filter = { _id: studentId };
  if (schoolId) filter.schoolId = schoolId;

  const student = await User.findOne(filter).lean();
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  if (!student.certificate || !student.certificate.url) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No certificate found to update. Use the create route to upload a new one.');
  }

  // Delete the old certificate from S3 if applicable
  const oldCertificateUrl = student.certificate.url;
  try {
    if (oldCertificateUrl && oldCertificateUrl.startsWith('http')) {
      const url = new URL(oldCertificateUrl);
      const s3Key = url.pathname.substring(1); // Remove leading '/'
      const s3Util = new S3Util(s3Key);
      await s3Util.deleteFromS3();
    }
  } catch (error) {
    console.error(`Failed to delete old certificate from S3: ${oldCertificateUrl}`, error);
  }

  if (!req.files || !req.files.certificateImage || !req.files.certificateImage[0]) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Certificate image is required for update.');
  }

  const newCertificateFile = req.files.certificateImage[0];
  const newCertificateUrl = newCertificateFile.location || newCertificateFile.path;

  const updated = await User.findByIdAndUpdate(
    studentId,
    {
      $set: {
        certificate: {
          url: newCertificateUrl,
          uploadedAt: new Date(),
          uploadedBy: adminUser._id,
        },
      },
    },
    { new: true, runValidators: false }
  ).lean();

  return updated;
};

const deleteCertificate = async (studentId, schoolId) => {
  const filter = { _id: studentId };
  if (schoolId) filter.schoolId = schoolId;

  const student = await User.findOne(filter).lean();
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  if (!student.certificate || !student.certificate.url) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No certificate found to delete.');
  }

  // Delete from S3 if applicable
  const certificateUrl = student.certificate.url;
  try {
    if (certificateUrl && certificateUrl.startsWith('http')) {
      const url = new URL(certificateUrl);
      const s3Key = url.pathname.substring(1); // Remove leading '/'
      const s3Util = new S3Util(s3Key);
      await s3Util.deleteFromS3();
    }
  } catch (error) {
    console.error(`Failed to delete certificate from S3: ${certificateUrl}`, error);
  }

  // Remove certificate using an atomic update to avoid running validation hooks
  await User.updateOne({ _id: studentId }, { $unset: { certificate: '' } });
};

module.exports = {
  createTemplate,
  listTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  generateCertificate,
  uploadCertificate,
  updateCertificate,
  deleteCertificate,
  renderHtmlToPdfBuffer,
};
