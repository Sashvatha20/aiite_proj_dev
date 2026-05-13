// backend/src/services/sheetSyncHelper.js
const { sheets, spreadsheetId } = require('./googleSheets');

function normalizeLastColumn(lastColumn = 'A') {
  const value = String(lastColumn || 'A').trim();
  return value.includes(':') ? value.split(':').pop() : value;
}

function quoteSheetName(sheetName) {
  return `'${String(sheetName).replace(/'/g, "''")}'`;
}

function normalizeName(name = '') {
  return String(name).toLowerCase().replace(/[\s_]+/g, '');
}

async function getExactSheetTitle(sheetName) {
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });

  const titles = (res.data.sheets || [])
    .map((s) => s.properties?.title)
    .filter(Boolean);

  const directMatch = titles.find((t) => t === sheetName);
  if (directMatch) return directMatch;

  const normalizedTarget = normalizeName(sheetName);
  const fuzzyMatch = titles.find((t) => normalizeName(t) === normalizedTarget);
  if (fuzzyMatch) return fuzzyMatch;

  throw new Error(
    `Google Sheet tab not found for "${sheetName}". Available tabs: ${titles.join(', ')}`
  );
}

function buildRange(exactSheetTitle, lastColumn = 'A') {
  const endColumn = normalizeLastColumn(lastColumn);
  return `${quoteSheetName(exactSheetTitle)}!A2:${endColumn}`;
}

async function replaceSheetData(sheetName, rows = [], lastColumn = 'A') {
  const exactSheetTitle = await getExactSheetTitle(sheetName);
  const clearRange = buildRange(exactSheetTitle, lastColumn);

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: clearRange,
  });

  if (rows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${quoteSheetName(exactSheetTitle)}!A2`,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    });
  }

  return {
    success: true,
    sheet: exactSheetTitle,
    count: rows.length,
  };
}

module.exports = { replaceSheetData, getExactSheetTitle };