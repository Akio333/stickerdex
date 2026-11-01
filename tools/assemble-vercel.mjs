// Combines the separately built apps into one static site for a single Vercel project:
// the shell at the root and each remote under /remotes/<name>/. Remotes stay federated
// at runtime, and same-origin paths mean no CORS setup and working preview deployments.
import { cpSync, rmSync, writeFileSync } from 'node:fs';

const REMOTES = ['home', 'search', 'dossier'];
const OUTPUT = 'dist/vercel';

const browserDir = (app) => `dist/apps/${app}/browser`;

rmSync(OUTPUT, { recursive: true, force: true });
cpSync(browserDir('shell'), OUTPUT, { recursive: true });

for (const remote of REMOTES) {
  cpSync(browserDir(remote), `${OUTPUT}/remotes/${remote}`, {
    recursive: true,
  });
}

const manifest = Object.fromEntries(
  REMOTES.map((remote) => [remote, `/remotes/${remote}/remoteEntry.json`]),
);
writeFileSync(
  `${OUTPUT}/federation.manifest.json`,
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Assembled ${OUTPUT}`);
