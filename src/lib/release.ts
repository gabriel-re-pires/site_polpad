export interface InfoRelease {
  versao: string;
  firmwareUrl: string | null;
}

/** A mesma regra do app (polpad/src/polpad/device/firmware_release.py, ASSET_PATTERN). */
const NOME_FIRMWARE = /^firmware[\w.-]*\.bin$/i;

/** Lê a resposta de /releases/latest da API do GitHub. Qualquer coisa inesperada vira null. */
export function extrairRelease(dados: unknown): InfoRelease | null {
  if (typeof dados !== 'object' || dados === null) return null;
  const { tag_name, assets } = dados as { tag_name?: unknown; assets?: unknown };
  if (typeof tag_name !== 'string' || tag_name === '') return null;

  let firmwareUrl: string | null = null;
  if (Array.isArray(assets)) {
    for (const anexo of assets) {
      if (
        typeof anexo?.name === 'string' &&
        NOME_FIRMWARE.test(anexo.name) &&
        typeof anexo.browser_download_url === 'string'
      ) {
        firmwareUrl = anexo.browser_download_url;
        break;
      }
    }
  }
  return { versao: tag_name.replace(/^v/, ''), firmwareUrl };
}

/**
 * Lê a resposta de /releases (mais nova primeiro). A versão vem da release publicada mais
 * recente; o firmware, da mais recente que tem um .bin — releases só do app não trazem firmware.
 */
export function extrairReleases(lista: unknown): InfoRelease | null {
  if (!Array.isArray(lista)) return null;
  const publicadas = lista
    .filter((r) => typeof r === 'object' && r !== null && !r.draft && !r.prerelease)
    .map(extrairRelease)
    .filter((r): r is InfoRelease => r !== null);
  if (publicadas.length === 0) return null;
  const comFirmware = publicadas.find((r) => r.firmwareUrl !== null);
  return { versao: publicadas[0].versao, firmwareUrl: comFirmware?.firmwareUrl ?? null };
}

/** Por quanto tempo a resposta da API vale no navegador (a API sem login dá 60 consultas/hora). */
export const CACHE_MS = 10 * 60 * 1000;

export function paraCache(info: InfoRelease, agora: number): string {
  return JSON.stringify({ quando: agora, info });
}

/** Lê o que paraCache guardou. Vazio, lixo, formato errado ou fora do prazo vira null. */
export function lerCache(texto: string | null, agora: number): InfoRelease | null {
  if (!texto) return null;
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    return null;
  }
  const { quando, info } = (dados ?? {}) as { quando?: unknown; info?: Partial<InfoRelease> };
  if (typeof quando !== 'number' || quando > agora || agora - quando > CACHE_MS) return null;
  if (typeof info?.versao !== 'string' || info.versao === '') return null;
  if (info.firmwareUrl !== null && typeof info.firmwareUrl !== 'string') return null;
  return { versao: info.versao, firmwareUrl: info.firmwareUrl };
}
