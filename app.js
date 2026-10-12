(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var UI = {"en": {"tonight": "Tonight", "today": "Today", "guest": "guest", "guests": "guests", "send_wa": "Send request on WhatsApp", "send_mail": "Send request by email", "send_call": "Review request", "full": "Table request", "name": "Name", "phone": "Phone", "date": "Date", "time": "Time", "guestsl": "Guests", "occ": "Occasion", "notes": "Notes", "miss": "Please add your name and a phone number.", "wa_toast": "Opening WhatsApp with the request.", "mail_toast": "Opening your email app with the request.", "call_toast": "Request noted. Call to confirm your table.", "call_hint": "Call the restaurant to confirm your table.", "none": "No dishes match your search.", "step": "Step", "of": "of", "nofree": "No free times left today, pick another day."}, "ar": {"tonight": "الليلة", "today": "اليوم", "guest": "ضيف", "guests": "ضيوف", "send_wa": "أرسل الطلب عبر واتساب", "send_mail": "أرسل الطلب بالبريد", "send_call": "راجع الطلب", "full": "طلب حجز طاولة", "name": "الاسم", "phone": "الهاتف", "date": "اليوم", "time": "الوقت", "guestsl": "عدد الضيوف", "occ": "المناسبة", "notes": "ملاحظات", "miss": "من فضلك اكتب اسمك ورقم هاتفك.", "wa_toast": "جارٍ فتح واتساب والطلب جاهز.", "mail_toast": "جارٍ فتح تطبيق البريد والطلب جاهز.", "call_toast": "تم تجهيز الطلب. اتصل لتأكيد الحجز.", "call_hint": "اتصل بالمطعم لتأكيد حجز طاولتك.", "none": "لا توجد أطباق مطابقة لبحثك.", "step": "الخطوة", "of": "من", "nofree": "لا توجد مواعيد متاحة اليوم، اختر يوماً آخر."}};
  var root = document.documentElement, bd = document.body;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function lang() { return root.lang === 'ar' ? 'ar' : 'en'; }
  function T(k) { return UI[lang()][k]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Cairo time
  function cairo() {
    try {
      var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var g = function (t) { return p.filter(function (x) { return x.type === t; })[0].value; };
      var h = +g('hour') % 24, m = +g('minute');
      return { h: h, m: m, t: h * 60 + m, date: g('year') + '-' + g('month') + '-' + g('day') };
    } catch (e) { var d = new Date(); return { h: d.getHours(), m: d.getMinutes(), t: d.getHours() * 60 + d.getMinutes(), date: d.toISOString().slice(0, 10) }; }
  }
  var openM = +bd.getAttribute('data-open'), closeM = +bd.getAttribute('data-close');
  var overnight = closeM < openM;

  // arrival moment: shown once per session on the home page, skippable
  var cur = $('.curtain');
  if (cur) {
    var kill = function () { cur.classList.add('done'); };
    if (root.classList.contains('arrive')) {
      setTimeout(kill, 1300); cur.addEventListener('click', kill);
      document.addEventListener('keydown', kill, { once: true });
    } else kill();
  }

  // open or closed badge (hours come from data-* on <body>, minutes after midnight)
  var stEls = $$('.js-status');
  function paintStatus() {
    if (!stEls.length || !bd.getAttribute('data-open')) return;
    var c = cairo(), t = c.t;
    var open = openM < closeM ? (t >= openM && t < closeM) : (t >= openM || t < closeM);
    var ar = lang() === 'ar';
    var txt = open ? ((ar && bd.getAttribute('data-open-text-ar')) || bd.getAttribute('data-open-text')) : ((ar && bd.getAttribute('data-closed-text-ar')) || bd.getAttribute('data-closed-text'));
    stEls.forEach(function (s) { s.textContent = txt; s.classList.toggle('open', open); });
  }

  // toast
  var toast = $('.toast'), tt;
  function say(msg) {
    if (!toast || !msg) return;
    toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt);
    tt = setTimeout(function () { toast.classList.remove('show'); }, 2800);
  }

  // drawer
  var burger = $('.burger'), mnav = $('#mnav');
  function setNav(o) {
    if (!burger || !mnav) return;
    mnav.classList.toggle('open', o);
    burger.setAttribute('aria-expanded', String(o));
    burger.setAttribute('aria-label', lang() === 'ar' ? (o ? 'إغلاق القائمة' : 'فتح القائمة') : (o ? 'Close menu' : 'Open menu'));
    document.body.style.overflow = o ? 'hidden' : '';
  }
  if (burger) {
    burger.addEventListener('click', function () { setNav(!mnav.classList.contains('open')); });
    $$('#mnav a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
  }

  // ---- language: English and Arabic (RTL). Elements with data-ar swap their text; the choice is remembered.
  function applyLang(l, persist) {
    root.lang = l; root.dir = l === 'ar' ? 'rtl' : 'ltr';
    $$('[data-ar]').forEach(function (el) {
      if (el.classList.contains('js-status')) return;
      if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.textContent);
      el.textContent = l === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
    });
    $$('[data-ph-en]').forEach(function (el) { el.placeholder = el.getAttribute('data-ph-' + l); });
    $$('.js-lang').forEach(function (b) { b.setAttribute('aria-label', l === 'ar' ? 'English' : 'العربية'); });
    if (persist) { try { localStorage.setItem('nx-lang', l); } catch (e) {} }
    setNav(mnav ? mnav.classList.contains('open') : false);
    paintStatus(); buildFlow(); filterMenu(); updateCount();
  }
  $$('.js-lang').forEach(function (b) { b.addEventListener('click', function () { applyLang(lang() === 'ar' ? 'en' : 'ar', true); }); });

  // ---- reservation: day and guests, then time, then details; ends in a prefilled WhatsApp, email or call
  var flow = $('.js-rflow'), R = { date: null, time: null, guests: 2 };
  function baseDate() {
    var c = cairo(), p = c.date.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    if (overnight && c.t < closeM) d.setUTCDate(d.getUTCDate() - 1);
    return d;
  }
  function nowSvc() { var c = cairo(); return (overnight && c.t < closeM) ? c.t + 1440 : c.t; }
  function dkey(d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function dfmt(d, o) { o.timeZone = 'UTC'; return new Intl.DateTimeFormat(lang() === 'ar' ? 'ar-EG' : 'en-GB', o).format(d); }
  function tlabel(m) {
    var h = Math.floor(m / 60) % 24, mi = m % 60;
    if (lang() === 'ar') return new Date(2000, 0, 1, h, mi).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
    return ((h % 12) || 12) + ':' + pad(mi) + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function nf(n) { return lang() === 'ar' ? n.toLocaleString('ar-EG') : String(n); }
  function guestText(n) { return nf(n) + ' ' + (n === 1 ? T('guest') : T('guests')); }
  function dateFromKey(k) { var p = k.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  var FROM, TO, MODE, panes = [];
  function slots() { var a = []; for (var m = FROM; m <= TO; m += 30) a.push(m); return a; }
  function isToday() { return R.date === dkey(baseDate()); }
  function freeToday() { var n = nowSvc(); return slots().some(function (m) { return m >= n + 30; }); }
  function setPressed(wrap, test) {
    $$('button', wrap).forEach(function (b) { b.setAttribute('aria-pressed', String(test(b))); });
  }
  function buildDays() {
    var wrap = $('.js-days', flow), base = baseDate(); wrap.innerHTML = '';
    if (!R.date) R.date = dkey(new Date(base.getTime() + (freeToday() ? 0 : 86400000)));
    for (var i = 0; i < 7; i++) {
      var d = new Date(base.getTime() + i * 86400000), k = dkey(d), b = document.createElement('button');
      b.type = 'button'; b.className = 'dchip'; b.setAttribute('data-d', k); b.setAttribute('aria-pressed', String(R.date === k));
      b.innerHTML = '<b>' + dfmt(d, { weekday: 'short' }) + '</b><span>' + dfmt(d, { day: 'numeric', month: 'short' }) + '</span>' + (i === 0 ? '<small>' + T('tonight') + '</small>' : '');
      b.addEventListener('click', function () { R.date = this.getAttribute('data-d'); setPressed(wrap, function (x) { return x.getAttribute('data-d') === R.date; }); });
      wrap.appendChild(b);
    }
  }
  function buildTimes() {
    var wrap = $('.js-times', flow), today = isToday(), n = nowSvc(), free = 0; wrap.innerHTML = '';
    slots().forEach(function (m) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tchip'; b.setAttribute('data-m', m);
      b.textContent = tlabel(m); b.disabled = today && m < n + 30; if (!b.disabled) free++;
      if (b.disabled && R.time === m) R.time = null;
      b.setAttribute('aria-pressed', String(R.time === m));
      b.addEventListener('click', function () { R.time = +this.getAttribute('data-m'); setPressed(wrap, function (x) { return +x.getAttribute('data-m') === R.time; }); $('.js-to3', flow).disabled = false; });
      wrap.appendChild(b);
    });
    var nf = $('.js-nofree', flow); nf.hidden = free > 0; nf.textContent = T('nofree');
    $('.js-to3', flow).disabled = R.time == null;
  }
  function summary() {
    var d = dateFromKey(R.date);
    var sep = lang() === 'ar' ? '، ' : ', ';
    return dfmt(d, { weekday: 'long', day: 'numeric', month: 'short' }) + sep + tlabel(R.time) + sep + guestText(R.guests);
  }
  function go(n) {
    panes.forEach(function (p, i) { p.hidden = i !== n - 1; });
    $('.js-stepno', flow).textContent = n;
    if (n === 2) buildTimes();
    if (n === 3) $('.js-sum', flow).textContent = summary();
    var f = $('button, input', panes[n - 1]); if (f && n > 1) f.focus({ preventScroll: true });
  }
  var callName = '';
  function fillDone() {
    var dn = $('.js-done', flow); if (!dn || dn.hidden) return;
    $('.js-donesum', flow).textContent = summary() + (callName ? ' · ' + callName : '');
    $('.js-donehint', flow).textContent = T('call_hint');
  }
  function buildFlow() {
    if (!flow) return;
    buildDays();
    $('.js-gn', flow).textContent = nf(R.guests);
    $('.js-stepl', flow).textContent = T('step'); $('.js-stepof', flow).textContent = T('of');
    $('.js-send', flow).textContent = T(MODE === 'wa' ? 'send_wa' : MODE === 'mail' ? 'send_mail' : 'send_call');
    if (!panes[1].hidden) buildTimes();
    if (!panes[2].hidden) $('.js-sum', flow).textContent = summary();
    fillDone();
  }
  if (flow) {
    FROM = +flow.getAttribute('data-from'); TO = +flow.getAttribute('data-to'); MODE = flow.getAttribute('data-mode');
    panes = $$('.rpane', flow);
    $('.js-minus', flow).addEventListener('click', function () { R.guests = Math.max(1, R.guests - 1); $('.js-gn', flow).textContent = nf(R.guests); });
    $('.js-plus', flow).addEventListener('click', function () { R.guests = Math.min(12, R.guests + 1); $('.js-gn', flow).textContent = nf(R.guests); });
    $('.js-to2', flow).addEventListener('click', function () { go(2); });
    $('.js-to3', flow).addEventListener('click', function () { if (R.time != null) go(3); });
    $$('.back', flow).forEach(function (b) { b.addEventListener('click', function () { go(+b.closest('.rpane').getAttribute('data-step') - 1); }); });
    $$('.ochip', flow).forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); }); });
    var edit = $('.js-edit', flow);
    if (edit) edit.addEventListener('click', function () { $('.js-done', flow).hidden = true; $('.rstep', flow).hidden = false; go(1); });
    var err = $('#rf-err', flow);
    flow.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = function (id) { return ($('#' + id, flow).value || '').trim(); };
      if (!v('rf-name') || !v('rf-phone')) { err.textContent = T('miss'); err.hidden = false; return; }
      err.hidden = true;
      var occ = $$('.ochip[aria-pressed=true]', flow).map(function (b) { return b.textContent; });
      var d = dateFromKey(R.date), subject = T('full') + ': ' + summary();
      var body = [T('name') + ': ' + v('rf-name'), T('phone') + ': ' + v('rf-phone'),
        T('date') + ': ' + dfmt(d, { weekday: 'long', day: 'numeric', month: 'short' }), T('time') + ': ' + tlabel(R.time), T('guestsl') + ': ' + R.guests];
      if (occ.length) body.push(T('occ') + ': ' + occ.join(', '));
      if (v('rf-notes')) body.push(T('notes') + ': ' + v('rf-notes'));
      body = body.join('\n');
      var a = $('.js-mail', flow), wa = bd.getAttribute('data-wa');
      if (MODE === 'wa') { a.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(subject + '\n' + body); a.target = '_blank'; a.rel = 'noopener'; say(T('wa_toast')); }
      else if (MODE === 'mail') { a.href = 'mailto:' + a.getAttribute('href').replace('mailto:', '').split('?')[0] + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body); say(T('mail_toast')); }
      else {
        var dn = $('.js-done', flow); callName = v('rf-name');
        panes.forEach(function (p) { p.hidden = true; }); $('.rstep', flow).hidden = true; dn.hidden = false; fillDone();
        say(T('call_toast')); var cl = $('a', dn); if (cl) cl.focus({ preventScroll: true });
        return;
      }
      a.click();
    });
  }

  // ---- menu: chips with scrollspy, live search, dish photo lightbox
  var chips = $$('.js-jump a');
  if (chips.length) {
    var secs = chips.map(function (c) { return $(c.getAttribute('href')); });
    var scroller = $('.js-jump .wrap');
    var setOn = function (id) {
      chips.forEach(function (c) {
        var on = c.getAttribute('href') === id;
        c.classList.toggle('on', on);
        if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
      });
    };
    var lock = 0;
    var centre = function (c) {
      if (!scroller) return;
      var r = c.getBoundingClientRect(), s = scroller.getBoundingClientRect();
      scroller.scrollBy({ left: (r.left + r.width / 2) - (s.left + s.width / 2), behavior: 'smooth' });
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () { setOn(c.getAttribute('href')); lock = Date.now() + 1100; centre(c); });
    });
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false;
        if (Date.now() < lock) return;
        var cu = null;
        secs.forEach(function (s, i) { if (s && s.offsetParent !== null && s.getBoundingClientRect().top < 190) cu = chips[i]; });
        if (cu && !cu.classList.contains('on')) { setOn(cu.getAttribute('href')); centre(cu); }
        if (!cu) chips.forEach(function (c) { c.classList.remove('on'); });
      });
    }, { passive: true });
  }

  var q = $('.js-search'), none = $('.js-none');
  function filterMenu() {
    if (!q) return;
    var v = q.value.trim().toLowerCase(), any = false;
    $$('.mi').forEach(function (li) {
      var hay = li.textContent + ' ' + (li.getAttribute('data-n') || '') + ' ' + (li.getAttribute('data-d') || '');
      $$('[data-en]', li).forEach(function (n) { hay += ' ' + n.getAttribute('data-en'); });
      var show = !v || hay.toLowerCase().indexOf(v) > -1;
      li.hidden = !show; if (show) any = true;
    });
    $$('.msec').forEach(function (s) { s.hidden = !!v && !$$('.mi', s).some(function (li) { return !li.hidden; }); });
    $$('.js-jump a').forEach(function (c) { var s = $(c.getAttribute('href')); c.hidden = !!(s && s.hidden); });
    none.hidden = any || !v; none.textContent = T('none');
  }
  if (q) q.addEventListener('input', filterMenu);

  var lb = $('.js-lb');
  if (lb) {
    var lbImg = $('img', lb), lbI = $('figcaption i', lb), lbS = $('figcaption span', lb), lbB = $('figcaption b', lb), opener = null, ty = 0;
    var openLb = function (el) {
      opener = el; lbImg.src = el.getAttribute('data-ph'); lbImg.alt = el.getAttribute('data-n') || '';
      lbI.textContent = el.getAttribute('data-n') || ''; lbS.textContent = el.getAttribute('data-d') || ''; lbB.textContent = el.getAttribute('data-p') || '';
      lb.hidden = false; document.body.style.overflow = 'hidden'; $('.js-lbx', lb).focus();
    };
    var closeLb = function () { if (lb.hidden) return; lb.hidden = true; document.body.style.overflow = ''; if (opener) opener.focus({ preventScroll: true }); };
    $$('[data-ph]').forEach(function (el) {
      el.addEventListener('click', function () { openLb(el); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(el); } });
    });
    $('.js-lbx', lb).addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
    lb.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (e.changedTouches[0].clientY - ty > 80) closeLb(); }, { passive: true });
  }

  // header turns solid once you scroll past the opening photo
  var over = $('.hdr--over');
  if (over) {
    var solid = function () { over.classList.toggle('solid', window.scrollY > 40); };
    solid(); window.addEventListener('scroll', solid, { passive: true });
  }

  // reveal on scroll (content is visible by default; the js class on <html> hides it until it enters)
  var rv = $$('.rv');
  if (rv.length) {
    if (!('IntersectionObserver' in window) || still) { rv.forEach(function (n) { n.classList.add('in'); }); }
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      rv.forEach(function (n) { io.observe(n); });
    }
  }

  // slow parallax on photos (a few dozen pixels, clamped)
  var px = $$('[data-px]');
  if (px.length && !still) {
    var pt = false;
    var upd = function () {
      pt = false;
      var vh = window.innerHeight;
      px.forEach(function (im) {
        var box = im.parentNode.getBoundingClientRect();
        if (box.bottom < -200 || box.top > vh + 200) return;
        var p = (box.top + box.height / 2 - vh / 2) / vh;
        p = Math.max(-1, Math.min(1, p));
        im.style.setProperty('--py', (-p * (+im.getAttribute('data-px'))).toFixed(1) + 'px');
      });
    };
    upd();
    window.addEventListener('scroll', function () { if (!pt) { pt = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
  }

  // photo track: previous and next buttons, swipe, counter
  var track = $('.js-track'), cnt = $('.js-count');
  function updateCount() {
    if (!track || !cnt) return;
    var fs = $$('figure', track), f = fs[0]; if (!f) return;
    var i = Math.round(Math.abs(track.scrollLeft) / (f.offsetWidth + 20)) + 1;
    cnt.textContent = Math.min(i, fs.length) + ' / ' + fs.length;
  }
  if (track) {
    var step = function (d) {
      var f = track.querySelector('figure'), dir = root.dir === 'rtl' ? -1 : 1;
      track.scrollBy({ left: d * dir * (f ? f.offsetWidth + 20 : 320), behavior: still ? 'auto' : 'smooth' });
    };
    var pv = $('.js-prev'), nx = $('.js-next');
    if (pv) pv.addEventListener('click', function () { step(-1); });
    if (nx) nx.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', function () { requestAnimationFrame(updateCount); }, { passive: true });
  }

  // first paint: remembered language, then the badge
  applyLang(lang(), false);
  paintStatus();
})();
