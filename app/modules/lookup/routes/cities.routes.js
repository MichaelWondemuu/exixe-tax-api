import express from 'express';
import multer from 'multer';
import { HttpError } from '../../../shared/utils/http-error.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function parseUploadedFiles(req, res, next) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next();
  }
  try {
    const payload = {};
    if (req.files.region?.[0]?.buffer) {
      payload.regions = JSON.parse(req.files.region[0].buffer.toString('utf8'));
      if (!Array.isArray(payload.regions)) payload.regions = [];
    }
    if (req.files.zone?.[0]?.buffer) {
      payload.zones = JSON.parse(req.files.zone[0].buffer.toString('utf8'));
      if (!Array.isArray(payload.zones)) payload.zones = [];
    }
    if (req.files.woreda?.[0]?.buffer) {
      payload.woredas = JSON.parse(req.files.woreda[0].buffer.toString('utf8'));
      if (!Array.isArray(payload.woredas)) payload.woredas = [];
    }
    req.body.payload = payload;
  } catch (err) {
    return next(
      new HttpError(
        400,
        'INVALID_JSON_FILES',
        'Each file must contain a valid JSON array. ' + (err.message || ''),
      ),
    );
  }
  next();
}

const uploadFields = upload.fields([
  { name: 'region', maxCount: 1 },
  { name: 'zone', maxCount: 1 },
  { name: 'woreda', maxCount: 1 },
]);

/**
 * @param {{ citiesController: import('../controllers/cities.controller.js').CitiesController }} deps
 */
export const buildCitiesRouter = ({ citiesController }) => {
  const router = express.Router();

  router.post(
    '/upload',
    (req, res, next) => {
      const isMultipart = (req.headers['content-type'] || '').includes(
        'multipart/form-data',
      );
      if (isMultipart) {
        return uploadFields(req, res, (err) => {
          if (err) return next(err);
          parseUploadedFiles(req, res, next);
        });
      }
      parseUploadedFiles(req, res, next);
    },
    citiesController.upload,
  );

  router.get('/regions', citiesController.getRegions);
  router.post('/regions', citiesController.createRegion);
  router.get(
    '/regions/:regionId/zones',
    citiesController.getZonesByRegionId,
  );
  router.post('/zones', citiesController.createZone);
  router.get('/zones/:zoneId/woredas', citiesController.getWoredasByZoneId);
  router.post('/woredas', citiesController.createWoreda);

  return router;
};
