import ptBr from '../i18n/pt-br.json';
import en from '../i18n/en.json';

export type Idioma = 'pt-br' | 'en';
export const IDIOMAS: readonly Idioma[] = ['pt-br', 'en'];

export type ChaveRota = 'inicio' | 'baixar' | 'comunidade' | 'docs';

/** Segmento de URL de cada rota principal, por idioma. */
export const ROTAS: Record<ChaveRota, Record<Idioma, string>> = {
  inicio: { 'pt-br': '', en: '' },
  baixar: { 'pt-br': 'baixar', en: 'download' },
  comunidade: { 'pt-br': 'comunidade', en: 'community' },
  docs: { 'pt-br': 'docs', en: 'docs' },
};

/** Monta um caminho interno: base + prefixo do idioma + partes, sempre terminando em "/". */
export function caminhoCom(base: string, idioma: Idioma, ...partes: string[]): string {
  const segmentos = [base, idioma === 'en' ? 'en' : '', ...partes]
    .flatMap((p) => p.split('/'))
    .filter((p) => p !== '');
  return segmentos.length === 0 ? '/' : `/${segmentos.join('/')}/`;
}

export function caminho(idioma: Idioma, ...partes: string[]): string {
  return caminhoCom(import.meta.env.BASE_URL, idioma, ...partes);
}

export function rota(idioma: Idioma, chave: ChaveRota, ...extra: string[]): string {
  return caminho(idioma, ROTAS[chave][idioma], ...extra);
}

export function outroIdioma(idioma: Idioma): Idioma {
  return idioma === 'pt-br' ? 'en' : 'pt-br';
}

export type ChaveTexto = keyof typeof ptBr;

const TEXTOS: Record<Idioma, Record<ChaveTexto, string>> = { 'pt-br': ptBr, en };

export function t(idioma: Idioma, chave: ChaveTexto): string {
  return TEXTOS[idioma][chave];
}

/** Código de idioma para o atributo lang do HTML. */
export function langHtml(idioma: Idioma): string {
  return idioma === 'pt-br' ? 'pt-BR' : 'en';
}
