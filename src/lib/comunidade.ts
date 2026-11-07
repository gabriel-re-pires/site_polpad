export const TIPOS = ['case', 'perfil', 'build', 'firmware'] as const;
export type TipoProjeto = (typeof TIPOS)[number];

/** Licenças (identificadores SPDX) aceitas para cada tipo de projeto. */
export const LICENCAS_POR_TIPO: Record<TipoProjeto, readonly string[]> = {
  case: ['CC-BY-4.0', 'CC-BY-SA-4.0', 'CERN-OHL-S-2.0'],
  build: ['CC-BY-4.0', 'CC-BY-SA-4.0', 'CERN-OHL-S-2.0'],
  perfil: ['CC0-1.0', 'CC-BY-4.0'],
  firmware: ['GPL-3.0-or-later'],
};

export function licencaPermitida(tipo: TipoProjeto, licenca: string): boolean {
  return LICENCAS_POR_TIPO[tipo].includes(licenca);
}

export const SLUG_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const RAW = 'https://github.com/gabriel-re-pires/site_polpad/raw/main/comunidade';

/** Link direto para baixar um arquivo de um projeto da comunidade. */
export function urlArquivo(slug: string, arquivo: string): string {
  const partes = [slug, ...arquivo.split('/')].map(encodeURIComponent);
  return `${RAW}/${partes.join('/')}`;
}

export function ordenarPorData<T extends { data: { data: Date } }>(projetos: T[]): T[] {
  return [...projetos].sort((a, b) => b.data.data.getTime() - a.data.data.getTime());
}
