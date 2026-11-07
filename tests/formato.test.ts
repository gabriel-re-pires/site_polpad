import { describe, expect, it } from 'vitest';
import { dataPorExtenso, paragrafos } from '../src/lib/formato';

describe('dataPorExtenso', () => {
  it('formata no idioma sem perder o dia por fuso', () => {
    const d = new Date('2026-11-07');
    expect(dataPorExtenso(d, 'pt-br')).toBe('7 de novembro de 2026');
    expect(dataPorExtenso(d, 'en')).toBe('November 7, 2026');
  });
});

describe('paragrafos', () => {
  it('separa por linha em branco e junta quebras simples', () => {
    expect(paragrafos('linha um\nlinha dois\n\n  segundo  \n\n\n')).toEqual([
      'linha um linha dois',
      'segundo',
    ]);
  });
  it('texto vazio não gera parágrafo', () => {
    expect(paragrafos('  \n ')).toEqual([]);
  });
});
