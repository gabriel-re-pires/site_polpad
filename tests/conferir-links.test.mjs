import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { conferirDist, linksInternos } from '../scripts/conferir-links.mjs';

const temporarios = [];
function distTemporario(arquivos) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-'));
  temporarios.push(dir);
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    const alvo = path.join(dir, nome);
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.writeFileSync(alvo, conteudo);
  }
  return dir;
}
afterEach(() => {
  for (const d of temporarios.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe('linksInternos', () => {
  it('pega só href/src absolutos internos', () => {
    const html =
      '<a href="/x/">x</a><img src="/site_polpad/a.png"><a href="https://g.com">g</a>' +
      '<a href="#topo">t</a><a href="//cdn.com/a.js">c</a><a href="mailto:a@b.c">m</a>';
    expect(linksInternos(html)).toEqual(['/x/', '/site_polpad/a.png']);
  });
});

describe('conferirDist', () => {
  it('acusa link sem o base e link para página inexistente', () => {
    const dir = distTemporario({
      'index.html': '<a href="/site_polpad/baixar/">b</a><a href="/sobre/">s</a>',
    });
    const erros = conferirDist(dir, '/site_polpad/');
    expect(erros).toHaveLength(2);
    expect(erros.some((e) => e.includes('/sobre/') && e.includes('sem o base'))).toBe(true);
    expect(erros.some((e) => e.includes('/site_polpad/baixar/') && e.includes('não existe'))).toBe(true);
  });

  it('aceita páginas e arquivos que existem, ignorando query e hash', () => {
    const dir = distTemporario({
      'index.html': '<a href="/site_polpad/baixar/#topo">b</a><img src="/site_polpad/a.png?v=1">',
      'baixar/index.html': 'ok',
      'a.png': 'png',
    });
    expect(conferirDist(dir, '/site_polpad/')).toEqual([]);
  });

  it('funciona com base raiz', () => {
    const dir = distTemporario({
      'index.html': '<a href="/baixar/">b</a>',
      'baixar/index.html': 'ok',
    });
    expect(conferirDist(dir, '/')).toEqual([]);
  });

  it('confere páginas em subpastas', () => {
    const dir = distTemporario({
      'index.html': 'ok',
      'en/index.html': '<a href="/site_polpad/en/nada/">n</a>',
    });
    const erros = conferirDist(dir, '/site_polpad');
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain(path.join('en', 'index.html'));
  });
});
