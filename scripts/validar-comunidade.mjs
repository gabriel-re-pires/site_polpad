// Confere os projetos em comunidade/ antes de entrarem no site.
// Uso: node scripts/validar-comunidade.mjs [--pr-base <ref>]
// Com --pr-base, também confere se o PR só mexe numa pasta de projeto.
// O esquema do projeto.yml (campos, tipo, licença) é conferido pelo build do Astro.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';

export const LIMITE_IMAGEM = 1_000_000;
export const LIMITE_PASTA = 25_000_000;
export const EXTENSOES = ['.yml', '.md', '.jpg', '.png', '.webp', '.stl', '.3mf', '.step', '.json', '.bin', '.zip'];
const IMAGENS = ['.jpg', '.png', '.webp'];
const SLUG_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function arquivosDa(dir) {
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath, e.name));
}

/** Caminho relativo seguro: sem "..", sem caminho absoluto. */
function caminhoSeguro(caminho) {
  return (
    typeof caminho === 'string' &&
    caminho !== '' &&
    !path.isAbsolute(caminho) &&
    !caminho.split(/[\\/]/).includes('..')
  );
}

/** Erros de uma pasta comunidade/<slug>/, no formato "<slug>: <motivo>". */
export function conferirPasta(dir) {
  const slug = path.basename(dir);
  const erros = [];
  const erro = (motivo) => erros.push(`${slug}: ${motivo}`);

  if (!SLUG_VALIDO.test(slug)) {
    erro('nome da pasta (slug) inválido: use só letras minúsculas, números e hífen');
  }

  let total = 0;
  for (const arquivo of arquivosDa(dir)) {
    const relativo = path.relative(dir, arquivo).split(path.sep).join('/');
    const tamanho = fs.statSync(arquivo).size;
    const ext = path.extname(arquivo).toLowerCase();
    total += tamanho;
    if (!EXTENSOES.includes(ext)) {
      erro(`${relativo}: extensão "${ext || '(nenhuma)'}" não é aceita (aceitas: ${EXTENSOES.join(' ')})`);
    } else if (IMAGENS.includes(ext) && tamanho > LIMITE_IMAGEM) {
      erro(`${relativo}: imagem com ${(tamanho / 1e6).toFixed(1)} MB, o limite é 1 MB`);
    }
  }
  if (total > LIMITE_PASTA) {
    erro(`a pasta tem ${(total / 1e6).toFixed(1)} MB, o limite é 25 MB (use "links" para arquivos grandes)`);
  }

  const yml = path.join(dir, 'projeto.yml');
  if (!fs.existsSync(yml)) {
    erro('falta o arquivo projeto.yml');
    return erros;
  }
  let dados;
  try {
    dados = parse(fs.readFileSync(yml, 'utf8'));
  } catch (e) {
    erro(`projeto.yml ilegível: ${e.message.split('\n')[0]}`);
    return erros;
  }
  if (typeof dados !== 'object' || dados === null) {
    erro('projeto.yml está vazio ou não é um mapa de campos');
    return erros;
  }

  const citados = [
    ...(dados.capa !== undefined ? [dados.capa] : []),
    ...(Array.isArray(dados.fotos) ? dados.fotos : []),
    ...(Array.isArray(dados.arquivos) ? dados.arquivos : []),
  ];
  for (const citado of citados) {
    if (!caminhoSeguro(citado)) {
      erro(`projeto.yml cita "${citado}": o caminho tem de ficar dentro da pasta do projeto`);
    } else if (!fs.existsSync(path.join(dir, citado))) {
      erro(`projeto.yml cita "${citado}", que não existe na pasta`);
    }
  }
  for (const link of Array.isArray(dados.links) ? dados.links : []) {
    const url = typeof link?.url === 'string' ? link.url.trim() : '';
    if (!/^https?:\/\//i.test(url)) {
      erro(`link "${link?.titulo ?? ''}": a url tem de começar com https:// (recebido "${url}")`);
    }
  }
  return erros;
}

/**
 * Arquivos que o PR muda em relação a `base`. Sem detectar renomeação: mover um arquivo de
 * fora para dentro de comunidade/ tem de aparecer também pelo caminho antigo.
 */
export function arquivosDoPR(base, cwd) {
  const saida = execFileSync('git', ['diff', '--no-renames', '--name-only', `${base}...HEAD`], {
    cwd,
    encoding: 'utf8',
  });
  return saida.split('\n').filter(Boolean);
}

/** Um PR que mexe na comunidade só pode mexer numa pasta comunidade/<slug>/. */
export function conferirCaminhosDoPR(arquivos) {
  const daComunidade = arquivos.filter((a) => a.startsWith('comunidade/'));
  if (daComunidade.length === 0) return [];

  const erros = [];
  const fora = arquivos.filter((a) => !a.startsWith('comunidade/'));
  if (fora.length > 0) {
    erros.push(`o PR mexe na comunidade e também fora dela: ${fora.join(', ')}. Envie o projeto num PR separado.`);
  }
  const soltos = daComunidade.filter((a) => a.split('/').length < 3);
  if (soltos.length > 0) {
    erros.push(`arquivos soltos em comunidade/: ${soltos.join(', ')}. Coloque-os dentro de comunidade/<nome-do-projeto>/.`);
  }
  const slugs = [...new Set(daComunidade.filter((a) => a.split('/').length >= 3).map((a) => a.split('/')[1]))];
  if (slugs.length > 1) {
    erros.push(`o PR mexe em mais de um projeto (${slugs.join(', ')}). Envie um projeto por PR.`);
  }
  return erros;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const comunidade = path.join(raiz, 'comunidade');
  const erros = [];

  for (const entrada of fs.readdirSync(comunidade, { withFileTypes: true })) {
    if (entrada.isDirectory()) erros.push(...conferirPasta(path.join(comunidade, entrada.name)));
    else erros.push(`comunidade/${entrada.name}: arquivo solto; cada projeto fica na sua própria pasta`);
  }

  const i = process.argv.indexOf('--pr-base');
  if (i !== -1) {
    erros.push(...conferirCaminhosDoPR(arquivosDoPR(process.argv[i + 1], raiz)));
  }

  if (erros.length > 0) {
    console.error(`Problemas encontrados (${erros.length}):`);
    for (const e of erros) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log('Comunidade: tudo certo.');
}
