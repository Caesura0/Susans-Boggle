const fs = require('fs').promises;
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.resolve(projectRoot, 'dist');

async function copyDir(srcDir, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function build() {
  await fs.rm(distRoot, { recursive: true, force: true });
  await fs.mkdir(distRoot, { recursive: true });

  const filesToCopy = ['index.html', 'dictionary.txt', 'TestBoard.txt'];
  const dirsToCopy = ['js', 'style', 'example'];

  for (const file of filesToCopy) {
    await fs.copyFile(path.join(projectRoot, file), path.join(distRoot, file));
  }

  for (const dir of dirsToCopy) {
    const srcDir = path.join(projectRoot, dir);
    const destDir = path.join(distRoot, dir);
    try {
      await copyDir(srcDir, destDir);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  console.log('Standalone build generated at dist/');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
