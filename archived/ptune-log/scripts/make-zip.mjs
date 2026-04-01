import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const zipName = `${pkg.name}-${pkg.version}.zip`;

execSync(`cd dist && zip -r ./${zipName} ptune-log`, { stdio: 'inherit' });
console.log(`Created ${zipName}`);
