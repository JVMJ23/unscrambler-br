# Trocaletra

Desembaralhador de palavras em português brasileiro. Site 100% estático
(HTML + CSS + JS puro, sem build, sem backend, sem dependências para instalar).

```
trocaletra-site/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── data/
│   └── (opcional) palavras.txt — veja "Hospedar o dicionário localmente"
└── README.md
```

## Rodando localmente

Como é estático, dá pra simplesmente abrir o `index.html` no navegador.
Se preferir servir por HTTP (recomendado, alguns navegadores bloqueiam
`fetch` em arquivos abertos direto do disco com `file://`):

```bash
# qualquer servidor estático funciona, por exemplo:
npx serve .
# ou
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Publicando

Como não há backend, qualquer host de site estático serve. Três caminhos rápidos:

### Netlify (mais simples)
1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop)
2. Arraste a pasta `trocaletra-site` inteira
3. Pronto — já tem uma URL pública

### Vercel
```bash
npm i -g vercel
cd trocaletra-site
vercel
```
Siga as instruções no terminal (aceite os padrões — é um projeto estático).

### GitHub Pages
1. Crie um repositório no GitHub e suba os arquivos desta pasta
2. Vá em **Settings → Pages**
3. Em "Source", selecione a branch principal e a pasta `/ (root)`
4. Salve — o site fica em `https://seu-usuario.github.io/nome-do-repo`

Em qualquer uma dessas opções, se quiser um domínio próprio (`trocaletra.com.br`,
por exemplo), basta configurar o DNS do domínio apontando para o host escolhido —
todos eles suportam domínio customizado nas configurações do projeto.

## Sobre o dicionário

Por padrão, o site carrega a lista de palavras (+320 mil entradas) direto de um
CDN público na primeira visita:

- Fonte: [pythonprobr/palavras](https://github.com/pythonprobr/palavras)
  (baseada no corretor ortográfico pt_BR do LibreOffice, licença MPL-2.0)
- Carregado via jsdelivr, com fallback para raw.githubusercontent.com

Isso significa que o site depende de acesso a esses domínios para funcionar.
Na grande maioria dos casos isso é transparente e rápido, mas se você quiser
eliminar essa dependência (por exemplo, para funcionar 100% offline ou atrás
de um firewall restritivo):

1. Baixe o arquivo `palavras.txt` do repositório acima
2. Coloque-o em `data/palavras.txt` dentro deste projeto
3. Pronto — o `js/app.js` já tenta esse caminho local primeiro, antes do CDN
   (veja a constante `DICT_URLS` no topo do arquivo)

## Customizando

- **Cores**: todas as variáveis de cor ficam no topo de `css/style.css`,
  dentro de `:root` (`--paper`, `--ink`, `--mustard`, `--papaya`, `--jungle`).
- **Nome/marca**: troque "Trocaletra" em `index.html` (título, `aria-label`)
  e na animação em `js/app.js` (constante `word`).
- **Pontuação das letras**: tabela `POINTS` no início de `js/app.js` —
  é uma estimativa lúdica baseada na raridade das letras, não uma marca
  registrada de nenhum jogo específico.

## Licença dos dados

A lista de palavras é distribuída sob licença MPL-2.0 pelo repositório
original. Este projeto não tem afiliação com o LibreOffice nem com marcas
registradas de jogos de tabuleiro de palavras.
