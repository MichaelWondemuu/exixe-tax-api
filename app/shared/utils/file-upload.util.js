import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { HttpError } from './http-error.js';
import { env } from '../../config/env.js';

export function createSingleImageUploadMiddleware({
  fieldName = 'image',
  maxFileSizeBytes = 5 * 1024 * 1024,
} = {}) {
  const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSizeBytes },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype?.startsWith('image/')) {
        return cb(
          new HttpError(
            400,
            'INVALID_FILE_TYPE',
            'Only image files are allowed',
          ),
        );
      }
      cb(null, true);
    },
  });

  return (req, res, next) => {
    const isMultipart = (req.headers['content-type'] || '').includes(
      'multipart/form-data',
    );
    if (!isMultipart) return next();
    return imageUpload.single(fieldName)(req, res, (err) => {
      if (err) return next(err);
      return next();
    });
  };
}

export async function saveImageToAssets(file, { subDir, filePrefix }) {
  if (!file?.buffer) return null;

  const assetsDir = path.join(env.filesDir, subDir);
  await fs.mkdir(assetsDir, { recursive: true });

  const ext =
    file.mimetype === 'image/png'
      ? 'png'
      : file.mimetype === 'image/webp'
        ? 'webp'
        : file.mimetype === 'image/gif'
          ? 'gif'
          : 'jpg';
  const fileName = `${filePrefix}-${Date.now()}.${ext}`;
  const targetPath = path.join(assetsDir, fileName);

  await fs.writeFile(targetPath, file.buffer);

  return {
    fileName,
    relativeUrl: `/assets/${subDir}/${fileName}`,
    absolutePath: targetPath,
  };
}
