import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { conferirCaminhosDoPR, conferirPasta, formatarParaActions } from '../scripts/validar-comunidade.mjs';

const temporarios = [];
afterEach(() => {
  for (const d of temporarios.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

const YML_VALIDO = `titulo: Teste
tipo: case
autor:
  nome: Fulano
descricao: Um teste.
licenca: CC-BY-4.0
data: 2026-11-07
capa: capa.png
arquivos:
  - arquivos/a.stl
`;

/** Cria comunidade/<slug>/ numa pasta temporária com os arquivos dados. */
function projeto(slug, arquivos) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'comunidade-'));
  temporarios.push(raiz);
  const dir = path.join(raiz, slug);
  fs.mkdirSync(dir);
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    const alvo = path.join(dir, nome);
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.writeFileSync(alvo, conteudo);
  }
  return dir;
}

const basico = (extra = {}) => ({
  'projeto.yml': YML_VALIDO,
  'capa.png': Buffer.alloc(10),
  'arquivos/a.stl': 'solid',
  ...extra,
});

describe('conferirPasta', () => {
  it('pasta válida não tem erros', () => {
    expect(conferirPasta(projeto('meu-case', basico()))).toEqual([]);
  });

  it('arquivo citado que não existe', () => {
    const dir = projeto('meu-case', basico({ 'projeto.yml': YML_VALIDO.replace('arquivos/a.stl', 'arquivos/sumiu.stl') }));
    const erros = conferirPasta(dir);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('sumiu.stl');
  });

  it('capa citada que não existe', () => {
    const dir = projeto('meu-case', basico({ 'projeto.yml': YML_VALIDO.replace('capa.png', 'outra.png') }));
    expect(conferirPasta(dir).some((e) => e.includes('outra.png'))).toBe(true);
  });

  it('extensão proibida', () => {
    const erros = conferirPasta(projeto('meu-case', basico({ 'virus.exe': 'MZ' })));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('virus.exe');
    expect(erros[0]).toContain('extensão');
  });

  it('imagem acima de 1 MB', () => {
    const erros = conferirPasta(projeto('meu-case', basico({ 'capa.png': Buffer.alloc(1_000_001) })));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('1 MB');
  });

  it('pasta acima de 25 MB', () => {
    const grandes = {};
    for (let i = 0; i < 3; i++) grandes[`arquivos/p${i}.stl`] = Buffer.alloc(9_000_000);
    const erros = conferirPasta(projeto('meu-case', basico(grandes)));
    expect(erros.some((e) => e.includes('25 MB'))).toBe(true);
  });

  it('slug inválido', () => {
    const erros = conferirPasta(projeto('Meu_Case', basico()));
    expect(erros.some((e) => e.includes('slug'))).toBe(true);
  });

  it('caminho saindo da pasta', () => {
    const dir = projeto('meu-case', basico({ 'projeto.yml': YML_VALIDO.replace('arquivos/a.stl', '../../etc/passwd') }));
    expect(conferirPasta(dir).some((e) => e.includes('../../etc/passwd'))).toBe(true);
  });

  it('sem projeto.yml', () => {
    const erros = conferirPasta(projeto('meu-case', { 'capa.png': Buffer.alloc(10) }));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('projeto.yml');
  });

  it('link com esquema que não é http(s) é recusado', () => {
    for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<b>x</b>', 'vbscript:x']) {
      const yml = YML_VALIDO + `links:
  - titulo: Printables
    url: "${url}"
`;
      const erros = conferirPasta(projeto('meu-case', basico({ 'projeto.yml': yml })));
      expect(erros, url).toHaveLength(1);
      expect(erros[0]).toContain('https');
    }
  });

  it('link https passa', () => {
    const yml = YML_VALIDO + 'links:\n  - titulo: Printables\n    url: https://www.printables.com/x\n';
    expect(conferirPasta(projeto('meu-case', basico({ 'projeto.yml': yml })))).toEqual([]);
  });

  it('YAML ilegível', () => {
    const erros = conferirPasta(projeto('meu-case', basico({ 'projeto.yml': 'titulo: [sem fechar' })));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('projeto.yml');
  });

  it('aceita .jpeg (e .JPG maiúsculo) como imagem', () => {
    const yml = YML_VALIDO.replace('capa: capa.png', 'capa: capa.jpeg');
    const dir = projeto('meu-case', basico({ 'projeto.yml': yml, 'capa.jpeg': Buffer.alloc(10), 'foto.JPG': Buffer.alloc(10) }));
    expect(conferirPasta(dir)).toEqual([]);
  });

  it('.jpeg acima de 1 MB também é barrado', () => {
    const yml = YML_VALIDO.replace('capa: capa.png', 'capa: capa.jpeg');
    const erros = conferirPasta(projeto('meu-case', basico({ 'projeto.yml': yml, 'capa.jpeg': Buffer.alloc(1_000_001) })));
    expect(erros.some((e) => e.includes('1 MB'))).toBe(true);
  });

  it('capa ou foto que não é imagem é recusada', () => {
    const yml = YML_VALIDO.replace('capa: capa.png', 'capa: arquivos/a.stl');
    const erros = conferirPasta(projeto('meu-case', basico({ 'projeto.yml': yml })));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('arquivos/a.stl');
    expect(erros[0]).toContain('imagem');
  });

  it('link simbólico é recusado', (ctx) => {
    const dir = projeto('meu-case', basico());
    try {
      fs.symlinkSync(path.join(dir, 'capa.png'), path.join(dir, 'atalho.png'));
    } catch {
      ctx.skip(); // Windows sem modo de desenvolvedor não cria symlink; o CI (Linux) roda este teste.
    }
    const erros = conferirPasta(dir);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('atalho.png');
    expect(erros[0]).toContain('link simbólico');
  });
});

describe('formatarParaActions', () => {
  it('vira anotação de erro do GitHub, escapando quebras de linha e %', () => {
    expect(formatarParaActions(['meu-case: 100% errado\nlinha 2'])).toEqual([
      '::error title=Comunidade::meu-case: 100%25 errado%0Alinha 2',
    ]);
  });
});

describe('conferirCaminhosDoPR', () => {
  it('PR dentro de uma pasta só passa', () => {
    expect(conferirCaminhosDoPR(['comunidade/a/projeto.yml', 'comunidade/a/capa.png'])).toEqual([]);
  });
  it('PR em dois projetos falha citando os dois', () => {
    const erros = conferirCaminhosDoPR(['comunidade/a/projeto.yml', 'comunidade/b/projeto.yml']);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('a');
    expect(erros[0]).toContain('b');
  });
  it('PR que mexe fora da comunidade falha citando o arquivo', () => {
    const erros = conferirCaminhosDoPR(['comunidade/a/projeto.yml', 'src/lib/i18n.ts']);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('src/lib/i18n.ts');
  });
  it('arquivo solto direto em comunidade/ falha', () => {
    expect(conferirCaminhosDoPR(['comunidade/leia.md'])).toHaveLength(1);
  });
  it('PR sem nada da comunidade passa (mantenedor)', () => {
    expect(conferirCaminhosDoPR(['README.md'])).toEqual([]);
  });
});
