/* ==========================================================
   desembaralhar.js — a ferramenta original do Trocaletra
   ==========================================================
   Recebe letras soltas e mostra todas as palavras válidas que
   dá pra formar com elas. Usa o DICTIONARY montado em
   dictionary.js (carregado antes deste arquivo).

   Padrão usado aqui: uma função init() que pega os elementos
   do DOM e liga os eventos — chamada pelo app.js quando a
   página carrega. Isso evita rodar código antes da aba
   "Desembaralhar" existir na tela.
   ========================================================== */

function initDesembaralhar() {
  const lettersInput = document.getElementById("lettersInput");
  const tilePreview = document.getElementById("tilePreview");
  const fStarts = document.getElementById("fStarts");
  const fContains = document.getElementById("fContains");
  const fEnds = document.getElementById("fEnds");
  const fExact = document.getElementById("fExact");
  const statusLine = document.getElementById("statusLine");
  const resultsEl = document.getElementById("results");

  const RESULTS_PAGE = 400;
  let pendingResults = [];
  let renderedCount = 0;
  let debounceTimer = null;

  function scoreClass(pts) {
    if (pts >= 4) return "score-high";
    if (pts >= 2) return "score-mid";
    return "score-low";
  }

  function renderTilePreview(raw) {
    tilePreview.innerHTML = "";
    const norm = normalize(raw);
    for (const ch of norm) {
      const pts = POINTS[ch.toLowerCase()] || 1;
      const t = document.createElement("div");
      t.className = "tile " + scoreClass(pts);
      t.innerHTML = ch + `<span class="pt">${pts}</span>`;
      tilePreview.appendChild(t);
    }
  }

  function search(inputRaw, opts) {
    const norm = normalize(inputRaw);
    if (norm.length < 2) return [];

    const counts = {};
    for (const ch of norm) counts[ch] = (counts[ch] || 0) + 1;
    const total = norm.length;
    const startsWith = opts.startsWith ? normalize(opts.startsWith) : "";
    const endsWith = opts.endsWith ? normalize(opts.endsWith) : "";
    const contains = opts.contains ? normalize(opts.contains) : "";
    const exact = opts.exact;

    const out = [];
    for (let i = 0; i < DICTIONARY.length; i++) {
      const entry = DICTIONARY[i];
      if (entry.len > total) continue;
      if (exact && entry.len !== total) continue;
      if (startsWith && !entry.norm.startsWith(startsWith)) continue;
      if (endsWith && !entry.norm.endsWith(endsWith)) continue;
      if (contains && !entry.norm.includes(contains)) continue;

      let ok = true;
      const pairs = entry.pairs;
      for (let p = 0; p < pairs.length; p++) {
        if ((counts[pairs[p][0]] || 0) < pairs[p][1]) { ok = false; break; }
      }
      if (ok) out.push(entry);
    }
    out.sort((a, b) => b.len - a.len || b.score - a.score || a.display.localeCompare(b.display, "pt-BR"));
    return out;
  }

  function wordTilesHTML(entry) {
    let html = '<div class="word-tiles">';
    for (const ch of entry.norm) {
      const pts = POINTS[ch.toLowerCase()] || 1;
      html += `<div class="tile ${scoreClass(pts)}">${ch}<span class="pt">${pts}</span></div>`;
    }
    html += "</div>";
    return html;
  }

  function renderBatch() {
    const slice = pendingResults.slice(renderedCount, renderedCount + RESULTS_PAGE);
    if (renderedCount === 0) {
      resultsEl.innerHTML = "";
    } else {
      const oldBtn = document.getElementById("moreBtn");
      if (oldBtn) oldBtn.remove();
    }

    let currentGroupLen = null;
    let groupBody = null;
    if (renderedCount > 0 && resultsEl.lastElementChild && resultsEl.lastElementChild.classList.contains("group")) {
      const last = resultsEl.lastElementChild;
      currentGroupLen = last.dataset.len;
      groupBody = last;
    }

    for (const entry of slice) {
      if (String(entry.len) !== String(currentGroupLen)) {
        currentGroupLen = entry.len;
        groupBody = document.createElement("div");
        groupBody.className = "group";
        groupBody.dataset.len = entry.len;
        const total = pendingResults.filter((e) => e.len === entry.len).length;
        groupBody.innerHTML = `<div class="group-head">${entry.len} letras <span class="count">(${total.toLocaleString("pt-BR")})</span></div>`;
        resultsEl.appendChild(groupBody);
      }
      const row = document.createElement("div");
      row.className = "word-row";
      row.innerHTML = `${wordTilesHTML(entry)}<span class="word-score">${entry.display} · ${entry.score} pts</span>`;
      groupBody.appendChild(row);
    }

    renderedCount += slice.length;

    if (renderedCount < pendingResults.length) {
      const btn = document.createElement("button");
      btn.id = "moreBtn";
      btn.className = "more-btn";
      btn.textContent = `Mostrar mais (${(pendingResults.length - renderedCount).toLocaleString("pt-BR")} restantes)`;
      btn.onclick = renderBatch;
      resultsEl.appendChild(btn);
    }
  }

  function runSearch() {
    const raw = lettersInput.value;
    renderTilePreview(raw);

    const norm = normalize(raw);
    if (norm.length < 2) {
      statusLine.innerHTML = "";
      resultsEl.innerHTML = '<div class="intro-msg">Digite pelo menos duas letras para começar.</div>';
      return;
    }

    const opts = {
      startsWith: fStarts.value,
      endsWith: fEnds.value,
      contains: fContains.value,
      exact: fExact.checked,
    };
    const results = search(raw, opts);
    pendingResults = results;
    renderedCount = 0;

    if (results.length === 0) {
      resultsEl.innerHTML = '<div class="empty"><strong>Nenhuma palavra encontrada</strong>Tente remover algum filtro ou conferir se digitou as letras certas.</div>';
    } else {
      renderBatch();
    }
    statusLine.innerHTML = `<span class="dot" style="background:var(--jungle)"></span> ${results.length.toLocaleString("pt-BR")} palavra(s) encontrada(s) para "${norm}".`;
  }

  function onInputChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, 180);
  }

  lettersInput.addEventListener("input", onInputChange);
  fStarts.addEventListener("input", onInputChange);
  fContains.addEventListener("input", onInputChange);
  fEnds.addEventListener("input", onInputChange);
  fExact.addEventListener("change", onInputChange);

  resultsEl.innerHTML = '<div class="intro-msg">Comece digitando letras acima ↑</div>';
}
