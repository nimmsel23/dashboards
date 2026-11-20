import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
// Hosted checkout keeps assets under dist, the dashboards source branch under source.
const output = existsSync(new URL('source/index.html', root)) ? 'source' : 'dist';

await build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: ['src/firebase-adapter.js'],
  outfile: output + '/firebase-sdk.js',
  bundle: true,
  external: ['./sync-core.mjs'],
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  legalComments: 'eof',
});
