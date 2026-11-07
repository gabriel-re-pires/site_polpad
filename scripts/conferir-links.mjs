// Confere os links internos do site gerado (dist/).
// Uso: node scripts/conferir-links.mjs   (roda no fim do `npm run build`)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Todo href/src que começa com uma barra só (link interno absoluto). */
export function linksInternos(html) {
  const links = [];
  for (const m of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']*)["']/gi)) {
    const url = m[1];
    if (url.startsWith('/') && !url.startsWith('//')) links.push(url);
  }
  return links;
}

/** Todo href/src interno, absoluto ou relativo (fora esquemas como https:, mailto: e âncoras). */
function linksDaPagina(html) {
  const links = [];
  for (const m of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']*)["']/gi)) {
    const url = m[1];
    if (url === '' || url.startsWith('#') || url.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(url)) continue;
    links.push(url);
  }
  return links;
}

function paginasHtml(dir) {
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => path.join(e.parentPath, e.name));
}

/** Devolve um erro por link interno quebrado: "<arquivo.html>: <link> <motivo>". */
export function conferirDist(dist, base) {
  const prefixo = base.endsWith('/') ? base : `${base}/`;
  const erros = [];
  for (const pagina of paginasHtml(dist)) {
    const relativo = path.relative(dist, pagina);
    // URL da pasta da página, para resolver links relativos (ex.: ../../baixar/).
    const pastaDaPagina = path.dirname(relativo).split(path.sep).filter((p) => p !== '.').join('/');
    const urlDaPagina = `http://site${prefixo}${pastaDaPagina ? `${pastaDaPagina}/` : ''}`;
    for (const link of linksDaPagina(fs.readFileSync(pagina, 'utf8'))) {
      const limpo = new URL(link, urlDaPagina).pathname;
      if (!limpo.startsWith(prefixo)) {
        erros.push(`${relativo}: ${link} sem o base ${prefixo}`);
        continue;
      }
      const resto = decodeURIComponent(limpo.slice(prefixo.length));
      const alvo = resto === '' || resto.endsWith('/')
        ? path.join(dist, resto, 'index.html')
        : path.join(dist, resto);
      if (!fs.existsSync(alvo)) erros.push(`${relativo}: ${link} não existe em dist/`);
    }
  }
  return erros;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { BASE } = await import('../site.config.mjs');
  const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const erros = conferirDist(path.join(raiz, 'dist'), BASE);
  if (erros.length > 0) {
    console.error(`Links internos quebrados (${erros.length}):`);
    for (const e of erros) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log('Links internos: tudo certo.');
}
