export interface InfoRelease {
  versao: string;
  firmwareUrl: string | null;
}

const NOME_FIRMWARE = /^firmware-\d+\.\d+\.\d+\.bin$/;

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
