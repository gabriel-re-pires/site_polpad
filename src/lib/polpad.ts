/**
 * Medidas da tampa do case, em milímetros, com a origem no centro da tampa
 * (x para a direita, y para trás), medidas em case_top.stl. A ilustração 3D do topo
 * da página (e o desenho de reserva) usa estas medidas; tests/descomprimir-glb.test.mjs confere que as teclas
 * estão no mesmo lugar no modelo 3D.
 */
export const CASE = { lado: 118, raio: 4 } as const;

/** Centros das 18 teclas, na ordem do app: de cima para baixo, da esquerda para a direita. */
export const TECLAS: readonly (readonly [number, number])[] = [
  [0, 30.58],
  [19.05, 30.58],
  [38.1, 30.58],
  [-38.1, 6.06],
  [-19.05, 6.06],
  [0, 6.06],
  [19.05, 6.06],
  [38.1, 6.06],
  [-38.1, -13.94],
  [-19.05, -13.94],
  [0, -13.94],
  [19.05, -13.94],
  [38.1, -13.94],
  [-38.1, -33.94],
  [-19.05, -33.94],
  [0, -33.94],
  [19.05, -33.94],
  [38.1, -33.94],
];

/** Janela do display, no canto de cima à esquerda. */
export const TELA = { x: -27.94, y: 29.66, largura: 28, altura: 18.38 } as const;

/** Largura de um keycap de 1u. O furo da tecla tem 14 mm; o keycap cobre mais. */
export const KEYCAP = 17.4;
