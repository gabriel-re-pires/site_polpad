import { rota, type Idioma } from './i18n';

const SLUGS_DOCS = {
  montagem: { 'pt-br': 'montagem', en: 'assembly' },
  instalar: { 'pt-br': 'instalar', en: 'install' },
  firmware: { 'pt-br': 'firmware', en: 'firmware' },
  'enviar-projeto': { 'pt-br': 'enviar-projeto', en: 'submit-project' },
} as const;

type ChaveDoc = keyof typeof SLUGS_DOCS;

export function urlDocPorChave(idioma: Idioma, chave: ChaveDoc): string {
  return rota(idioma, 'docs', SLUGS_DOCS[chave][idioma]);
}

export const urlEnviarProjeto = (idioma: Idioma) => urlDocPorChave(idioma, 'enviar-projeto');
export const urlMontagem = (idioma: Idioma) => urlDocPorChave(idioma, 'montagem');
export const urlInstalar = (idioma: Idioma) => urlDocPorChave(idioma, 'instalar');
