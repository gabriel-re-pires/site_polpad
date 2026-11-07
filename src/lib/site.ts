export const REPO_POLPAD = 'https://github.com/gabriel-re-pires/polpad';
export const REPO_SITE = 'https://github.com/gabriel-re-pires/site_polpad';

const ULTIMA = `${REPO_POLPAD}/releases/latest`;

export const DOWNLOADS = {
  windows: `${ULTIMA}/download/Polpad-Windows-Instalador.exe`,
  linux: `${ULTIMA}/download/Polpad-Linux-Instalador.tar.gz`,
  sha256: `${ULTIMA}/download/SHA256SUMS.txt`,
  /** O nome do firmware muda a cada versão e nem toda release traz um; sem a API, vai à lista de releases. */
  firmwareReserva: `${REPO_POLPAD}/releases`,
} as const;

/** Lista de releases (mais nova primeiro): a última pode ser só do app, sem firmware. */
export const API_RELEASES = 'https://api.github.com/repos/gabriel-re-pires/polpad/releases?per_page=10';

/** Arquivos do hardware no repositório do app. Os STL usam raw/ para baixar direto. */
export const HARDWARE = {
  caseTopo: `${REPO_POLPAD}/raw/main/hardware/case/case_top.stl`,
  caseBase: `${REPO_POLPAD}/raw/main/hardware/case/case_bottom.stl`,
  gcode: `${REPO_POLPAD}/tree/main/hardware/case/gcode-ender3-v3-se`,
} as const;

export const AUTORES: { nome: string; github: string }[] = [
  { nome: 'Gabriel R. Pires', github: 'gabriel-re-pires' },
  { nome: 'Artur', github: 'Artur-Brasileiro' },
];
