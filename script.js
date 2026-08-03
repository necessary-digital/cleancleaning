/* ---------- side-scattered emoji — one of each, no repeats, no tiling ---------- */
(function(){
  const EMOJI = ["🧼","🫧","✨","🍋","🌿","💧","🧴","🪟","🧽","🧹","🪣","🧺"];
  // [x%, y%, rotate] — confined to left/right margins so nothing sits
  // behind the headline or the card; each position gets one unique emoji.
  const POS = [
    [3,8,-9],[7,26,7],[2,45,-6],[6,63,10],[3,80,-8],[8,95,5],
    [93,10,8],[97,29,-7],[92,48,9],[96,66,-10],[93,84,6],[97,97,-8]
  ];
  const canvasEl = document.querySelector('.canvas');
  const frag = document.createDocumentFragment();
  POS.forEach((p,i)=>{
    const s=document.createElement('span');
    s.textContent=EMOJI[i];
    s.style.left=p[0]+'%';s.style.top=p[1]+'%';
    s.style.transform=`rotate(${p[2]}deg)`;
    frag.appendChild(s);
  });
  canvasEl.appendChild(frag);

  // Parallax on hover only — no autoplay, no scroll drift. Eases back to
  // rest the moment the cursor leaves the window.
  let mx=0, my=0, tx=0, ty=0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce){
    addEventListener('mousemove',(e)=>{
      const cx=(e.clientX/innerWidth-.5)*2, cy=(e.clientY/innerHeight-.5)*2;
      tx=cx*-14; ty=cy*-10;
    },{passive:true});
    addEventListener('mouseleave',()=>{ tx=0; ty=0; });
    (function loop(){
      mx+=(tx-mx)*.06; my+=(ty-my)*.06;
      canvasEl.style.transform=`translate3d(${mx}px, ${my}px, 0)`;
      requestAnimationFrame(loop);
    })();
  }
})();

/* ---------- QR / poster source tracking ---------- */
(function(){
  const p=new URLSearchParams(location.search);
  document.getElementById('sourceField').value = p.get('src')||p.get('utm_source')||'direct';
})();

/* ---------- day chips ---------- */
(function(){
  const wrap=document.getElementById('dayChips');
  const today=new Date();
  for(let i=1;i<=3;i++){
    const d=new Date(today); d.setDate(d.getDate()+i);
    const val=d.toISOString().slice(0,10);
    const lab=i===1?'Tomorrow':d.toLocaleDateString('en-GB',{weekday:'short'});
    const sub=d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    wrap.insertAdjacentHTML('beforeend',
      `<label class="pill-opt"><input type="radio" name="day" value="${val}" ${i===1?'checked':''}><span class="box">${lab}<small>${sub}</small></span></label>`);
  }
  wrap.insertAdjacentHTML('beforeend',
    `<label class="pill-opt"><input type="radio" name="day" value="custom"><span class="box">Later<small>Pick a date</small></span></label>`);
  wrap.addEventListener('change',()=>{
    const custom = wrap.querySelector('input[value=custom]').checked;
    document.getElementById('customDateWrap').hidden = !custom;
    if(custom) document.getElementById('date').focus();
  });
  const d=new Date(); d.setDate(d.getDate()+4);
  document.getElementById('date').min=d.toISOString().slice(0,10);
})();

/* ---------- flow ---------- */
const ARROW='<svg class="arr" width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 1L14 5.5L9 10M14 5.5H0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const form=document.getElementById('bookForm');
const nextBtn=document.getElementById('nextBtn');
const backBtn=document.getElementById('backBtn');
const sets=[...form.querySelectorAll('fieldset')];
const TITLES={1:'Your clean',2:'When & where',3:'Almost done',4:'All set'};
let step=1;

function price(){
  return +form.querySelector('input[name=size]:checked').dataset.price
       + +form.querySelector('input[name=service]:checked').dataset.price;
}
function renderPrice(){
  document.getElementById('price').textContent='€'+price();
}
form.addEventListener('change',renderPrice);renderPrice();

function chosenDate(){
  const day=form.querySelector('input[name=day]:checked');
  if(!day) return '';
  return day.value==='custom' ? document.getElementById('date').value : day.value;
}
function fmtDate(v){
  if(!v) return '';
  return new Date(v+'T12:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
}
function buildSummary(){
  const svc=form.querySelector('input[name=service]:checked').value;
  const size=form.querySelector('input[name=size]:checked').value;
  const date=fmtDate(chosenDate());
  const time=form.querySelector('input[name=time]:checked').value;
  const postal=document.getElementById('postal').value;
  document.getElementById('summary').innerHTML=`
    <div class="li"><span class="k">CLEAN</span><span class="v">${svc} · ${size}</span><button type="button" data-goto="1">Edit</button></div>
    <div class="li"><span class="k">WHEN</span><span class="v">${date} · ${time}</span><button type="button" data-goto="2">Edit</button></div>
    <div class="li"><span class="k">WHERE</span><span class="v">${postal} Barcelona</span><button type="button" data-goto="2">Edit</button></div>`;
  document.getElementById('summaryText').value=`${svc} | ${size} | ${date} ${time} | ${postal} | €${price()}`;
}
function show(n){
  step=n;
  sets.forEach(f=>f.hidden=(+f.dataset.step!==n));
  form.querySelectorAll('.err').forEach(e=>e.style.display='none');
  document.querySelector('.step-count').textContent=n<4?`STEP ${n} OF 3`:'DONE';
  document.getElementById('stepTitle').textContent=TITLES[n];
  document.getElementById('progressBar').style.width=(n<4?n/3*100:100)+'%';
  backBtn.hidden=(n===1||n===4);
  document.getElementById('cardFoot').style.display=(n===4)?'none':'flex';
  document.getElementById('footNote').style.display=(n===4)?'none':'block';
  nextBtn.innerHTML=(n===3?'Request my clean ':'Continue ')+ARROW;
  if(n===3) buildSummary();
  document.getElementById('card').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function fail(id){document.getElementById(id).style.display='block';}
backBtn.addEventListener('click',()=>show(step-1));
form.addEventListener('click',e=>{
  const g=e.target.closest('[data-goto]');
  if(g) show(+g.dataset.goto);
});

/* ================= where booking requests go =================
   PRIMARY: WhatsApp — zero setup, always works. Put your business
   number below (international format, no + or spaces).            */
const WHATSAPP_NUMBER = "34641812908";

/* OPTIONAL SECONDARY: also email you a copy via Formspree (free).
   Sign up at https://formspree.io, create a form, paste the ID
   below. Leave as-is to skip email entirely.                      */
const ENDPOINT="https://formspree.io/f/YOUR_FORM_ID";

nextBtn.addEventListener('click',async()=>{
  if(step===1){ show(2); }
  else if(step===2){
    if(!chosenDate()||!/^\d{5}$/.test(document.getElementById('postal').value)) return fail('err2');
    show(3);
  }
  else if(step===3){
    if(!document.getElementById('name').value.trim()||!document.getElementById('phone').value.trim()) return fail('err3');
    const data=Object.fromEntries(new FormData(form).entries());
    data.date=chosenDate();
    data.total='€'+price();
    data._subject=`Booking · ${data.name} · ${data.total} · ${fmtDate(data.date)} · src:${data.source}`;
    nextBtn.disabled=true;nextBtn.textContent='Opening WhatsApp…';

    // fire-and-forget email copy, never blocks the booking
    if(!ENDPOINT.includes('YOUR_FORM_ID')){
      fetch(ENDPOINT,{method:'POST',headers:{'Accept':'application/json'},body:new URLSearchParams(data)}).catch(()=>{});
    }

    const msg =
      `Hi CleanCleaning! I'd like to book a clean.\n\n`+
      `Service: ${data.service}\n`+
      `Home: ${data.size}\n`+
      `Date: ${fmtDate(data.date)}\n`+
      `Window: ${data.time}\n`+
      `Postal code: ${data.postal_code}\n`+
      `Total: ${data.total}\n\n`+
      `Name: ${data.name}\n`+
      `Contact: ${data.contact}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
    show(4);
  }
});
show(1);