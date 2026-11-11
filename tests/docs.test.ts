import { describe, expect, it } from 'vitest';
import { corDoGuia, docsDoIdioma, slugDoDoc, traducao, urlDoc } from '../src/lib/docs';

const doc = (id: string, chave: string, ordem: number) => ({ id, data: { chave, ordem } });
const montagemPt = doc('pt-br/montagem', 'montagem', 1);
const instalarPt = doc('pt-br/instalar', 'instalar', 2);
const assemblyEn = doc('en/assembly', 'montagem', 1);
const soPt = doc('pt-br/so-pt', 'so-pt', 3);
const docs = [soPt, assemblyEn, instalarPt, montagemPt];

describe('docsDoIdioma', () => {
  it('filtra pelo idioma e ordena por ordem', () => {
    expect(docsDoIdioma(docs, 'pt-br').map((d) => d.id)).toEqual([
      'pt-br/montagem',
      'pt-br/instalar',
      'pt-br/so-pt',
    ]);
    expect(docsDoIdioma(docs, 'en').map((d) => d.id)).toEqual(['en/assembly']);
  });
});

describe('slugDoDoc', () => {
  it('tira o prefixo do idioma', () => {
    expect(slugDoDoc('en/assembly')).toBe('assembly');
    expect(slugDoDoc('pt-br/enviar-projeto')).toBe('enviar-projeto');
  });
});

describe('traducao', () => {
  it('acha o doc do outro idioma pela chave', () => {
    expect(traducao(docs, montagemPt, 'en')?.id).toBe('en/assembly');
  });
  it('doc sem tradução devolve undefined', () => {
    expect(traducao(docs, soPt, 'en')).toBeUndefined();
  });
});

describe('urlDoc', () => {
  it('monta a rota da doc no idioma', () => {
    expect(urlDoc('en', assemblyEn)).toBe('/en/docs/assembly/');
    expect(urlDoc('pt-br', montagemPt)).toBe('/docs/montagem/');
  });
});

describe('corDoGuia', () => {
  it('dá a cada guia uma cor, na ordem do índice (o Firmware é claro como o Instalar), e recomeça depois da quarta', () => {
    expect([0, 1, 2, 3].map(corDoGuia)).toEqual(['roxo', 'claro', 'claro', 'lima']);
    expect(corDoGuia(4)).toBe('roxo');
  });
});
