import { langHtml, type Idioma } from './i18n';

// UTC: a data do projeto.yml não muda de dia por causa do fuso.
export function dataPorExtenso(data: Date, idioma: Idioma): string {
  return new Intl.DateTimeFormat(langHtml(idioma), { dateStyle: 'long', timeZone: 'UTC' }).format(data);
}

export function resumo(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  const espaco = corte.lastIndexOf(' ');
  return `${(espaco > 0 ? corte.slice(0, espaco) : corte).trimEnd()}…`;
}

export function paragrafos(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p !== '');
}
