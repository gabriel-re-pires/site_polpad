import { API_RELEASES } from '../lib/site';
import { extrairReleases, lerCache, paraCache, type InfoRelease } from '../lib/release';

const CHAVE = 'polpad-releases';

// sessionStorage pode falhar (aba anônima, cookies bloqueados): aí fica sem cache.
function doCache(): InfoRelease | null {
  try {
    return lerCache(sessionStorage.getItem(CHAVE), Date.now());
  } catch {
    return null;
  }
}

function guardar(info: InfoRelease): void {
  try {
    sessionStorage.setItem(CHAVE, paraCache(info, Date.now()));
  } catch {}
}

async function daApi(): Promise<InfoRelease | null> {
  const resposta = await fetch(API_RELEASES, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(5000),
  });
  if (!resposta.ok) return null;
  const info = extrairReleases(await resposta.json());
  if (info) guardar(info);
  return info;
}

// Em qualquer falha a página fica como está, com os links de reserva.
export async function atualizarVersao(raiz: ParentNode = document): Promise<void> {
  try {
    const info = doCache() ?? (await daApi());
    if (!info) return;

    for (const el of raiz.querySelectorAll<HTMLElement>('[data-versao]')) {
      // data-rotulo (opcional) vem antes do número: "Versão atual: v0.7.2".
      el.textContent = el.dataset.rotulo ? `${el.dataset.rotulo}: v${info.versao}` : `v${info.versao}`;
      el.hidden = false;
    }
    if (info.firmwareUrl) {
      for (const el of raiz.querySelectorAll<HTMLAnchorElement>('[data-firmware]')) {
        el.href = info.firmwareUrl;
      }
    }
  } catch {}
}

atualizarVersao();
