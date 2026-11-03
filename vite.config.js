import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// After each build, list every file of the site in precache.json. The service worker downloads
// them all once, so the exam (pictures included) also works without internet.
function precacheList() {
  let outDir = 'dist';
  return {
    name: 'speakup-precache-list',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const files = [];
      const walk = (dir) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push('/' + relative(outDir, full).split('\\').join('/'));
        }
      };
      walk(outDir);
      const list = files.filter((f) => !/^\/(sw\.js|precache\.json|_redirects)$/.test(f) && !f.endsWith('.map'));
      const version = Date.now().toString(36);
      writeFileSync(join(outDir, 'precache.json'), JSON.stringify({ version, files: list }));
    },
  };
}

export default defineConfig({
  plugins: [react(), precacheList()],
});
