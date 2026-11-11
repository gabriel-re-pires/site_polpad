import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { escreverGlb, lerGlb } from '../scripts/descomprimir-glb.mjs';
import { TECLAS } from '../src/lib/polpad';

describe('lerGlb e escreverGlb', () => {
  it('ida e volta mantém o JSON e os bytes do bloco binário', () => {
    const json = { asset: { version: '2.0' }, buffers: [{ byteLength: 5 }] };
    const bin = Buffer.from([1, 2, 3, 4, 5]);
    const glb = escreverGlb(json, bin);
    expect(glb.readUInt32LE(0)).toBe(0x46546c67);
    expect(glb.readUInt32LE(8)).toBe(glb.length);
    expect(glb.length % 4).toBe(0);
    const lido = lerGlb(glb);
    expect(lido.json).toEqual(json);
    // O bloco binário vem completado com zeros até um múltiplo de 4.
    expect([...lido.bin.subarray(0, 5)]).toEqual([1, 2, 3, 4, 5]);
    expect(lido.bin.length).toBe(8);
  });

  it('recusa um arquivo que não é GLB', () => {
    expect(() => lerGlb(Buffer.from('nada disso aqui'))).toThrow('Não é um arquivo GLB');
  });
});

describe('modelo publicado', () => {
  const { json } = lerGlb(fs.readFileSync('public/modelos/polpad.glb'));

  it('abre sem o decodificador do meshopt (a CSP do site não permite WebAssembly)', () => {
    expect(json.extensionsUsed ?? []).not.toContain('EXT_meshopt_compression');
    expect(json.extensionsRequired ?? []).not.toContain('EXT_meshopt_compression');
    expect(json.buffers).toHaveLength(1);
    expect(json.buffers[0].uri).toBeUndefined();
  });

  it('tem todas as camadas que o site separa', () => {
    const grupos = new Set(json.nodes.map((n) => n.extras?.group).filter(Boolean));
    for (const g of ['keycap', 'switch', 'case_top', 'case_bottom', 'pcb', 'mcu', 'oled', 'socket']) {
      expect(grupos).toContain(g);
    }
  });

  it('as 18 keycaps estão onde o desenho 2D do topo põe as teclas', () => {
    // No plano da tampa, o X é o mesmo e o Z do glTF é o Y do STL com o sinal trocado.
    const keycaps = json.nodes
      .filter((n) => n.extras?.group === 'keycap')
      .map((n) => [n.translation[0], -n.translation[2]]);
    expect(keycaps).toHaveLength(TECLAS.length);
    for (const [x, y] of TECLAS) {
      const perto = keycaps.some(([kx, ky]) => Math.abs(kx - x) < 0.05 && Math.abs(ky - y) < 0.05);
      expect(perto, `tecla em (${x}, ${y})`).toBe(true);
    }
  });
});

describe('case do modelo publicado', () => {
  const { json } = lerGlb(fs.readFileSync('public/modelos/polpad.glb'));
  const caixaDe = (nome) => {
    const no = json.nodes.find((n) => n.name === nome);
    const acessor = json.accessors[json.meshes[no.mesh].primitives[0].attributes.POSITION];
    return acessor.max.map((v, i) => v - acessor.min[i]);
  };

  it('a tampa vem dos STL de impressão: 118 × 8,6 × 118 mm, já em milímetros', () => {
    const [x, y, z] = caixaDe('Case_Top');
    expect(x).toBeCloseTo(118, 0);
    expect(y).toBeCloseTo(8.6, 1);
    expect(z).toBeCloseTo(118, 0);
  });

  it('a base fica por baixo da tampa', () => {
    const no = (nome) => json.nodes.find((n) => n.name === nome);
    const acessor = (nome) => json.accessors[json.meshes[no(nome).mesh].primitives[0].attributes.POSITION];
    expect(acessor('Case_Bottom').min[1]).toBeLessThan(acessor('Case_Top').min[1] - 10);
  });
});
