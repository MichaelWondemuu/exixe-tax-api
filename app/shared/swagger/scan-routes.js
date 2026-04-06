// shared/swagger/scan-routes.js

import fs from 'fs/promises';
import path from 'path';

export async function scanRouteFiles(dir) {
  let results = [];

  const list = await fs.readdir(dir, { withFileTypes: true });

  for (const file of list) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      results = results.concat(await scanRouteFiles(fullPath));
    } else if (
      file.name.endsWith('.routes.js') ||
      file.name.endsWith('.route.js')
    ) {
      results.push(fullPath);
    }
  }

  return results;
}