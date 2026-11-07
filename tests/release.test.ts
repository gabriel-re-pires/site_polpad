import { describe, expect, it } from 'vitest';
import { extrairRelease, extrairReleases } from '../src/lib/release';

describe('extrairRelease', () => {
  it('pega a versão sem o v e o link do firmware', () => {
    const ok = {
      tag_name: 'v0.7.2',
      assets: [
        { name: 'Polpad-Windows-Instalador.exe', browser_download_url: 'https://x/w.exe' },
        { name: 'firmware-2.1.0.bin', browser_download_url: 'https://x/f.bin' },
      ],
    };
    expect(extrairRelease(ok)).toEqual({ versao: '0.7.2', firmwareUrl: 'https://x/f.bin' });
  });

  it('release sem firmware devolve firmwareUrl null', () => {
    expect(extrairRelease({ tag_name: '0.7.2', assets: [] })).toEqual({ versao: '0.7.2', firmwareUrl: null });
  });

  it('erro da API (limite de requisições) devolve null', () => {
    expect(extrairRelease({ message: 'API rate limit exceeded' })).toBeNull();
  });

  it('dados inválidos devolvem null', () => {
    expect(extrairRelease(null)).toBeNull();
    expect(extrairRelease('texto')).toBeNull();
    expect(extrairRelease({ tag_name: 42, assets: [] })).toBeNull();
    expect(extrairRelease({ tag_name: '', assets: [] })).toBeNull();
  });

  it('ignora anexos que só parecem firmware', () => {
    expect(
      extrairRelease({ tag_name: 'v1.0.0', assets: [{ name: 'firmware-velho.txt', browser_download_url: 'u' }] }),
    ).toEqual({ versao: '1.0.0', firmwareUrl: null });
  });

  it('assets ausente não quebra', () => {
    expect(extrairRelease({ tag_name: 'v1.0.0' })).toEqual({ versao: '1.0.0', firmwareUrl: null });
  });
});

describe('extrairReleases', () => {
  const app = (tag: string, extra = {}) => ({ tag_name: tag, draft: false, prerelease: false, assets: [], ...extra });
  const comFw = (tag: string, fw: string) =>
    app(tag, { assets: [{ name: `firmware-${fw}.bin`, browser_download_url: `https://x/${fw}.bin` }] });

  it('release só do app: versão da mais nova, firmware da última que tem .bin', () => {
    expect(extrairReleases([app('v0.7.3'), comFw('v0.7.2', '2.1.0'), app('v0.7.1')])).toEqual({
      versao: '0.7.3',
      firmwareUrl: 'https://x/2.1.0.bin',
    });
  });

  it('ignora rascunhos e pré-lançamentos', () => {
    expect(
      extrairReleases([app('v0.8.0', { prerelease: true }), comFw('v0.7.9', '9.9.9'), app('v0.7.5', { draft: true })]),
    ).toEqual({ versao: '0.7.9', firmwareUrl: 'https://x/9.9.9.bin' });
  });

  it('nenhuma release com firmware', () => {
    expect(extrairReleases([app('v0.7.3')])).toEqual({ versao: '0.7.3', firmwareUrl: null });
  });

  it('resposta que não é lista, ou lista vazia, vira null', () => {
    expect(extrairReleases({ message: 'API rate limit exceeded' })).toBeNull();
    expect(extrairReleases([])).toBeNull();
    expect(extrairReleases(null)).toBeNull();
  });
});

describe('nome do anexo de firmware (mesma regra do app)', () => {
  const com = (name: string) => extrairRelease({ tag_name: 'v1.0.0', assets: [{ name, browser_download_url: `https://x/${name}` }] });
  it('aceita sufixos e maiúsculas, como o app', () => {
    expect(com('firmware-2.2.0-rc1.bin')?.firmwareUrl).toBe('https://x/firmware-2.2.0-rc1.bin');
    expect(com('Firmware-2.2.0.BIN')?.firmwareUrl).toBe('https://x/Firmware-2.2.0.BIN');
  });
  it('continua recusando o que não é .bin de firmware', () => {
    expect(com('firmware-velho.txt')?.firmwareUrl).toBeNull();
    expect(com('Polpad-firmware.bin')?.firmwareUrl).toBeNull();
  });
});
