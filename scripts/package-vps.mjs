import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
const allowed = /^(?:src\/|server\/|shared\/|public\/|scripts\/|tests\/|deployment\/|docs\/spa-deployment\.md$|(?:package(?:-lock)?\.json|index\.html|tsconfig[^/]*\.json|vite(?:\.legacy)?\.config\.(?:ts|js))$)/;
const forbidden = /(?:^|\/)(?:\.env(?:\..*)?|\.git|node_modules|storage|deploy-artifacts)(?:\/|$)|\.local$|\.(?:sql|pem|key|p12|pfx)$/i;
const trackedAndNew = git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean);
const files = [...new Set(trackedAndNew.filter(file => allowed.test(file) && !forbidden.test(file)))].sort();
const temporary = await mkdtemp(join(tmpdir(), 'kindsight-package-'));
try {
  const stage = join(temporary, 'kindsight');
  await mkdir(stage);
  for (const file of files) {
    const source = join(root, file);
    if ((await lstat(source)).isSymbolicLink()) throw new Error(`Symlinks are not allowed: ${file}`);
    await mkdir(dirname(join(stage, file)), { recursive: true });
    await cp(source, join(stage, file));
  }
  await cp(join(root, 'dist'), join(stage, 'dist'), { recursive: true });
  const manifestFiles = [];
  async function inventory(directory, prefix = '') {
    for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = prefix + item.name;
      if (item.isSymbolicLink() || forbidden.test(relative)) throw new Error(`Forbidden package entry: ${relative}`);
      if (item.isDirectory()) await inventory(join(directory, item.name), relative + '/');
      else manifestFiles.push({ path: relative, sha256: createHash('sha256').update(await readFile(join(directory, item.name))).digest('hex') });
    }
  }
  await inventory(stage);
  for (const required of ['dist/index.html', 'server/index.ts', 'shared/react-content.json', 'src/scripts/data/partners.js', 'deployment/vps.env.example', 'package-lock.json']) {
    if (!manifestFiles.some(file => file.path === required)) throw new Error(`Missing package dependency: ${required}`);
  }
  const createdAt = new Date().toISOString();
  await writeFile(join(stage, 'PACKAGE-MANIFEST.json'), JSON.stringify({ createdAt, baseCommit: git(['rev-parse', 'HEAD']).trim(), localChanges: git(['diff', '--name-only']).trim().split('\n').filter(Boolean), untrackedIncluded: files.filter(file => git(['ls-files', '--', file]).trim() === ''), files: manifestFiles }, null, 2) + '\n');
  const output = join(root, 'deploy-artifacts');
  await mkdir(output, { recursive: true });
  const archive = join(output, `kindsight-vps-${createdAt.replace(/[:.]/g, '-')}.zip`);
  execFileSync('zip', ['-q', '-r', archive, 'kindsight'], { cwd: temporary });
  const checksum = createHash('sha256').update(await readFile(archive)).digest('hex');
  await writeFile(archive + '.sha256', `${checksum}  ${archive.split('/').at(-1)}\n`);
  console.log(`Package verified: ${manifestFiles.length} files + manifest\n${archive}\nSHA256: ${checksum}`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
