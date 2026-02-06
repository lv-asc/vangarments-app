import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.join(__dirname, 'storage');
const testFile = 'images/wardrobe/6a0b5116-8b9c-4ea9-97c5-8cb7b484699a/5855bc71-c558-4364-b7da-f1a2e5f2dd7e_optimized.jpg';
const fullPath = path.join(STORAGE_ROOT, testFile);

console.log('STORAGE_ROOT:', STORAGE_ROOT);
console.log('Test File:', testFile);
console.log('Full Path:', fullPath);
console.log('Exists:', fs.existsSync(fullPath));

// Try with relative path
const relFromSrc = path.join(__dirname, 'src', 'middleware', '../../storage', testFile);
console.log('Path from src/middleware:', relFromSrc);
console.log('Exists (rel):', fs.existsSync(relFromSrc));
