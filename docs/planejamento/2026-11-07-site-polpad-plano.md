# Site do Polpad: plano de construção

> **Para quem for executar:** use superpowers:subagent-driven-development ou
> superpowers:executing-plans, tarefa por tarefa. Os passos usam `- [ ]` para
> acompanhar o andamento.

**Objetivo:** construir a v1 do site do Polpad descrita no planejamento. São
cinco partes:

- página inicial;
- baixar;
- comunidade;
- docs;
- publicação automática no GitHub Pages.

**Arquitetura:** o Astro gera um site estático. Cada rota existe em pt-BR
(sem prefixo) e em inglês (`/en/...`). Os arquivos de rota são finos: só
escolhem o idioma e renderizam um componente de página compartilhado. Toda a
lógica que dá para testar fica em módulos puros (`src/lib/*.ts`,
`scripts/*.mjs`), testados com Vitest. A comunidade e as docs são *content
collections*.

**Stack:** Node ≥ 22.23 (a máquina tem 24.14), Astro 7.4.x, `@astrojs/check`,
TypeScript, Vitest, `yaml` (para ler o `projeto.yml` nos scripts) e GitHub
Actions.

**Planejamento:** [2026-11-07-site-polpad-design.md](2026-11-07-site-polpad-design.md).
Leia antes de começar. As seções citadas abaixo (§) são dele.

## Restrições globais

- Repositório: `C:\Projetos_Eletronica\site_polpad`, branch `main`.
  - Nada vai para o GitHub sem o mantenedor pedir.
  - Mensagens de commit: uma linha curta em português, sem coautoria de IA e
    sem "Generated with".
- Publicação inicial: `site = 'https://gabriel-re-pires.github.io'` e
  `base = '/site_polpad'`. Os dois ficam definidos **só** em
  `site.config.mjs`.
  - Quando o domínio entrar: `SITE = 'https://polpad.com.br'` e
    `BASE = '/'`. `caminhoCom` e `conferirDist` têm de funcionar com base
    `'/'`, e os testes cobrem isso.
- Idiomas: `pt-br` (padrão, sem prefixo) e `en` (`/en/`).
  - `trailingSlash: 'always'`: todo link interno termina em `/`.
- Cores (§5):
  - fundo `#0E0B14`;
  - destaque `#7A2EF0`;
  - texto `#FFFFFF`.
  - Roxo sobre preto só em título grande e ícone, nunca em texto pequeno.
- Fontes (Google Fonts): títulos em `Unbounded` 800, texto em `Inter` 400/600.
- Tema só escuro na v1.
- Repositório do app: `https://github.com/gabriel-re-pires/polpad`.
  Repositório do site: `https://github.com/gabriel-re-pires/site_polpad`.
- Licenças no rodapé: software GPL-3.0, hardware CERN-OHL-S.
  - Autores: Gabriel R. Pires (`gabriel-re-pires`) e Artur
    (`Artur-Brasileiro`).
- Comunidade (§6):
  - tipos `case | perfil | build | firmware`;
  - imagem até 1 MB (1 000 000 bytes) e pasta até 25 MB (25 000 000 bytes);
  - extensões `.yml .md .jpg .png .webp .stl .3mf .step .json .bin .zip`;
  - slug `^[a-z0-9]+(-[a-z0-9]+)*$`.
- Licenças aceitas por tipo:

  | Tipo | Licenças |
  |---|---|
  | `case` | CC-BY-4.0, CC-BY-SA-4.0, CERN-OHL-S-2.0 |
  | `build` | CC-BY-4.0, CC-BY-SA-4.0, CERN-OHL-S-2.0 |
  | `perfil` | CC0-1.0, CC-BY-4.0 |
  | `firmware` | GPL-3.0-or-later |

- Downloads (§7):

  | Item | URL |
  |---|---|
  | Windows | `https://github.com/gabriel-re-pires/polpad/releases/latest/download/Polpad-Windows-Instalador.exe` |
  | Linux | `…/releases/latest/download/Polpad-Linux-Instalador.tar.gz` |
  | SHA-256 | `…/releases/latest/download/SHA256SUMS.txt` |
  | Firmware (reserva) | `https://github.com/gabriel-re-pires/polpad/releases/latest` |

  - Firmware real: anexo `firmware-X.Y.Z.bin`, resolvido pela API
    `https://api.github.com/repos/gabriel-re-pires/polpad/releases/latest`.
- Texto fixo do hero (§5):

  | | pt-BR | EN |
  |---|---|---|
  | Título | "Seu macropad, / do seu jeito. / Aberto." | "Your macropad, / your way. / Open." |
  | Etiqueta | "Open source · ESP32-C3 · Windows e Linux" | "Open source · ESP32-C3 · Windows & Linux" |
  | Subtítulo | "Hardware, software e firmware abertos. / Monte, configure e compartilhe." | "Open hardware, software and firmware. / Build it, set it up, share it." |

## Foco da revisão

1. **API do GitHub fora do ar ou no limite de 60/h:** os botões de download
   continuam funcionando. Não aparece "undefined" nem versão vazia; o número
   da versão só some (Tarefa 4).
2. **Site servido em `/site_polpad/`:** nenhum link interno, imagem ou CSS
   pode apontar para `/` sem o base. O verificador de links do build pega
   isso (Tarefa 1).
3. **Arquivo da comunidade com espaço ou acento no nome**
   (`tampa nova ç.stl`): o link de download sai codificado e funciona
   (Tarefa 2).
4. **PR que mexe fora de `comunidade/<slug>/`, em dois projetos, ou cita
   arquivo inexistente no `projeto.yml`:** a validação falha com mensagem
   clara, dizendo arquivo e motivo (Tarefa 7).
5. **Doc sem tradução no outro idioma:** o seletor PT/EN leva ao índice das
   docs do outro idioma, nunca a um 404 (Tarefa 6).

---

## Estrutura de arquivos

```
site_polpad/
├── site.config.mjs                # SITE e BASE (única fonte)
├── astro.config.mjs               # importa site.config.mjs; i18n; trailingSlash
├── package.json / package-lock.json / tsconfig.json / vitest.config.ts / .gitignore
├── README.md                      # como rodar, testar e publicar
├── CONTRIBUTING.md                # como enviar projeto (resumo + link para a doc)
├── .github/
│   ├── workflows/publicar.yml
│   ├── workflows/validar-comunidade.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── comunidade/exemplo-case-original/{projeto.yml, capa.png}
├── public/                        # favicon.ico, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, polvo.svg
├── scripts/
│   ├── conferir-links.mjs         # roda depois do build, sobre dist/
│   └── validar-comunidade.mjs     # roda no CI de PR
├── src/
│   ├── content.config.ts          # coleções docs e comunidade
│   ├── content/docs/{pt-br,en}/*.md
│   ├── i18n/{pt-br,en}.json       # textos de interface
│   ├── lib/
│   │   ├── i18n.ts                # Idioma, ROTAS, caminho(), rota(), t()
│   │   ├── site.ts                # URLs de repositórios e downloads
│   │   ├── comunidade.ts          # tipos, licenças, urlArquivo(), ordenarPorData()
│   │   ├── docs.ts                # docsDoIdioma(), slugDoDoc(), traducao()
│   │   └── release.ts             # extrairRelease()
│   ├── scripts/versao.ts          # roda no navegador: busca a release e preenche a página
│   ├── styles/{tokens.css, global.css}
│   ├── layouts/{Base.astro, Docs.astro}
│   ├── components/
│   │   ├── Cabecalho.astro, Rodape.astro, Hero.astro, CartaoProjeto.astro, Cartoes.astro
│   │   └── paginas/{PaginaInicial, PaginaBaixar, PaginaComunidade, PaginaProjeto, PaginaDocsIndice, PaginaDoc}.astro
│   └── pages/
│       ├── index.astro, baixar.astro, 404.astro
│       ├── comunidade/{index.astro, [slug].astro}
│       ├── docs/{index.astro, [slug].astro}
│       └── en/{index.astro, download.astro, community/{index,[slug]}.astro, docs/{index,[slug]}.astro}
└── tests/                         # *.test.ts e *.test.mjs do Vitest, um por módulo de lib/scripts
```

---

### Tarefa 1: Esqueleto, i18n e verificador de links

**Arquivos:**
- Criar: `package.json`, `site.config.mjs`, `astro.config.mjs`,
  `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `README.md`
- Criar: `src/lib/i18n.ts`, `src/lib/site.ts`, `src/i18n/pt-br.json`,
  `src/i18n/en.json`
- Criar: `src/styles/tokens.css`, `src/styles/global.css`,
  `src/layouts/Base.astro`, `src/components/Cabecalho.astro`,
  `src/components/Rodape.astro`
- Criar: `src/pages/index.astro`, `src/pages/en/index.astro` (provisórios:
  só um `<h1>`, trocados na Tarefa 5)
- Criar: `public/*`, copiando de
  `C:\Projetos_Eletronica\polpad\docs\marca\polvo-encoder\favicon\*` e
  `…\svg\polvo-roxo.svg` (este como `polvo.svg`)
- Criar: `scripts/conferir-links.mjs`
- Testes: `tests/i18n.test.ts`, `tests/conferir-links.test.mjs`

**Interfaces:**
- Produz `site.config.mjs`:
  - `export const SITE = 'https://gabriel-re-pires.github.io'`
  - `export const BASE = '/site_polpad'`
- Produz `src/lib/i18n.ts`:
  - `type Idioma = 'pt-br' | 'en'`
  - `const IDIOMAS: readonly Idioma[]`
  - `type ChaveRota = 'inicio' | 'baixar' | 'comunidade' | 'docs'`
  - `const ROTAS: Record<ChaveRota, Record<Idioma, string>>`, com valores
    `inicio: ''/''`, `baixar: 'baixar'/'download'`,
    `comunidade: 'comunidade'/'community'`, `docs: 'docs'/'docs'`
  - `caminhoCom(base: string, idioma: Idioma, ...partes: string[]): string`
    (pura)
  - `caminho(idioma: Idioma, ...partes: string[]): string`: chama
    `caminhoCom(import.meta.env.BASE_URL, …)`
  - `rota(idioma: Idioma, chave: ChaveRota, ...extra: string[]): string`
  - `outroIdioma(idioma: Idioma): Idioma`
  - `type ChaveTexto = keyof typeof ptBr`
  - `t(idioma: Idioma, chave: ChaveTexto): string`
- Produz `src/lib/site.ts`:
  - `REPO_POLPAD`, `REPO_SITE`
  - `DOWNLOADS = { windows, linux, sha256, firmwareReserva }`, com as URLs
    das Restrições
  - `API_RELEASE`
  - `AUTORES: { nome: string; github: string }[]`
- Produz `Base.astro`. Props:
  - `idioma: Idioma`
  - `titulo: string`
  - `descricao: string`
  - `alternativa: string` (URL da mesma página no outro idioma)

  Põe `<html lang>` (`pt-BR` ou `en`), favicon e as fontes do Google, e
  renderiza `Cabecalho`, `<slot/>` e `Rodape`.
- Produz `Cabecalho.astro` (props: `idioma`, `alternativa`):
  - polvo + "Polpad" ligando a `rota(idioma,'inicio')`;
  - links Docs, Comunidade e Baixar;
  - seletor PT/EN apontando para `alternativa`;
  - ícone do GitHub apontando para `REPO_POLPAD`.
- Produz `scripts/conferir-links.mjs`:
  - `export function linksInternos(html: string): string[]`: todo `href` e
    `src` que começa com `/` (ignora `//`, `http`, `mailto:` e `#`);
  - `export function conferirDist(dist: string, base: string): string[]`:
    devolve erros no formato `"<arquivo.html>: <link> <motivo>"`;
  - CLI `node scripts/conferir-links.mjs`: importa `BASE` de
    `site.config.mjs`, confere `dist/` e sai com 1 se houver erro.

- [ ] **Passo 1: Criar o projeto e instalar**

  ```bash
  npm init -y
  npm install astro@^7.4.7
  npm install -D @astrojs/check typescript vitest yaml
  ```

  - `package.json` com `"type": "module"`, `"engines": {"node": ">=22.23.4"}`
    e estes scripts:
    - `dev`: `astro dev`
    - `build`: `astro check && astro build && node scripts/conferir-links.mjs`
    - `preview`: `astro preview`
    - `test`: `vitest run`
    - `validar`: `node scripts/validar-comunidade.mjs`
  - `.gitignore` com `node_modules/`, `dist/` e `.astro/`.

- [ ] **Passo 2: Configurar o Astro**

  `astro.config.mjs` importa `SITE` e `BASE` de `./site.config.mjs` e usa:

  ```js
  defineConfig({
    site: SITE,
    base: BASE,
    trailingSlash: 'always',
    i18n: {
      locales: ['pt-br', 'en'],
      defaultLocale: 'pt-br',
      routing: { prefixDefaultLocale: false },
    },
  })
  ```

  `tsconfig.json` estende `astro/tsconfigs/strict`.

- [ ] **Passo 3: Escrever os testes que falham em `tests/i18n.test.ts`**

  ```ts
  expect(caminhoCom('/site_polpad/', 'pt-br')).toBe('/site_polpad/');
  expect(caminhoCom('/site_polpad', 'en')).toBe('/site_polpad/en/');
  expect(caminhoCom('/site_polpad/', 'pt-br', 'comunidade', 'meu-case')).toBe('/site_polpad/comunidade/meu-case/');
  expect(caminhoCom('/', 'en', 'download')).toBe('/en/download/');
  expect(caminhoCom('/', 'pt-br', '')).toBe('/');   // partes vazias não geram "//"
  expect(outroIdioma('pt-br')).toBe('en');
  // en.json tem exatamente as mesmas chaves de pt-br.json
  expect(Object.keys(en).sort()).toEqual(Object.keys(ptBr).sort());
  ```

  `rota()` usa `import.meta.env.BASE_URL`. No Vitest ele vale `/`, então
  teste `rota('en','baixar')` como `'/en/download/'`.

- [ ] **Passo 4: Rodar `npm test` e ver falhar** (módulo inexistente).

- [ ] **Passo 5: Implementar `src/lib/i18n.ts`, `src/lib/site.ts` e os dois
  JSON**

  - `caminhoCom` junta `base`, o prefixo `en` (se for o caso) e as `partes`
    não vazias com uma barra só, sempre terminando em `/`.
  - Os JSON trazem as chaves de interface usadas nas tarefas seguintes. Cada
    tarefa acrescenta as suas, sempre nos dois arquivos.

- [ ] **Passo 6: Rodar `npm test` e ver passar.**

- [ ] **Passo 7: Escrever os testes que falham em
  `tests/conferir-links.test.mjs`**

  - `linksInternos('<a href="/x/">…<img src="/site_polpad/a.png"><a href="https://g.com">…<a href="#topo">')`
    devolve `['/x/', '/site_polpad/a.png']`.
  - Criar um `dist` temporário (`fs.mkdtempSync`) com `index.html`
    contendo:
    - `href="/site_polpad/baixar/"`, sem `baixar/index.html` no `dist`;
    - `href="/sobre/"`.

    `conferirDist(dir, '/site_polpad/')` devolve 2 erros. Um contém
    `"/sobre/"` e `"sem o base"`; o outro contém `"/site_polpad/baixar/"` e
    `"não existe"`.
  - Com `baixar/index.html` criado e o `/sobre/` removido, devolve `[]`.
  - Com base `'/'`: `href="/baixar/"` e `baixar/index.html` existente
    devolvem `[]`.

- [ ] **Passo 8: Ver falhar, implementar `scripts/conferir-links.mjs`, ver
  passar**

  - Um link `/base/x/` vale se existir `dist/x/index.html`. Um link
    `/base/a.png` vale se existir `dist/a.png`.
  - Ignore `?query` e `#hash`.

- [ ] **Passo 9: Criar o layout, o cabeçalho, o rodapé e os tokens**

  - `tokens.css` define variáveis `:root`:
    - `--cor-fundo`, `--cor-destaque`, `--cor-texto`;
    - `--cor-texto-suave` (`#B9B3C6`), `--cor-borda` (`#2A2433`);
    - `--fonte-titulo`, `--fonte-texto`;
    - `--largura-max` (`1120px`).
  - `global.css` faz o reset mínimo, define `body` com fundo e fonte, e usa
    margem lateral de 16 px abaixo de 640 px.
  - O rodapé mostra as licenças, os autores com link ao GitHub e o link do
    repositório do site.
  - As páginas provisórias usam `Base`, com `alternativa` apontando uma para
    a outra.

- [ ] **Passo 10: Verificar o build**

  Rode `npm run build`. Deve terminar sem erros, com
  `dist/index.html`, `dist/en/index.html` e o verificador de links sem
  falhas. Abra com `npm run preview` em
  `http://localhost:4321/site_polpad/` e confira que o PT/EN alterna.

- [ ] **Passo 11: Commit** — `git add -A && git commit -m "Esqueleto do site com Astro e i18n"`

---

### Tarefa 2: Coleção da comunidade

**Arquivos:**
- Criar: `src/lib/comunidade.ts`, `src/content.config.ts` (com a coleção
  `comunidade`; `docs` entra na Tarefa 6)
- Criar: `comunidade/exemplo-case-original/projeto.yml` e `capa.png` (cópia
  de `…\polvo-encoder\png\polvo-branco-fundo-roxo\` na versão de 512 px)
- Teste: `tests/comunidade.test.ts`

**Interfaces:**
- Produz `src/lib/comunidade.ts`:
  - `TIPOS = ['case','perfil','build','firmware'] as const`
  - `type TipoProjeto`
  - `LICENCAS_POR_TIPO: Record<TipoProjeto, readonly string[]>`
  - `licencaPermitida(tipo: TipoProjeto, licenca: string): boolean`
  - `SLUG_VALIDO: RegExp`
  - `urlArquivo(slug: string, arquivo: string): string`
  - `ordenarPorData<T extends { data: { data: Date } }>(projetos: T[]): T[]`
    (mais novo primeiro, sem mutar a entrada)
- Produz a coleção `comunidade`:
  - `glob({ base: './comunidade', pattern: '*/projeto.yml', generateId: ({ entry }) => entry.split('/')[0] })`,
    então o `id` da entrada é o slug.
  - Esquema: `({ image }) => z.object({...})` com os campos do §6.
    - `titulo` (1–80), `tipo` (enum `TIPOS`), `autor { nome, github? }`,
      `descricao`, `licenca`, `data` (`z.coerce.date()`), `capa: image()`.
    - `fotos: image().array().default([])`.
    - `arquivos: z.string().array().default([])`.
    - `links: {titulo, url}[] .default([])`.
    - `versao_firmware?`.
  - `superRefine` usa `licencaPermitida` para dar erro em licença fora da
    lista do tipo.

- [ ] **Passo 1: Escrever os testes que falham**

  ```ts
  expect(licencaPermitida('firmware', 'GPL-3.0-or-later')).toBe(true);
  expect(licencaPermitida('firmware', 'CC-BY-4.0')).toBe(false);
  expect(licencaPermitida('perfil', 'CC0-1.0')).toBe(true);
  expect(SLUG_VALIDO.test('meu-case-2')).toBe(true);
  expect(SLUG_VALIDO.test('Meu_Case')).toBe(false);
  expect(SLUG_VALIDO.test('-case')).toBe(false);
  expect(urlArquivo('meu-case', 'arquivos/tampa nova ç.stl'))
    .toBe('https://github.com/gabriel-re-pires/site_polpad/raw/main/comunidade/meu-case/arquivos/tampa%20nova%20%C3%A7.stl');
  // ordenarPorData: [2026-01-01, 2026-03-01] -> [2026-03-01, 2026-01-01], e a lista original não muda
  ```

- [ ] **Passo 2: Rodar `npm test` e ver falhar.**

- [ ] **Passo 3: Implementar `src/lib/comunidade.ts`**

  `urlArquivo` codifica cada segmento com `encodeURIComponent` e preserva as
  `/`.

- [ ] **Passo 4: Rodar `npm test` e ver passar.**

- [ ] **Passo 5: Criar `content.config.ts` e o projeto de exemplo**

  O exemplo:
  - `tipo: case`, `licenca: CERN-OHL-S-2.0`;
  - autor Gabriel R. Pires;
  - `arquivos: []`;
  - `links` para `hardware/case/case_top.stl`, `case_bottom.stl` e a pasta
    `gcode-ender3-v3-se` no `REPO_POLPAD` (`/blob/main/...`), sem copiar os
    STL.

- [ ] **Passo 6: Verificar o esquema de verdade**

  1. Rode `npm run build` e veja passar.
  2. Troque `licenca` do exemplo para `GPL-3.0-or-later`, rode o build e veja
     **falhar**, com a mensagem citando a licença.
  3. Desfaça a troca.
  4. Troque `capa` para `nao-existe.png`: o build falha. Desfaça.

  Se o `glob` com `base` fora de `src/` ou o `image()` em YAML não
  funcionarem no Astro 7, pare e reporte antes de contornar.

- [ ] **Passo 7: Commit** — `git commit -am "Coleção da comunidade com projeto de exemplo"`
  (adicione os arquivos novos antes).

---

### Tarefa 3: Páginas da comunidade

**Arquivos:**
- Criar: `src/components/CartaoProjeto.astro`,
  `src/components/paginas/PaginaComunidade.astro`,
  `src/components/paginas/PaginaProjeto.astro`
- Criar: `src/pages/comunidade/index.astro`,
  `src/pages/comunidade/[slug].astro`,
  `src/pages/en/community/index.astro`,
  `src/pages/en/community/[slug].astro`
- Modificar: `src/i18n/pt-br.json`, `src/i18n/en.json` (nomes dos tipos,
  "Todos", "Baixar arquivo", "Licença", "Enviar projeto"…)

**Interfaces:**
- Consome: `getCollection('comunidade')`, `ordenarPorData`, `urlArquivo`,
  `rota`, `t`, `Base`.
- Produz `CartaoProjeto.astro`:
  - props `projeto: CollectionEntry<'comunidade'>` e `idioma: Idioma`;
  - mostra a capa (`<Image>` de `astro:assets`, 16:10, `alt` = título),
    título, tipo, autor e data formatada no idioma;
  - liga a `rota(idioma,'comunidade', projeto.id)`.
- Produz `PaginaComunidade.astro` (prop `idioma`).
- Produz `PaginaProjeto.astro` (props `idioma` e `projeto`).

- [ ] **Passo 1: Página da lista**

  - Mostra todos os projetos (`ordenarPorData`) numa grade responsiva: 1
    coluna em 375 px, 3 colunas a partir de 960 px.
  - Botões de filtro com `data-tipo`: "Todos" e os quatro tipos.
    - Um `<script>` pequeno esconde os cartões de outro tipo e marca o botão
      ativo com `aria-pressed`.
    - Sem JavaScript, todos aparecem.
  - Botão "Enviar projeto" leva à doc `enviar-projeto`. A rota dela vem da
    Tarefa 6; até lá aponta para `rota(idioma,'docs')`.

- [ ] **Passo 2: Página do projeto**

  - `getStaticPaths` gera um caminho por entrada da coleção.
  - Mostra:
    - capa e fotos;
    - a descrição renderizada como Markdown;
    - autor (com link ao GitHub se houver `github`);
    - licença e data;
    - `versao_firmware`, se houver.
  - Para cada arquivo, um botão de download com `urlArquivo`. Para cada
    link, um botão externo.
  - Se não houver arquivos nem links, mostra o texto
    `t(idioma,'projeto_sem_arquivos')`.
  - `alternativa` = a mesma página no outro idioma.

- [ ] **Passo 3: Verificar**

  1. Rode `npm run build` e confira que existem
     `dist/comunidade/exemplo-case-original/index.html` e
     `dist/en/community/exemplo-case-original/index.html`, sem erros no
     verificador de links.
  2. No `npm run preview`, em 375 px e no desktop: o filtro "Perfis" esconde
     o exemplo, e "Todos" o mostra de novo.

- [ ] **Passo 4: Commit** — `"Páginas da comunidade"`

---

### Tarefa 4: Página de downloads e versão ao vivo

**Arquivos:**
- Criar: `src/lib/release.ts`, `src/scripts/versao.ts`,
  `src/components/paginas/PaginaBaixar.astro`, `src/pages/baixar.astro`,
  `src/pages/en/download.astro`
- Modificar: os dois JSON de textos
- Teste: `tests/release.test.ts`

**Interfaces:**
- Produz `src/lib/release.ts`:
  - `interface InfoRelease { versao: string; firmwareUrl: string | null }`
  - `extrairRelease(dados: unknown): InfoRelease | null`
- Produz `src/scripts/versao.ts`:
  - `atualizarVersao(raiz: ParentNode = document): Promise<void>`
  - Busca `API_RELEASE` e, em caso de sucesso:
    - preenche todo `[data-versao]` com `textContent = 'v' + versao` e tira
      o `hidden`;
    - troca o `href` de `[data-firmware]` por `firmwareUrl` (se não for
      `null`).
  - Em qualquer falha, não altera nada.
- Consumido pela Tarefa 5: a marcação `<span data-versao hidden></span>` e
  `<a data-firmware href={DOWNLOADS.firmwareReserva}>`.

- [ ] **Passo 1: Escrever os testes que falham**

  ```ts
  const ok = { tag_name: 'v0.7.2', assets: [
    { name: 'Polpad-Windows-Instalador.exe', browser_download_url: 'https://x/w.exe' },
    { name: 'firmware-2.1.0.bin', browser_download_url: 'https://x/f.bin' } ] };
  expect(extrairRelease(ok)).toEqual({ versao: '0.7.2', firmwareUrl: 'https://x/f.bin' });
  expect(extrairRelease({ tag_name: '0.7.2', assets: [] })).toEqual({ versao: '0.7.2', firmwareUrl: null });
  expect(extrairRelease({ message: 'API rate limit exceeded' })).toBeNull();
  expect(extrairRelease(null)).toBeNull();
  expect(extrairRelease({ tag_name: 42, assets: [] })).toBeNull();
  expect(extrairRelease({ tag_name: 'v1.0.0', assets: [{ name: 'firmware-velho.txt', browser_download_url: 'u' }] }))
    .toEqual({ versao: '1.0.0', firmwareUrl: null });
  ```

  Firmware é o anexo que casa com `^firmware-\d+\.\d+\.\d+\.bin$`.

- [ ] **Passo 2: Ver falhar, implementar `extrairRelease`, ver passar.**

- [ ] **Passo 3: Implementar `versao.ts` e a página**

  - `PaginaBaixar` tem três blocos:
    - **Software:** botões Windows e Linux, o link SHA-256 e uma linha "como
      instalar" que leva à doc `instalar`.
    - **Firmware:** explica que o app grava o firmware sozinho; o `.bin` fica
      como "avançado", com `data-firmware`.
    - **Hardware:** links para `case_top.stl`, `case_bottom.stl` e a pasta
      de G-code no `REPO_POLPAD`, e o texto "esquemático e placa em breve".
  - A página carrega `versao.ts` com `<script>`. Use `fetch` com
    `AbortSignal.timeout(5000)`.

- [ ] **Passo 4: Verificar no navegador**

  1. Rode `npm run build && npm run preview` e abra `/site_polpad/baixar/`.
     A versão aparece e o link do firmware vira `firmware-X.Y.Z.bin`.
  2. Repita com a rede bloqueada para `api.github.com` (DevTools → Network
     request blocking). A versão fica escondida e o firmware aponta para a
     página da release.

- [ ] **Passo 5: Commit** — `"Página de downloads com versão da última release"`

---

### Tarefa 5: Página inicial

**Arquivos:**
- Criar: `src/components/Hero.astro`, `src/components/Cartoes.astro`,
  `src/components/paginas/PaginaInicial.astro`
- Modificar: `src/pages/index.astro`, `src/pages/en/index.astro` (trocam o
  provisório por `<PaginaInicial idioma=…/>`) e os JSON de textos

**Interfaces:**
- Consome: `rota`, `t`, `DOWNLOADS`, `REPO_POLPAD`, `CartaoProjeto`,
  `ordenarPorData`, `getCollection('comunidade')` e a marcação
  `data-versao` da Tarefa 4.
- Produz `Hero.astro` (prop `idioma`).
- Produz `Cartoes.astro` (prop `idioma`).

- [ ] **Passo 1: Hero (§5)**

  - Etiqueta em pílula com o `data-versao` ao lado. Carrega `versao.ts`.
  - Título em três linhas (`<h1>` com `<span>` por linha), `Unbounded` 800 e
    `font-size: clamp(2.6rem, 9vw, 6.5rem)`. As duas primeiras linhas em
    `--cor-destaque`, a terceira em `--cor-texto`.
  - Subtítulo em duas linhas.
  - Botões **Baixar** (fundo roxo, texto branco, vai para
    `rota(idioma,'baixar')`) e **Ver no GitHub** (contorno, `REPO_POLPAD`).
  - Brilho: `radial-gradient` roxo com opacidade ≈ 0,25 atrás do título,
    num pseudo-elemento sem eventos de mouse.
  - Textos exatamente os das Restrições.

- [ ] **Passo 2: Cartões e prévia**

  - `Cartoes`: Hardware / Software / Firmware, cada um com uma frase e um
    link.
    - Hardware leva à doc `montagem` (até a Tarefa 6, para
      `rota(idioma,'docs')`).
    - Software e Firmware levam a `rota(idioma,'baixar')`.
  - Prévia: os 3 projetos mais recentes com `CartaoProjeto` e o link "ver
    todos". Com 1 ou 2 projetos, mostra só os que existem, sem buracos na
    grade.

- [ ] **Passo 3: Verificar**

  1. Rode `npm run build` sem erros.
  2. No preview a 375 px: título sem rolagem horizontal, botões empilhados.
  3. No desktop, compare com a captura do spicetify.app: hierarquia
     parecida, cores do Polpad.

- [ ] **Passo 4: Commit** — `"Página inicial"`

---

### Tarefa 6: Docs e página 404

**Arquivos:**
- Criar: `src/lib/docs.ts`, `src/layouts/Docs.astro`,
  `src/components/paginas/PaginaDocsIndice.astro`,
  `src/components/paginas/PaginaDoc.astro`
- Criar: `src/pages/docs/index.astro`, `src/pages/docs/[slug].astro`,
  `src/pages/en/docs/index.astro`, `src/pages/en/docs/[slug].astro`,
  `src/pages/404.astro`
- Criar `src/content/docs/pt-br/`: `montagem.md`, `instalar.md`,
  `firmware.md`, `enviar-projeto.md`
- Criar `src/content/docs/en/`: `assembly.md`, `install.md`, `firmware.md`,
  `submit-project.md`
- Modificar: `src/content.config.ts` (coleção `docs`). Trocar os links
  provisórios das Tarefas 3 e 5 pelas docs reais.
- Teste: `tests/docs.test.ts`

**Interfaces:**
- Produz a coleção `docs`:
  - `glob({ base: './src/content/docs', pattern: '**/*.md' })`, com id no
    formato `pt-br/montagem`;
  - esquema `{ titulo: string, descricao: string, chave: string, ordem: number, fonte: z.string().url().optional() }`.
- Produz `src/lib/docs.ts`. Recebe objetos `{ id, data: { chave, ordem } }`:
  - `docsDoIdioma(docs, idioma)`: filtra pelo prefixo do `id` e ordena por
    `ordem`;
  - `slugDoDoc(id)`: devolve o que vem depois da primeira `/`;
  - `traducao(docs, doc, idioma)`: devolve o doc do `idioma` com a mesma
    `chave`, ou `undefined`;
  - `urlDoc(idioma, doc)`: `rota(idioma,'docs', slugDoDoc(doc.id))`.

- [ ] **Passo 1: Escrever os testes que falham**

  Com quatro docs falsos:
  - `pt-br/montagem` (`chave` `montagem`, `ordem` 1);
  - `pt-br/instalar` (`chave` `instalar`, `ordem` 2);
  - `en/assembly` (`chave` `montagem`, `ordem` 1);
  - `pt-br/so-pt` (`chave` `so-pt`, `ordem` 3).

  Espere:
  - `docsDoIdioma(docs,'pt-br').map(d=>d.id)` igual a
    `['pt-br/montagem','pt-br/instalar','pt-br/so-pt']`;
  - `slugDoDoc('en/assembly')` igual a `'assembly'`;
  - `traducao(docs, montagemPt, 'en')?.id` igual a `'en/assembly'`;
  - `traducao(docs, soPt, 'en')` igual a `undefined`.

- [ ] **Passo 2: Ver falhar, implementar, ver passar.**

- [ ] **Passo 3: Layout e páginas**

  - `Docs.astro`: barra lateral com os docs do idioma (o atual destacado
    com `aria-current="page"`) e conteúdo à direita. Abaixo de 768 px, a
    barra vira lista no topo.
  - Cada doc com `fonte` mostra o link "ver no repositório".
  - `alternativa` = `urlDoc(outro, traducao(...))`. Se não houver tradução,
    usa `rota(outro,'docs')`.
  - `404.astro`: uma página só, com o texto nos dois idiomas, links para
    `rota('pt-br','inicio')` e `rota('en','inicio')` e
    `alternativa = rota('en','inicio')`.

- [ ] **Passo 4: Escrever as docs**

  Cada doc é adaptada das fontes abaixo. O `fonte` aponta para o arquivo no
  `REPO_POLPAD` (`/blob/main/...`).

  | chave | fonte no `C:\Projetos_Eletronica\polpad` | conteúdo |
  |---|---|---|
  | `montagem` | `docs/PINAGEM.md`, `hardware/case/README.md` | peças, pinagem do ESP32-C3 SuperMini, impressão do case |
  | `instalar` | `README.md`, `tools/LEIA-ME-linux.txt` | instalar no Windows (instalador) e no Linux |
  | `firmware` | `firmware/README.md` | gravar e atualizar pelo app; `.bin` avançado |
  | `enviar-projeto` | §6 deste planejamento | passo a passo pela interface web do GitHub, `projeto.yml` de exemplo, limites e licenças |

  Use os fatos desses arquivos e não invente pinagem. Se uma fonte
  contradisser outra, pare e pergunte.

- [ ] **Passo 5: Verificar**

  1. Rode `npm run build` sem erros.
  2. No preview: em `/site_polpad/docs/montagem/`, o EN vai para
     `/site_polpad/en/docs/assembly/`.
  3. Abra `/site_polpad/nao-existe/` e veja a página 404.

- [ ] **Passo 6: Commit** — `"Docs básicas e página 404"`

---

### Tarefa 7: Validação da comunidade e publicação automática

**Arquivos:**
- Criar: `scripts/validar-comunidade.mjs`,
  `.github/workflows/validar-comunidade.yml`,
  `.github/workflows/publicar.yml`, `.github/PULL_REQUEST_TEMPLATE.md`,
  `CONTRIBUTING.md`
- Modificar: `README.md` (rodar, testar, publicar e o passo a passo do
  domínio do §8)
- Teste: `tests/validar-comunidade.test.mjs`

**Interfaces:**
- Produz `scripts/validar-comunidade.mjs`:
  - `LIMITE_IMAGEM = 1_000_000`, `LIMITE_PASTA = 25_000_000`, `EXTENSOES`
    (lista das Restrições)
  - `conferirPasta(dir: string): string[]`. Erros no formato
    `"<slug>: <motivo>"`, para:
    - slug inválido;
    - falta `projeto.yml`;
    - YAML ilegível;
    - extensão proibida (cita o arquivo);
    - imagem `.jpg/.png/.webp` acima de 1 MB;
    - pasta acima de 25 MB;
    - item de `arquivos`, `capa` ou `fotos` que não existe;
    - caminho com `..`.
  - `conferirCaminhosDoPR(arquivos: string[]): string[]`:
    - se nenhum arquivo começa com `comunidade/`, devolve `[]` (PR do
      mantenedor);
    - se começa, todos têm de estar dentro de um único `comunidade/<slug>/`.
  - CLI: `node scripts/validar-comunidade.mjs [--pr-base <ref>]` confere
    toda pasta de `comunidade/`. Com `--pr-base`, confere também
    `git diff --name-only <ref>...HEAD`. Imprime um erro por linha e sai
    com 1 se houver erro.

- [ ] **Passo 1: Escrever os testes que falham**

  Usar pastas temporárias montadas no próprio teste:
  - Pasta válida (projeto.yml + capa.png de 10 bytes + `arquivos/a.stl`
    listado) → `[]`.
  - `arquivos: [arquivos/sumiu.stl]` → 1 erro contendo `sumiu.stl`.
  - Arquivo `virus.exe` → erro contendo `virus.exe` e `extensão`.
  - `capa.png` com 1 000 001 bytes → erro contendo `1 MB`.
  - Slug `Meu_Case` → erro contendo `slug`.
  - `arquivos: [../../etc/passwd]` → erro.
  - `conferirCaminhosDoPR`:
    - `['comunidade/a/projeto.yml','comunidade/a/capa.png']` → `[]`;
    - `['comunidade/a/projeto.yml','comunidade/b/projeto.yml']` → 1 erro
      citando os dois slugs;
    - `['comunidade/a/projeto.yml','src/lib/i18n.ts']` → 1 erro citando
      `src/lib/i18n.ts`;
    - `['README.md']` → `[]`.

- [ ] **Passo 2: Ver falhar, implementar, ver passar.**

  Use o pacote `yaml` para ler o `projeto.yml`.

- [ ] **Passo 3: Workflows**

  **`publicar.yml`** (modelo da doc do Astro para GitHub Pages):
  - disparado por `push` em `main` e por `workflow_dispatch`;
  - permissões `contents: read`, `pages: write`, `id-token: write`;
  - job `build`:
    - `actions/checkout@v7`;
    - `withastro/action@v6` com `build-cmd: npm test && npm run build`;
  - job `deploy`: `environment: github-pages` e `actions/deploy-pages@v5`.

  **`validar-comunidade.yml`**:
  - disparado por `pull_request` com `paths: ['comunidade/**']`;
  - `permissions: contents: read`, sem segredos;
  - passos:
    1. `actions/checkout@v7` com `fetch-depth: 0`;
    2. `actions/setup-node` na versão mais recente (confira a tag atual)
       com `node-version: 24` e `cache: npm`;
    3. `npm ci`;
    4. `node scripts/validar-comunidade.mjs --pr-base origin/${{ github.base_ref }}`;
    5. `npm run build`, que valida o esquema e as licenças.

- [ ] **Passo 4: `CONTRIBUTING.md` e modelo de PR**

  - `CONTRIBUTING.md`: resumo de 10 linhas mais o link para a doc
    `enviar-projeto` publicada.
  - O modelo de PR traz um checklist:
    - só uma pasta;
    - licença escolhida;
    - fotos até 1 MB;
    - firmware com link para o código-fonte.

- [ ] **Passo 5: Verificar localmente**

  1. Rode `npm run validar` e veja sair com 0.
  2. Crie `comunidade/teste/virus.exe` e rode de novo: sai com 1 e o erro
     cita o arquivo. Apague o arquivo.
  3. Rode `npm test && npm run build` e veja passar.

- [ ] **Passo 6: Commit** — `"Validação da comunidade e publicação no GitHub Pages"`

---

### Tarefa 8: Verificação final

Sem código novo, só conferência e correções.

- [ ] **Passo 1:** Rode `npm test && npm run build` e confira que todos os
  testes passam, o `astro check` não dá erro e o verificador de links também
  não.
- [ ] **Passo 2: Percorrer as páginas no preview**

  Percorra todas as páginas em PT e EN, a 375 px e a 1280 px:
  - nenhuma rolagem horizontal;
  - o PT/EN de cada página cai na página correspondente;
  - os downloads apontam para a release atual.
- [ ] **Passo 3:** Rode o Lighthouse na inicial, em `/baixar/` e na página
  do projeto de exemplo. Acessibilidade tem de dar ≥ 90; corrija o que
  ficar abaixo.
- [ ] **Passo 4:** Rode `git status` e confira que está limpo. Reporte ao
  mantenedor o que ficou fora de verificação. A publicação real só acontece
  quando ele criar o repositório no GitHub e ativar o Pages (Settings →
  Pages → Source: GitHub Actions).
