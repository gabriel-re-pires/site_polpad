// Prepara um GLB comprimido com meshopt (como o exportado pelo glTF-Transform) para o site.
//
// O decodificador do meshopt roda em WebAssembly, e a política de segurança do site
// (vercel.json) não permite compilar WebAssembly no navegador. Este script faz a
// descompressão uma vez, aqui, e grava um GLB comum. A quantização das malhas
// (KHR_mesh_quantization) continua: o three.js lê esse formato sem decodificador.
//
// Uso: npm run modelo:importar -- <entrada.glb> [saida.glb]
import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const MAGICO = 0x46546c67; // "glTF"
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

/** Lê um GLB e devolve o JSON e o bloco binário. */
export function lerGlb(buffer) {
  if (buffer.readUInt32LE(0) !== MAGICO) throw new Error('Não é um arquivo GLB');
  let pos = 12;
  let json;
  let bin;
  while (pos < buffer.length) {
    const tamanho = buffer.readUInt32LE(pos);
    const tipo = buffer.readUInt32LE(pos + 4);
    const dados = buffer.subarray(pos + 8, pos + 8 + tamanho);
    if (tipo === JSON_CHUNK) json = JSON.parse(dados.toString('utf8'));
    if (tipo === BIN_CHUNK) bin = dados;
    pos += 8 + tamanho;
  }
  if (!json) throw new Error('GLB sem JSON');
  return { json, bin: bin ?? Buffer.alloc(0) };
}

const alinhar4 = (n) => (n + 3) & ~3;

/** Monta um GLB a partir do JSON e do bloco binário. */
export function escreverGlb(json, bin) {
  const texto = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPad = Buffer.concat([texto, Buffer.alloc(alinhar4(texto.length) - texto.length, 0x20)]);
  const binPad = Buffer.concat([bin, Buffer.alloc(alinhar4(bin.length) - bin.length)]);
  const cabecalho = Buffer.alloc(12);
  cabecalho.writeUInt32LE(MAGICO, 0);
  cabecalho.writeUInt32LE(2, 4);
  cabecalho.writeUInt32LE(12 + 8 + jsonPad.length + 8 + binPad.length, 8);
  const bloco = (tipo, dados) => {
    const c = Buffer.alloc(8);
    c.writeUInt32LE(dados.length, 0);
    c.writeUInt32LE(tipo, 4);
    return Buffer.concat([c, dados]);
  };
  return Buffer.concat([cabecalho, bloco(JSON_CHUNK, jsonPad), bloco(BIN_CHUNK, binPad)]);
}

/**
 * Tira o EXT_meshopt_compression: cada bufferView comprimido vira dados crus,
 * e tudo passa a morar num só buffer (o bloco binário do GLB).
 */
export async function descomprimir(glb) {
  await MeshoptDecoder.ready;
  const { json, bin } = lerGlb(glb);
  if (json.buffers?.some((b) => b.uri)) throw new Error('Só GLB com os dados embutidos');

  const partes = [];
  let tamanho = 0;
  for (const vista of json.bufferViews ?? []) {
    const ext = vista.extensions?.EXT_meshopt_compression;
    let dados;
    if (ext) {
      if (ext.buffer !== 0) throw new Error('Dados comprimidos fora do bloco binário');
      dados = new Uint8Array(ext.count * ext.byteStride);
      const fonte = bin.subarray(ext.byteOffset ?? 0, (ext.byteOffset ?? 0) + ext.byteLength);
      MeshoptDecoder.decodeGltfBuffer(dados, ext.count, ext.byteStride, fonte, ext.mode, ext.filter ?? 'NONE');
      delete vista.extensions.EXT_meshopt_compression;
      if (Object.keys(vista.extensions).length === 0) delete vista.extensions;
    } else {
      if (vista.buffer !== 0) throw new Error('bufferView fora do bloco binário');
      dados = bin.subarray(vista.byteOffset ?? 0, (vista.byteOffset ?? 0) + vista.byteLength);
    }
    const inicio = alinhar4(tamanho);
    if (inicio > tamanho) partes.push(Buffer.alloc(inicio - tamanho));
    partes.push(Buffer.from(dados.buffer, dados.byteOffset, dados.byteLength));
    vista.buffer = 0;
    vista.byteOffset = inicio;
    vista.byteLength = dados.byteLength;
    tamanho = inicio + dados.byteLength;
  }

  json.buffers = [{ byteLength: tamanho }];
  const semMeshopt = (lista) => lista?.filter((e) => e !== 'EXT_meshopt_compression');
  json.extensionsUsed = semMeshopt(json.extensionsUsed);
  json.extensionsRequired = semMeshopt(json.extensionsRequired);
  for (const chave of ['extensionsUsed', 'extensionsRequired']) if (json[chave]?.length === 0) delete json[chave];
  return escreverGlb(json, Buffer.concat(partes));
}

/** Tira do bloco binário o que nenhum acessor usa mais (por exemplo, malhas trocadas). */
export function compactar(json, bin) {
  const usados = new Set();
  for (const malha of json.meshes ?? [])
    for (const p of malha.primitives) {
      for (const a of Object.values(p.attributes)) usados.add(a);
      if (p.indices !== undefined) usados.add(p.indices);
    }
  const acessores = [];
  const novoAcessor = new Map();
  json.accessors.forEach((a, i) => {
    if (!usados.has(i)) return;
    novoAcessor.set(i, acessores.length);
    acessores.push(a);
  });
  const vistas = [];
  const novaVista = new Map();
  const partes = [];
  let tamanho = 0;
  for (const a of acessores) {
    if (a.bufferView === undefined) continue;
    if (!novaVista.has(a.bufferView)) {
      const vista = json.bufferViews[a.bufferView];
      const dados = bin.subarray(vista.byteOffset ?? 0, (vista.byteOffset ?? 0) + vista.byteLength);
      const inicio = alinhar4(tamanho);
      if (inicio > tamanho) partes.push(Buffer.alloc(inicio - tamanho));
      partes.push(dados);
      tamanho = inicio + dados.length;
      novaVista.set(a.bufferView, vistas.length);
      vistas.push({ ...vista, buffer: 0, byteOffset: inicio });
    }
    a.bufferView = novaVista.get(a.bufferView);
  }
  for (const malha of json.meshes ?? [])
    for (const p of malha.primitives) {
      for (const k of Object.keys(p.attributes)) p.attributes[k] = novoAcessor.get(p.attributes[k]);
      if (p.indices !== undefined) p.indices = novoAcessor.get(p.indices);
    }
  json.accessors = acessores;
  json.bufferViews = vistas;
  const novoBin = Buffer.concat(partes);
  json.buffers = [{ byteLength: novoBin.length }];
  return { json, bin: novoBin };
}

const executadoDireto = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
if (executadoDireto) {
  // npm run modelo -- <entrada.glb> [saida.glb] [--case <pasta com case_top.stl e case_bottom.stl>]
  const args = process.argv.slice(2);
  const iCase = args.indexOf('--case');
  const pastaDoCase = iCase >= 0 ? args.splice(iCase, 2)[1] : undefined;
  const [entrada, saida = 'public/modelos/polpad.glb'] = args;
  if (!entrada) {
    console.error('Uso: npm run modelo -- <entrada.glb> [saida.glb] [--case <pasta do case>]');
    process.exit(1);
  }
  let resultado = await descomprimir(readFileSync(entrada));
  if (pastaDoCase) {
    const { trocarCase } = await import('./case-stl.mjs');
    const lido = lerGlb(resultado);
    const trocado = trocarCase(lido.json, lido.bin, pastaDoCase);
    const enxuto = compactar(trocado.json, trocado.bin);
    resultado = escreverGlb(enxuto.json, enxuto.bin);
    console.log(`Case trocado pelos STL de ${pastaDoCase} (tampa apoiada a ${trocado.apoio.graus.toFixed(2)}°)`);
  }
  writeFileSync(saida, resultado);
  console.log(`${saida}: ${(resultado.length / 1024).toFixed(0)} KB`);
}
