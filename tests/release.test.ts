import { describe, expect, it } from 'vitest';
import { extrairRelease } from '../src/lib/release';

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
