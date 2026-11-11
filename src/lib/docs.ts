import { rota, type Idioma } from './i18n';

export interface DocBasico {
  id: string;
  data: { chave: string; ordem: number };
}

const idiomaDoId = (id: string) => id.slice(0, id.indexOf('/'));

export function docsDoIdioma<T extends DocBasico>(docs: T[], idioma: Idioma): T[] {
  return docs.filter((d) => idiomaDoId(d.id) === idioma).sort((a, b) => a.data.ordem - b.data.ordem);
}

export function slugDoDoc(id: string): string {
  return id.slice(id.indexOf('/') + 1);
}

export function traducao<T extends DocBasico>(docs: T[], doc: DocBasico, idioma: Idioma): T | undefined {
  return docs.find((d) => idiomaDoId(d.id) === idioma && d.data.chave === doc.data.chave);
}

export function urlDoc(idioma: Idioma, doc: DocBasico): string {
  return rota(idioma, 'docs', slugDoDoc(doc.id));
}

/** Cor de cada guia, na ordem: a mesma no índice e no topo da página do guia (o Firmware também é claro, a pedido). */
export const CORES_DOS_GUIAS = ['roxo', 'claro', 'claro', 'lima'] as const;
export const corDoGuia = (posicao: number) => CORES_DOS_GUIAS[posicao % CORES_DOS_GUIAS.length];
