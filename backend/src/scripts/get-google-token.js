const { google } = require('googleapis');
const readline = require('readline');

// INSTRUCTIONS:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing
// 3. Enable Google Drive API
// 4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
// 5. Choose "Desktop app" as application type
// 6. Download credentials and copy Client ID and Client Secret below

const CLIENT_ID = '27920329424-kku9hqcikrqjq68lfs8dr33l5vds02u2.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // Force to get refresh token
});

console.log('\n=== Google Drive OAuth Setup ===\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Authorize the application');
console.log('3. Copy the authorization code\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n✓ Success! Add these to your .env file:\n');
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\nDon\'t forget to also add GOOGLE_DRIVE_FOLDER_ID!\n');
  } catch (error) {
    console.error('\n✗ Error getting tokens:', error.message);
  }
  
  rl.close();
  process.exit(0);
});
