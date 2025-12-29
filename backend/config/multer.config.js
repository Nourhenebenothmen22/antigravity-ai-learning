import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ==================== CONSTANTS ====================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory paths
const UPLOAD_DIRS = {
  profiles: path.join(process.cwd(), "uploads", "profiles"),
  documents: path.join(process.cwd(), "uploads", "documents")
};

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  profile: 5 * 1024 * 1024,    // 5MB
  document: 50 * 1024 * 1024   // 50MB
};

// Allowed file types
const ALLOWED_IMAGE_TYPES = {
  extensions: /jpeg|jpg|png|gif|webp/,
  mimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp"
  ]
};

const ALLOWED_DOCUMENT_TYPES = {
  extensions: /pdf|doc|docx|txt|ppt|pptx/,
  mimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ]
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Ensure upload directories exist
 */
const ensureUploadDirs = () => {
  Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize directories
ensureUploadDirs();

/**
 * Generate unique filename
 * @param {String} prefix - File prefix (e.g., 'profile', 'doc')
 * @param {String} userId - User ID
 * @param {String} originalName - Original filename
 * @returns {String} Unique filename
 */
const generateUniqueFilename = (prefix, userId, originalName) => {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1e9);
  const ext = path.extname(originalName);
  const sanitizedName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9.-]/g, "_");
  
  return `${prefix}-${userId || "guest"}-${timestamp}-${randomSuffix}-${sanitizedName}${ext}`;
};

/**
 * Validate file type
 * @param {Object} file - Multer file object
 * @param {Object} allowedTypes - Allowed file types configuration
 * @returns {Boolean} Is file valid
 */
const validateFileType = (file, allowedTypes) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidExtension = allowedTypes.extensions.test(ext);
  const isValidMimeType = allowedTypes.mimeTypes.includes(file.mimetype);
  
  return isValidExtension && isValidMimeType;
};

// ==================== STORAGE CONFIGURATIONS ====================

/**
 * Storage configuration for profile images
 */
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRS.profiles);
  },
  filename: (req, file, cb) => {
    try {
      const userId = req.user?.id;
      const filename = generateUniqueFilename("profile", userId, file.originalname);
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  }
});

/**
 * Storage configuration for documents
 */
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRS.documents);
  },
  filename: (req, file, cb) => {
    try {
      const userId = req.user?.id;
      const filename = generateUniqueFilename("doc", userId, file.originalname);
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  }
});

// ==================== FILE FILTERS ====================

/**
 * File filter for images
 */
const imageFileFilter = (req, file, cb) => {
  if (validateFileType(file, ALLOWED_IMAGE_TYPES)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only ${ALLOWED_IMAGE_TYPES.extensions.source} files are allowed.`
      ),
      false
    );
  }
};

/**
 * File filter for documents
 */
const documentFileFilter = (req, file, cb) => {
  if (validateFileType(file, ALLOWED_DOCUMENT_TYPES)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only ${ALLOWED_DOCUMENT_TYPES.extensions.source} files are allowed.`
      ),
      false
    );
  }
};

// ==================== MULTER CONFIGURATIONS ====================

/**
 * Multer configuration for profile images
 */
export const uploadProfileImage = multer({
  storage: profileStorage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.profile,
    files: 1
  },
  fileFilter: imageFileFilter
});

/**
 * Multer configuration for documents
 */
export const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.document,
    files: 1
  },
  fileFilter: documentFileFilter
});

/**
 * Multer configuration for multiple documents
 */
export const uploadMultipleDocuments = multer({
  storage: documentStorage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.document,
    files: 10 // Maximum 10 files
  },
  fileFilter: documentFileFilter
});

// ==================== FILE MANAGEMENT ====================

/**
 * Delete a file from the filesystem
 * @param {String} filePath - Path to the file
 * @returns {Boolean} Success status
 */
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Delete multiple files
 * @param {Array<String>} filePaths - Array of file paths
 * @returns {Object} Result with success count
 */
export const deleteMultipleFiles = (filePaths) => {
  let successCount = 0;
  let failCount = 0;

  filePaths.forEach(filePath => {
    if (deleteFile(filePath)) {
      successCount++;
    } else {
      failCount++;
    }
  });

  return { successCount, failCount, total: filePaths.length };
};

/**
 * Get file size in human-readable format
 * @param {Number} bytes - File size in bytes
 * @returns {String} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Check if file exists
 * @param {String} filePath - Path to the file
 * @returns {Boolean} File exists
 */
export const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};
