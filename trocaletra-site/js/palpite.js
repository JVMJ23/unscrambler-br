/* ==========================================================
   palpite.js — o "Termo" da família Trocaletra
   ==========================================================
   Usa VALID_WORDS e ANSWERS de dictionary.js (carregado antes
   deste arquivo). Toda a grade e o teclado são construídos
   dinamicamente no init(), igual o Desembaralhar faz com os
   resultados da busca.
   ========================================================== */

const PALPITE_TAMANHO = 5;
const PALPITE_TENTATIVAS_MAX = 6;
const PALPITE_TECLADO = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];
const PALPITE_PRIORIDADE = { certo: 3, existe: 2, errado: 1 };

function palavraDoDia() {
  const hoje = new Date();
  const seed = hoje.getFullYear() * 372 + hoje.getMonth() * 31 + hoje.getDate();
  return ANSWERS[seed % ANSWERS.length];
}

function palavraAleatoria(excluir) {
  let p;
  do { p = ANSWERS[Math.floor(Math.random() * ANSWERS.length)]; } while (p === excluir);
  return p;
}

// compara a tentativa com a palavra secreta e devolve certo/existe/errado por posição
function avaliarTentativa(tentativa, secreta) {
  const resultado = new Array(PALPITE_TAMANHO).fill("errado");
  const restantes = secreta.split("");
  for (let i = 0; i < PALPITE_TAMANHO; i++) {
    if (tentativa[i] === secreta[i]) { resultado[i] = "certo"; restantes[i] = null; }
  }
  for (let i = 0; i < PALPITE_TAMANHO; i++) {
    if (resultado[i] === "certo") continue;
    const idx = restantes.indexOf(tentativa[i]);
    if (idx !== -1) { resultado[i] = "existe"; restantes[idx] = null; }
  }
  return resultado;
}

function initPalpite() {
  const gradeEl = document.getElementById("palpiteGrade");
  const statusEl = document.getElementById("palpiteStatus");
  const tecladoEl = document.getElementById("palpiteTeclado");
  const controlesEl = document.getElementById("palpiteControles");
  const painelFimEl = document.getElementById("palpitePainelFim");

  let modo = "dia"; // 'dia' | 'livre'
  let secreta = palavraDoDia();
  let tentativaAtual = "";
  let tentativas = []; // [{palavra, resultado}]
  let status = "jogando"; // jogando | ganhou | perdeu
  let mensagemTimer = null;

  function avisar(texto, duracao) {
    statusEl.textContent = texto;
    statusEl.style.opacity = texto ? "1" : "0.001";
    clearTimeout(mensagemTimer);
    if (duracao !== 0) {
      mensagemTimer = setTimeout(() => {
        statusEl.textContent = "pronto";
        statusEl.style.opacity = "0.001";
      }, duracao || 1600);
    }
  }

  function estadoTeclas() {
    const mapa = {};
    tentativas.forEach(({ palavra, resultado }) => {
      palavra.split("").forEach((letra, i) => {
        const atual = mapa[letra];
        if (!atual || PALPITE_PRIORIDADE[resultado[i]] > PALPITE_PRIORIDADE[atual]) mapa[letra] = resultado[i];
      });
    });
    return mapa;
  }

  function renderGrade() {
    gradeEl.innerHTML = "";
    const linhasVazias = PALPITE_TENTATIVAS_MAX - tentativas.length - (status === "jogando" ? 1 : 0);

    tentativas.forEach((t) => {
      const linha = document.createElement("div");
      linha.className = "palpite-linha";
      t.palavra.split("").forEach((letra, ci) => {
        const tile = document.createElement("div");
        tile.className = `palpite-tile palpite-${t.resultado[ci]}`;
        tile.textContent = letra;
        tile.style.animationDelay = `${ci * 0.07}s`;
        linha.appendChild(tile);
      });
      gradeEl.appendChild(linha);
    });

    if (status === "jogando") {
      const linha = document.createElement("div");
      linha.className = "palpite-linha";
      for (let ci = 0; ci < PALPITE_TAMANHO; ci++) {
        const tile = document.createElement("div");
        tile.className = "palpite-tile palpite-vazio" + (tentativaAtual[ci] ? " palpite-preenchido" : "");
        tile.textContent = tentativaAtual[ci] || "";
        linha.appendChild(tile);
      }
      gradeEl.appendChild(linha);
    }

    for (let l = 0; l < linhasVazias; l++) {
      const linha = document.createElement("div");
      linha.className = "palpite-linha";
      for (let ci = 0; ci < PALPITE_TAMANHO; ci++) {
        const tile = document.createElement("div");
        tile.className = "palpite-tile palpite-vazio";
        linha.appendChild(tile);
      }
      gradeEl.appendChild(linha);
    }
  }

  function renderTeclado() {
    const estado = estadoTeclas();
    tecladoEl.innerHTML = "";
    PALPITE_TECLADO.forEach((linhaTeclas) => {
      const linha = document.createElement("div");
      linha.className = "palpite-linha-teclado";
      linhaTeclas.forEach((tecla) => {
        const btn = document.createElement("button");
        btn.className = "palpite-tecla" + (tecla === "ENTER" || tecla === "⌫" ? " palpite-tecla-grande" : "");
        if (estado[tecla]) btn.classList.add(`palpite-${estado[tecla]}`);
        btn.textContent = tecla;
        btn.onclick = () => digitar(tecla);
        linha.appendChild(btn);
      });
      tecladoEl.appendChild(linha);
    });
  }

  function renderPainelFim() {
    painelFimEl.innerHTML = "";
    painelFimEl.style.display = status === "jogando" ? "none" : "flex";
    if (status === "jogando") return;

    const btnCopiar = document.createElement("button");
    btnCopiar.className = "palpite-btn";
    btnCopiar.textContent = "Copiar resultado";
    btnCopiar.onclick = copiarResultado;
    painelFimEl.appendChild(btnCopiar);

    if (modo === "livre") {
      const btnNovo = document.createElement("button");
      btnNovo.className = "palpite-btn palpite-btn-primario";
      btnNovo.textContent = "Jogar de novo";
      btnNovo.onclick = () => reiniciar();
      painelFimEl.appendChild(btnNovo);
    }
  }

  function render() {
    renderGrade();
    renderTeclado();
    renderPainelFim();
  }

  function reiniciar(novoModo) {
    modo = novoModo || modo;
    secreta = modo === "dia" ? palavraDoDia() : palavraAleatoria(secreta);
    tentativas = [];
    tentativaAtual = "";
    status = "jogando";
    avisar("pronto", 0);
    render();
  }

  function shakeLinhaAtual() {
    const linhas = gradeEl.querySelectorAll(".palpite-linha");
    const alvo = linhas[tentativas.length];
    if (!alvo) return;
    alvo.classList.add("palpite-tremer");
    setTimeout(() => alvo.classList.remove("palpite-tremer"), 400);
  }

  function confirmarTentativa() {
    if (status !== "jogando") return;
    if (tentativaAtual.length !== PALPITE_TAMANHO) {
      shakeLinhaAtual();
      avisar("Faltam letras");
      return;
    }
    if (!VALID_WORDS.has(tentativaAtual)) {
      shakeLinhaAtual();
      avisar("Não está no dicionário");
      return;
    }

    const resultado = avaliarTentativa(tentativaAtual, secreta);
    tentativas.push({ palavra: tentativaAtual, resultado });
    tentativaAtual = "";

    if (tentativas[tentativas.length - 1].palavra === secreta) {
      status = "ganhou";
      avisar(["Mandou bem!", "Excelente!", "Na mosca!", "Certeiro!"][Math.min(tentativas.length - 1, 3)], 0);
    } else if (tentativas.length >= PALPITE_TENTATIVAS_MAX) {
      status = "perdeu";
      avisar(`Era ${secreta}`, 0);
    }
    render();
  }

  function digitar(tecla) {
    if (status !== "jogando") return;
    if (tecla === "ENTER") { confirmarTentativa(); return; }
    if (tecla === "⌫") { tentativaAtual = tentativaAtual.slice(0, -1); render(); return; }
    if (/^[A-Z]$/.test(tecla) && tentativaAtual.length < PALPITE_TAMANHO) {
      tentativaAtual += tecla;
      render();
    }
  }

  function copiarResultado() {
    const emoji = { certo: "🟧", existe: "🟨", errado: "⬜" };
    const linhas = tentativas.map((t) => t.resultado.map((r) => emoji[r]).join(""));
    const texto = `PALPITE ${tentativas.length}/${PALPITE_TENTATIVAS_MAX}\n\n${linhas.join("\n")}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() => avisar("Resultado copiado"));
    } else {
      avisar("Não foi possível copiar");
    }
  }

  document.addEventListener("keydown", (e) => {
    if (document.getElementById("tab-palpite").hidden) return; // só reage se a aba estiver ativa
    if (e.key === "Enter") digitar("ENTER");
    else if (e.key === "Backspace") digitar("⌫");
    else if (/^[a-zA-Z]$/.test(e.key)) digitar(e.key.toUpperCase());
  });

  controlesEl.querySelector('[data-modo="dia"]').onclick = () => {
    setModoAtivo("dia");
    reiniciar("dia");
  };
  controlesEl.querySelector('[data-modo="livre"]').onclick = () => {
    setModoAtivo("livre");
    reiniciar("livre");
  };

  function setModoAtivo(m) {
    controlesEl.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("botao-modo-ativo", b.dataset.modo === m);
    });
  }

  setModoAtivo("dia");
  avisar("pronto", 0);
  render();
}
