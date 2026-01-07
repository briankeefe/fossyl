import { readdir } from 'fs/promises';
import { join, extname } from 'path';

/**
 * Recursively scans a directory for route files.
 *
 * Only includes TypeScript files (.ts), excluding declaration files (.d.ts).
 * Recursively traverses subdirectories.
 *
 * @param routesPath - The directory path to scan
 * @returns Array of absolute file paths to route files
 */
export async function scanRouteFiles(routesPath: string): Promise<string[]> {
  const files: string[] = [];

  const entries = await readdir(routesPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(routesPath, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await scanRouteFiles(fullPath);
      files.push(...nestedFiles);
    } else if (entry.isFile() && isRouteFile(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Checks if a filename is a valid route file.
 *
 * @param filename - The filename to check
 * @returns True if the file should be processed as a route file
 */
function isRouteFile(filename: string): boolean {
  const ext = extname(filename);
  // Only .ts files, ignore .d.ts
  return ext === '.ts' && !filename.endsWith('.d.ts');
}
