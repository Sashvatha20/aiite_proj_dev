const { google } = require('googleapis');
const path = require('path');
const pool = require('../db');

const SHEET_NAME = 'Water_Can_Log';

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString().replace('T', ' ').split('.')[0];
  } catch {
    return '';
  }
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function getSheetsClient() {
  let credentials;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
    const keyPath = path.resolve(process.cwd(), process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE);
    credentials = require(keyPath);
  } else {
    throw new Error('Google service account credentials are missing');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function syncWaterCanSheet() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SPREADSHEET_ID is missing in environment');
  }

  const sheets = await getSheetsClient();

  const result = await pool.query(`
    SELECT
      id AS db_id,
      date,
      no_of_ro_water,
      ro_price,
      no_of_bisleri_water,
      bisleri_price,
      total_water_cans,
      amount,
      paid_or_balance,
      balance,
      created_at,
      updated_at
    FROM water_can_details
    ORDER BY date DESC, created_at DESC
  `);

  const headers = [
    'db_id',
    'date',
    'no_of_ro_water',
    'ro_price',
    'ro_amount',
    'no_of_bisleri_water',
    'bisleri_price',
    'bisleri_amount',
    'total_water_cans',
    'amount',
    'paid_or_balance',
    'balance',
    'created_at',
    'updated_at',
  ];

  const rows = result.rows.map((row) => {
    const roCount = toNumber(row.no_of_ro_water, 0);
    const roPrice = toNumber(row.ro_price, 40);
    const bisCount = toNumber(row.no_of_bisleri_water, 0);
    const bisPrice = toNumber(row.bisleri_price, 120);
    const roAmount = roCount * roPrice;
    const bisAmount = bisCount * bisPrice;

    return [
      row.db_id || '',
      formatDate(row.date),
      roCount,
      roPrice,
      roAmount,
      bisCount,
      bisPrice,
      bisAmount,
      toNumber(row.total_water_cans, roCount + bisCount),
      toNumber(row.amount, roAmount + bisAmount),
      row.paid_or_balance || 'paid',
      toNumber(row.balance, 0),
      formatDateTime(row.created_at),
      formatDateTime(row.updated_at),
    ];
  });

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_NAME}!A:N`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [headers, ...rows],
    },
  });

  return {
    success: true,
    message: 'Water can sheet synced successfully',
    count: rows.length,
    sheet: SHEET_NAME,
  };
}

module.exports = { syncWaterCanSheet };