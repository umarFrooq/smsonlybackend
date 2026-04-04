const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (e) {
    // ignore - will surface later when writing files
  }
}

const writeBufferToFile = (buffer, filename) => {
  const safeName = filename || `upload-${Date.now()}`;
  const filePath = path.join(UPLOADS_DIR, `${Date.now()}-${safeName}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

const normalizeFile = (element) => {
  if (!element) return null;
  // If multer stored file on disk
  if (element.path) {
    return { filePath: element.path, filename: element.originalname || element.filename };
  }
  // If multer used memoryStorage and provided buffer
  if (element.buffer) {
    const filePath = writeBufferToFile(element.buffer, element.originalname || element.filename);
    return { filePath, filename: element.originalname || element.filename };
  }
  // If element is an array (fields style)
  if (Array.isArray(element) && element.length > 0) {
    return normalizeFile(element[0]);
  }
  return null;
};

module.exports = (input) => {
  if (!input) return null;

  // If array of files
  if (Array.isArray(input)) {
    const storage = [];
    input.forEach((el) => {
      const n = normalizeFile(el);
      if (n) storage.push(n);
    });
    return storage;
  }

  // If object mapping fieldname -> array of files (multer.fields)
  if (typeof input === 'object') {
    // If it's a single file object (req.file)
    if (input.path || input.buffer || input.originalname) {
      return normalizeFile(input);
    }

    // Otherwise attempt to treat it as fields map
    const values = Object.values(input);
    if (values.length > 0 && Array.isArray(values[0])) {
      const storage = [];
      values.forEach((arr) => {
        if (Array.isArray(arr)) {
          arr.forEach((el) => {
            const n = normalizeFile(el);
            if (n) storage.push(n);
          });
        }
      });
      return storage;
    }
  }

  return null;
};
