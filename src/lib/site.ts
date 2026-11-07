export const REPO_POLPAD = 'https://github.com/gabriel-re-pires/polpad';
export const REPO_SITE = 'https://github.com/gabriel-re-pires/site_polpad';

const ULTIMA = `${REPO_POLPAD}/releases/latest`;

export const DOWNLOADS = {
  windows: `${ULTIMA}/download/Polpad-Windows-Instalador.exe`,
  linux: `${ULTIMA}/download/Polpad-Linux-Instalador.tar.gz`,
  sha256: `${ULTIMA}/download/SHA256SUMS.txt`,
  /** O nome do firmware muda a cada versão; sem a API, o link cai na página da release. */
  firmwareReserva: ULTIMA,
} as const;

export const API_RELEASE = 'https://api.github.com/repos/gabriel-re-pires/polpad/releases/latest';

/** Arquivos do hardware no repositório do app. */
export const HARDWARE = {
  caseTopo: `${REPO_POLPAD}/blob/main/hardware/case/case_top.stl`,
  caseBase: `${REPO_POLPAD}/blob/main/hardware/case/case_bottom.stl`,
  gcode: `${REPO_POLPAD}/tree/main/hardware/case/gcode-ender3-v3-se`,
} as const;

export const AUTORES: { nome: string; github: string }[] = [
  { nome: 'Gabriel R. Pires', github: 'gabriel-re-pires' },
  { nome: 'Artur', github: 'Artur-Brasileiro' },
];
