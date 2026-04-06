import swaggerAutogen from 'swagger-autogen';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanRouteFiles } from '../shared/swagger/scan-routes.js';
import { generateSwaggerEntry } from '../shared/swagger/generate-entry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');

const outputFile = path.join(appRoot, 'swagger.json');
// Keep temp entry outside appRoot so nodemon (--ext js --watch .) does not restart in a loop.
const tempEntry = path.join(
  os.tmpdir(),
  `e-envoice-swagger-entry-${process.pid}.js`,
);

let cachedSpec = null;

const baseDoc = {
  info: {
    title: 'Cheche Invoice API',
    version: '1.0.0',
    description: 'REST API documentation',
  },
  servers: [{ url: '/v1', description: 'API v1' }],
};

function minimalOpenApiSpec() {
  return {
    openapi: '3.0.0',
    info: baseDoc.info,
    servers: [{ url: '/', description: 'API root' }],
    paths: {},
  };
}

export async function generateSwagger() {
  const autogen = swaggerAutogen({
    openapi: '3.0.0',
    disableLogs: true,
  });

  try {
    // 🔥 1. Scan all route files
    const routeFiles = await scanRouteFiles(appRoot);

    // 🔥 2. Generate temporary entry file
    await generateSwaggerEntry(routeFiles, tempEntry);

    // 🔥 3. Run swagger-autogen on generated entry
    await autogen(outputFile, [tempEntry], baseDoc);

    const raw = await fs.readFile(outputFile, 'utf8');
    cachedSpec = JSON.parse(raw);

    // 🔥 4. Cleanup temp file
    await fs.unlink(tempEntry).catch(() => {});
  } catch (err) {
    console.warn('[swagger] generation failed:', err.message);
    cachedSpec = minimalOpenApiSpec();
  }
}

export function getSwaggerSpec() {
  return cachedSpec;
}