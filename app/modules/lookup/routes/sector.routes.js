import express from 'express';
import multer from 'multer';
import { HttpError } from '../../../shared/utils/http-error.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function parseUploadedSectorsFile(req, res, next) {
  const file = req.file || req.files?.sectors?.[0] || req.files?.file?.[0];
  if (!file?.buffer) return next();
  try {
    const json = JSON.parse(file.buffer.toString('utf8'));
    req.body.payload = Array.isArray(json) ? json : json?.sectors ?? json;
  } catch (err) {
    return next(
      new HttpError(
        400,
        'INVALID_JSON_FILE',
        'Uploaded file must be valid JSON (array of sectors). ' +
          (err.message || ''),
      ),
    );
  }
  next();
}

const uploadFields = upload.fields([
  { name: 'sectors', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);

/**
 * @param {{ sectorController: import('../controllers/sector.controller.js').SectorController }} deps
 */
export const buildSectorRouter = ({ sectorController }) => {
  const router = express.Router();

  router.get('/tree', sectorController.getTree);

  router.post(
    '/upload',
    (req, res, next) => {
      const isMultipart = (req.headers['content-type'] || '').includes(
        'multipart/form-data',
      );
      if (isMultipart) {
        return uploadFields(req, res, (err) => {
          if (err) return next(err);
          parseUploadedSectorsFile(req, res, next);
        });
      }
      next();
    },
    sectorController.upload,
  );

  router.get('/', sectorController.list);
  router.get('/:sectorId/children', sectorController.getChildren);
  router.get('/:id', sectorController.getById);
  router.post('/', sectorController.create);
  router.put('/:id', sectorController.update);

  return router;
};
