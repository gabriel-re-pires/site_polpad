import { API_RELEASE } from '../lib/site';
import { extrairRelease } from '../lib/release';

/**
 * Busca a última release do Polpad e preenche a página:
 * [data-versao] recebe "vX.Y.Z" e aparece; [data-firmware] passa a apontar para o .bin.
 * Em qualquer falha (rede, limite da API, resposta estranha) a página fica como está:
 * os links de reserva continuam funcionando.
 */
export async function atualizarVersao(raiz: ParentNode = document): Promise<void> {
  try {
    const resposta = await fetch(API_RELEASE, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!resposta.ok) return;
    const info = extrairRelease(await resposta.json());
    if (!info) return;

    for (const el of raiz.querySelectorAll<HTMLElement>('[data-versao]')) {
      el.textContent = `v${info.versao}`;
      el.hidden = false;
    }
    if (info.firmwareUrl) {
      for (const el of raiz.querySelectorAll<HTMLAnchorElement>('[data-firmware]')) {
        el.href = info.firmwareUrl;
      }
    }
  } catch {
    // Sem rede ou API fora: mantém os links de reserva.
  }
}

atualizarVersao();
