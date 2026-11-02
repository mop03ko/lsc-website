// LSC.mn → Google Sheets lead receiver.
//
// Install (once): open the lead spreadsheet → Extensions → Apps Script, paste this file,
// run setup() once, then Deploy → New deployment → Web app (Execute as: Me, Who has access:
// Anyone). Put the Web App URL in LSC_SHEET_URL and the logged secret in LSC_SHEET_SECRET on
// the server. Only the server knows the secret; never put it in HTML.
//
// Rows match the existing sheet layout:
//   A Огноо | B Нэр | C Утас | D Барилгын төрөл | E Нэмэлт мэдээлэл | F ID (dedupe key)
// Script Properties: LSC_SECRET (required), LSC_SPREADSHEET_ID (optional when bound to the
// sheet), LSC_SHEET_GID (optional, default 0 = first tab).

const LSC_TZ = 'Asia/Ulaanbaatar';
const LSC_TYPES = {
  house: 'АОС, Зуслан',
  apartment: 'Нийтийн орон сууц',
  tourist_camp: 'Жуулчны кемп',
  mining_camp: 'Уул уурхайн кемп',
  mobile: 'Зөөврийн сууц',
  extension: 'Барилгын өргөтгөл',
  other: 'Бусад',
};

function lscMoney(n) {
  return '₮' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function lscQuoteText(q) {
  if (!q) return '';
  let pay = 'Бэлэн төлөх';
  if (q.payment === 'loan') {
    pay =
      'Зээл — ' +
      (q.borrower === 'business' ? 'Байгууллага' : 'Иргэн') +
      ', ' +
      q.term +
      ' сар, сарын төлөлт ' +
      lscMoney(q.monthly);
  } else if (q.payment === 'barter') {
    pay = 'Бартер (бэлэн ' + lscMoney(q.barter_cash) + ', бараа ' + lscMoney(q.barter_goods) + ')';
  }
  return (
    'Тооцоолуур: ' +
    q.profile +
    'мм профиль, ' +
    q.area +
    ' м², нийт үнэ ' +
    lscMoney(q.total) +
    '. Төлбөрийн хэлбэр: ' +
    pay +
    '.'
  );
}

// Text cells that start with a formula character are stored as plain text.
function lscSafe(value) {
  const s = String(value == null ? '' : value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function lscRow(lead, formatDate) {
  const p = lead.data || {};
  const details = [lscQuoteText(p.quote), p.message]
    .filter(function (x) {
      return x && String(x).trim();
    })
    .join(' ');
  return [
    formatDate(new Date(lead.created_at * 1000)),
    lscSafe(p.name),
    lscSafe(p.phone),
    LSC_TYPES[p.type] || '',
    lscSafe(details),
    lead.id,
  ];
}

function lscSheet(props) {
  const id = props.getProperty('LSC_SPREADSHEET_ID');
  const book = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  const gid = Number(props.getProperty('LSC_SHEET_GID') || 0);
  return (
    book.getSheets().filter(function (s) {
      return s.getSheetId() === gid;
    })[0] || book.getSheets()[0]
  );
}

// Run once from the editor: stores a random secret and prints it for the server env.
function setup() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('LSC_SECRET');
  if (!secret || secret.length < 32) {
    secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('LSC_SECRET', secret);
  }
  const sheet = lscSheet(props);
  if (!sheet.getRange(1, 6).getValue()) sheet.getRange(1, 6).setValue('ID');
  Logger.log('Sheet: ' + sheet.getName() + '\nLSC_SHEET_SECRET=' + secret);
}

function doPost(e) {
  const reply = function (value) {
    return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
      ContentService.MimeType.JSON,
    );
  };
  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('LSC_SECRET');
  let lock;
  try {
    const body = JSON.parse(e.postData.contents);
    if (
      !secret ||
      secret.length < 32 ||
      typeof body.payload !== 'string' ||
      body.payload.length > 20000 ||
      !Number.isInteger(body.timestamp) ||
      Math.abs(Date.now() / 1000 - body.timestamp) > 300
    )
      return reply({ success: false });
    const expected = Utilities.computeHmacSha256Signature(body.timestamp + '.' + body.payload, secret)
      .map(function (b) {
        return ('0' + ((b + 256) % 256).toString(16)).slice(-2);
      })
      .join('');
    if (typeof body.signature !== 'string' || body.signature.length !== expected.length)
      return reply({ success: false });
    let diff = 0;
    for (let i = 0; i < expected.length; i++)
      diff |= expected.charCodeAt(i) ^ body.signature.charCodeAt(i);
    if (diff) return reply({ success: false });
    const lead = JSON.parse(body.payload);
    if (!/^LSC-[A-F0-9]{16}$/.test(lead.id)) return reply({ success: false });
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    const sheet = lscSheet(props);
    const last = sheet.getLastRow();
    if (
      last > 1 &&
      sheet.getRange(2, 6, last - 1, 1).createTextFinder(lead.id).matchEntireCell(true).findNext()
    )
      return reply({ success: true, id: lead.id });
    sheet.appendRow(
      lscRow(lead, function (d) {
        return Utilities.formatDate(d, LSC_TZ, 'yyyy.MM.dd HH:mm:ss');
      }),
    );
    SpreadsheetApp.flush();
    return reply({ success: true, id: lead.id });
  } catch (error) {
    return reply({ success: false });
  } finally {
    if (lock) lock.releaseLock();
  }
}
