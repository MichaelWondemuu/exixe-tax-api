// shared/swagger/generate-entry.js

import fs from 'fs/promises';
import path from 'path';

export async function generateSwaggerEntry(routeFiles, outputPath) {
  const imports = routeFiles
    .map((file, i) => `import route${i} from '${file.replace(/\\/g, '/')}';`)
    .join('\n');

  const content = `
${imports}

// Fake express app for swagger-autogen
const app = {
  use: () => {},
  get: () => {},
  post: () => {},
  put: () => {},
  delete: () => {},
};

${routeFiles
  .map((_, i) => `if (typeof route${i} === 'function') route${i}(app);`)
  .join('\n')}
`;

  await fs.writeFile(outputPath, content, 'utf8');
}