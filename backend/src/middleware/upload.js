import multer from 'multer';
import path from 'path';

const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 25) * 1024 * 1024;

const ALLOWED_TYPES = {
  'application/pdf'                                                  : 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword'                                               : 'docx',
  'text/plain'                                                       : 'txt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint'                                    : 'pptx',
};

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported. Allowed: PDF, DOCX, TXT, PPTX`), false);
  }
};

export const upload = multer({
  storage : multer.memoryStorage(),
  limits  : { fileSize: MAX_SIZE },
  fileFilter,
});

export const getFileExtension = (mimetype) => ALLOWED_TYPES[mimetype] || 'bin';
