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

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff];
const imagem = (assinatura, tamanho = 10) => {
  const b = Buffer.alloc(tamanho);
  b.set(assinatura);
  return b;
};

const basico = (extra = {}) => ({
  'projeto.yml': YML_VALIDO,
  'capa.png': imagem(PNG),
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
    const erros = conferirPasta(projeto('meu-case', basico({ 'capa.png': imagem(PNG, 1_000_001) })));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('1 MB');
  });

  it('pasta acima de 25 MB', () => {
    const grandes = {};
    for (let i = 0; i < 3; i++) grandes[`arquivos/p${i}.stl`] = Buffer.from('solid'.padEnd(9_000_000));
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
    const erros = conferirPasta(projeto('meu-case', { 'capa.png': imagem(PNG) }));
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
    const dir = projeto('meu-case', basico({ 'projeto.yml': yml, 'capa.jpeg': imagem(JPEG), 'foto.JPG': imagem(JPEG) }));
    expect(conferirPasta(dir)).toEqual([]);
  });

  it('.jpeg acima de 1 MB também é barrado', () => {
    const yml = YML_VALIDO.replace('capa: capa.png', 'capa: capa.jpeg');
    const erros = conferirPasta(projeto('meu-case', basico({ 'projeto.yml': yml, 'capa.jpeg': imagem(JPEG, 1_000_001) })));
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
      ctx.skip(); // Windows sem modo de desenvolvedor não cria symlink.
    }
    const erros = conferirPasta(dir);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('atalho.png');
    expect(erros[0]).toContain('link simbólico');
  });

  it('arquivo com conteúdo diferente da extensão é recusado', () => {
    const erros = conferirPasta(projeto('meu-case', basico({ 'capa.png': Buffer.from('MZ executável') })));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('capa.png');
    expect(erros[0]).toContain('conteúdo');
  });

  it('STL binário com tamanho coerente passa', () => {
    const stl = Buffer.alloc(84 + 50 * 2);
    stl.writeUInt32LE(2, 80);
    expect(conferirPasta(projeto('meu-case', basico({ 'arquivos/a.stl': stl })))).toEqual([]);
  });

  it('STL binário com bytes sobrando no fim passa; curto demais não', () => {
    const sobra = Buffer.alloc(84 + 50 * 2 + 3);
    sobra.writeUInt32LE(2, 80);
    expect(conferirPasta(projeto('meu-case', basico({ 'arquivos/a.stl': sobra })))).toEqual([]);
    const curto = Buffer.alloc(84 + 50);
    curto.writeUInt32LE(2, 80);
    expect(conferirPasta(projeto('meu-case', basico({ 'arquivos/a.stl': curto })))).toHaveLength(1);
  });

  it('.zip não é aceito', () => {
    const erros = conferirPasta(projeto('meu-case', basico({ 'tudo.zip': Buffer.from([0x50, 0x4b, 3, 4]) })));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('extensão');
  });

  it('texto com byte nulo é recusado', () => {
    const erros = conferirPasta(projeto('meu-case', basico({ 'leia.md': Buffer.from([0x61, 0, 0x62]) })));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('leia.md');
  });

  it('.bin fora de projeto de firmware é recusado', () => {
    const erros = conferirPasta(projeto('meu-case', basico({ 'fw.bin': Buffer.alloc(16) })));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('firmware');
  });

  it('.bin em projeto de firmware passa', () => {
    const yml = YML_VALIDO.replace('tipo: case', 'tipo: firmware').replace('CC-BY-4.0', 'GPL-3.0-or-later');
    expect(conferirPasta(projeto('meu-fw', basico({ 'projeto.yml': yml, 'fw.bin': Buffer.alloc(16) })))).toEqual([]);
  });

  it('mais arquivos que o limite é recusado', () => {
    const muitos = {};
    for (let i = 0; i < 30; i++) muitos[`arquivos/p${i}.stl`] = 'solid';
    const erros = conferirPasta(projeto('meu-case', basico(muitos)));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('limite é 30');
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
