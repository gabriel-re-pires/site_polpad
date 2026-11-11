export const REPO_POLPAD = 'https://github.com/gabriel-re-pires/polpad';
export const REPO_SITE = 'https://github.com/gabriel-re-pires/site_polpad';

const ULTIMA = `${REPO_POLPAD}/releases/latest`;

export const DOWNLOADS = {
  windows: `${ULTIMA}/download/Polpad-Windows-Instalador.exe`,
  linux: `${ULTIMA}/download/Polpad-Linux-Instalador.tar.gz`,
  sha256: `${ULTIMA}/download/SHA256SUMS.txt`,
  // Sem a API não dá para saber o nome do .bin: vai para a lista de releases.
  firmwareReserva: `${REPO_POLPAD}/releases`,
} as const;

export const API_RELEASES = 'https://api.github.com/repos/gabriel-re-pires/polpad/releases?per_page=10';

// raw/ faz o STL baixar direto.
export const HARDWARE = {
  caseTopo: `${REPO_POLPAD}/raw/main/hardware/case/case_top.stl`,
  caseBase: `${REPO_POLPAD}/raw/main/hardware/case/case_bottom.stl`,
  gcode: `${REPO_POLPAD}/tree/main/hardware/case/gcode-ender3-v3-se`,
  // Pasta, e não um arquivo: os nomes dos Gerbers levam a data, e o README de lá
  // diz o que conferir antes de fabricar.
  placa: `${REPO_POLPAD}/tree/main/hardware/PCB_polpad`,
} as const;

/** Quem fez o Polpad. `curto` e `site` aparecem na coluna "Criadores" do rodapé. */
export const AUTORES: { nome: string; curto: string; github: string; site: string }[] = [
  { nome: 'Gabriel R. Pires', curto: 'Gabriel', github: 'gabriel-re-pires', site: 'https://github.com/gabriel-re-pires' },
  { nome: 'Artur', curto: 'Artur', github: 'Artur-Brasileiro', site: 'https://arturbrasileiro.com.br/' },
];
