import ptBr from '../i18n/pt-br.json';
import en from '../i18n/en.json';

export type Idioma = 'pt-br' | 'en';
export const IDIOMAS: readonly Idioma[] = ['pt-br', 'en'];

export type ChaveRota = 'inicio' | 'baixar' | 'comunidade' | 'docs';

export const ROTAS: Record<ChaveRota, Record<Idioma, string>> = {
  inicio: { 'pt-br': '', en: '' },
  baixar: { 'pt-br': 'baixar', en: 'download' },
  comunidade: { 'pt-br': 'comunidade', en: 'community' },
  docs: { 'pt-br': 'docs', en: 'docs' },
};

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

export function langHtml(idioma: Idioma): string {
  return idioma === 'pt-br' ? 'pt-BR' : 'en';
}

/** `alternativa` é null quando a página não tem tradução de verdade. */
export function linksAlternativos(
  idioma: Idioma,
  atual: string,
  alternativa: string | null,
): { hreflang: string; href: string }[] {
  if (alternativa === null) return [];
  const pt = idioma === 'pt-br' ? atual : alternativa;
  return [
    { hreflang: langHtml(idioma), href: atual },
    { hreflang: langHtml(outroIdioma(idioma)), href: alternativa },
    { hreflang: 'x-default', href: pt },
  ];
}
