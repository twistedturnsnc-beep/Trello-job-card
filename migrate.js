// Shared by the Job Card section: moves a pre-rollout card's description into its Job Card once.
  // Cards whose old description is moved into the Job Card once (rollout on 10/27/2026).
  var MIGRATE = ["6ad4d6b68efd803dde5c7a39", "6ad4d711fcb67f6b38b1d296", "6ad4d7181455f0e01aa7f768", "6ad517226446254fdafbf444", "6ad5172bd18773294d746f17", "6ad51732b52baaa8ea113ac0", "6ad8f410befe8a03c4226cc2", "6ad907ae35581dd02575a947", "6adcd0e1fbce0e58937014af", "6adcd102655154c432b02ab2", "6adcd1718d1197a0238ee294", "6adcd19d7e0d51537cf76965", "6adcd1d571e00631706f3419", "6adcd2159731eb657b379717", "6adcf369248fb7533404f214", "6adcf36ccaf12d0df5762e67", "6adcf36f57286595595a254c", "6adcf372553ef74c58731f3f", "6adcf375eab3de293f5565ab", "6adf7fb0443383079351d229", "6ae09f5ab78ac13b419bc308", "6ae09f5b43d2b7131660d370", "6adcd127f7622050b24dde37", "6ae09f53a93625a3c5f2a4f4", "6adcd0b1b3229d3971e990e0", "6ae09f54dee2d2d030445d06", "6ae09f551253b3757052a892", "6ae09f567d22f9fd9416b579", "6ae09f56e1489f150151dcaa", "6ae09f57dc4d292e711f2c9e", "6ae09f58bfa4db8e745e7ba9", "6ae09f59d7cbc3f7c0f46a71", "6ae09f5a415f48e2498fc4f3", "6adcf37980ee08c06ffa3cf5", "6ae0ed55db17e7347382f94e", "6ad920e5e05eccdc39990b28", "6ad9228750251eb5c148c94c", "6ad4d6f0968432ec8ed1c570", "6ad4d70c34f588fd10d3102a", "6ad8f430200da064556b9454", "6ad4d701ef2ed404584f55ce", "6ad4d70869edf265e8894e03", "6ad8f852009dc62edfd6c59d", "6ad4d6f66af5f6c90fb20039", "6ae09cb72763b817a6557f57"];

  // One-time move of a card's old description into its Job Card. Every line is kept: known labels go to
  // their fields and everything else goes to Notes.
  function descToJob(name, desc) {
    var PH = /^(not provided|needed)\b/i;
    function url(v) { var m = v.match(/\((https?:\/\/[^\s)"]+)/) || v.match(/(https?:\/\/[^\s|)"\]]+)/); return m ? m[1] : v; }
    function date(v) { var m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/); return m ? m[3] + '-' + m[1] + '-' + m[2] + 'T12:00:00.000Z' : ''; }
    var job = {}, notes = [], other = [];
    var fm = (name || '').split('|')[0].trim();
    if (fm === 'Ashley' || fm === 'Tyler') job.fm = fm;
    var lines = (desc || '').replace(/\*\*/g, '').split('\n'), i = 0;
    while (i < lines.length) {
      var raw = lines[i].replace(/‌/g, '').replace(/\s+$/, ''); i++;
      if (!raw.trim()) continue;
      if (raw.indexOf('=== ') === 0 && raw.indexOf('=== End') !== 0) {
        var title = raw.replace(/^=+\s*|\s*=+$/g, ''), body = [];
        while (i < lines.length && lines[i].indexOf('=== End') !== 0) { if (lines[i].trim()) body.push(lines[i].trim()); i++; }
        i++;
        other.push(title + ': ' + body.join('; '));
        continue;
      }
      var m = raw.match(/^([A-Za-z \/&()-]{2,40}?)\s*:\s*(.*)$/);
      if (!m) { notes.push(raw.trim()); continue; }
      var k = m[1].trim(), v = m[2].trim(), K = k.toLowerCase();
      var empty = PH.test(v), rest = v.replace(/^(not provided|needed)\s*/i, '').trim(), dt;
      if (K === 'client') job.client = v;
      else if (K === 'scoping received') { if (!empty) job.received = v; }
      else if (K === 'scheduled scope') { dt = date(v); if (dt) job.scopeDate = dt; else if (rest && rest !== '(check portal)') notes.push('Scheduled scope: ' + v); }
      else if (K === 'scope deadline') { if (!empty && !job.scopeDate) notes.push('Scope deadline: ' + v); }
      else if (K === 'access pdf') { if (!empty) job.accessPdf = url(v); }
      else if (K === 'navigate link' || K === 'navigate ai') {
        if (!empty) {
          job.navLink = url(v.split('|')[0].trim());
          var mc = v.match(/Access code:\s*(\S+)/i); if (mc) job.navCode = mc[1];
        }
      }
      else if (K === 'inspection code') { if (!empty) job.navCode = v.replace(/^Access code:\s*/i, ''); }
      else if (K === 'lockbox') { if (!empty) job.lockbox = v; else if (rest) notes.push('Lockbox: ' + v); }
      else if (K === 'igloo code') { if (!empty) job.igloo = v; }
      else if (K === 'ecd') { dt = date(v); if (dt) job.ecd = dt; if ((!dt || v.length > 10) && !empty) notes.push('ECD: ' + v); }
      else if (K === 'turn work order') job.turnWo = v;
      else if (K === 'turn amount') job.amount = v;
      else if (K === 'scope sheet' || K === 'scope') {
        if (/https?:/.test(v)) job.scope = url(v);
        var after = v.split(')').slice(1).join(')');
        if (/\)\s*\S/.test(v) && after.indexOf('(') >= 0) notes.push('Scope sheet: ' + after.trim());
      }
      else if (K === 'flooring') job.flooring = v;
      else if (K === 'vendor') {
        var s = /^not assigned/i.test(v) ? null : v.match(/\b(Alyssa|Pablo|Karen)\b/);
        if (s) job.sub = s[1];
        if (!s || v !== s[1]) notes.push('Vendor: ' + v);
      }
      else if ({ 'other work orders': '', 'work orders': '', 'work order': '' }.hasOwnProperty(K)) other.push(v);
      else if (K === 'access work order') other.push('Access ' + v);
      else if (K === 'change order') other.push('Change order ' + v);
      else if (K === 'new work order') other.push('New work order ' + v);
      else if (K === 'scoping work order') other.push('Scoping ' + v);
      else if (K === 'note') notes.push(v);
      else if (K.indexOf('note ') === 0) notes.push(k.slice(5) + ': ' + v);
      else if (K === 'turn pdf') { if (!empty) notes.push('Turn PDF: ' + v); }
      else notes.push(k + ': ' + v);
    }
    if (other.length) job.otherWo = other.join('; ');
    if (notes.length) job.notes = notes.join('\n').replace(/\[Open\]\((https?:\/\/[^)\s]+)\)/g, '$1');
    return job;
  }
