/* ==========================================================
   Trocaletra — desembaralhador de palavras em português
   ========================================================== */

/* ---------------- hero scramble animation ---------------- */
(function(){
  const word = "Trocaletra";
  const el = document.getElementById('scrambleTitle');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  [...word].forEach((ch)=>{
    const span = document.createElement('span');
    span.textContent = ch;
    if(!reduce){
      const tx = (Math.random()*140-70).toFixed(0);
      const ty = (Math.random()*90-45).toFixed(0);
      const rot = (Math.random()*90-45).toFixed(0);
      span.style.transform = `translate(${tx}px,${ty}px) rotate(${rot}deg)`;
      span.style.opacity = '0';
    }
    el.appendChild(span);
  });
  requestAnimationFrame(()=>{
    setTimeout(()=>{
      [...el.children].forEach((span,i)=>{
        setTimeout(()=>{
          span.style.transform = 'translate(0,0) rotate(0)';
          span.style.opacity = '1';
        }, i*45);
      });
    }, 120);
  });
})();

/* ---------------- dictionary loading ----------------
   Ordem de tentativa:
   1) data/palavras.txt         -> arquivo local, se você optar por hospedar o dicionário você mesmo
   2) CDN (jsdelivr)            -> espelha o repositório público no GitHub
   3) raw.githubusercontent.com -> fallback direto do GitHub
   Veja o README.md para instruções de como hospedar o dicionário localmente.
------------------------------------------------------- */
const DICT_URLS = [
  'data/palavras.txt',
  'https://cdn.jsdelivr.net/gh/pythonprobr/palavras/palavras.txt',
  'https://raw.githubusercontent.com/pythonprobr/palavras/master/palavras.txt'
];

const ALPHA = "abcçdefghijklmnopqrstuvwxyz";
const POINTS = {a:1,b:3,c:2,ç:3,d:2,e:1,f:4,g:4,h:4,i:1,j:5,k:5,l:2,m:1,n:3,o:1,p:2,q:6,r:1,s:1,t:1,u:1,v:4,w:5,x:8,y:5,z:8};

function normalize(str){
  return str.toLowerCase()
    .replace(/[áàâã]/g,'a')
    .replace(/[éè]/g,'e')
    .replace(/ê/g,'e')
    .replace(/[íì]/g,'i')
    .replace(/[óòôõ]/g,'o')
    .replace(/[úù]/g,'u')
    .replace(/ü/g,'u')
    .replace(/[^a-zç]/g,'');
}

let DICTIONARY = [];
let dictReady = false;
let searchToken = 0;
const RESULTS_PAGE = 400;
let pendingResults = [];
let renderedCount = 0;

const statusLine = document.getElementById('statusLine');
const resultsEl = document.getElementById('results');

function setStatus(html){ statusLine.innerHTML = html; }

async function loadDictionary(){
  setStatus('<span class="dot"></span> carregando dicionário de palavras em português…');

  let text = null;
  for(const url of DICT_URLS){
    try{
      const res = await fetch(url);
      if(res.ok){ text = await res.text(); break; }
    }catch(e){ /* tenta a próxima fonte */ }
  }
  if(!text){
    resultsEl.innerHTML = `<div class="error"><strong>Não consegui carregar o dicionário.</strong>Verifique sua conexão e tente novamente.<br><button class="retry-btn" onclick="loadDictionary()">Tentar de novo</button></div>`;
    setStatus('');
    return;
  }

  setStatus('<span class="dot"></span> preparando índice de palavras…');
  await new Promise(r=>setTimeout(r,10)); // deixa a UI pintar antes do trabalho pesado

  const lines = text.split(/\r?\n/);
  const wordRe = /^[a-zàáâãéêíóôõúüç]+$/i;
  const seen = new Set();
  const dict = [];

  for(let i=0;i<lines.length;i++){
    const w = lines[i].trim();
    if(!w || !wordRe.test(w)) continue;
    const norm = normalize(w);
    if(norm.length < 2) continue;
    const key = norm+'|'+w.toLowerCase();
    if(seen.has(key)) continue;
    seen.add(key);

    const counts = new Array(27).fill(0);
    for(const ch of norm){
      const idx = ALPHA.indexOf(ch);
      if(idx>=0) counts[idx]++;
    }
    const pairs = [];
    let score = 0;
    for(let k=0;k<27;k++){
      if(counts[k]>0){
        pairs.push([k,counts[k]]);
        score += (POINTS[ALPHA[k]]||1) * counts[k];
      }
    }
    dict.push({display:w, norm, len:norm.length, pairs, score});
  }

  DICTIONARY = dict;
  dictReady = true;
  setStatus(`<span class="dot" style="background:var(--jungle)"></span> ${DICTIONARY.length.toLocaleString('pt-BR')} palavras prontas — pode digitar.`);
  resultsEl.innerHTML = `<div class="intro-msg">Comece digitando letras acima ↑</div>`;
}
window.loadDictionary = loadDictionary;
loadDictionary();

/* ---------------- tile preview ---------------- */
const lettersInput = document.getElementById('lettersInput');
const tilePreview = document.getElementById('tilePreview');

function scoreClass(pts){
  if(pts>=4) return 'score-high';
  if(pts>=2) return 'score-mid';
  return 'score-low';
}

function renderTilePreview(raw){
  tilePreview.innerHTML = '';
  const norm = normalize(raw);
  for(const ch of norm){
    const pts = POINTS[ch] || 1;
    const t = document.createElement('div');
    t.className = 'tile ' + scoreClass(pts);
    t.innerHTML = ch.toUpperCase() + `<span class="pt">${pts}</span>`;
    tilePreview.appendChild(t);
  }
}

/* ---------------- search ---------------- */
function search(inputRaw, opts){
  const norm = normalize(inputRaw);
  if(norm.length < 2) return [];

  const counts = new Array(27).fill(0);
  for(const ch of norm){
    const idx = ALPHA.indexOf(ch);
    if(idx>=0) counts[idx]++;
  }
  const total = norm.length;
  const startsWith = opts.startsWith ? normalize(opts.startsWith) : '';
  const endsWith = opts.endsWith ? normalize(opts.endsWith) : '';
  const contains = opts.contains ? normalize(opts.contains) : '';
  const exact = opts.exact;

  const out = [];
  for(let i=0;i<DICTIONARY.length;i++){
    const entry = DICTIONARY[i];
    if(entry.len > total) continue;
    if(exact && entry.len !== total) continue;
    if(startsWith && !entry.norm.startsWith(startsWith)) continue;
    if(endsWith && !entry.norm.endsWith(endsWith)) continue;
    if(contains && !entry.norm.includes(contains)) continue;

    let ok = true;
    const pairs = entry.pairs;
    for(let p=0;p<pairs.length;p++){
      if(counts[pairs[p][0]] < pairs[p][1]){ ok = false; break; }
    }
    if(ok) out.push(entry);
  }
  out.sort((a,b)=> b.len-a.len || b.score-a.score || a.display.localeCompare(b.display,'pt-BR'));
  return out;
}

/* ---------------- render results ---------------- */
function wordTilesHTML(entry){
  let html = '<div class="word-tiles">';
  for(const ch of entry.norm){
    const pts = POINTS[ch] || 1;
    html += `<div class="tile ${scoreClass(pts)}">${ch.toUpperCase()}<span class="pt">${pts}</span></div>`;
  }
  html += '</div>';
  return html;
}

function renderBatch(){
  const slice = pendingResults.slice(renderedCount, renderedCount + RESULTS_PAGE);
  if(renderedCount === 0){
    resultsEl.innerHTML = '';
  } else {
    const oldBtn = document.getElementById('moreBtn');
    if(oldBtn) oldBtn.remove();
  }

  let currentGroupLen = null;
  let groupBody = null;

  if(renderedCount > 0 && resultsEl.lastElementChild && resultsEl.lastElementChild.classList.contains('group')){
    const last = resultsEl.lastElementChild;
    currentGroupLen = last.dataset.len;
    groupBody = last;
  }

  for(const entry of slice){
    if(String(entry.len) !== String(currentGroupLen)){
      currentGroupLen = entry.len;
      groupBody = document.createElement('div');
      groupBody.className = 'group';
      groupBody.dataset.len = entry.len;
      const total = pendingResults.filter(e=>e.len===entry.len).length;
      groupBody.innerHTML = `<div class="group-head">${entry.len} letras <span class="count">(${total.toLocaleString('pt-BR')})</span></div>`;
      resultsEl.appendChild(groupBody);
    }
    const row = document.createElement('div');
    row.className = 'word-row';
    row.innerHTML = `${wordTilesHTML(entry)}<span class="word-score">${entry.display} · ${entry.score} pts</span>`;
    groupBody.appendChild(row);
  }

  renderedCount += slice.length;

  if(renderedCount < pendingResults.length){
    const btn = document.createElement('button');
    btn.id = 'moreBtn';
    btn.className = 'more-btn';
    btn.textContent = `Mostrar mais (${(pendingResults.length - renderedCount).toLocaleString('pt-BR')} restantes)`;
    btn.onclick = renderBatch;
    resultsEl.appendChild(btn);
  }
}

function runSearch(){
  const raw = lettersInput.value;
  renderTilePreview(raw);

  if(!dictReady) return;

  const norm = normalize(raw);
  if(norm.length < 2){
    resultsEl.innerHTML = `<div class="intro-msg">Digite pelo menos duas letras para começar.</div>`;
    return;
  }

  const token = ++searchToken;
  setStatus('<span class="dot"></span> buscando palavras…');

  setTimeout(()=>{
    if(token !== searchToken) return; // input mudou nesse meio tempo

    const opts = {
      startsWith: document.getElementById('fStarts').value,
      endsWith: document.getElementById('fEnds').value,
      contains: document.getElementById('fContains').value,
      exact: document.getElementById('fExact').checked
    };
    const results = search(raw, opts);
    pendingResults = results;
    renderedCount = 0;

    if(results.length === 0){
      resultsEl.innerHTML = `<div class="empty"><strong>Nenhuma palavra encontrada</strong>Tente remover algum filtro ou conferir se digitou as letras certas.</div>`;
    } else {
      renderBatch();
    }
    setStatus(`<span class="dot" style="background:var(--jungle)"></span> ${results.length.toLocaleString('pt-BR')} palavra(s) encontrada(s) para "${norm.toUpperCase()}".`);
  }, 20);
}

let debounceTimer = null;
function onInputChange(){
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runSearch, 220);
}

lettersInput.addEventListener('input', onInputChange);
document.getElementById('fStarts').addEventListener('input', onInputChange);
document.getElementById('fEnds').addEventListener('input', onInputChange);
document.getElementById('fContains').addEventListener('input', onInputChange);
document.getElementById('fExact').addEventListener('change', onInputChange);
