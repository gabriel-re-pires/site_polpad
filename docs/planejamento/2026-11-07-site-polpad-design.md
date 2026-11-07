# Site do Polpad: planejamento

Data: 07/11/2026 · Status: aguardando revisão

## 1. Objetivo

Um site público do Polpad (macropad open source com ESP32-C3) onde qualquer
pessoa consegue:

1. baixar o **software** (Windows e Linux), o **firmware** e o **hardware**
   (case 3D hoje; esquemático e PCB quando existirem);
2. aprender a **montar, instalar e gravar** o macropad (docs básicas);
3. ver e **compartilhar projetos da comunidade**, que só entram depois de
   aprovados pelo mantenedor.

O trabalho segue três etapas: **estrutura e planejamento** (este documento),
depois **construção**, depois **refinar o design** aos poucos.

## 2. Decisões

| Assunto | Decisão |
|---|---|
| Domínio | `polpad.com.br` (disponível, ainda não comprado). Até a compra, o site roda no GitHub Pages: `gabriel-re-pires.github.io/site_polpad` |
| Idiomas | pt-BR (padrão, sem prefixo na URL) e inglês (`/en/...`) |
| Tecnologia | [Astro](https://astro.build), site 100% estático, sem servidor nem banco |
| Hospedagem | GitHub Pages, publicado por GitHub Actions a cada push no `main` |
| Repositório | `gabriel-re-pires/site_polpad`, separado do `polpad`. A comunidade mora dentro dele |
| Visual inicial | Inspirado no spicetify.app, com as cores da marca do polvo |
| Docs | Seção básica no próprio site |

### Por que Astro

- Tem i18n embutido: uma página por idioma sem duplicar o layout.
- Docs e projetos da comunidade são arquivos (Markdown e YAML) que o Astro
  transforma em páginas e valida com um esquema (*content collections*).
- O resultado é HTML/CSS puro, rápido e grátis para hospedar.

Alternativas descartadas:

- **HTML na mão:** cada página vira duas cópias, e a lista da comunidade
  precisaria de JavaScript.
- **Docusaurus ou VitePress:** a página inicial "vitrine" brigaria com o tema
  de documentação.

## 3. Estrutura de pastas

```
site_polpad/
├── .github/
│   ├── workflows/
│   │   ├── publicar.yml          # build + deploy no GitHub Pages
│   │   └── validar-comunidade.yml # checa PRs que mexem em comunidade/
│   └── PULL_REQUEST_TEMPLATE.md
├── comunidade/                   # um projeto por pasta (ver seção 6)
│   └── <slug>/
│       ├── projeto.yml
│       ├── capa.jpg
│       └── arquivos/...
├── docs/planejamento/            # este documento e os planos seguintes
├── public/                       # favicon, imagens fixas, CNAME (quando houver domínio)
├── src/
│   ├── components/               # Cabecalho, Rodape, Hero, CartaoProjeto, BotaoDownload...
│   ├── content/
│   │   ├── docs/pt-br/*.md
│   │   └── docs/en/*.md
│   ├── content.config.ts         # esquemas das coleções (docs e comunidade)
│   ├── i18n/                     # textos de interface: pt-br.json, en.json
│   ├── layouts/                  # Base, Docs
│   ├── pages/                    # rotas (ver seção 4)
│   └── styles/                   # tokens.css (cores, fontes), global.css
├── astro.config.mjs
├── package.json
├── CONTRIBUTING.md               # como enviar um projeto
└── README.md
```

A coleção `comunidade` é carregada da pasta `comunidade/` na raiz. Ela fica
fora de `src/` para quem envia um projeto não precisar mexer no código do site.

## 4. Páginas

Toda rota existe também em `/en/...`.

| Rota | Conteúdo |
|---|---|
| `/` | Página inicial (seção 5) |
| `/baixar` | Software, firmware e hardware, com versão atual e instruções curtas |
| `/comunidade` | Grade de cartões com filtro: Todos · Cases 3D · Perfis · Builds · Firmware |
| `/comunidade/<slug>` | Fotos, descrição, autor, licença, arquivos e links |
| `/docs` | Índice das docs |
| `/docs/montagem` | Peças, pinagem do ESP32-C3 SuperMini, impressão do case |
| `/docs/instalar` | Instalar o app no Windows e no Linux |
| `/docs/firmware` | Gravar e atualizar o firmware (pelo app) |
| `/docs/enviar-projeto` | Passo a passo para enviar à comunidade |
| `/404` | Página de não encontrado |

As docs são **adaptadas** dos arquivos do repositório `polpad`
(`docs/PINAGEM.md`, `firmware/README.md`, `hardware/case/README.md`). Elas
são cópias, não sincronizadas: quando algo mudar no `polpad`, a doc do site
é atualizada à mão. Cada página de doc tem um link "ver no repositório" para
o arquivo de origem.

## 5. Página inicial (primeira versão)

Fiel ao espírito do spicetify.app: escura, título gigante, dois botões.

- **Cabeçalho:** polvo + "Polpad" à esquerda. Links Docs, Comunidade e
  Baixar. À direita, seletor PT/EN e botão do GitHub.
- **Hero:**
  - Etiqueta em pílula: "Open source · ESP32-C3 · Windows e Linux".
  - Título em fonte larga e grossa, três linhas: as duas primeiras em roxo,
    a última em branco. Texto provisório: "Seu macropad, / do seu jeito. /
    Aberto." (EN: "Your macropad, / your way. / Open.").
  - Subtítulo de duas linhas.
  - Botões: **Baixar** (roxo, vai para `/baixar`) e **Ver no GitHub**
    (contorno, vai para o repositório `polpad`).
  - Um brilho roxo radial atrás do título.
- **Três cartões:** Hardware / Software / Firmware, cada um com uma frase e
  um link.
- **Prévia da comunidade:** os 3 projetos mais recentes e o link "ver todos".
- **Rodapé:** licenças (software GPL-3.0, hardware CERN-OHL-S), links do
  GitHub e o crédito dos autores.

### Tokens de design

| Token | Valor | Origem |
|---|---|---|
| `--cor-fundo` | `#0E0B14` | marca (preto) |
| `--cor-destaque` | `#7A2EF0` | marca (roxo) |
| `--cor-texto` | `#FFFFFF` / tons de cinza | marca (branco) |
| `--fonte-titulo` | fonte larga do Google Fonts (ex.: Unbounded); a escolha final fica para a etapa de design | |
| `--fonte-texto` | fonte sem serifa legível (ex.: Inter) | |

Regras da marca (`docs/marca/polvo-encoder/LEIA-ME.md` do `polpad`):

- Roxo sobre preto (3,2:1) só em títulos grandes e ícones, nunca em texto
  pequeno.
- Abaixo de 24 px, usar o polvo "pequeno".
- O favicon vem pronto da pasta `favicon/` da marca.

O tema é só escuro na v1. Um tema claro fica para a etapa de design.

## 6. Comunidade

### Formato de um projeto

Cada projeto é uma pasta `comunidade/<slug>/`, onde `<slug>` usa letras
minúsculas, números e hífen. Dentro dela fica um `projeto.yml`:

```yaml
titulo: Case com tampa de acrílico
tipo: case            # case | perfil | build | firmware
autor:
  nome: Fulano
  github: fulano      # opcional
descricao: |
  Texto curto em Markdown sobre o projeto.
licenca: CC-BY-4.0    # obrigatória; identificador SPDX
data: 2026-11-07
capa: capa.jpg        # imagem obrigatória, até 1 MB
fotos: [foto1.jpg, foto2.jpg]   # opcional
arquivos:             # arquivos dentro da pasta
  - arquivos/tampa.stl
links:                # opcional, para arquivos grandes ou externos
  - titulo: Printables
    url: https://...
versao_firmware: 2.1.0   # opcional; recomendado para perfil e firmware
```

O esquema é validado pelo Astro no build. Projeto com campo errado quebra o
build, e o PR não passa.

Licenças aceitas na v1:

- **case e build:** CC-BY-4.0, CC-BY-SA-4.0 ou CERN-OHL-S-2.0
- **perfil:** CC0-1.0 ou CC-BY-4.0
- **firmware:** GPL-3.0-or-later (por ser derivado do firmware do Polpad)

### Fluxo de envio

1. A pessoa faz um fork pelo site do GitHub, cria a pasta e envia os
   arquivos pela interface web (sem Git na linha de comando) e abre um PR. O
   `CONTRIBUTING.md` e `/docs/enviar-projeto` explicam o passo a passo, com
   um `projeto.yml` de exemplo.
2. O workflow **validar-comunidade** roda no PR e confere:
   - o esquema do `projeto.yml`;
   - se os arquivos citados existem;
   - imagens até 1 MB;
   - pasta até 25 MB;
   - extensões permitidas (`.yml .md .jpg .png .webp .stl .3mf .step .json .bin .zip`);
   - se o PR só mexe dentro de `comunidade/<slug>/`.
3. O mantenedor revisa (conteúdo, licença, se o `.bin` vem com código-fonte
   ou link para ele) e faz o merge. O site é republicado sozinho.

PRs de fork rodam com permissão só de leitura (padrão do GitHub para
`pull_request`). O workflow de validação não usa segredos.

### Exibição

- Os cartões mostram capa, título, tipo, autor e data.
- A página do projeto mostra a galeria, a descrição, o botão de baixar cada
  arquivo (link direto ao arquivo no repositório) e a licença.
- A descrição é escrita num idioma só, o do autor. A interface em volta
  segue o idioma do site.

## 7. Downloads

| Item | Link |
|---|---|
| Windows | `github.com/gabriel-re-pires/polpad/releases/latest/download/Polpad-Windows-Instalador.exe` |
| Linux | `.../releases/latest/download/Polpad-Linux-Instalador.tar.gz` |
| Firmware | o nome muda a cada versão (`firmware-2.1.0.bin`). O link é resolvido pela API (abaixo); sem ela, aponta para a página da release mais recente |
| Hardware | arquivos de `hardware/case/` (STL e G-code) por link direto ao repositório `polpad` |
| Somas SHA-256 | `.../releases/latest/download/SHA256SUMS.txt` |

- **Versão exibida:** um script pequeno no navegador chama
  `api.github.com/repos/gabriel-re-pires/polpad/releases/latest` e mostra a
  versão e o link do firmware. Se a chamada falhar (limite de 60 por hora
  por IP, ou rede), os botões continuam funcionando, só sem o número da
  versão.
- **A gravação do firmware é feita pelo app Polpad.** O `.bin` aparece no
  site como opção avançada.
- **Melhoria futura (repositório `polpad`, fora deste projeto):** anexar
  `Polpad-Hardware.zip` às releases. Aí o hardware também ganha um link fixo
  de `latest/download`.

## 8. Publicação e domínio

### Agora

- `publicar.yml`: `npm ci` → `astro build` → `actions/deploy-pages`.
- Enquanto o site estiver em `gabriel-re-pires.github.io/site_polpad`,
  `astro.config.mjs` usa `base: '/site_polpad'`. Todos os links internos
  passam por um helper que respeita o `base`, para a troca de domínio não
  quebrar nada.

### Quando comprar `polpad.com.br`

1. Criar `public/CNAME` com `polpad.com.br`, remover o `base` e trocar
   `site` para `https://polpad.com.br`.
2. No registro.br, configurar o DNS:
   - registros **A** de `polpad.com.br` para `185.199.108.153`,
     `185.199.109.153`, `185.199.110.153` e `185.199.111.153`;
   - **CNAME** de `www` para `gabriel-re-pires.github.io`.
3. Em Settings → Pages, informar o domínio e marcar "Enforce HTTPS".
4. Verificar o domínio na conta do GitHub, para ninguém sequestrá-lo.

## 9. Fora da v1

Busca, login, comentários, curtidas, envio por formulário sem GitHub, blog,
tema claro, notícias e changelog no site, estatísticas de download.

## 10. Testes e verificação

- `astro check` e `astro build` sem erros no CI. O build falha com projeto
  da comunidade inválido.
- Verificador de links internos no build. Links externos ficam fora, para o
  CI não ficar instável.
- Conferência manual a cada etapa:
  - as páginas em 375 px (celular) e no desktop;
  - PT e EN;
  - os downloads apontando para a release atual;
  - Lighthouse com acessibilidade ≥ 90.
- Um projeto de exemplo em `comunidade/exemplo-case-original/`, com o case
  oficial, serve de teste do esquema e de modelo para quem envia.

## 11. Etapas

1. **Estrutura e planejamento** (este documento): aprovar.
2. **Construção:** plano de implementação detalhado. Depois:
   - criar o projeto Astro com i18n e tokens de cor;
   - páginas e componentes;
   - coleção da comunidade e validação;
   - docs básicas;
   - workflows de publicação;
   - publicar em `github.io`.
3. **Design:** fonte final do título, textos, animações discretas (brilho,
   entrada do título), fotos reais do macropad, tema claro.

## 12. Em aberto

- Texto final do título e do subtítulo, nas duas línguas.
- Fotos reais do macropad montado para a página inicial e as docs.
- Nome do repositório no GitHub: `site_polpad` (atual) ou `polpad-site`.
  Depois do domínio próprio, o nome só aparece no GitHub.
