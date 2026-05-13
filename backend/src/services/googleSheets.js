const path = require('path');
const { google } = require('googleapis');

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

if (!spreadsheetId) {
  throw new Error('GOOGLE_SPREADSHEET_ID is missing in environment variables');
}

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(process.cwd(), process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({
  version: 'v4',
  auth,
});

module.exports = {
  sheets,
  spreadsheetId,
};