import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Promisify exec to make it work with async/await
const execAsync = promisify(exec);

// Required because __dirname doesn't exist in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '..', 'dist');
const destination = path.join(
  __dirname,
  '..',
  '..',
  'api',
  'wwwroot'
);

async function build() {
  try {
    console.log('Building client...');
    await execAsync('npm run build');
    console.log('✅ Client built successfully!');
  } catch (err) {
    console.error('❌ Client build failed:', err);
    process.exit(1);
  }
}

async function deploy() {
  try {
    console.log('Cleaning destination folder...');
    await fs.emptyDir(destination);

    console.log('Copying files...');
    await fs.copy(source, destination);

    console.log('✅ Deployment successful!');
  } catch (err) {
    console.error('❌ Deployment failed:', err);
    process.exit(1);
  }
}

async function createCommit() {
  try {
    console.log('Creating git commit...');
    // Try to remove tracked files, ignore errors if none exist
    try {
      await execAsync('git rm -r --ignore-unmatch .');
    } catch {
      // Ignore errors - this is expected if no tracked files exist
    }
    await execAsync(`git add "${destination}"`);
    await execAsync('git commit -m "Publish new client version"');
    console.log('✅ Commit created successfully!');
  } catch (err) {
    console.error('❌ Commit creation failed:', err);
    process.exit(1);
  }
}

await build();
await deploy();
// await createCommit();
