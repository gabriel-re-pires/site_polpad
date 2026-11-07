import { describe, expect, it } from 'vitest';
import { licencaPermitida, ordenarPorData, SLUG_VALIDO, urlArquivo } from '../src/lib/comunidade';

describe('licencaPermitida', () => {
  it('firmware só aceita GPL-3.0-or-later', () => {
    expect(licencaPermitida('firmware', 'GPL-3.0-or-later')).toBe(true);
    expect(licencaPermitida('firmware', 'CC-BY-4.0')).toBe(false);
  });
  it('perfil aceita CC0', () => {
    expect(licencaPermitida('perfil', 'CC0-1.0')).toBe(true);
    expect(licencaPermitida('perfil', 'CERN-OHL-S-2.0')).toBe(false);
  });
  it('case e build aceitam CERN-OHL-S-2.0', () => {
    expect(licencaPermitida('case', 'CERN-OHL-S-2.0')).toBe(true);
    expect(licencaPermitida('build', 'CC-BY-SA-4.0')).toBe(true);
  });
});

describe('SLUG_VALIDO', () => {
  it('aceita minúsculas, números e hífen simples', () => {
    expect(SLUG_VALIDO.test('meu-case-2')).toBe(true);
  });
  it('recusa maiúsculas, sublinhado e hífen nas pontas', () => {
    expect(SLUG_VALIDO.test('Meu_Case')).toBe(false);
    expect(SLUG_VALIDO.test('-case')).toBe(false);
    expect(SLUG_VALIDO.test('case-')).toBe(false);
    expect(SLUG_VALIDO.test('case--x')).toBe(false);
  });
});

describe('urlArquivo', () => {
  it('codifica espaço e acento e preserva as barras', () => {
    expect(urlArquivo('meu-case', 'arquivos/tampa nova ç.stl')).toBe(
      'https://github.com/gabriel-re-pires/site_polpad/raw/main/comunidade/meu-case/arquivos/tampa%20nova%20%C3%A7.stl',
    );
  });
});

describe('ordenarPorData', () => {
  it('mais novo primeiro, sem mudar a lista original', () => {
    const velho = { id: 'a', data: { data: new Date('2026-01-01') } };
    const novo = { id: 'b', data: { data: new Date('2026-03-01') } };
    const lista = [velho, novo];
    expect(ordenarPorData(lista).map((p) => p.id)).toEqual(['b', 'a']);
    expect(lista.map((p) => p.id)).toEqual(['a', 'b']);
  });
});
