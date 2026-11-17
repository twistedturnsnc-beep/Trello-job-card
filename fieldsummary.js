// Crew summary written into the card description, so field crews see it in the Trello phone app
// (the phone app does not show Power-Up sections). Office-only details stay in the Job Card.
// Candice, 11/17: what shows depends on the stage; no emoji; no paint label.
// Trial: only the cards listed here use it. Every other card keeps the old behavior.
var FIELD_DESC_CARDS = ['6afb947712d2dfb6ff319da0']; // TEST CARD | 123 Test Card Ln
var FS_SCOPING = '6ad41787807d5a5ea54c351f';
var FS_IN_PROGRESS = '6ad4178d04d73fb79ebe8a2c';

function fsDate(d) {
var x = new Date(d);
if (isNaN(x)) return '';
return ('0' + (x.getUTCMonth() + 1)).slice(-2) + '/' + ('0' + x.getUTCDate()).slice(-2) + '/' + x.getUTCFullYear();
}
function fsVal(v) { return v && !/^needed$/i.test(String(v)) ? String(v) : ''; }
function fsLink(url, text) { return /^https?:\/\//i.test(url || '') ? '[' + text + '](' + url + ')' : (url || ''); }
function fsOr(v) { return v || 'Not provided yet'; }

// Every work order number on the card: checklist items, the turn work order, other work orders and change order sheets.
function fsWorkOrders(job, card) {
var seen = {};
function add(s) { (String(s || '').match(/\d{5,}-\d+/g) || []).forEach(function (w) { seen[w] = 1; }); }
(card.checklists || []).forEach(function (cl) { (cl.checkItems || []).forEach(function (it) { add(it.name); }); });
add(job.turnWo); add(job.otherWo);
fsChangeOrders(job, card).forEach(function (c) { add(c.wo); });
return Object.keys(seen).sort(function (a, b) {
var x = a.split('-'), y = b.split('-');
return x[0] === y[0] ? Number(x[1]) - Number(y[1]) : (x[0] < y[0] ? -1 : 1);
}).map(function (w) {
var n = Number(w.split('-')[1]);
return '- #' + w + ' ' + (n === 1 ? 'Access' : n === 2 ? 'Scoping' : n === 3 ? 'Turn' : 'Change order');
});
}
// Same rules as the Job Card's Change Order Sheets box.
function fsChangeOrders(job, card) {
var byWo = {}, removed = job.coRemoved || [];
(card.attachments || []).forEach(function (a) {
var m = (a.name || '').match(/Change Order\b.*\bWO\s*([0-9]+-[0-9]+)/i);
if (m && /^https:\/\/docs\.google\.com\//.test(a.url || '') && removed.indexOf(m[1]) < 0) byWo[m[1]] = { wo: m[1], url: a.url };
});
(job.coSheets || []).forEach(function (c) { if (c && c.wo && c.url) byWo[c.wo] = c; });
return Object.keys(byWo).sort().map(function (k) { return byWo[k]; });
}
function fsAccess(job) {
var parts = [];
if (fsVal(job.igloo)) parts.push('Igloo ' + job.igloo);
if (fsVal(job.lockbox)) parts.push('Lockbox ' + job.lockbox);
return parts.join(', ');
}

// Returns the description text for the card's stage, or null for stages that are not set up yet (left untouched).
function fieldSummary(job, card) {
var out = [], wos = fsWorkOrders(job, card);
if (card.idList === FS_SCOPING) {
out.push('**Client:** ' + fsOr(fsVal(job.client)), '');
out.push('**Inspection scheduled:** ' + fsOr(job.inspection ? fsDate(job.inspection) : ''), '');
out.push('**Inspection link:** ' + fsOr(fsLink(fsVal(job.navLink), 'Open Navigate')));
out.push('**Access code:** ' + fsOr(fsVal(job.navCode)), '');
out.push('**Home access (initial):** ' + fsOr(fsAccess(job)));
out.push('_Changes after the access work order is done._');
} else if (card.idList === FS_IN_PROGRESS) {
out.push('**ECD:** ' + fsOr(job.ecd ? fsDate(job.ecd) : ''), '');
out.push('**Approved scope:** ' + fsOr(fsLink(fsVal(job.scope), 'Open scope sheet')));
if (fsVal(job.portal)) out.push('**Portal:** ' + fsLink(job.portal, 'Open portal'));
out.push('');
out.push('**Home access:** ' + fsOr(fsAccess(job)), '');
out.push('**Navigate AI inspection:** ' + fsOr(fsLink(fsVal(job.navLink), 'Open Navigate')));
out.push('**Navigate AI code:** ' + fsOr(fsVal(job.navCode)));
var cos = fsChangeOrders(job, card);
if (cos.length) {
out.push('');
cos.forEach(function (c) { out.push('**Approved change order ' + c.wo + ':** ' + fsLink(c.url, 'Open CO sheet')); });
}
} else return null;
return out.concat(wos.length ? ['', '**Work orders**'].concat(wos) : []).join('\n');
}
// Writes the summary only when it differs from what is there now. Needs the one-time Allow.
function writeFieldSummary(t, cardId, text, extra) {
if (text === null) return Promise.resolve();
var api = t.getRestApi();
return api.isAuthorized().then(function (ok) {
if (!ok) return;
return api.getToken().then(function (token) {
var url = 'https://api.trello.com/1/cards/' + cardId + '?key=ad3efcf32217b49cb05c06e7399eb447&token=' + token;
return fetch(url + '&fields=desc').then(function (r) { return r.json(); }).then(function (x) {
var body = {};
if ((x.desc || '') !== text) body.desc = text;
Object.keys(extra || {}).forEach(function (k) { body[k] = extra[k]; });
if (!Object.keys(body).length) return;
return fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
});
});
});
}
