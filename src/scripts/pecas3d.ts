// Peças 3D usadas pelas duas cenas do Polpad One: o modelo completo da seção "Polpad One"
// (modelo3d.ts) e a ilustração do topo da página (macropad3d.ts).
import { BufferGeometry, CanvasTexture, Float32BufferAttribute, MathUtils, SRGBColorSpace, Vector3 } from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * A malha das keycaps no GLB tem uma rachadura em volta do meio (triângulos
 * colapsados). Aqui a forma é refeita com as mesmas medidas: um quadrado de cantos
 * arredondados que afunila até o topo (base ±1, altura de -0,528 a 0,528).
 */
const PERFIL_KEYCAP: [number, number][] = [
  [-0.528, 1.0],
  [-0.2, 0.928],
  [0.225, 0.85],
  [0.4, 0.8],
  [0.47, 0.778],
  [0.5, 0.762],
  [0.518, 0.742],
  [0.528, 0.72],
];

/** Meia altura da keycap, nas unidades de geometriaDaKeycap(). */
export const MEIA_ALTURA_KEYCAP = 0.528;

export function geometriaDaKeycap(): BufferGeometry {
  const segmentos = 6;
  const porAnel = 4 * (segmentos + 1);
  const anel = (meia: number, y: number, saida: number[]) => {
    const raio = meia * 0.16;
    const c = meia - raio;
    const cantos: [number, number, number][] = [
      [c, c, 0],
      [-c, c, Math.PI / 2],
      [-c, -c, Math.PI],
      [c, -c, (3 * Math.PI) / 2],
    ];
    for (const [cx, cz, a0] of cantos)
      for (let k = 0; k <= segmentos; k++) {
        const a = a0 + (k / segmentos) * (Math.PI / 2);
        saida.push(cx + Math.cos(a) * raio, y, cz + Math.sin(a) * raio);
      }
  };
  const posicoes: number[] = [];
  const indices: number[] = [];
  PERFIL_KEYCAP.forEach(([y, meia]) => anel(meia, y, posicoes));
  for (let r = 0; r < PERFIL_KEYCAP.length - 1; r++)
    for (let i = 0; i < porAnel; i++) {
      const a = r * porAnel + i;
      const b = r * porAnel + ((i + 1) % porAnel);
      indices.push(a, a + porAnel, b, b, a + porAnel, b + porAnel);
    }
  const tampa = (y: number, meia: number, paraCima: boolean) => {
    const inicio = posicoes.length / 3;
    anel(meia, y, posicoes);
    const centro = posicoes.length / 3;
    posicoes.push(0, y, 0);
    for (let i = 0; i < porAnel; i++) {
      const a = inicio + i;
      const b = inicio + ((i + 1) % porAnel);
      if (paraCima) indices.push(centro, b, a);
      else indices.push(centro, a, b);
    }
  };
  const topo = PERFIL_KEYCAP[PERFIL_KEYCAP.length - 1];
  tampa(topo[0], topo[1], true);
  tampa(PERFIL_KEYCAP[0][0], PERFIL_KEYCAP[0][1], false);
  const geometria = new BufferGeometry();
  geometria.setAttribute('position', new Float32BufferAttribute(posicoes, 3));
  geometria.setIndex(indices);
  return achatarTampas(toCreasedNormals(geometria, MathUtils.degToRad(40)));
}

/**
 * Deixa lisas as faces viradas para cima ou para baixo. Suavizadas junto com a borda,
 * elas ganham manchas em X ou em diagonal (as normais da borda se espalham pelos
 * triângulos grandes da tampa); retas, a luz fica igual na face inteira.
 * A geometria precisa ser não indexada, como a que sai de toCreasedNormals.
 */
export function achatarTampas(geometria: BufferGeometry): BufferGeometry {
  const posicao = geometria.getAttribute('position');
  const normal = geometria.getAttribute('normal');
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  for (let i = 0; i + 2 < posicao.count; i += 3) {
    a.fromBufferAttribute(posicao, i);
    b.fromBufferAttribute(posicao, i + 1).sub(a);
    c.fromBufferAttribute(posicao, i + 2).sub(a);
    const y = b.cross(c).normalize().y;
    if (Math.abs(y) < 0.9999) continue;
    for (let k = 0; k < 3; k++) normal.setXYZ(i + k, 0, Math.sign(y), 0);
  }
  normal.needsUpdate = true;
  return geometria;
}

/**
 * A imagem do display: "POLPAD" em branco, na fonte de pixel, sobre o preto. O texto
 * ocupa a mesma fração da largura em qualquer tamanho de canvas. A fonte Silkscreen
 * precisa estar carregada antes (document.fonts.load).
 */
export function texturaDoDisplay(largura = 512, altura = 256): CanvasTexture {
  const tela = document.createElement('canvas');
  tela.width = largura;
  tela.height = altura;
  const c = tela.getContext('2d')!;
  c.fillStyle = '#000';
  c.fillRect(0, 0, largura, altura);
  c.fillStyle = '#fff';
  const fonte = Math.round(largura * 0.164);
  c.font = `${fonte}px Silkscreen, monospace`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('POLPAD', largura / 2, altura / 2 + fonte * 0.07);
  const textura = new CanvasTexture(tela);
  textura.colorSpace = SRGBColorSpace;
  textura.anisotropy = 8;
  return textura;
}
