const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const appendRow = async (spreadsheetId, sheetName, values) => {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [values] },
    });
    console.log(`✅ Sheets synced: ${sheetName}`);
  } catch (err) {
    console.error(`❌ Sheets sync failed (${sheetName}):`, err.message);
  }
};

module.exports = { appendRow };