import { langHtml, type Idioma } from './i18n';

/** Data por extenso no idioma, sem deslocar o dia pelo fuso. */
export function dataPorExtenso(data: Date, idioma: Idioma): string {
  return new Intl.DateTimeFormat(langHtml(idioma), { dateStyle: 'long', timeZone: 'UTC' }).format(data);
}

/** Divide um texto em parágrafos pelas linhas em branco. */
export function paragrafos(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p !== '');
}
