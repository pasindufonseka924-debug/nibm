
  // ---------- bottle categories: each has its own dedicated QR code ----------
  const categories = [
    { id:'small',     emoji:'🥤', name:'Small Beverage Bottle', example:'250–750 ml',        points:5,  qr:'REEARN-SMALL-BEV' },
    { id:'large',     emoji:'🥤', name:'Large Beverage Bottle', example:'1 L–2.5 L',          points:10, qr:'REEARN-LARGE-BEV' },
    { id:'personal',  emoji:'🧴', name:'Personal Care Bottle',  example:'Shampoo, lotion',    points:8,  qr:'REEARN-PERSONAL-CARE' },
    { id:'household', emoji:'🧽', name:'Household Bottle',      example:'Detergent, dishwash',points:10, qr:'REEARN-HOUSEHOLD' },
    { id:'can',       emoji:'🥫', name:'Can',                   example:'Aluminium/steel can',points:8,  qr:'REEARN-CAN' },
    { id:'other',     emoji:'🫙', name:'Other Plastic Container',example:'Jars, etc.',        points:5,  qr:'REEARN-OTHER-PLASTIC' },
  ];

  // reward tiers (points needed -> Rs discount)
  const rewardTiers = [
    { pts:50,  rs:25,  id:'coupon-50' },
    { pts:100, rs:60,  id:'coupon-100' },
    { pts:200, rs:150, id:'coupon-200' },
    { pts:500, rs:400, id:'coupon-500' },
  ];

  // ---------- state ----------
  const categoryCounts = Object.fromEntries(categories.map(c=>[c.id,0]));
  let spentPoints = 0;
  let activity = [];
  let vouchers = [];
  try {
    const saved = JSON.parse(localStorage.getItem('reearn-v1') || 'null');
    if(saved) {
      categories.forEach(c=> { const n=saved.counts?.[c.id]; if(Number.isSafeInteger(n) && n>=0 && n<1000000) categoryCounts[c.id]=n; });
      const earned=categories.reduce((n,c)=>n+categoryCounts[c.id]*c.points,0);
      if(Number.isSafeInteger(saved.spent) && saved.spent>=0 && saved.spent<=earned) spentPoints=saved.spent;
      activity=Array.isArray(saved.activity)?saved.activity.slice(0,100):[];
      vouchers=Array.isArray(saved.vouchers)?saved.vouchers.slice(0,100):[];
    }
  } catch(e) { /* Invalid or unavailable storage starts a fresh local wallet. */ }
  function saveState(){
    try { localStorage.setItem('reearn-v1',JSON.stringify({counts:categoryCounts,spent:spentPoints,activity,vouchers})); }
    catch(e) { document.getElementById('save-notice').textContent='Storage unavailable: keep this page open to retain your points.'; }
  }
  let selectedCategoryId = categories[0].id;
  function getCategory(id){ return categories.find(c=>c.id===id); }
  function categoryEarned(id){ const c = getCategory(id); return categoryCounts[id] * c.points; }
  function computeBalance(){ return categories.reduce((sum,c)=> sum + categoryEarned(c.id), 0) - spentPoints; }
  let balance = computeBalance();

  // ---------- screen switching ----------
  let mapInited = false;
  function showScreen(name){
    if(!document.getElementById('screen-'+name)) return;
    stopScan();
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
    document.getElementById('screen-'+name).classList.add('active');
    const tabEl = document.getElementById('tab-'+name);
    if(tabEl) tabEl.classList.add('on');

    if(name==='map' && !mapInited){
      initMap();
      mapInited = !!window._leafletMap;
    }
    if(name==='map' && mapInited){
      setTimeout(()=>{ if(window._leafletMap) window._leafletMap.invalidateSize(); }, 80);
    }
    if(name==='scan'){
      renderScanTarget();
      resetScan();
      startScan();
    } else {
      stopScan();
    }
  }

  function setLbView(v){
    lbView=v; renderLeaderboard();
    document.getElementById('btn-friends').classList.toggle('on', v==='friends');
    document.getElementById('btn-global').classList.toggle('on', v==='global');
  }

  // ---------- points / UI refresh ----------
  function refreshUI(){
    balance = computeBalance();
    document.getElementById('pts-topbar').textContent = balance;
    document.getElementById('pts-home').innerHTML = balance + ' <span>points</span>';
    document.getElementById('pts-wallet').innerHTML = balance + ' <span>points</span>';
    renderLeaderboard();
    renderHistory();

    const nextTier = rewardTiers.find(t=>balance < t.pts);
    const pctNext = nextTier ? Math.max(0, Math.min(100, (balance/nextTier.pts)*100)) : 100;
    document.getElementById('progress-home').style.width = pctNext + '%';
    document.getElementById('progress-wallet').style.width = pctNext + '%';

    if(nextTier){
      document.getElementById('pts-home-sub').innerHTML = '<b style="color:var(--mango)">'+(nextTier.pts-balance)+'</b> points to go until the Rs.'+nextTier.rs+' voucher';
      document.getElementById('progress-meta-home-max').textContent = nextTier.pts+' · Rs.'+nextTier.rs;
      document.getElementById('progress-meta-wallet-max').textContent = nextTier.pts+' · Rs.'+nextTier.rs;
    } else {
      document.getElementById('pts-home-sub').innerHTML = 'All reward tiers <b style="color:var(--mango)">unlocked</b>!';
      document.getElementById('progress-meta-home-max').textContent = 'Max tier reached';
      document.getElementById('progress-meta-wallet-max').textContent = 'Max tier reached';
    }
    document.querySelector('#progress-meta-home span:first-child').textContent = balance;
    document.querySelector('#progress-meta-wallet span:first-child').textContent = balance;

    rewardTiers.forEach(t=>{
      setCoupon(t.id, balance>=t.pts, (t.pts-balance)+' points needed', 'Unlocked · ready to redeem');
    });

    renderCategoryGrid();
    renderScanTarget();
  }

  function setCoupon(id, unlocked, lockedText, unlockedText){
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.toggle('unlocked', unlocked);
    el.classList.toggle('locked', !unlocked);
    el.querySelector('.status').textContent = unlocked ? 'USE NOW' : 'LOCKED';
    el.querySelector('.s').textContent = unlocked ? unlockedText : lockedText;
    el.setAttribute('role','button'); el.tabIndex=unlocked?0:-1;
    el.setAttribute('aria-disabled',String(!unlocked));
    el.onclick=()=>redeemReward(id);
    el.onkeydown=e=> {if(e.key==='Enter'||e.key===' '){e.preventDefault();redeemReward(id);}};
  }

  // ---------- category grid (home) ----------
  function bottleSvg(id, pct, emoji){
    const clipId = 'clip-' + id;
    const gradId = 'grad-' + id;
    // liquid rises within the bottle body (y 20 to 88); clamp so it never overflows the neck
    const bodyTop = 20, bodyBottom = 88;
    const fillY = bodyBottom - (Math.max(0, Math.min(100, pct)) / 100) * (bodyBottom - bodyTop);
    return `
      <svg viewBox="0 0 60 96" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="${clipId}">
            <rect x="21" y="6" width="18" height="16" rx="4"/>
            <rect x="6" y="18" width="48" height="70" rx="16"/>
          </clipPath>
          <linearGradient id="${gradId}" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#1FA187"/>
            <stop offset="100%" stop-color="#66CDB8"/>
          </linearGradient>
        </defs>
        <g clip-path="url(#${clipId})"><rect class="bottle-liquid" x="0" y="20" width="60" height="76" fill="url(#${gradId})" style="transform:translateY(${fillY-20}px)"/></g>
        <rect x="21" y="6" width="18" height="16" rx="4" fill="none" stroke="rgba(243,236,218,0.35)" stroke-width="2"/>
        <rect x="6" y="18" width="48" height="70" rx="16" fill="none" stroke="rgba(243,236,218,0.35)" stroke-width="2"/>
        <rect x="19" y="2" width="22" height="7" rx="2.5" fill="#FFB44D"/>
        <text x="30" y="55" text-anchor="middle" font-size="22">${emoji}</text>
      </svg>
    `;
  }

  function renderCategoryGrid(){
    const grid = document.getElementById('cat-grid');
    if(!grid) return;
    grid.innerHTML = categories.map(c=>{
      const earned = categoryEarned(c.id);
      const pct = bottlePercent(earned);
      return `
        <button class="cat-card" onclick="goScanCategory('${c.id}')">
          <div class="bottle-wrap">${bottleSvg(c.id, pct, c.emoji)}</div>
          <div class="info-col">
            <div class="nm">${c.name}</div>
            <div class="ex">${c.example}</div>
            <div class="pts-badge">+${c.points} pts / item</div>
            <div class="earned"><b>${earned}</b> pts earned · ${categoryCounts[c.id]} scanned<br>${Math.floor(earned/50)} bottles filled · 50 pts per fill</div>
          </div>
        </button>
      `;
    }).join('');
  }

  function goScanCategory(id){
    selectedCategoryId = id;
    showScreen('scan');
  }

  // ---------- category chips + target (scan screen) ----------
  function renderCatChips(){
    const row = document.getElementById('cat-chip-row');
    if(!row) return;
    row.innerHTML = categories.map(c=>`
      <button class="cat-chip ${c.id===selectedCategoryId?'on':''}" onclick="selectCategory('${c.id}')">${c.emoji} ${c.name}</button>
    `).join('');
  }

  function renderScanTarget(){
    const c = getCategory(selectedCategoryId);
    if(!c) return;
    const emojiEl = document.getElementById('scan-target-emoji');
    const nameEl = document.getElementById('scan-target-name');
    const ptsEl = document.getElementById('scan-target-pts');
    if(emojiEl) emojiEl.textContent = c.emoji;
    if(nameEl) nameEl.textContent = c.name;
    if(ptsEl) ptsEl.textContent = '+'+c.points+' pts / item';
    renderCatChips();
  }

  function selectCategory(id){
    if(!getCategory(id)) return;
    selectedCategoryId = id;
    document.getElementById('demo-qr-box').classList.remove('show');
    const mismatchEl = document.getElementById('scan-mismatch');
    if(mismatchEl) mismatchEl.textContent = '';
    renderScanTarget();
  }

  // ---------- demo QR (lets you test the flow without a printed sticker) ----------
  function toggleDemoQr(){
    const box = document.getElementById('demo-qr-box');
    const showing = box.classList.toggle('show');
    if(showing){
      const canvasEl = document.getElementById('demo-qr-canvas');
      canvasEl.innerHTML = '';
      const c = getCategory(selectedCategoryId);
      const img = document.createElement('img');
      img.src='./qr-'+c.id+'.svg'; img.alt=c.name+' QR code'; img.width=200; img.height=200;
      canvasEl.append(img);
      const link=document.createElement('a'); link.href=img.src; link.download='ReEarn-'+c.id+'.svg'; link.textContent='Download QR';
      canvasEl.append(link);
    }
  }

  function addHistoryEntry(icon,label,pts){
    activity.unshift({icon,label,pts,time:new Date().toISOString()}); activity=activity.slice(0,100);
    saveState(); renderHistory();
  }
  function renderHistory(){
    const list=document.getElementById('history-list'); list.replaceChildren();
    if(!activity.length) list.textContent='No activity yet. Scan a ReEarn QR to begin.';
    activity.forEach(a=>{
      const row=document.createElement('div'); row.className='history-row';
      const icon=document.createElement('div'); icon.className='ic'; icon.textContent=a.icon;
      const info=document.createElement('div');
      const label=document.createElement('div'); label.className='t'; label.textContent=a.label;
      const date=document.createElement('div'); date.className='d'; date.textContent=new Date(a.time).toLocaleString();
      const pts=document.createElement('div'); pts.className='pt'; pts.textContent=(a.pts>0?'+':'')+a.pts;
      info.append(label,date); row.append(icon,info,pts); list.append(row);
    });
    const out=document.getElementById('voucher-list'); out.replaceChildren();
    vouchers.forEach(v=>{const el=document.createElement('p'); el.textContent='Demo Rs.'+v.rs+' voucher · '+v.code; out.append(el);});
  }
  function redeemReward(id){
    const tier=rewardTiers.find(t=>t.id===id);
    if(!tier || computeBalance()<tier.pts) return;
    if(!confirm('Redeem '+tier.pts+' points for a demo Rs.'+tier.rs+' voucher?')) return;
    spentPoints+=tier.pts;
    const code='RE-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
    vouchers.unshift({rs:tier.rs,code});
    addHistoryEntry('🏷️','Demo Rs.'+tier.rs+' voucher: '+code,-tier.pts); refreshUI();
  }
  let lbView='friends';
  function renderLeaderboard(){
    const earned=categories.reduce((n,c)=>n+categoryEarned(c.id),0);
    const people=lbView==='friends'?[['Piyu',520],['Sadu',410],['Pavinya',375],['Vishmi',298],['Amasha',210],['Vidushi',175]]:[['Nimal',940],['Amali',825],['Kasun',760],['Piyu',520]];
    people.push(['You',earned]); people.sort((a,b)=>b[1]-a[1]);
    const list=document.getElementById('leader-list'); list.replaceChildren();
    people.forEach(([name,points],i)=>{
      const row=document.createElement('div'); row.className='lb-row'+(name==='You'?' me':'');
      [['rk',i+1],['av',name[0]],['nm',name],['pt',points]].forEach(([cls,value])=>{const el=document.createElement('div');el.className=cls;el.textContent=value;row.append(el);}); list.append(row);
    });
  }

  // ---------- shops mock data (Kandy District, real chains / real streets) ----------
  const shops = [
    { name:"Cargills Food City — Kandy City Centre", addr:"Dalada Veediya, Kandy", lat:7.2921, lng:80.6350, dist:"0.5 km" },
    { name:"Keells Super — Peradeniya Road", addr:"Peradeniya Road, Kandy", lat:7.2740, lng:80.6234, dist:"2.1 km" },
    { name:"Arpico Super Centre — Katugastota Road", addr:"Katugastota Road, Kandy", lat:7.3040, lng:80.6280, dist:"1.8 km" },
    { name:"LAUGFS Super — Kandy", addr:"William Gopallawa Mawatha, Kandy", lat:7.2865, lng:80.6410, dist:"1.1 km" },
    { name:"Sathosa — Katugastota", addr:"Main Street, Katugastota", lat:7.3325, lng:80.6234, dist:"5.4 km" },
  ];

  function initMap(){
    document.getElementById('shop-list').innerHTML=shops.map(s=>`<div class="shop-card"><div class="info"><div class="name">${s.name}</div><div class="addr">${s.addr} · Participation unverified</div></div></div>`).join('');
    if(!window.L){document.getElementById('map').textContent='Map unavailable. Please check your connection. Example locations are listed below.';return;}
    const map = L.map('map', { zoomControl:false, attributionControl:true }).setView([7.2950, 80.6320], 13);
    window._leafletMap = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains:'abcd', maxZoom:19, attribution:'&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    const icon = L.divIcon({
      className:'',
      html:'<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#FFB44D;border:2px solid #0A2C29;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
      iconSize:[26,26], iconAnchor:[13,26]
    });

    shops.forEach(s=>{
      L.marker([s.lat, s.lng], {icon}).addTo(map).bindPopup(`<b>${s.name}</b><br>${s.addr}`);
    });

    const list = document.getElementById('shop-list');
    list.innerHTML = shops.map(s=>`
      <div class="shop-card">
        <div class="badge">♻️</div>
        <div class="info">
          <div class="name">${s.name}</div>
          <div class="addr">${s.addr} · Participation unverified</div>
        </div>
        <div class="dist">Example</div>
      </div>
    `).join('');
  }

  // Decode individual frames. ZXing 0.20 has no decodeOnceFromVideoElement method.
  let codeReader=null, cameraStream=null, scanLoopActive=false, scanLocked=true;
  let scanSession=0, scanTimer=null, cameraOpening=false;
  function getReader(){
    if(!window.ZXing) throw new Error('QR scanner unavailable. Reload the page.');
    if(!codeReader){const hints=new Map(); hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,[ZXing.BarcodeFormat.QR_CODE]); hints.set(ZXing.DecodeHintType.TRY_HARDER,true); codeReader=new ZXing.BrowserMultiFormatReader(hints);}
    return codeReader;
  }
  async function startScan(){
    if(cameraOpening || scanLoopActive) return;
    stopScan(); resetScan();
    const session=scanSession, video=document.getElementById('scan-video'), status=document.getElementById('scan-status');
    if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia){status.textContent='Camera needs HTTPS and a supported browser. Open the site directly, or scan a QR image.';return;}
    try{getReader();}catch(e){status.textContent=e.message;return;}
    cameraOpening=true; document.getElementById('camera-start').disabled=true;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
      if(session!==scanSession){stream.getTracks().forEach(t=>t.stop());return;}
      cameraStream=stream; video.srcObject=stream; await video.play();
      if(session!==scanSession)return;
      scanLocked=false; scanLoopActive=true;
      status.textContent='Point at a ReEarn QR. Points are added automatically.';
      scanFrameLoop(session);
    }catch(e){
      if(session!==scanSession)return;
      stopScan();
      const messages={NotAllowedError:'Camera permission denied. Allow camera access in browser settings, then tap Start Camera.',NotFoundError:'No camera found. Choose Scan QR image instead.',NotReadableError:'Camera is busy. Close other camera apps and try again.'};
      status.textContent=messages[e.name]||'Could not start camera. Try again or scan a QR image.';
    }finally{if(session===scanSession){cameraOpening=false;document.getElementById('camera-start').disabled=false;}}
  }
  function acceptCode(text){
    if(scanLocked) return false;
    const c=categories.find(c=>c.qr===String(text).trim());
    if(!c){document.getElementById('scan-mismatch').textContent='This is not a supported ReEarn QR. Use the category QR shown under Fixed QR; ordinary product barcodes are not registered.';return false;}
    scanLocked=true; selectedCategoryId=c.id; handleScanSuccess(); return true;
  }
  function scanFrameLoop(session){
    if(session!==scanSession || !scanLoopActive || scanLocked)return;
    const video=document.getElementById('scan-video');
    if(video.readyState>=2 && video.videoWidth){
      try{ const result=getReader().decode(video); if(acceptCode(result.getText()))return; }
      catch(e){if(!['NotFoundException','ChecksumException','FormatException'].includes(e.constructor?.name) && !(e instanceof ZXing.NotFoundException) && !(e instanceof ZXing.ChecksumException) && !(e instanceof ZXing.FormatException)){stopScan();document.getElementById('scan-status').textContent='Scanner error. Restart camera or scan a QR image.';return;}}
    }
    scanTimer=setTimeout(()=>scanFrameLoop(session),120);
  }
  function stopScan(){
    scanSession++; scanLocked=true; scanLoopActive=false; cameraOpening=false;
    clearTimeout(scanTimer);
    if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop()); cameraStream=null;}
    if(codeReader){try{codeReader.reset();}catch(e){}}
    const video=document.getElementById('scan-video'); if(video)video.srcObject=null;
    const btn=document.getElementById('camera-start');if(btn)btn.disabled=false;
  }
  async function scanImage(input){
    const file=input.files?.[0]; if(!file)return;
    stopScan(); const session=scanSession; resetScan();
    const status=document.getElementById('scan-status'); status.textContent='Reading QR image…';
    const url=URL.createObjectURL(file);
    try{
      const img=new Image(); img.src=url; await img.decode();
      if(session!==scanSession)return;
      const result=getReader().decode(img); scanLocked=false;
      if(!acceptCode(result.getText()))status.textContent='Choose another image or start the camera.';
    }catch(e){if(session===scanSession)status.textContent='No readable QR found. Choose a clear, uncropped QR image or start the camera.';}
    finally{URL.revokeObjectURL(url);input.value='';}
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopScan();document.getElementById('scan-status').textContent='Camera paused. Tap Start Camera to resume.';}});
  window.addEventListener('pagehide',stopScan);

  // Each 50 lifetime category points fills one progress bottle. Completed
  // bottles remain counted; the next scan starts filling the next bottle.
  function bottlePercent(points){ return points>0 && points%50===0 ? 100 : (points%50)*2; }
  function fillKeyframes(before,after){
    const start=bottlePercent(before), end=bottlePercent(after);
    const frame=(pct,offset)=>({transform:'translateY('+(68*(1-pct/100))+'px)',offset});
    if(start===100) return [frame(0,0),frame(end,1)];
    if(Math.floor(after/50)>Math.floor(before/50) && after%50!==0){
      const boundary=(50-before%50)/(after-before);
      const at=Math.min(.8,Math.max(.2,boundary));
      return [frame(start,0),frame(100,at),frame(0,Math.min(.95,at+.08)),frame(end,1)];
    }
    return [frame(start,0),frame(end,1)];
  }
  function animateBottle(c,before,after){
    const host=document.getElementById('result-bottle');
    host.innerHTML=bottleSvg('result-'+c.id,bottlePercent(after),c.emoji);
    host.setAttribute('role','img');
    host.setAttribute('aria-label',c.name+': '+after+' lifetime points, '+Math.floor(after/50)+' bottles filled');
    document.getElementById('result-fill-caption').textContent=Math.floor(after/50)+' bottles filled · '+(after%50===0?50:after%50)+'/50 pts';
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const liquid=host.querySelector('.bottle-liquid');
    if(!reduced && liquid?.animate){
      liquid.animate(fillKeyframes(before,after),{duration:1400,easing:'ease-in-out'});
      document.getElementById('scan-points').animate([{transform:'translateY(12px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:550,easing:'ease-out'});
    }
  }
  function handleScanSuccess(){
    stopScan();
    const c = getCategory(selectedCategoryId);
    const pts = c.points;
    const before = categoryEarned(c.id);
    categoryCounts[c.id] = (categoryCounts[c.id]||0) + 1;
    refreshUI();
    addHistoryEntry(c.emoji, c.name + ' scanned', pts);

    document.getElementById('scan-live').style.display = 'none';
    const resultEl = document.getElementById('scan-result');
    resultEl.style.display = 'block';
    document.getElementById('scan-result-title').textContent = c.name + ' scanned';
    document.getElementById('scan-points').textContent = '+'+pts;
    animateBottle(c,before,categoryEarned(c.id));
  }

  function resetScan(){
    document.getElementById('scan-result').style.display = 'none';
    document.getElementById('scan-live').style.display = 'block';
    document.getElementById('scan-status').textContent = 'Opening camera…';
    const mismatchEl = document.getElementById('scan-mismatch');
    if(mismatchEl) mismatchEl.textContent = '';
  }

  refreshUI();
