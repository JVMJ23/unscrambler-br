/* ==========================================================
   app.js — ponto de entrada
   ==========================================================
   Roda por último (veja a ordem dos <script defer> no
   index.html). Não sabe nada sobre dicionário nem sobre regra
   de jogo — só cuida da animação do título e da troca de abas,
   chamando initDesembaralhar() e initPalpite() uma vez cada.
   ========================================================== */

// ---------------- animação do título (igual ao Trocaletra original) ----------------
(function () {
  const word = "Trocaletra";
  const el = document.getElementById("scrambleTitle");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  [...word].forEach((ch) => {
    const span = document.createElement("span");
    span.textContent = ch;
    if (!reduce) {
      const tx = (Math.random() * 140 - 70).toFixed(0);
      const ty = (Math.random() * 90 - 45).toFixed(0);
      const rot = (Math.random() * 90 - 45).toFixed(0);
      span.style.transform = `translate(${tx}px,${ty}px) rotate(${rot}deg)`;
      span.style.opacity = "0";
    }
    el.appendChild(span);
  });
  requestAnimationFrame(() => {
    setTimeout(() => {
      [...el.children].forEach((span, i) => {
        setTimeout(() => {
          span.style.transform = "translate(0,0) rotate(0)";
          span.style.opacity = "1";
        }, i * 45);
      });
    }, 120);
  });
})();

// ---------------- troca de abas ----------------
function initTabs() {
  const botoes = document.querySelectorAll(".tab-btn");
  const paineis = {
    desembaralhar: document.getElementById("tab-desembaralhar"),
    palpite: document.getElementById("tab-palpite"),
  };

  botoes.forEach((btn) => {
    btn.addEventListener("click", () => {
      const aba = btn.dataset.tab;
      botoes.forEach((b) => b.classList.toggle("tab-ativa", b === btn));
      Object.entries(paineis).forEach(([nome, painel]) => {
        painel.hidden = nome !== aba;
      });
    });
  });
}

// ---------------- inicialização ----------------
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initDesembaralhar();
  initPalpite();
});

