/* ============================================================
   CleanCleaning
   1. background   2. header   3. tabs + dock
   4. ask row      5. booking flow   6. delivery
   ============================================================ */

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -------- 1. background ------------------------------------ */
(function () {
  // six, edges only, no repeats
  const SET = [
    ["🧼",  5,  9, -8, 9.0, 0.0],
    ["🫧", 91, 15,  7, 11 , 0.8],
    ["🍋",  4, 34,  6, 10 , 1.6],
    ["✨", 93, 41, -7, 12 , 0.4],
    ["🌿",  6, 58, -6, 9.5, 2.2],
    ["💧", 92, 66,  8, 10.5, 1.2],
    ["🧴",  4, 82, -7, 11.5, 0.6],
    ["🧺", 90, 90,  6, 9.8, 1.9]
  ];
  const layer = document.getElementById('field');
  const frag = document.createDocumentFragment();
  SET.forEach(([ch, x, y, r, dur, del]) => {
    const el = document.createElement('span');
    el.textContent = ch;
    el.style.left = x + '%'; el.style.top = y + '%';
    el.style.setProperty('--rot', r + 'deg');
    el.style.setProperty('--dur', dur + 's');
    el.style.setProperty('--del', '-' + del + 's');
    frag.appendChild(el);
  });
  layer.appendChild(frag);

  if (REDUCE || matchMedia('(hover: none)').matches) return;
  let mx = 0, my = 0, tx = 0, ty = 0, running = false;
  const loop = () => {
    mx += (tx - mx) * .06; my += (ty - my) * .06;
    layer.style.transform = `translate3d(${mx.toFixed(2)}px,${my.toFixed(2)}px,0)`;
    if (Math.abs(tx - mx) > .1 || Math.abs(ty - my) > .1) requestAnimationFrame(loop);
    else running = false;
  };
  const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
  addEventListener('mousemove', e => {
    tx = (e.clientX / innerWidth - .5) * -14;
    ty = (e.clientY / innerHeight - .5) * -10;
    kick();
  }, { passive: true });
  addEventListener('mouseleave', () => { tx = 0; ty = 0; kick(); });
})();

/* -------- 2. tabs ------------------------------------------ */
const DEFAULT_TAB = 'info';           // 'book' to open straight on the form
const tabs = [...document.querySelectorAll('.dock-btn')];
const ind = document.getElementById('dockInd');

const mark = document.getElementById('mark');

function setTab(name, focusPanel) {
  tabs.forEach(t => {
    const on = t.dataset.tab === name;
    t.setAttribute('aria-selected', on ? 'true' : 'false');
    const panel = document.getElementById('panel-' + t.dataset.tab);
    panel.hidden = !on;
    if (on) {
      // stagger the entrance: masthead, headline, then the rest
      [...panel.children].forEach((el, i) => el.style.setProperty('--i', i));
      panel.classList.remove('in'); void panel.offsetWidth; panel.classList.add('in');
      if (focusPanel) panel.focus({ preventScroll: true });
    }
  });
  ind.style.transform = name === 'book' ? 'translateX(100%)' : 'translateX(0)';
  document.body.classList.toggle('tab-book', name === 'book');
  scrollTo({ top: 0, behavior: REDUCE ? 'auto' : 'smooth' });
  history.replaceState(null, '', '#' + name);
}
mark.addEventListener('click', e => { e.preventDefault(); setTab('info', false); });
document.querySelectorAll('[data-goto-tab]').forEach(b =>
  b.addEventListener('click', () => setTab(b.dataset.gotoTab, true)));

tabs.forEach(t => t.addEventListener('click', () => setTab(t.dataset.tab, true)));

/* -------- 3. ask row ---------------------------------------
   Everything typed here goes to WhatsApp. To make it an
   assistant later, replace the body of handleAsk().           */
const askInput = document.getElementById('askInput');
function handleAsk(q) {
  q = (q || '').trim();
  if (!q) { askInput.focus(); return; }
  openWhatsApp(`Hola! ${q}`);
  askInput.value = '';
}
document.getElementById('askSend').addEventListener('click', () => handleAsk(askInput.value));
askInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleAsk(askInput.value); });

/* FAQ: animate the close as well as the open */
document.querySelectorAll('.qa').forEach(d => {
  d.querySelector('summary').addEventListener('click', e => {
    if (!d.open || REDUCE) return;
    e.preventDefault();
    const ans = d.querySelector('.ans');
    ans.style.gridTemplateRows = '0fr';
    setTimeout(() => { d.open = false; ans.style.gridTemplateRows = ''; }, 290);
  });
});

/* -------- 4. booking flow ---------------------------------- */
const form = document.getElementById('bookForm');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const sets = [...form.querySelectorAll('fieldset')];
const TITLES = { 1: 'Your clean', 2: 'When & where', 3: 'Almost done', 4: 'All set' };
const ARROW = '<svg class="arr" width="15" height="11" viewBox="0 0 15 11" fill="none"><path d="M9 1L14 5.5L9 10M14 5.5H0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let step = 1;

/* poster / QR source */
(function () {
  const p = new URLSearchParams(location.search);
  document.getElementById('sourceField').value = p.get('src') || p.get('utm_source') || 'direct';
})();

/* day chips */
(function () {
  const wrap = document.getElementById('dayChips');
  const today = new Date();
  for (let i = 1; i <= 3; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    const val = d.toISOString().slice(0, 10);
    const lab = i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' });
    const sub = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    wrap.insertAdjacentHTML('beforeend',
      `<label class="pill"><input type="radio" name="day" value="${val}" ${i === 1 ? 'checked' : ''}><span class="box">${lab}<small>${sub}</small></span></label>`);
  }
  wrap.insertAdjacentHTML('beforeend',
    `<label class="pill"><input type="radio" name="day" value="custom"><span class="box">Later<small>Pick a date</small></span></label>`);
  wrap.addEventListener('change', () => {
    const custom = wrap.querySelector('input[value=custom]').checked;
    document.getElementById('customDateWrap').hidden = !custom;
    if (custom) document.getElementById('date').focus();
  });
  const d = new Date(); d.setDate(d.getDate() + 4);
  document.getElementById('date').min = d.toISOString().slice(0, 10);
})();

const priceEl = document.getElementById('price');
function price() {
  let p = +form.querySelector('input[name=size]:checked').dataset.price
    + +form.querySelector('input[name=service]:checked').dataset.price
    + +form.querySelector('input[name=materials]:checked').dataset.price;
  form.querySelectorAll('input[name=extra]:checked:not(:disabled)').forEach(x => p += +x.dataset.price);
  return p;
}

/* extras already covered by the chosen clean become "included" and inactive */
function syncExtras() {
  const svc = form.querySelector('input[name=service]:checked').value;
  const rolled = [];
  form.querySelectorAll('input[name=extra]').forEach(x => {
    const inc = (x.dataset.included || '').split(',').filter(Boolean);
    const covered = inc.includes(svc);
    x.disabled = covered;
    const priceTag = x.parentElement.querySelector('small');
    priceTag.textContent = covered ? 'included' : '+€' + x.dataset.price;
    if (covered && x.checked) { x.checked = false; }
    if (covered) rolled.push(x.value.toLowerCase());
  });
  const note = document.getElementById('extrasNote');
  if (rolled.length) {
    note.hidden = false;
    note.textContent = 'Already part of your ' + svc.toLowerCase() + ': ' + rolled.join(', ') + '.';
  } else { note.hidden = true; }
}

/* vacuum answer toggles the reassurance line */
function syncEquip() {
  const no = form.querySelector('input[name=equipment][value="No vacuum or mop"]').checked;
  document.getElementById('equipNote').hidden = !no;
}
let priceTimer = null;
function renderPrice() {
  const v = '€' + price();
  const el = priceEl.querySelector('.pv');
  if (el.textContent === v) return;
  if (REDUCE) { el.textContent = v; return; }
  clearTimeout(priceTimer);
  el.classList.remove('enter');
  el.classList.add('out');
  priceTimer = setTimeout(() => {
    el.textContent = v;
    el.classList.remove('out');
    void el.offsetWidth;
    el.classList.add('enter');
    priceTimer = setTimeout(() => el.classList.remove('enter'), 280);
  }, 160);
}

form.addEventListener('change', () => { syncExtras(); syncEquip(); renderPrice(); });
syncExtras(); syncEquip();
priceEl.querySelector('.pv').textContent = '€' + price();

function chosenDate() {
  const day = form.querySelector('input[name=day]:checked');
  if (!day) return '';
  return day.value === 'custom' ? document.getElementById('date').value : day.value;
}
function fmtDate(v) {
  if (!v) return '';
  return new Date(v + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
function buildSummary() {
  const svc = form.querySelector('input[name=service]:checked').value;
  const size = form.querySelector('input[name=size]:checked').value;
  const date = fmtDate(chosenDate());
  const time = form.querySelector('input[name=time]:checked').value;
  const postal = document.getElementById('postal').value;
  const bath = form.querySelector('input[name=bathrooms]:checked').value;
  const mat = form.querySelector('input[name=materials]:checked');
  const matShort = mat.dataset.price === '0' ? 'Client has products' : 'We bring products (+€' + mat.dataset.price + ')';
  const extras = [...form.querySelectorAll('input[name=extra]:checked:not(:disabled)')].map(x => x.value);
  const extraShort = extras.length ? extras.join(', ') : 'None';
  const equipOk = form.querySelector('input[name=equipment]:checked').value === 'Vacuum and mop available';
  document.getElementById('summary').innerHTML = `
    <div class="li"><span class="k">Clean</span><span class="v">${svc} · ${size} · ${bath}</span><button type="button" data-goto="1">Edit</button></div>
    <div class="li"><span class="k">Extras</span><span class="v">${extraShort}</span><button type="button" data-goto="1">Edit</button></div>
    <div class="li"><span class="k">Supplies</span><span class="v">${matShort}${equipOk ? '' : ' · no vacuum at home'}</span><button type="button" data-goto="1">Edit</button></div>
    <div class="li"><span class="k">When</span><span class="v">${date} · ${time}</span><button type="button" data-goto="2">Edit</button></div>
    <div class="li"><span class="k">Where</span><span class="v">${postal} Barcelona</span><button type="button" data-goto="2">Edit</button></div>`;
  document.getElementById('summaryText').value = `${svc} | ${size} ${bath} | Extras: ${extraShort} | ${matShort} | ${date} ${time} | ${postal} | €${price()}`;
}
function show(n) {
  step = n;
  sets.forEach(f => f.hidden = (+f.dataset.step !== n));
  form.querySelectorAll('.err').forEach(e => e.style.display = 'none');
  document.querySelector('.step-count').textContent = n < 4 ? `Step ${n} of 3` : 'Done';
  document.getElementById('stepTitle').textContent = TITLES[n];
  document.getElementById('progressBar').style.width = (n < 4 ? n / 3 * 100 : 100) + '%';
  backBtn.hidden = (n === 1 || n === 4);
  document.body.classList.toggle('done', n === 4);
  nextBtn.innerHTML = (n === 3 ? 'Request my clean' : 'Continue') + ARROW;
  if (n === 3) buildSummary();
}
function fail(id) { document.getElementById(id).style.display = 'block'; }
backBtn.addEventListener('click', () => show(step - 1));
form.addEventListener('click', e => {
  const g = e.target.closest('[data-goto]');
  if (g) show(+g.dataset.goto);
});

/* -------- 5. where bookings go -----------------------------
   PRIMARY: WhatsApp. Your number, international format,
   no + and no spaces.                                         */
const WHATSAPP_NUMBER = "34600000000";

/* OPTIONAL: email yourself a copy via Formspree. Create a form
   at formspree.io and paste the ID. Left as-is, no email.     */
const ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

let lastMessage = '';
function openWhatsApp(text) {
  lastMessage = text;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}
document.getElementById('resendBtn').addEventListener('click', () => openWhatsApp(lastMessage));

function celebrate() {
  if (REDUCE) return;
  const layer = document.getElementById('rise');
  ["🫧", "🫧", "✨", "🫧", "💧", "🫧"].forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.left = (12 + Math.random() * 76) + '%';
    s.style.fontSize = (14 + Math.random() * 16) + 'px';
    s.style.animationDelay = (i * .12).toFixed(2) + 's';
    s.style.setProperty('--dx', (Math.random() * 50 - 25).toFixed(0) + 'px');
    layer.appendChild(s);
    setTimeout(() => s.remove(), 3400);
  });
}

nextBtn.addEventListener('click', () => {
  if (step === 1) return show(2);

  if (step === 2) {
    if (!chosenDate() || !/^\d{5}$/.test(document.getElementById('postal').value)) return fail('err2');
    return show(3);
  }

  if (step === 3) {
    if (!document.getElementById('name').value.trim() || !document.getElementById('phone').value.trim()) return fail('err3');

    const data = Object.fromEntries(new FormData(form).entries());
    data.date = chosenDate();
    data.total = '€' + price();
    data._subject = `Booking · ${data.name} · ${data.total} · ${fmtDate(data.date)} · src:${data.source}`;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Opening WhatsApp…';

    if (!ENDPOINT.includes('YOUR_FORM_ID')) {
      fetch(ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: new URLSearchParams(data) }).catch(() => { });
    }

    openWhatsApp(
      `Hi CleanCleaning! I'd like to book a clean.\n\n` +
      `Service: ${data.service}\n` +
      `Home: ${data.size}, ${data.bathrooms}\n` +
      `Extras: ${[...form.querySelectorAll('input[name=extra]:checked:not(:disabled)')].map(x => x.value).join(', ') || 'none'}\n` +
      `Date: ${fmtDate(data.date)}\n` +
      `Window: ${data.time}\n` +
      `Products: ${data.materials}\n` +
      `Equipment: ${data.equipment}\n` +
      `Postal code: ${data.postal_code}\n` +
      `Total: ${data.total}\n\n` +
      `Name: ${data.name}\n` +
      `Contact: ${data.contact}` +
      (data.notes && data.notes.trim() ? `\nNotes: ${data.notes.trim()}` : '')
    );

    show(4);
    celebrate();
  }
});

show(1);
setTab(location.hash === '#book' ? 'book' : DEFAULT_TAB, false);