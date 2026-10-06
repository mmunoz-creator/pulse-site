/*! PULSE demo coach v1.1 (from PULSE Portfolio v1w; v1.1 2026-10-06: Why and Your Turn in Practice). Proprietary and confidential. All rights reserved. */
// The guided-demo coach shared by the PULSE apps: a panel in the lower left with the talk track, a pulsing
// outline around the next thing to click, and steps that move on by themselves. No libraries. One global:
// window.PulseDemoCoach. Workflows use the shared format (see pulse-demo-coach-guide.md):
//   { id, version: 'internal' | 'client', title, audience, minutes, blurb, wrap,
//     steps: [ { go, at, target, click | change | route | appear, fill, title, say, doit, wait } ] }
(function () {
  'use strict';
  var S = null; // the running workflow
  var timer = null;
  var opts = {};
  var SAMPLE_PDF = '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n4 0 obj << /Length 70 >> stream\nBT /F1 14 Tf 72 720 Td (Sample document for the PULSE guided demo) Tj ET\nendstream endobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF';

  var CSS = [
    '.pdc-ring{position:fixed;display:none;z-index:2147483000;pointer-events:none;border:3px solid var(--pdc-acc,#a0522d);border-radius:10px;box-shadow:0 0 0 4px var(--pdc-acc-u,rgba(160,82,45,.18));animation:pdcpulse 1.6s ease-in-out infinite;transition:left .2s,top .2s,width .2s,height .2s}',
    '@keyframes pdcpulse{0%,100%{box-shadow:0 0 0 4px var(--pdc-acc-u,rgba(160,82,45,.18))}50%{box-shadow:0 0 0 10px var(--pdc-acc-u,rgba(160,82,45,.08))}}',
    '@media (prefers-reduced-motion:reduce){.pdc-ring{animation:none;transition:none}}',
    '.pdc{position:fixed;left:16px;bottom:16px;width:360px;max-width:calc(100vw - 32px);z-index:2147483001;box-sizing:border-box;background:var(--pdc-bg,#fff);color:var(--pdc-ink,#192a40);border:1px solid var(--pdc-line,#dce5ee);border-top:4px solid var(--pdc-acc,#a0522d);border-radius:12px;box-shadow:0 12px 32px rgba(10,22,40,.18);padding:14px 16px 16px;display:flex;flex-direction:column;gap:10px;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,sans-serif}',
    '.pdc *{box-sizing:border-box}',
    '.pdc-head{display:flex;justify-content:space-between;align-items:center;gap:8px}',
    '.pdc-kick{font-size:10.5px;font-weight:800;letter-spacing:.8px;color:var(--pdc-acc,#a0522d);line-height:1.35}',
    '.pdc-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.pdc h3{margin:0;font-size:17px;line-height:1.3}',
    '.pdc-step{font-size:12px;color:var(--pdc-faint,#6b7d90);font-weight:600}',
    '.pdc-say{margin:0;font-size:14px;line-height:1.5;color:var(--pdc-muted,#52667b)}',
    '.pdc-who{font-size:12px;padding:6px 8px;border-radius:8px;background:var(--pdc-ok-bg,#e9f5f1);color:var(--pdc-ok-ink,#1f6a55)}',
    '.pdc-warn{font-size:13px;padding:6px 8px;border-radius:8px;background:var(--pdc-warn-bg,#fff0df);color:var(--pdc-warn-ink,#7f4a0f)}',
    '.pdc-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:4px}',
    '.pdc-dots{display:flex;gap:4px;flex-wrap:wrap}',
    '.pdc-dots span{width:7px;height:7px;border-radius:50%;background:var(--pdc-line,#dce5ee)}',
    '.pdc-dots span.d{background:var(--pdc-acc-l,#d9a98c)}.pdc-dots span.on{background:var(--pdc-acc,#a0522d)}',
    '.pdc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border-radius:8px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;border:1px solid var(--pdc-line,#dce5ee);background:var(--pdc-bg,#fff);color:var(--pdc-ink,#192a40)}',
    '.pdc-btn.pri{background:var(--pdc-acc,#a0522d);border-color:var(--pdc-acc,#a0522d);color:#fff}',
    '.pdc-btn:disabled{opacity:.5;cursor:default}',
    '.pdc-lnk{border:0;background:none;padding:0;font:inherit;font-size:12px;font-weight:600;color:var(--pdc-acc,#a0522d);text-decoration:underline;cursor:pointer}',
    '.pdc-x{border:0;background:none;font-size:20px;line-height:1;cursor:pointer;color:var(--pdc-muted,#52667b);min-width:28px;min-height:28px}',
    '.pdc-fill{align-self:flex-start;min-height:32px;font-size:12px}',
    '.pdc-lab{font-size:10.5px;font-weight:800;letter-spacing:.8px;color:var(--pdc-faint,#6b7d90);margin-bottom:-6px}',
    '.pdc-turn{border:1px solid var(--pdc-acc-l,#d9a98c);border-left:4px solid var(--pdc-acc,#a0522d);background:var(--pdc-acc-u,rgba(160,82,45,.10));border-radius:8px;padding:8px 10px}',
    '.pdc-turn .pdc-lab{color:var(--pdc-acc,#a0522d);margin-bottom:2px}',
    '.pdc-turn p{margin:0;font-size:14px;line-height:1.45;font-weight:600;color:var(--pdc-ink,#192a40)}',
    '.pdc-wait{margin:-4px 0 0;font-size:12px;color:var(--pdc-faint,#6b7d90)}',
    '@media (max-width:900px){.pdc{width:auto;right:16px}}',
  ].join('\n');

  function esc(v) { return String(v === null || v === undefined ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function step() { return S && S.flow ? S.flow.steps[S.i] : null; }
  function fill(s) { var ids = (S && S.ids) || {}; return String(s || '').replace(/\{(\w+)\}/g, function (m, k) { return ids[k] || ''; }); }
  function hashOf(go) { return '#/' + fill(go); }

  // A selector, or "selector|text": the first visible match whose text includes the text.
  function find(sel) {
    if (!sel) return null;
    sel = fill(sel);
    var bar = sel.indexOf('|'), css = bar >= 0 ? sel.slice(0, bar) : sel, txt = bar >= 0 ? sel.slice(bar + 1).toLowerCase() : '';
    var list;
    try { list = document.querySelectorAll(css); } catch (e) { return null; }
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.closest('.pdc')) continue;
      if (txt && String(el.innerText || el.textContent || el.value || '').toLowerCase().indexOf(txt) < 0) continue;
      var r = el.getBoundingClientRect();
      if (!r.width && !r.height && el.type !== 'radio' && el.type !== 'checkbox' && el.type !== 'file') continue;
      return el;
    }
    return null;
  }
  function matches(el, sel) {
    if (!el || !sel) return false;
    var hit = find(sel);
    if (hit && (hit === el || hit.contains(el))) return true;
    sel = fill(sel);
    try { return sel.indexOf('|') < 0 && !!el.closest(sel); } catch (e) { return false; }
  }
  function at(s) {
    if (!s) return true;
    if (opts.at) return opts.at(s, fill);
    var h = location.hash || '';
    if (s.at) { try { return new RegExp(fill(s.at)).test(h); } catch (e) { return true; } }
    if (s.go) return h === hashOf(s.go);
    return true;
  }
  function go(s, force) {
    if (!s || !s.go) return;
    if (opts.go) { opts.go(fill(s.go), force); return; }
    var h = hashOf(s.go);
    if (location.hash === h) { if (force) window.dispatchEvent(new HashChangeEvent('hashchange')); } else location.hash = h;
  }

  function ensureDom() {
    if (!document.getElementById('pdc-css')) { var st = document.createElement('style'); st.id = 'pdc-css'; st.textContent = CSS; document.head.appendChild(st); }
    var ring = document.querySelector('.pdc-ring'), panel = document.querySelector('.pdc');
    if (!ring) { ring = document.createElement('div'); ring.className = 'pdc-ring'; ring.setAttribute('aria-hidden', 'true'); document.body.appendChild(ring); }
    if (!panel) { panel = document.createElement('aside'); panel.className = 'pdc'; panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', 'Guided demo'); panel.addEventListener('click', onPanel); document.body.appendChild(panel); }
    return { ring: ring, panel: panel };
  }

  function draw() {
    if (!S) return;
    var d = ensureDom(), s = step(), n = S.flow.steps.length, here = at(s);
    var who = S.signedInAs ? '<div class="pdc-who">Signed in as <b>' + esc(S.signedInAs) + '</b>, the demo client. Everything here is what the client sees.</div>' : '';
    var body;
    if (S.done) {
      body = '<h3>That\'s the Workflow</h3><p class="pdc-say">' + esc(S.flow.wrap || 'That\'s the end of this workflow.') + '</p><div class="pdc-row"><button type="button" class="pdc-btn" data-pdc="back">Back</button>' +
        (S.endButtons || [{ key: 'end', label: 'End demo', pri: true }]).map(function (b) { return '<button type="button" class="pdc-btn' + (b.pri ? ' pri' : '') + '" data-pdc="btn" data-k="' + esc(b.key) + '">' + esc(b.label) + '</button>'; }).join('') + '</div>';
    } else {
      // v1.1: Practice shows Why (the talk track) and Your Turn (the instruction). Presenting is unchanged.
      var waits = !!(s.click || s.route || s.appear || s.change);
      var talkHtml = S.practice
        ? ((s.say && !S.hideWhy ? '<div class="pdc-lab">WHY</div><p class="pdc-say">' + esc(s.say) + '</p>' : '') +
          '<div class="pdc-turn"><div class="pdc-lab">YOUR TURN</div><p>' + esc(s.doit || s.title) + '</p></div>' +
          (waits ? '<p class="pdc-wait">Waiting for you to click. Next skips it.</p>' : ''))
        : (S.talk ? '<p class="pdc-say">' + esc(s.say) + '</p>' : '');
      body = '<div class="pdc-step">Step ' + (S.i + 1) + ' of ' + n + '</div><h3>' + esc(s.title) + '</h3>' +
        (here ? '' : '<div class="pdc-warn">You\'re on another page. <button type="button" class="pdc-lnk" data-pdc="home">Bring me back</button></div>') +
        talkHtml +
        (s.fill && here ? '<button type="button" class="pdc-btn pdc-fill" data-pdc="fill"' + (S.filling ? ' disabled' : '') + '>' + (S.filling ? 'Filling in...' : 'Fill it in for me') + '</button>' : '') +
        '<div class="pdc-bar"><div class="pdc-dots" aria-hidden="true">' + S.flow.steps.map(function (x, k) { return '<span class="' + (k < S.i ? 'd' : k === S.i ? 'on' : '') + '"></span>'; }).join('') + '</div>' +
        '<div class="pdc-row"><button type="button" class="pdc-btn" data-pdc="back"' + (S.i ? '' : ' disabled') + ' aria-label="Back (left arrow)">←</button>' +
        '<button type="button" class="pdc-btn' + (s.click || s.route || s.appear || s.change ? '' : ' pri') + '" data-pdc="next" aria-label="Next (right arrow)">' + (S.i === n - 1 ? 'Finish' : 'Next →') + '</button></div></div>';
    }
    d.panel.innerHTML = '<div class="pdc-head"><span class="pdc-kick">' + esc((S.flow.version === 'client' ? 'CLIENT VIEW · ' : 'GUIDED DEMO · ') + S.flow.title.toUpperCase()) + '</span>' +
      '<div class="pdc-row"><button type="button" class="pdc-lnk" data-pdc="' + (S.practice ? 'why' : 'talk') + '">' + (S.practice ? (S.hideWhy ? 'Show Why' : 'Hide Why') : S.talk ? 'Hide talk track' : 'Show talk track') + '</button><button type="button" class="pdc-x" data-pdc="end" aria-label="End demo (Esc)" title="End demo">×</button></div></div>' + who + body;
    S.drawnHere = here;
  }

  function moveTo(i, nav, force, hold) {
    if (!S) return;
    S.i = Math.max(0, Math.min(S.flow.steps.length - 1, i));
    S.scrolled = false; S.filling = false; S.done = false; S.hold = null; S.moves = (S.moves || 0) + 1;
    var s = step();
    if (nav && s.go && (force || !at(s))) go(s, true);
    if (hold) S.hold = location.hash;
    draw(); tick();
    if (opts.onStep) opts.onStep(S.i, s);
  }
  function next() {
    if (!S) return;
    if (S.i >= S.flow.steps.length - 1) { S.done = true; draw(); tick(); return; }
    moveTo(S.i + 1, true);
  }
  // Going back holds the step: it doesn't move on by itself until the page changes or Next is pressed.
  function back() { if (!S) return; if (S.done) { S.done = false; draw(); return; } if (S.i > 0) moveTo(S.i - 1, true, false, true); }

  function end(result) {
    if (!S) return;
    var was = S, done = !!was.done;
    S = null;
    var ring = document.querySelector('.pdc-ring'), panel = document.querySelector('.pdc');
    if (ring) ring.remove();
    if (panel) panel.remove();
    if (was.onEnd) was.onEnd({ done: done, button: result || (done ? 'end' : 'esc'), flowId: was.flow.id });
  }

  async function doFill() {
    var s = step();
    if (!S || !s || !s.fill || S.filling) return;
    var run = S;
    S.filling = true; draw();
    for (var k = 0; k < s.fill.length; k++) {
      var sel = s.fill[k][0], val = fill(s.fill[k][1]), el = null;
      for (var w = 0; w < 30; w++) { el = find(sel); if (el && !el.disabled) break; await new Promise(function (r) { setTimeout(r, 100); }); }
      if (!el) continue;
      if (el.type === 'file') {
        try { var dt = new DataTransfer(); dt.items.add(new File([SAMPLE_PDF], val || 'Sample document (demo).pdf', { type: 'application/pdf' })); el.files = dt.files; } catch (e) {}
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (el.tagName === 'BUTTON' || el.tagName === 'A') {
        el.click();
      } else if (el.type === 'radio' || el.type === 'checkbox') {
        if (el.checked !== (val !== 'off')) el.click();
      } else if (el.tagName === 'SELECT') {
        var opt = null;
        for (var o = 0; o < el.options.length; o++) { var op = el.options[o]; if (val.charAt(0) === '~' ? op.text.toLowerCase().indexOf(val.slice(1).toLowerCase()) >= 0 : op.value === val) { opt = op; break; } }
        if (opt) { el.value = opt.value; el.dispatchEvent(new Event('change', { bubbles: true })); }
      } else {
        el.focus(); el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      await new Promise(function (r) { setTimeout(r, 180); });
    }
    if (S === run) { S.filling = false; draw(); }
  }

  // Every 300 ms: place the outline, and move on when the step is done.
  function tick() {
    var ring = document.querySelector('.pdc-ring'), s = step();
    if (!S || !s || S.done) { if (ring) ring.style.display = 'none'; return; }
    if (!document.querySelector('.pdc')) draw();
    var here = at(s);
    if (location.hash !== S.lastHash) { S.lastHash = location.hash; S.scrolled = false; }
    if (here !== S.drawnHere) { draw(); }
    if (S.hold !== null && S.hold !== undefined && S.hold !== location.hash) S.hold = null;
    var auto = S.hold === null || S.hold === undefined;
    if (auto && here && s.route) { try { if (new RegExp(fill(s.route)).test(location.hash)) { next(); return; } } catch (e) {} }
    if (auto && here && s.appear && find(s.appear)) { next(); return; }
    var el = here && s.target ? find(s.target) : null;
    ring = document.querySelector('.pdc-ring');
    if (!ring) return;
    if (!el) { ring.style.display = 'none'; return; }
    if (!S.scrolled) { S.scrolled = true; var tall = el.getBoundingClientRect().height > window.innerHeight * 0.7; try { el.scrollIntoView({ block: tall ? 'start' : 'center', behavior: 'smooth' }); } catch (e) { el.scrollIntoView(); } }
    var r = el.getBoundingClientRect();
    if (el.type === 'radio' || el.type === 'checkbox') { var lab = el.closest('label'); if (lab) r = lab.getBoundingClientRect(); }
    ring.style.display = 'block';
    ring.style.left = (r.left - 6) + 'px'; ring.style.top = (r.top - 6) + 'px';
    ring.style.width = (r.width + 12) + 'px'; ring.style.height = (r.height + 12) + 'px';
  }

  // Clicks and changes are watched before the page handles them, so a step moves on when its action is done.
  function watch(e) {
    var s = step();
    if (!S || !s || S.done || !e.target.closest || e.target.closest('.pdc')) return;
    var sel = e.type === 'click' ? s.click : s.change;
    if (!sel || !at(s)) return;
    if (sel === true) sel = s.target;
    if (matches(e.target, sel)) { var run = S, mv = S.moves; setTimeout(function () { if (S === run && S.moves === mv) next(); }, s.wait || 250); }
  }

  // Right arrow next, left arrow back, Esc ends. Not while typing, or when the host says its own screen uses the keys.
  function key(e) {
    if (!S || e.altKey || e.ctrlKey || e.metaKey) return;
    var el = document.activeElement, tag = el && el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el && el.isContentEditable)) return;
    if (opts.keysBlocked && opts.keysBlocked(e) && !(el && el.closest && el.closest('.pdc'))) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    else if (e.key === 'Escape' && !(opts.escBlocked && opts.escBlocked())) { end('esc'); }
  }

  function onPanel(e) {
    var b = e.target.closest('[data-pdc]');
    if (!b || !S) return;
    var a = b.getAttribute('data-pdc');
    if (a === 'next') next();
    else if (a === 'back') back();
    else if (a === 'home') go(step(), true);
    else if (a === 'fill') doFill();
    else if (a === 'talk') { S.talk = !S.talk; draw(); }
    else if (a === 'why') { S.hideWhy = !S.hideWhy; draw(); }
    else if (a === 'end') end('esc');
    else if (a === 'btn') end(b.getAttribute('data-k'));
  }

  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;
    document.addEventListener('click', watch, true);
    document.addEventListener('change', watch, true);
    document.addEventListener('keydown', key);
    window.addEventListener('hashchange', function () { if (S) setTimeout(tick, 50); });
    timer = setInterval(function () { if (S) tick(); }, 300);
  }

  window.PulseDemoCoach = {
    version: 1,
    // o: { flow, ids, practice, talk, signedInAs, endButtons: [{ key, label, pri }], onEnd({ done, button, flowId }),
    //      go(path, force), at(step, fill), keysBlocked(event), escBlocked(), onStep(i, step) }
    start: function (o) {
      if (!o || !o.flow || !o.flow.steps || !o.flow.steps.length) throw new Error('PulseDemoCoach.start needs a flow with steps.');
      if (S) end('replaced');
      opts = { go: o.go, at: o.at, keysBlocked: o.keysBlocked, escBlocked: o.escBlocked, onStep: o.onStep };
      S = { flow: o.flow, ids: o.ids || {}, practice: !!o.practice, talk: o.talk !== false, signedInAs: o.signedInAs || '', endButtons: o.endButtons, onEnd: o.onEnd, i: 0 };
      wire();
      moveTo(o.startAt || 0, true, true);
    },
    end: function () { end('host'); },
    next: next,
    back: back,
    running: function () { return !!S; },
    state: function () { return S ? { flowId: S.flow.id, step: S.i, steps: S.flow.steps.length, done: !!S.done, here: at(step()) } : null; },
    redraw: function () { if (S) { draw(); tick(); } },
    // Helpers for hosts and tests: the same matching rules the coach uses.
    find: find,
    fill: fill,
  };
})();
