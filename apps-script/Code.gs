/**
 * ETS Investments — Advisory Practice Intake
 * Backend for the questionnaire in this repository.
 *
 * This is a Google Apps Script bound to a Google Sheet. It stores every
 * answer in that Sheet and serves them back to two callers:
 *
 *   POST  {sid, status, answers, headers, values}  ->  save / update a response
 *   GET   ?sid=<session id>                        ->  restore that person's draft
 *   GET   ?key=<ADMIN_KEY>                         ->  every response, for the
 *                                                      "Practice access" screen
 *
 * Setup lives in README.md. Two things to change before deploying:
 * ADMIN_KEY, and NOTIFY_EMAIL if you want an email on each submission.
 */

// ============================================================
// SETTINGS
// ============================================================

/** Passcode typed into the "Practice access" prompt on the form.
 *  Make it long and random. It is never sent to the client's browser —
 *  it only exists here and in your head. */
var ADMIN_KEY = 'change-this-key';

/** Optional. Set to your email to get a note when a form is submitted.
 *  Leave as '' for no email. */
var NOTIFY_EMAIL = '';

/** Sheet that humans read. */
var SHEET_RESPONSES = 'Responses';
/** Sheet holding the exact answer structure. Hidden; do not edit by hand. */
var SHEET_DATA = '_Data';

/** Fixed columns that come before the question columns. */
var META = ['Session ID', 'First seen', 'Last updated', 'Status'];

/** Guard rails. */
var MAX_JSON_CHARS = 45000;   // a Sheets cell holds 50,000
var MAX_SESSIONS = 500;       // refuse brand new sessions past this

// ============================================================
// ENTRY POINTS
// ============================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json_({ ok: false, error: 'empty body' });
    }
    var body = JSON.parse(e.postData.contents);

    var sid = String(body.sid || '').trim();
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(sid)) {
      return json_({ ok: false, error: 'bad sid' });
    }

    var answers = (body.answers && typeof body.answers === 'object') ? body.answers : {};
    var blob = JSON.stringify(answers);
    if (blob.length > MAX_JSON_CHARS) {
      return json_({ ok: false, error: 'answers too large' });
    }

    var status = (String(body.status || '') === 'final') ? 'SUBMITTED' : 'DRAFT';
    var headers = Array.isArray(body.headers) ? body.headers.map(String) : [];
    var values = Array.isArray(body.values) ? body.values.map(function (v) {
      return v == null ? '' : String(v);
    }) : [];

    var now = new Date();
    var wasSubmitted = writeData_(sid, now, status, blob);
    writeReadable_(sid, now, status, headers, values);

    if (NOTIFY_EMAIL && status === 'SUBMITTED' && !wasSubmitted) {
      notify_(sid, now);
    }
    return json_({ ok: true, status: status });

  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};

    if (p.key) {
      if (String(p.key) !== ADMIN_KEY) {
        return json_({ ok: false, error: 'unauthorized' });
      }
      return json_({ ok: true, records: allRecords_() });
    }

    if (p.sid) {
      var row = findData_(String(p.sid));
      if (!row) return json_({ ok: true, answers: null, status: null });
      return json_({ ok: true, answers: parseJson_(row.blob), status: row.status });
    }

    // No parameters: a health check that reveals nothing.
    return json_({ ok: true, ready: true });

  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

// ============================================================
// STORAGE — exact structure (hidden sheet, source of truth)
// ============================================================

/** Upserts the session row. Returns true if it was ALREADY submitted. */
function writeData_(sid, now, status, blob) {
  var sh = sheet_(SHEET_DATA, ['Session ID', 'First seen', 'Last updated', 'Status', 'Answers JSON']);
  var last = sh.getLastRow();
  var ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
  var rowIdx = -1;
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === sid) { rowIdx = i + 2; break; }
  }

  if (rowIdx === -1) {
    if (ids.length >= MAX_SESSIONS) throw new Error('session limit reached');
    sh.appendRow([sid, iso_(now), iso_(now), status, blob]);
    return false;
  }

  var prev = sh.getRange(rowIdx, 4).getValue();
  sh.getRange(rowIdx, 3, 1, 3).setValues([[iso_(now), status, blob]]);
  return String(prev) === 'SUBMITTED';
}

function findData_(sid) {
  var sh = sheet_(SHEET_DATA, ['Session ID', 'First seen', 'Last updated', 'Status', 'Answers JSON']);
  var last = sh.getLastRow();
  if (last < 2) return null;
  var rows = sh.getRange(2, 1, last - 1, 5).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === sid) {
      return { sid: rows[i][0], first: rows[i][1], ts: rows[i][2], status: String(rows[i][3]), blob: rows[i][4] };
    }
  }
  return null;
}

/** Newest first, the shape the admin screen expects. */
function allRecords_() {
  var sh = sheet_(SHEET_DATA, ['Session ID', 'First seen', 'Last updated', 'Status', 'Answers JSON']);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var rows = sh.getRange(2, 1, last - 1, 5).getValues();
  var out = rows.map(function (r, i) {
    return {
      _row: i,
      sid: String(r[0]),
      ts: isoCell_(r[2]),
      status: String(r[3]),
      answers: parseJson_(r[4])
    };
  });
  // Newest first. Two saves can share a timestamp, so fall back to sheet
  // order, where a later row is the more recently created session.
  out.sort(function (a, b) {
    if (a.ts !== b.ts) return a.ts < b.ts ? 1 : -1;
    return b._row - a._row;
  });
  return out.map(function (r) {
    return { sid: r.sid, ts: r.ts, status: r.status, answers: r.answers };
  });
}

// ============================================================
// STORAGE — human-readable sheet
// ============================================================

/**
 * Upserts one row per session, one column per question. Columns are
 * matched by their header text, and unknown headers are appended, so
 * editing the questionnaire adds columns instead of corrupting old rows.
 */
function writeReadable_(sid, now, status, headers, values) {
  if (!headers.length) return;
  var sh = sheet_(SHEET_RESPONSES, META);

  var width = Math.max(sh.getLastColumn(), META.length);
  var head = sh.getRange(1, 1, 1, width).getValues()[0].map(String);

  var index = {};
  for (var c = 0; c < head.length; c++) if (head[c]) index[head[c]] = c + 1;

  var missing = [];
  for (var h = 0; h < headers.length; h++) {
    if (!index[headers[h]]) { missing.push(headers[h]); index[headers[h]] = width + missing.length; }
  }
  if (missing.length) {
    sh.getRange(1, width + 1, 1, missing.length).setValues([missing]);
    sh.setFrozenRows(1);
    width += missing.length;
  }

  var last = sh.getLastRow();
  var ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
  var rowIdx = -1;
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === sid) { rowIdx = i + 2; break; }
  }

  var row = new Array(width).fill('');
  if (rowIdx === -1) {
    rowIdx = last + 1;
    row[1] = iso_(now);            // First seen
  } else {
    row = sh.getRange(rowIdx, 1, 1, width).getValues()[0];
  }
  row[0] = sid;
  if (!row[1]) row[1] = iso_(now);
  row[2] = iso_(now);              // Last updated
  row[3] = status;
  for (var k = 0; k < headers.length; k++) {
    row[index[headers[k]] - 1] = values[k] == null ? '' : values[k];
  }
  sh.getRange(rowIdx, 1, 1, width).setValues([row]);
}

// ============================================================
// HELPERS
// ============================================================

function sheet_(name, headerRow) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    sh.setFrozenRows(1);
    if (name === SHEET_DATA) sh.hideSheet();
  }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function parseJson_(v) {
  if (!v) return {};
  try { return JSON.parse(String(v)); } catch (err) { return {}; }
}

/** ISO 8601 with milliseconds, so the browser can hand it straight to
 *  new Date() and two saves in the same second still order correctly. */
function iso_(d) { return Utilities.formatDate(d, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"); }

/** A cell may come back as a Date or as the string we wrote. */
function isoCell_(v) {
  if (v instanceof Date) return iso_(v);
  var s = String(v || '');
  return s || iso_(new Date(0));
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function notify_(sid, now) {
  try {
    var url = SpreadsheetApp.getActive().getUrl();
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'Intake submitted — ETS Investments',
      body: 'A questionnaire was submitted at ' + iso_(now) + '.\n\n' +
            'Session: ' + sid + '\n' +
            'Sheet: ' + url + '\n\n' +
            'You can also read it in the form itself via "Practice access".'
    });
  } catch (err) {
    // Never let a mail failure fail the save.
  }
}

// ============================================================
// RUN ONCE FROM THE EDITOR
// ============================================================

/**
 * Creates both sheets and triggers the permission prompt, so the first
 * real submission is not the thing that discovers a missing scope.
 */
function setup() {
  sheet_(SHEET_RESPONSES, META);
  sheet_(SHEET_DATA, ['Session ID', 'First seen', 'Last updated', 'Status', 'Answers JSON']);
  if (ADMIN_KEY === 'change-this-key') {
    throw new Error('Change ADMIN_KEY at the top of this file before deploying.');
  }
  Logger.log('Sheets ready. Now: Deploy > New deployment > Web app.');
}

/** Sanity check you can run from the editor after deploying. */
function selfTest() {
  var sid = 'selftest' + Date.now();
  var post = doPost({ postData: { contents: JSON.stringify({
    sid: sid, status: 'draft',
    answers: { '1.1': '12', '1.3': ['a', 'b'], '1.6': { 'Mutual funds': '60' } },
    headers: ['1.1 How many clients?', '1.3 Arrangement', '1.6 Split'],
    values: ['12', 'a | b', 'Mutual funds: 60%']
  }) } });
  Logger.log('POST -> ' + post.getContent());

  var get = doGet({ parameter: { sid: sid } });
  Logger.log('GET  -> ' + get.getContent());

  var admin = doGet({ parameter: { key: ADMIN_KEY } });
  Logger.log('ADMIN records -> ' + JSON.parse(admin.getContent()).records.length);
  Logger.log('Delete the selftest rows from both sheets when you are done.');
}
