import { describe, expect, it } from 'vitest';
import { caminhoCom, outroIdioma, rota, t } from '../src/lib/i18n';
import ptBr from '../src/i18n/pt-br.json';
import en from '../src/i18n/en.json';

describe('caminhoCom', () => {
  it('raiz em pt-br com base terminada em barra', () => {
    expect(caminhoCom('/site_polpad/', 'pt-br')).toBe('/site_polpad/');
  });
  it('prefixa /en/ e acrescenta a barra do base', () => {
    expect(caminhoCom('/site_polpad', 'en')).toBe('/site_polpad/en/');
  });
  it('junta várias partes e termina em barra', () => {
    expect(caminhoCom('/site_polpad/', 'pt-br', 'comunidade', 'meu-case')).toBe(
      '/site_polpad/comunidade/meu-case/',
    );
  });
  it('funciona com base raiz (domínio próprio)', () => {
    expect(caminhoCom('/', 'en', 'download')).toBe('/en/download/');
  });
  it('partes vazias não geram barra dupla', () => {
    expect(caminhoCom('/', 'pt-br', '')).toBe('/');
    expect(caminhoCom('/site_polpad/', 'en', '', 'docs')).toBe('/site_polpad/en/docs/');
  });
});

describe('rota', () => {
  it('traduz o caminho da rota para o idioma', () => {
    expect(rota('en', 'baixar')).toBe('/en/download/');
    expect(rota('pt-br', 'baixar')).toBe('/baixar/');
    expect(rota('pt-br', 'inicio')).toBe('/');
    expect(rota('en', 'comunidade', 'meu-case')).toBe('/en/community/meu-case/');
  });
});

describe('idiomas', () => {
  it('outroIdioma alterna', () => {
    expect(outroIdioma('pt-br')).toBe('en');
    expect(outroIdioma('en')).toBe('pt-br');
  });
  it('en.json tem exatamente as mesmas chaves de pt-br.json', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ptBr).sort());
  });
  it('t devolve o texto do idioma', () => {
    expect(t('pt-br', 'nav_baixar')).toBe('Baixar');
    expect(t('en', 'nav_baixar')).toBe('Download');
  });
});
