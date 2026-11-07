import { rota, type Idioma } from './i18n';

/** Doc "como enviar um projeto". Até as docs existirem, aponta para o índice das docs. */
export function urlEnviarProjeto(idioma: Idioma): string {
  return rota(idioma, 'docs');
}

/** Doc de montagem (hardware). Até as docs existirem, aponta para o índice das docs. */
export function urlMontagem(idioma: Idioma): string {
  return rota(idioma, 'docs');
}
