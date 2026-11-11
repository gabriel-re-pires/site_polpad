// Cena 3D do Polpad. Este arquivo só é baixado quando a seção do modelo chega
// perto da tela (import dinâmico em Modelo3D.astro), para não pesar na página.
//
// O modelo é o GLB completo do Polpad: case, placa, ESP32-C3, display, soquetes,
// switches e keycaps, cada peça marcada com `extras.group`. Ao abrir, as camadas
// se afastam em etapas, uma depois da outra. Qualquer outro GLB também serve:
// aparece inteiro, e os nós com `extras.afastamento` (em mm) se afastam ao abrir.
// Detalhes em docs/modelo-3d.md.
import {
  Box3,
  CanvasTexture,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  type Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Scene,
  Sphere,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { geometriaDaKeycap, texturaDoDisplay } from './pecas3d';

export const CORES = {
  roxo: { caixa: '#7a2ef0', tecla: '#1c1726' },
  preto: { caixa: '#1b1624', tecla: '#2f2840' },
  branco: { caixa: '#edeaf3', tecla: '#1c1726' },
  limao: { caixa: '#d8f343', tecla: '#1c1726' },
} as const;
export type NomeDaCor = keyof typeof CORES;

export type Camada = 'keycaps' | 'switches' | 'tampa' | 'placa' | 'base';

/** A camada de cada peça do GLB (o `extras.group` de cada nó). */
const CAMADA_DO_GRUPO: Record<string, Camada> = {
  keycap: 'keycaps',
  switch: 'switches',
  case_top: 'tampa',
  pcb: 'placa',
  mcu: 'placa',
  oled: 'placa',
  socket: 'placa',
  case_bottom: 'base',
};

/**
 * Quanto cada camada anda (mm, no eixo da tampa) e em que trecho da abertura ela se move.
 * A placa, o ESP32-C3, o display e os soquetes são soldados juntos e ficam parados.
 */
const COREOGRAFIA: Record<Camada, { mm: number; trecho: [number, number] }> = {
  keycaps: { mm: 116, trecho: [0.04, 0.3] },
  switches: { mm: 84, trecho: [0.2, 0.5] },
  tampa: { mm: 42, trecho: [0.44, 0.74] },
  placa: { mm: 0, trecho: [0, 0] },
  base: { mm: -45, trecho: [0.66, 0.94] },
};

/** A partir de quanto aberto cada legenda aparece: quando a camada já se separou. */
export const REVELAR: Record<Camada, number> = { keycaps: 0.17, switches: 0.35, tampa: 0.59, placa: 0.74, base: 0.8 };

/**
 * Um cilindro em pé em volta do modelo: como ele gira em torno do eixo vertical,
 * a largura na tela nunca passa do raio, e a altura é a da pilha.
 */
interface Volume {
  centro: Vector3;
  raio: number;
  meiaAltura: number;
}

const medirVolume = (caixa: Box3): Volume => {
  const tamanho = caixa.getSize(new Vector3());
  return { centro: caixa.getCenter(new Vector3()), raio: Math.hypot(tamanho.x, tamanho.z) / 2, meiaAltura: tamanho.y / 2 };
};

export interface Modelo {
  /** 0 = montado, 1 = todo aberto. */
  abrir(valor: number): void;
  cor(nome: NomeDaCor): void;
}

/** O que a cena precisa saber do modelo, seja o Polpad ou um GLB qualquer. */
interface Conteudo {
  raiz: Group;
  /** O volume que precisa caber na tela, no espaço do giro, conforme o quanto está aberto. */
  volume(aberto: number, saida: Volume): void;
  abrir(aberto: number): void;
  /** Só o Polpad tem camadas com legenda. */
  camadas: boolean;
  cor?(nome: NomeDaCor): void;
}

const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const trecho = (aberto: number, [a, b]: [number, number]) =>
  b <= a ? 0 : suave(MathUtils.clamp((aberto - a) / (b - a), 0, 1));

/** Sombra difusa de contato, desenhada uma vez num canvas. */
function sombraDifusa(tamanho: number): Mesh {
  const tela = document.createElement('canvas');
  tela.width = tela.height = 256;
  const c = tela.getContext('2d')!;
  const g = c.createRadialGradient(128, 128, 30, 128, 128, 128);
  g.addColorStop(0, 'rgb(14 11 20 / 0.42)');
  g.addColorStop(1, 'rgb(14 11 20 / 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  const malha = new Mesh(
    new PlaneGeometry(tamanho, tamanho),
    new MeshBasicMaterial({ map: new CanvasTexture(tela), transparent: true, depthWrite: false }),
  );
  malha.rotation.x = -Math.PI / 2;
  return malha;
}

/** Põe a imagem do display em cima da tela do módulo OLED. */
function acenderDisplay(oled: Object3D) {
  const caixa = new Box3();
  const altura = new Box3();
  oled.traverse((objeto) => {
    if (!(objeto instanceof Mesh) || Array.isArray(objeto.material)) return;
    const nome = (objeto.material as { name?: string }).name;
    if (nome !== 'OLED_Screen' && nome !== 'OLED_Glass') return;
    objeto.geometry.computeBoundingBox();
    if (nome === 'OLED_Screen') caixa.union(objeto.geometry.boundingBox!);
    altura.union(objeto.geometry.boundingBox!);
  });
  if (caixa.isEmpty()) return;
  const tamanho = caixa.getSize(new Vector3());
  const centro = caixa.getCenter(new Vector3());
  const imagem = new Mesh(
    new PlaneGeometry(tamanho.x * 0.9, Math.min(tamanho.z * 0.86, tamanho.x * 0.45)),
    new MeshBasicMaterial({ map: texturaDoDisplay(), toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
  // O topo da imagem aponta para trás (-Z), para ler de frente para o teclado.
  imagem.rotation.x = -Math.PI / 2;
  imagem.position.set(centro.x, altura.max.y + tamanho.y * 0.02, centro.z);
  oled.add(imagem);
}

/** O Polpad completo, com as camadas marcadas no GLB. */
function montarPolpad(cena: Object3D): Conteudo | null {
  const partes: { objeto: Object3D; camada: Camada; y: number }[] = [];
  cena.traverse((objeto) => {
    const camada = CAMADA_DO_GRUPO[(objeto.userData as { group?: string }).group ?? ''];
    if (camada) partes.push({ objeto, camada, y: objeto.position.y });
  });
  if (!partes.some((p) => p.camada === 'keycaps') || !partes.some((p) => p.camada === 'base')) return null;

  const caixa = new MeshStandardMaterial({ roughness: 0.58, metalness: 0 });
  const tecla = new MeshStandardMaterial({ roughness: 0.52, metalness: 0 });
  const formaDaKeycap = geometriaDaKeycap();
  cena.traverse((objeto) => {
    if (!(objeto instanceof Mesh)) return;
    objeto.castShadow = true;
    objeto.receiveShadow = true;
    const nome = (objeto.material as { name?: string }).name;
    if (nome === 'Case_Shell') {
      objeto.material = caixa;
    } else if (nome === 'Keycap') {
      objeto.geometry = formaDaKeycap;
      objeto.material = tecla;
    }
  });
  for (const parte of partes) if (parte.camada === 'placa' && parte.objeto.userData.group === 'oled') acenderDisplay(parte.objeto);

  // O GLB está em milímetros; a cena trabalha em metros.
  const raiz = new Group();
  const escala = new Group();
  escala.scale.setScalar(0.001);
  escala.add(cena);
  raiz.add(escala);
  raiz.updateMatrixWorld(true);
  const centroMontado = new Box3().setFromObject(escala).getCenter(new Vector3());
  escala.position.sub(centroMontado);

  // Sombra difusa de contato embaixo da base, que desce junto com ela. As sombras de
  // verdade ficam só entre as peças: num chão invisível, as camadas soltas pareceriam
  // placas cinza flutuando ao lado do modelo.
  const base = partes.find((p) => p.camada === 'base')!.objeto;
  const chao = new Group();
  chao.add(sombraDifusa(0.2));
  raiz.add(chao);
  raiz.updateMatrixWorld(true);
  const fundoMontado = new Box3().setFromObject(escala).min.y - 0.0004;
  // Direção em que a base desce, já no espaço da raiz (o case é inclinado).
  const eixoBase = new Vector3(0, 1, 0).applyQuaternion(base.parent!.getWorldQuaternion(new Quaternion())).multiplyScalar(0.001);

  function abrir(aberto: number) {
    for (const parte of partes) {
      const passo = COREOGRAFIA[parte.camada];
      parte.objeto.position.y = parte.y + passo.mm * trecho(aberto, passo.trecho);
    }
    const desceu = COREOGRAFIA.base.mm * trecho(aberto, COREOGRAFIA.base.trecho);
    chao.position.set(eixoBase.x * desceu, fundoMontado + eixoBase.y * desceu, eixoBase.z * desceu);
  }

  // O volume que enquadra o modelo muda conforme abre: mede em 21 pontos e interpola.
  const amostras: Volume[] = [];
  const medida = new Box3();
  for (let i = 0; i <= 20; i++) {
    abrir(i / 20);
    raiz.updateMatrixWorld(true);
    amostras.push(medirVolume(medida.setFromObject(escala)));
  }
  abrir(0);

  return {
    raiz,
    camadas: true,
    abrir,
    volume(aberto, saida) {
      const posicao = MathUtils.clamp(aberto, 0, 1) * 20;
      const i = Math.min(Math.floor(posicao), 19);
      const t = posicao - i;
      saida.centro.lerpVectors(amostras[i].centro, amostras[i + 1].centro, t);
      saida.raio = MathUtils.lerp(amostras[i].raio, amostras[i + 1].raio, t);
      saida.meiaAltura = MathUtils.lerp(amostras[i].meiaAltura, amostras[i + 1].meiaAltura, t);
    },
    cor(nome) {
      caixa.color = new Color(CORES[nome].caixa);
      tecla.color = new Color(CORES[nome].tecla);
    },
  };
}

/** Um GLB qualquer: aparece inteiro, com as cores dele; quem tem `afastamento` se afasta ao abrir. */
function montarGenerico(cena: Object3D): Conteudo {
  const raiz = new Group();
  raiz.add(cena);
  raiz.updateMatrixWorld(true);
  const esfera = new Box3().setFromObject(cena).getBoundingSphere(new Sphere());
  // Reduz ou amplia para o tamanho do Polpad na tela, seja qual for a unidade do arquivo.
  const escala = esfera.radius > 0 ? 0.085 / esfera.radius : 1;
  raiz.scale.setScalar(escala);
  raiz.position.copy(esfera.center).multiplyScalar(-escala);

  const partes: { objeto: Object3D; y: number; afastamento: number }[] = [];
  cena.traverse((objeto) => {
    if (objeto instanceof Mesh) objeto.castShadow = objeto.receiveShadow = true;
    const afastamento = (objeto.userData as { afastamento?: unknown }).afastamento;
    if (typeof afastamento === 'number') partes.push({ objeto, y: objeto.position.y, afastamento: afastamento / 1000 });
  });
  const maior = Math.max(0, ...partes.map((p) => Math.abs(p.afastamento))) * escala;
  return {
    raiz,
    camadas: false,
    abrir(aberto) {
      for (const parte of partes) parte.objeto.position.y = parte.y + parte.afastamento * aberto;
    },
    volume(aberto, saida) {
      saida.centro.set(0, 0, 0);
      saida.raio = 0.085;
      saida.meiaAltura = 0.085 + (maior / 2) * aberto;
    },
  };
}

export async function iniciarModelo(palco: HTMLElement): Promise<Modelo> {
  const tela = palco.querySelector('canvas');
  const url = palco.dataset.modelo;
  if (!tela || !url) throw new Error('Palco do modelo 3D incompleto');

  const desenhista = new WebGLRenderer({ canvas: tela, antialias: true, alpha: true, powerPreference: 'high-performance' });
  desenhista.outputColorSpace = SRGBColorSpace;
  desenhista.toneMapping = NeutralToneMapping;
  desenhista.toneMappingExposure = 1.05;
  desenhista.shadowMap.enabled = true;
  desenhista.shadowMap.type = PCFShadowMap;

  const cena = new Scene();
  const ambiente = new PMREMGenerator(desenhista);
  cena.environment = ambiente.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.7;
  // Luz principal de cima e da frente (com sombra) e uma luz de recorte por trás,
  // que separa as bordas escuras dos switches e das keycaps do fundo claro.
  const principal = new DirectionalLight('#ffffff', 2.1);
  principal.position.set(0.06, 0.5, 0.16);
  principal.castShadow = true;
  principal.shadow.mapSize.set(2048, 2048);
  principal.shadow.camera.left = principal.shadow.camera.bottom = -0.2;
  principal.shadow.camera.right = principal.shadow.camera.top = 0.2;
  principal.shadow.camera.near = 0.05;
  principal.shadow.camera.far = 1;
  principal.shadow.bias = -0.0002;
  principal.shadow.normalBias = 0.0004;
  principal.shadow.radius = 3;
  const recorte = new DirectionalLight('#f3ecff', 0.9);
  recorte.position.set(-0.3, 0.25, -0.35);
  cena.add(principal, recorte, new HemisphereLight('#ffffff', '#d9d2e6', 0.35));
  const camera = new PerspectiveCamera(28, 1, 0.01, 5);

  // A fonte do display precisa estar carregada antes de desenhar no canvas.
  const [gltf] = await Promise.all([
    new GLTFLoader().loadAsync(url),
    document.fonts.load('84px Silkscreen').catch(() => undefined),
  ]);
  const conteudo = montarPolpad(gltf.scene) ?? montarGenerico(gltf.scene);
  // O CSS esconde as legendas e as cores quando o modelo não é o Polpad.
  palco.dataset.modo = conteudo.camadas ? 'polpad' : 'generico';
  const giro = new Group(); // o que o arraste gira
  giro.add(conteudo.raiz);
  cena.add(giro);

  // Estado: quanto está aberto, para onde está virado, e o que o arraste somou.
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alvo = 0;
  let aberto = 0;
  let giroY = -0.62;
  let inclinacaoExtra = 0;
  /** Velocidade do giro (rad/s) depois de soltar: o modelo continua girando e para devagar. */
  let embaloY = 0;
  let embaloX = 0;
  let arrastando = false;
  let ultimoToque = -Infinity;
  let visivel = false;
  let anterior = performance.now();
  let pendente = true;

  // As legendas ficam numa coluna fixa, na ordem da pilha: girar o modelo não as mexe.
  const legendas = [...palco.querySelectorAll<HTMLElement>('[data-camada]')];
  const volume: Volume = { centro: new Vector3(), raio: 0, meiaAltura: 0 };
  /** Quanto o arraste pode somar à altura da câmera (rad): de cima até por baixo. */
  const limitarInclinacao = (v: number) => MathUtils.clamp(v, -2.1, 1.1);
  const alvoDaCamera = new Vector3();
  const vertical = new Vector3(0, 1, 0);
  // A mesma largura em que o CSS põe as legendas numa coluna à direita.
  const colunaDeLegendas = window.matchMedia('(min-width: 1100px)');
  colunaDeLegendas.addEventListener('change', () => enquadrar());

  function enquadrar() {
    const largura = palco.clientWidth;
    const altura = palco.clientHeight;
    if (largura === 0 || altura === 0) return;
    // Com zoom no CSS, um px do palco pode ocupar mais ou menos pixels da tela: o
    // canvas acompanha o zoom, para desenhar só os pixels que aparecem.
    // Mede pelo elemento de fora: o palco pode estar com "scale", que não conta aqui.
    const fora = palco.parentElement ?? palco;
    const zoom = fora.getBoundingClientRect().width / fora.offsetWidth || 1;
    desenhista.setPixelRatio(Math.min(window.devicePixelRatio * zoom, 2));
    desenhista.setSize(largura, altura, false);
    camera.aspect = largura / altura;
    // Na tela larga as legendas ocupam a direita: o modelo vai um pouco para a esquerda.
    const desvio = colunaDeLegendas.matches && conteudo.camadas ? Math.min(largura * 0.12, 170) : 0;
    camera.setViewOffset(largura, altura, desvio, 0, largura, altura);
    camera.updateProjectionMatrix();
    pendente = true;
  }

  function legendar() {
    if (!conteudo.camadas) return;
    let atual: HTMLElement | undefined;
    let maior = -1;
    for (const legenda of legendas) {
      const limite = REVELAR[legenda.dataset.camada as Camada] ?? 1;
      const revelada = aberto >= limite;
      legenda.classList.toggle('revelada', revelada);
      if (revelada && limite > maior) {
        maior = limite;
        atual = legenda;
      }
    }
    for (const legenda of legendas) legenda.classList.toggle('atual', legenda === atual);
    palco.classList.toggle('aberto', aberto > 0.04);
  }

  function desenhar(agora: number) {
    const dt = Math.min((agora - anterior) / 1000, 0.1);
    anterior = agora;
    // Embalo depois de soltar o arraste, que vai perdendo força.
    if (!arrastando && (Math.abs(embaloY) > 0.01 || Math.abs(embaloX) > 0.01)) {
      giroY += embaloY * dt;
      inclinacaoExtra = limitarInclinacao(inclinacaoExtra + embaloX * dt);
      const freio = Math.exp(-dt * 3.2);
      embaloY *= freio;
      embaloX *= freio;
      ultimoToque = agora;
      pendente = true;
    }
    const parado = agora - ultimoToque > 2500 && !arrastando;
    if (!semMovimento && parado) {
      giroY += dt * 0.12;
      pendente = true;
    }
    if (Math.abs(alvo - aberto) > 0.0005) {
      aberto = semMovimento ? alvo : aberto + (alvo - aberto) * (1 - Math.exp(-dt * 7));
      pendente = true;
      legendar();
    }
    if (!pendente) return;
    pendente = false;

    giro.rotation.y = giroY;
    conteudo.abrir(aberto);

    // A câmera mira o meio da pilha e recua só o bastante para caber a largura e a
    // altura do modelo, cada uma no seu eixo da tela: assim ele ocupa o palco.
    conteudo.volume(aberto, volume);
    alvoDaCamera.copy(volume.centro).applyAxisAngle(vertical, giroY);
    // Dá para olhar de qualquer altura, inclusive por baixo; só não passa da vertical.
    const elevacao = MathUtils.clamp(MathUtils.lerp(0.6, 0.32, aberto) + inclinacaoExtra, -1.45, 1.45);
    const tanV = Math.tan(MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * camera.aspect;
    // Visto de cima, a altura na tela soma a pilha e a profundidade do case.
    const alturaNaTela = volume.meiaAltura * Math.cos(elevacao) + volume.raio * Math.abs(Math.sin(elevacao));
    // O lado mais perto da câmera aparece maior: a folga cobre essa perspectiva.
    const distancia = Math.max(volume.raio / tanH, alturaNaTela / tanV) * 1.06 + volume.raio * 0.55;
    camera.position.set(
      alvoDaCamera.x,
      alvoDaCamera.y + Math.sin(elevacao) * distancia,
      alvoDaCamera.z + Math.cos(elevacao) * distancia,
    );
    camera.lookAt(alvoDaCamera);
    desenhista.render(cena, camera);
  }

  function laco(agora: number) {
    if (!visivel) return;
    desenhar(agora);
    requestAnimationFrame(laco);
  }

  // Arrastar gira para qualquer lado. Com mouse ou caneta, o arraste vertical inclina
  // até ver o modelo por baixo. No toque, o arraste vertical continua rolando a página
  // (é a rolagem que desmonta o modelo); só o horizontal gira.
  let ultimoX = 0;
  let ultimoY = 0;
  let ultimoTempo = 0;
  tela.addEventListener('pointerdown', (evento) => {
    arrastando = true;
    embaloY = embaloX = 0;
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;
    ultimoTempo = performance.now();
    tela.setPointerCapture(evento.pointerId);
  });
  tela.addEventListener('pointermove', (evento) => {
    if (!arrastando) return;
    const agora = performance.now();
    const passo = Math.max(agora - ultimoTempo, 1) / 1000;
    const dY = (evento.clientX - ultimoX) * 0.008;
    const dX = evento.pointerType === 'touch' ? 0 : (evento.clientY - ultimoY) * 0.006;
    giroY += dY;
    inclinacaoExtra = limitarInclinacao(inclinacaoExtra + dX);
    // A velocidade do fim do arraste vira o embalo (média suave para não tremer).
    embaloY = embaloY * 0.6 + (dY / passo) * 0.4;
    embaloX = embaloX * 0.6 + (dX / passo) * 0.4;
    ultimoX = evento.clientX;
    ultimoY = evento.clientY;
    ultimoTempo = agora;
    ultimoToque = agora;
    pendente = true;
  });
  const soltar = () => {
    arrastando = false;
    // Parado antes de soltar: sem embalo.
    if (performance.now() - ultimoTempo > 80) embaloY = embaloX = 0;
    embaloY = MathUtils.clamp(embaloY, -9, 9);
    embaloX = MathUtils.clamp(embaloX, -6, 6);
    ultimoToque = performance.now();
  };
  tela.addEventListener('pointerup', soltar);
  tela.addEventListener('pointercancel', soltar);
  tela.addEventListener('keydown', (evento) => {
    const giros: Record<string, [number, number]> = {
      ArrowLeft: [-0.2, 0],
      ArrowRight: [0.2, 0],
      ArrowUp: [0, -0.15],
      ArrowDown: [0, 0.15],
    };
    const passo = giros[evento.key];
    if (!passo) return;
    evento.preventDefault();
    giroY += passo[0];
    inclinacaoExtra = limitarInclinacao(inclinacaoExtra + passo[1]);
    ultimoToque = performance.now();
    pendente = true;
  });

  new ResizeObserver(enquadrar).observe(palco);
  new IntersectionObserver(([entrada]) => {
    const antes = visivel;
    visivel = entrada.isIntersecting;
    if (visivel && !antes) {
      anterior = performance.now();
      pendente = true;
      requestAnimationFrame(laco);
    }
  }).observe(palco);

  const modelo: Modelo = {
    abrir(valor) {
      alvo = MathUtils.clamp(valor, 0, 1);
    },
    cor(nome) {
      conteudo.cor?.(nome);
      pendente = true;
    },
  };
  modelo.cor('roxo');
  legendar();
  enquadrar();
  return modelo;
}
