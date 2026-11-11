// Troca a tampa e a base do GLB pelos STL de impressão (a versão mais nova do case).
//
// O GLB do portfólio tem placa, ESP32-C3, display, soquetes, switches e keycaps bem
// detalhados, mas o case dele é de uma versão anterior. Aqui a tampa e a base saem
// dos STL do repositório polpad (hardware/case) e entram no lugar das antigas:
// - a tampa ocupa a mesma caixa da tampa antiga (as teclas e o display batem);
// - a base fica onde a tampa apoia nela, achado pela borda inclinada da base.
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Lê um STL binário: 9 números por triângulo (x, y, z dos três vértices), em mm, Z para cima. */
export function lerStl(buffer) {
  if (buffer.length < 84) throw new Error('STL curto demais');
  const n = buffer.readUInt32LE(80);
  if (buffer.length !== 84 + n * 50) throw new Error('Só STL binário é aceito');
  const triangulos = new Float32Array(n * 9);
  for (let i = 0; i < n; i++) {
    const inicio = 84 + i * 50 + 12; // pula a normal: ela é recalculada
    for (let k = 0; k < 9; k++) triangulos[i * 9 + k] = buffer.readFloatLE(inicio + k * 4);
  }
  return triangulos;
}

function normalEArea(t, i) {
  const ux = t[i + 3] - t[i];
  const uy = t[i + 4] - t[i + 1];
  const uz = t[i + 5] - t[i + 2];
  const vx = t[i + 6] - t[i];
  const vy = t[i + 7] - t[i + 1];
  const vz = t[i + 8] - t[i + 2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const comprimento = Math.hypot(nx, ny, nz);
  if (comprimento === 0) return { normal: [0, 0, 0], area: 0 };
  return { normal: [nx / comprimento, ny / comprimento, nz / comprimento], area: comprimento / 2 };
}

/**
 * Onde a tampa apoia na base. A borda da base é um plano inclinado (a base é uma
 * cunha); um degrau interno, mais alto, entra na tampa e a centraliza. Devolve a
 * normal do plano, o ângulo e, no referencial da base, a origem da tampa (o centro
 * da face de baixo dela).
 */
export function apoioDaTampa(triangulos) {
  const grupos = new Map();
  for (let i = 0; i < triangulos.length; i += 9) {
    const { normal, area } = normalEArea(triangulos, i);
    if (normal[2] < 0.9 || normal[2] > 0.9999 || Math.abs(normal[0]) > 0.01) continue;
    const chave = normal.map((n) => n.toFixed(3)).join(' ');
    const grupo = grupos.get(chave) ?? { normal, area: 0, faces: [] };
    grupo.area += area;
    grupo.faces.push(i);
    grupos.set(chave, grupo);
  }
  const borda = [...grupos.values()].sort((a, b) => b.area - a.area)[0];
  if (!borda) throw new Error('A base não tem borda inclinada: não sei onde apoiar a tampa');

  const [, ny, nz] = borda.normal;
  const comprimento = Math.hypot(ny, nz);
  const normal = [0, ny / comprimento, nz / comprimento];
  const eixoY = [0, normal[2], -normal[1]]; // "para trás" ao longo da tampa
  const distancia = (i) => triangulos[i + 1] * normal[1] + triangulos[i + 2] * normal[2];

  // Os degraus da borda, do mais baixo ao mais alto, agrupados a menos de 0,06 mm.
  const faces = borda.faces.map((i) => ({ i, d: distancia(i), area: normalEArea(triangulos, i).area }));
  faces.sort((a, b) => a.d - b.d);
  const degraus = [];
  for (const f of faces) {
    const ultimo = degraus.at(-1);
    if (ultimo && f.d - ultimo.ate < 0.06) {
      ultimo.d = (ultimo.d * ultimo.area + f.d * f.area) / (ultimo.area + f.area);
      ultimo.area += f.area;
      ultimo.ate = f.d;
      ultimo.faces.push(f.i);
    } else {
      degraus.push({ d: f.d, ate: f.d, area: f.area, faces: [f.i] });
    }
  }
  const assento = degraus.reduce((a, b) => (b.area > a.area ? b : a));
  const guias = degraus.filter((d) => d.d > assento.d + 0.5 && d.area > 50);
  const guia = guias.length ? guias.reduce((a, b) => (b.d > a.d ? b : a)) : assento;

  let u0 = Infinity;
  let u1 = -Infinity;
  let v0 = Infinity;
  let v1 = -Infinity;
  for (const i of guia.faces) {
    for (let k = 0; k < 9; k += 3) {
      const u = triangulos[i + k];
      const v = triangulos[i + k + 1] * eixoY[1] + triangulos[i + k + 2] * eixoY[2];
      u0 = Math.min(u0, u);
      u1 = Math.max(u1, u);
      v0 = Math.min(v0, v);
      v1 = Math.max(v1, v);
    }
  }
  const centroU = (u0 + u1) / 2;
  const centroV = (v0 + v1) / 2;
  return {
    normal,
    eixoY,
    graus: (Math.acos(normal[2]) * 180) / Math.PI,
    origem: [centroU, centroV * eixoY[1] + assento.d * normal[1], centroV * eixoY[2] + assento.d * normal[2]],
  };
}

/** Caixa (mm) de uma lista de posições x, y, z. */
function caixa(posicoes) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < posicoes.length; i++) {
    const e = i % 3;
    min[e] = Math.min(min[e], posicoes[i]);
    max[e] = Math.max(max[e], posicoes[i]);
  }
  return { min, max };
}

/**
 * Normais por canto, com quina viva: cada canto soma as normais das faces vizinhas
 * que dobram menos que `limite` graus em relação à sua. Devolve a malha indexada.
 */
export function malhaComNormais(triangulos, limite = 35) {
  const cosLimite = Math.cos((limite * Math.PI) / 180);
  const nTri = triangulos.length / 9;
  const chaveDe = (i) => `${triangulos[i].toFixed(3)},${triangulos[i + 1].toFixed(3)},${triangulos[i + 2].toFixed(3)}`;
  const normais = [];
  const pesos = [];
  const vizinhos = new Map();
  for (let t = 0; t < nTri; t++) {
    const { normal, area } = normalEArea(triangulos, t * 9);
    normais.push(normal);
    pesos.push(area);
    for (let k = 0; k < 3; k++) {
      const chave = chaveDe(t * 9 + k * 3);
      if (!vizinhos.has(chave)) vizinhos.set(chave, []);
      vizinhos.get(chave).push(t);
    }
  }
  const posicoes = [];
  const normaisSaida = [];
  const indices = [];
  const unicos = new Map();
  for (let t = 0; t < nTri; t++) {
    const nt = normais[t];
    for (let k = 0; k < 3; k++) {
      const i = t * 9 + k * 3;
      let sx = 0;
      let sy = 0;
      let sz = 0;
      for (const v of vizinhos.get(chaveDe(i))) {
        const nv = normais[v];
        if (nv[0] * nt[0] + nv[1] * nt[1] + nv[2] * nt[2] < cosLimite) continue;
        sx += nv[0] * pesos[v];
        sy += nv[1] * pesos[v];
        sz += nv[2] * pesos[v];
      }
      const c = Math.hypot(sx, sy, sz) || 1;
      const n = [sx / c, sy / c, sz / c];
      const chave = `${chaveDe(i)}|${n.map((x) => x.toFixed(3)).join(',')}`;
      let indice = unicos.get(chave);
      if (indice === undefined) {
        indice = posicoes.length / 3;
        unicos.set(chave, indice);
        posicoes.push(triangulos[i], triangulos[i + 1], triangulos[i + 2]);
        normaisSaida.push(...n);
      }
      indices.push(indice);
    }
  }
  return { posicoes: new Float32Array(posicoes), normais: new Float32Array(normaisSaida), indices: new Uint32Array(indices) };
}

/** Caixa (mm, no referencial do pai) da malha de um nó, lendo min/max do acessor. */
function caixaDoNo(json, no) {
  const acessor = json.accessors[json.meshes[no.mesh].primitives[0].attributes.POSITION];
  const divisor = acessor.normalized ? { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[acessor.componentType] : 1;
  const escala = no.scale ?? [1, 1, 1];
  const posicao = no.translation ?? [0, 0, 0];
  const ajustar = (v, e) => (v / divisor) * escala[e] + posicao[e];
  return { min: acessor.min.map(ajustar), max: acessor.max.map(ajustar) };
}

/**
 * Põe a tampa e a base dos STL no lugar de Case_Top e Case_Bottom. Recebe o JSON e o
 * bloco binário de um GLB sem compressão e devolve os dois atualizados.
 */
export function trocarCase(json, bin, pastaDoCase) {
  const tampa = lerStl(readFileSync(join(pastaDoCase, 'case_top.stl')));
  const base = lerStl(readFileSync(join(pastaDoCase, 'case_bottom.stl')));
  const apoio = apoioDaTampa(base);

  const noTampa = json.nodes.find((n) => n.name === 'Case_Top');
  const noBase = json.nodes.find((n) => n.name === 'Case_Bottom');
  if (!noTampa || !noBase) throw new Error('O GLB não tem Case_Top e Case_Bottom');

  // STL (mm, Z para cima, Y para trás) para glTF (Y para cima, -Z para trás).
  const paraGltf = (x, y, z) => [x, z, -y];
  // A tampa nova vai para o centro da caixa da tampa antiga.
  const antiga = caixaDoNo(json, noTampa);
  const nova = caixa(tampa);
  const centroNovo = paraGltf(...[0, 1, 2].map((e) => (nova.min[e] + nova.max[e]) / 2));
  const desloca = [0, 1, 2].map((e) => (antiga.min[e] + antiga.max[e]) / 2 - centroNovo[e]);

  const tampaGltf = new Float32Array(tampa.length);
  for (let i = 0; i < tampa.length; i += 3) {
    const g = paraGltf(tampa[i], tampa[i + 1], tampa[i + 2]);
    for (let e = 0; e < 3; e++) tampaGltf[i + e] = g[e] + desloca[e];
  }
  // Cada ponto da base, escrito no referencial da tampa: a tampa fica reta, e a base
  // fica inclinada por baixo dela, como no case montado.
  const { origem, normal, eixoY } = apoio;
  const baseGltf = new Float32Array(base.length);
  for (let i = 0; i < base.length; i += 3) {
    const d = [base[i] - origem[0], base[i + 1] - origem[1], base[i + 2] - origem[2]];
    const lx = d[0];
    const ly = d[1] * eixoY[1] + d[2] * eixoY[2];
    const lz = d[1] * normal[1] + d[2] * normal[2];
    const g = paraGltf(lx, ly, lz);
    for (let e = 0; e < 3; e++) baseGltf[i + e] = g[e] + desloca[e];
  }

  const partes = [bin];
  let tamanho = bin.length;
  const anexar = (dados, alvo) => {
    const inicio = (tamanho + 3) & ~3;
    if (inicio > tamanho) partes.push(Buffer.alloc(inicio - tamanho));
    partes.push(Buffer.from(dados.buffer, dados.byteOffset, dados.byteLength));
    tamanho = inicio + dados.byteLength;
    json.bufferViews.push({ buffer: 0, byteOffset: inicio, byteLength: dados.byteLength, ...(alvo ? { target: alvo } : {}) });
    return json.bufferViews.length - 1;
  };
  const material = json.meshes[noTampa.mesh].primitives[0].material;

  for (const [no, triangulos] of [
    [noTampa, tampaGltf],
    [noBase, baseGltf],
  ]) {
    const { posicoes, normais, indices } = malhaComNormais(triangulos);
    const limitesDaMalha = caixa(posicoes);
    json.accessors.push({ bufferView: anexar(posicoes, 34962), componentType: 5126, count: posicoes.length / 3, type: 'VEC3', ...limitesDaMalha });
    const posicao = json.accessors.length - 1;
    json.accessors.push({ bufferView: anexar(normais, 34962), componentType: 5126, count: normais.length / 3, type: 'VEC3' });
    const normal = json.accessors.length - 1;
    json.accessors.push({ bufferView: anexar(indices, 34963), componentType: 5125, count: indices.length, type: 'SCALAR' });
    const indice = json.accessors.length - 1;
    json.meshes[no.mesh] = {
      name: no.name,
      primitives: [{ attributes: { POSITION: posicao, NORMAL: normal }, indices: indice, material }],
    };
    // Os vértices já estão em mm, no lugar certo: o nó não move nem escala mais nada.
    delete no.translation;
    delete no.scale;
  }
  const novoBin = Buffer.concat(partes);
  json.buffers = [{ byteLength: novoBin.length }];
  return { json, bin: novoBin, apoio };
}
