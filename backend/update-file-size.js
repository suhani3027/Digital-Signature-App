#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

// Read the current .env file if it exists
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  // If .env doesn't exist, copy from env.example
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
    console.log('📄 Created .env file from env.example');
  } else {
    console.error('❌ env.example file not found');
    process.exit(1);
  }
}

// Update the MAX_FILE_SIZE value
const newFileSize = '52428800'; // 50MB in bytes
const updatedContent = envContent.replace(
  /MAX_FILE_SIZE=\d+/,
  `MAX_FILE_SIZE=${newFileSize}`
);

// Write the updated content back to .env
fs.writeFileSync(envPath, updatedContent);

console.log('✅ File size limit updated successfully!');
console.log(`📏 New limit: ${newFileSize} bytes (50MB)`);
console.log('🔄 Please restart your server for changes to take effect'); 