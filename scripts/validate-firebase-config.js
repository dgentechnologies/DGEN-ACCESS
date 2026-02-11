#!/usr/bin/env node

/**
 * Firebase Configuration Validator
 * 
 * This script validates your Firebase configuration and helps troubleshoot
 * connection issues before running the application.
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 DGEN Access Control - Firebase Configuration Validator\n');
console.log('='.repeat(60));

// Check for .env.local file
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('\n❌ .env.local file not found!\n');
  console.log('📝 To fix this:');
  console.log('   1. Copy .env.example to .env.local');
  console.log('   2. Add your Firebase credentials');
  console.log('   3. See SETUP.md for detailed instructions\n');
  process.exit(1);
}

console.log('✓ .env.local file exists');

// Load environment variables
require('dotenv').config({ path: envPath });

// Check required environment variables
const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_DATABASE_URL'
];

let allValid = true;

console.log('\n📋 Checking environment variables:\n');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const icon = exists ? '✓' : '❌';
  
  if (exists) {
    let displayValue = value;
    
    // Mask sensitive data for display
    if (varName === 'FIREBASE_PRIVATE_KEY') {
      displayValue = value.substring(0, 50) + '...[REDACTED]';
    } else if (varName === 'FIREBASE_CLIENT_EMAIL') {
      displayValue = value;
    }
    
    console.log(`${icon} ${varName}`);
    
    // Additional validation
    if (varName === 'FIREBASE_PRIVATE_KEY' && !value.includes('BEGIN PRIVATE KEY')) {
      console.log(`   ⚠️  Warning: Private key may be malformed`);
      allValid = false;
    }
    
    if (varName === 'FIREBASE_CLIENT_EMAIL' && !value.includes('@')) {
      console.log(`   ⚠️  Warning: Client email format looks incorrect`);
      allValid = false;
    }
    
    if (varName === 'FIREBASE_DATABASE_URL' && !value.startsWith('https://')) {
      console.log(`   ⚠️  Warning: Database URL should start with https://`);
      allValid = false;
    }
  } else {
    console.log(`${icon} ${varName} - MISSING`);
    allValid = false;
  }
});

// Check Firebase rules files
console.log('\n📋 Checking Firebase configuration files:\n');

const configFiles = [
  { file: 'firebase.json', desc: 'Firebase project configuration' },
  { file: 'firestore.rules', desc: 'Firestore security rules' },
  { file: 'database.rules.json', desc: 'Realtime Database security rules' },
  { file: 'firestore.indexes.json', desc: 'Firestore indexes' }
];

configFiles.forEach(({ file, desc }) => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  const icon = exists ? '✓' : '⚠️';
  console.log(`${icon} ${file} - ${desc}`);
});

console.log('\n' + '='.repeat(60));

if (allValid) {
  console.log('\n✅ Configuration looks good!\n');
  console.log('Next steps:');
  console.log('   1. Deploy Firebase rules: firebase deploy --only firestore:rules,database');
  console.log('   2. Run development server: npm run dev');
  console.log('   3. Open http://localhost:3000\n');
  process.exit(0);
} else {
  console.log('\n❌ Configuration has issues!\n');
  console.log('📖 Please check SETUP.md for detailed setup instructions.\n');
  process.exit(1);
}
