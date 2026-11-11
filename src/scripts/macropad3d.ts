// Ilustração 3D do Polpad One no topo da página inicial. É parecida com o hardware
// (as medidas da tampa, as 18 teclas nos lugares reais e o display), mas montada aqui
// com formas simples, sem baixar o GLB do modelo completo. Fica parada: clicar numa
// tecla faz ela afundar e acender em limão. Só desenha um quadro novo quando algo muda.
import {
  Box3,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Path,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  Scene,
  ShadowMaterial,
  Shape,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { CASE, KEYCAP, TECLAS, TELA } from '../lib/polpad';
import { achatarTampas, geometriaDaKeycap, MEIA_ALTURA_KEYCAP, texturaDoDisplay } from './pecas3d';

/** Medidas em mm. Largura, teclas e display vêm da tampa real; as alturas são próximas. */
const RAIO = CASE.raio + 2;
const BASE = 15;
const FRESTA = 0.5;
const TAMPA = 6;
const TOPO = BASE + FRESTA + TAMPA;
/** Quanto o corpo do switch sobe acima da tampa. */
const SWITCH = 4.6;
const ALTURA_KEYCAP = 8.4;
/** Curso da tecla ao apertar. */
const CURSO = 3.4;

/** Como a câmera olha: de frente e bem de cima, com o case girado um pouco. */
const ELEVACAO = MathUtils.degToRad(57);
const GIRO = -0.3;
/**
 * Até onde o modelo vai, do centro à borda do canvas (1 = encosta). O canvas é 44% maior
 * que o quadrado do case (Macropad.astro): o modelo fica 24% maior que ele, e sobra
 * espaço em volta para a sombra.
 */
const OCUPA = 0.86;

/** Uma tecla aperta por pelo menos isso (ms): um toque rápido ainda mostra a animação. */
const MINIMO = 180;

const COR = {
  base: '#120e19',
  tampa: '#1d1727',
  switch: '#0d0a12',
  tecla: '#2b2538',
  teclaSobre: '#3e3552',
  lima: '#d8f343',
};

/** Um retângulo de cantos arredondados, centrado em (cx, cy). */
function retangulo<T extends Path>(alvo: T, cx: number, cy: number, largura: number, altura: number, raio: number): T {
  const x0 = cx - largura / 2;
  const x1 = cx + largura / 2;
  const y0 = cy - altura / 2;
  const y1 = cy + altura / 2;
  alvo.moveTo(x0 + raio, y0);
  alvo.lineTo(x1 - raio, y0);
  alvo.absarc(x1 - raio, y0 + raio, raio, -Math.PI / 2, 0, false);
  alvo.lineTo(x1, y1 - raio);
  alvo.absarc(x1 - raio, y1 - raio, raio, 0, Math.PI / 2, false);
  alvo.lineTo(x0 + raio, y1);
  alvo.absarc(x0 + raio, y1 - raio, raio, Math.PI / 2, Math.PI, false);
  alvo.lineTo(x0, y0 + raio);
  alvo.absarc(x0 + raio, y0 + raio, raio, Math.PI, Math.PI * 1.5, false);
  return alvo;
}

/**
 * Um bloco quadrado com as bordas chanfradas e arredondadas, de y = 0 até `altura`.
 * As coordenadas da forma são as da tampa (x para a direita, y para trás), e os furos
 * atravessam o bloco.
 */
function bloco(altura: number, chanfro: number, furos: Path[] = []) {
  const lado = CASE.lado - 2 * chanfro;
  const forma = retangulo(new Shape(), 0, 0, lado, lado, RAIO - chanfro);
  forma.holes.push(...furos);
  const geometria = new ExtrudeGeometry(forma, {
    depth: altura - 2 * chanfro,
    bevelEnabled: true,
    bevelThickness: chanfro,
    bevelSize: chanfro,
    bevelSegments: 4,
    curveSegments: 10,
  });
  // A extrusão vai em +z; deitada, vai para cima, e o "para trás" da forma vira -z.
  geometria.rotateX(-Math.PI / 2);
  geometria.translate(0, chanfro, 0);
  return achatarTampas(toCreasedNormals(geometria, MathUtils.degToRad(35)));
}

/** Uma sombra macia em volta da base, desenhada uma vez num canvas. */
function sombraDeContato(): Mesh {
  const lado = 256;
  const tela = document.createElement('canvas');
  tela.width = tela.height = lado;
  const c = tela.getContext('2d')!;
  // Desenha o quadrado fora do canvas e deixa só a sombra borrada cair dentro.
  c.shadowColor = 'rgb(20 4 52 / 0.75)';
  c.shadowBlur = 26;
  c.shadowOffsetX = lado;
  c.fillStyle = '#000';
  c.beginPath();
  c.roundRect(-lado + 40, 40, lado - 80, lado - 80, 18);
  c.fill();
  const malha = new Mesh(
    new PlaneGeometry(CASE.lado * 1.45, CASE.lado * 1.45),
    new MeshBasicMaterial({ map: new CanvasTexture(tela), transparent: true, depthWrite: false }),
  );
  malha.rotation.x = -Math.PI / 2;
  malha.position.y = 0.05;
  return malha;
}

interface Tecla {
  capa: Mesh;
  material: MeshStandardMaterial;
  /** Altura da keycap solta. */
  y: number;
  apertada: boolean;
  desde: number;
  soltar: number;
  /** 0 a 1: o quanto afundou, o quanto está limão e o quanto o mouse está em cima. */
  afundou: number;
  acesa: number;
  sobre: number;
}

/** Monta a cena no canvas e desenha o primeiro quadro. Falha se não houver WebGL. */
export async function iniciarMacropad(tela: HTMLCanvasElement): Promise<void> {
  const desenhista = new WebGLRenderer({ canvas: tela, antialias: true, alpha: true });
  desenhista.outputColorSpace = SRGBColorSpace;
  desenhista.toneMapping = NeutralToneMapping;
  desenhista.toneMappingExposure = 1.05;
  desenhista.shadowMap.enabled = true;
  desenhista.shadowMap.type = PCFShadowMap;

  const cena = new Scene();
  const ambiente = new PMREMGenerator(desenhista);
  cena.environment = ambiente.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.55;
  ambiente.dispose();

  // Luz principal de cima, um pouco de trás e da direita: a frente fica na sombra, como
  // no desenho, e a sombra cai na frente do case. Embaixo, o roxo da página rebate.
  const principal = new DirectionalLight('#ffffff', 2.3);
  principal.position.set(45, 170, -55);
  principal.castShadow = true;
  principal.shadow.mapSize.set(2048, 2048);
  principal.shadow.camera.left = principal.shadow.camera.bottom = -110;
  principal.shadow.camera.right = principal.shadow.camera.top = 110;
  principal.shadow.camera.near = 20;
  principal.shadow.camera.far = 400;
  principal.shadow.bias = -0.0004;
  principal.shadow.normalBias = 0.25;
  principal.shadow.radius = 4;
  const recorte = new DirectionalLight('#efe6ff', 0.8);
  recorte.position.set(-140, 90, -120);
  cena.add(principal, recorte, new HemisphereLight('#ffffff', '#7a2ef0', 0.55));

  const modelo = new Group();
  modelo.rotation.y = GIRO;
  cena.add(modelo);

  const plastico = (cor: string, aspereza = 0.55) => new MeshStandardMaterial({ color: cor, roughness: aspereza, metalness: 0 });
  const comSombra = (malha: Mesh) => {
    malha.castShadow = true;
    malha.receiveShadow = true;
    return malha;
  };

  // Base e tampa, com uma fresta entre as duas. A tampa tem a janela do display.
  modelo.add(comSombra(new Mesh(bloco(BASE, 2.2), plastico(COR.base, 0.62))));
  const janela = retangulo(new Path(), TELA.x, TELA.y, TELA.largura, TELA.altura, 1.6);
  const tampa = comSombra(new Mesh(bloco(TAMPA, 1.3, [janela]), plastico(COR.tampa, 0.5)));
  tampa.position.y = BASE + FRESTA;
  modelo.add(tampa);

  // O display, afundado na janela: preto com reflexo, e o texto aceso.
  await document.fonts.load('80px Silkscreen').catch(() => undefined);
  const imagem = texturaDoDisplay(560, Math.round((560 * TELA.altura) / TELA.largura));
  const display = new Mesh(
    new PlaneGeometry(TELA.largura, TELA.altura),
    new MeshStandardMaterial({
      color: '#000000',
      roughness: 0.18,
      metalness: 0,
      emissive: '#ffffff',
      emissiveMap: imagem,
      emissiveIntensity: 1.1,
    }),
  );
  display.rotation.x = -Math.PI / 2;
  display.position.set(TELA.x, TOPO - 1.6, -TELA.y);
  display.receiveShadow = true;
  modelo.add(display);

  // Os switches aparecem entre as keycaps; as keycaps são as que afundam.
  const corpo = new BoxGeometry(14.6, SWITCH, 14.6);
  const materialSwitch = plastico(COR.switch, 0.6);
  const forma = geometriaDaKeycap();
  const escala = ALTURA_KEYCAP / (2 * MEIA_ALTURA_KEYCAP);
  const yKeycap = TOPO + SWITCH + 0.6 + ALTURA_KEYCAP / 2;
  const teclas: Tecla[] = TECLAS.map(([x, y]) => {
    const sw = comSombra(new Mesh(corpo, materialSwitch));
    sw.position.set(x, TOPO + SWITCH / 2, -y);
    const material = plastico(COR.tecla, 0.5);
    const capa = comSombra(new Mesh(forma, material));
    capa.scale.set(KEYCAP / 2, escala, KEYCAP / 2);
    capa.position.set(x, yKeycap, -y);
    modelo.add(sw, capa);
    return { capa, material, y: yKeycap, apertada: false, desde: 0, soltar: 0, afundou: 0, acesa: 0, sobre: 0 };
  });
  const porCapa = new Map(teclas.map((t) => [t.capa as object, t]));
  const capas = teclas.map((t) => t.capa);

  // O chão é invisível: só a sombra do case aparece sobre o roxo.
  const chao = new Mesh(new PlaneGeometry(600, 600), new ShadowMaterial({ color: '#1a0548', opacity: 0.4 }));
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  cena.add(chao, sombraDeContato());

  // Câmera: olha o modelo pela ELEVACAO e recua até ele ocupar o canvas por igual,
  // centrado. Mede pelos cantos da caixa do modelo, no espaço dele (girado).
  const camera = new PerspectiveCamera(24, 1, 10, 2000);
  modelo.updateMatrixWorld(true);
  const caixa = new Box3(new Vector3(-CASE.lado / 2, 0, -CASE.lado / 2), new Vector3(CASE.lado / 2, yKeycap + ALTURA_KEYCAP / 2, CASE.lado / 2));
  const cantos = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
    new Vector3(
      i & 1 ? caixa.max.x : caixa.min.x,
      i & 2 ? caixa.max.y : caixa.min.y,
      i & 4 ? caixa.max.z : caixa.min.z,
    ).applyMatrix4(modelo.matrixWorld),
  );
  function enquadrar(aspecto: number) {
    camera.aspect = aspecto;
    camera.updateProjectionMatrix();
    const direcao = new Vector3(0, Math.sin(ELEVACAO), Math.cos(ELEVACAO));
    const alvo = new Vector3(0, TOPO / 2, 0);
    const direita = new Vector3();
    const cima = new Vector3();
    const p = new Vector3();
    let distancia = 450;
    for (let i = 0; i < 10; i++) {
      camera.position.copy(alvo).addScaledVector(direcao, distancia);
      camera.lookAt(alvo);
      camera.updateMatrixWorld();
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const canto of cantos) {
        p.copy(canto).project(camera);
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      const meiaAltura = Math.tan(MathUtils.degToRad(camera.fov) / 2) * distancia;
      direita.setFromMatrixColumn(camera.matrixWorld, 0);
      cima.setFromMatrixColumn(camera.matrixWorld, 1);
      alvo
        .addScaledVector(direita, ((minX + maxX) / 2) * meiaAltura * aspecto)
        .addScaledVector(cima, ((minY + maxY) / 2) * meiaAltura);
      distancia *= Math.max((maxX - minX) / 2, (maxY - minY) / 2) / OCUPA;
    }
  }

  function desenhar() {
    desenhista.render(cena, camera);
  }

  function ajustarTamanho() {
    const largura = tela.clientWidth;
    const altura = tela.clientHeight;
    if (largura === 0 || altura === 0) return;
    // Com o zoom do site, um px do CSS pode ocupar mais ou menos pixels da tela.
    const zoom = tela.getBoundingClientRect().width / largura || 1;
    desenhista.setPixelRatio(Math.min(window.devicePixelRatio * zoom, 2));
    desenhista.setSize(largura, altura, false);
    enquadrar(largura / altura);
    desenhar();
  }

  // Animação das teclas: cada valor corre atrás do alvo e para quando chega.
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const base = new Color(COR.tecla);
  const sobre = new Color(COR.teclaSobre);
  const lima = new Color(COR.lima);
  let emCima: Tecla | undefined;
  let rodando = false;
  let anterior = 0;
  const seguir = (de: number, para: number, rapidez: number, dt: number) => {
    if (semMovimento) return para;
    const v = para + (de - para) * Math.exp(-rapidez * dt);
    return Math.abs(v - para) < 0.002 ? para : v;
  };

  function quadro(agora: number) {
    const dt = Math.min((agora - anterior) / 1000, 0.05);
    anterior = agora;
    let mexendo = false;
    for (const t of teclas) {
      // Apertar é quase instantâneo; ao soltar, a tecla sobe rápido e o limão apaga devagar.
      const afundou = seguir(t.afundou, t.apertada ? 1 : 0, t.apertada ? 45 : 24, dt);
      const acesa = seguir(t.acesa, t.apertada ? 1 : 0, t.apertada ? 45 : 9, dt);
      const em = seguir(t.sobre, t === emCima ? 1 : 0, 16, dt);
      if (afundou === t.afundou && acesa === t.acesa && em === t.sobre) continue;
      t.afundou = afundou;
      t.acesa = acesa;
      t.sobre = em;
      t.capa.position.y = t.y - CURSO * afundou;
      t.material.color.copy(base).lerp(sobre, em).lerp(lima, acesa);
      t.material.emissive.copy(lima).multiplyScalar(0.16 * acesa);
      mexendo = true;
    }
    desenhar();
    if (mexendo) requestAnimationFrame(quadro);
    else rodando = false;
  }
  function animar() {
    if (rodando) return;
    rodando = true;
    anterior = performance.now();
    requestAnimationFrame(quadro);
  }

  // Qual tecla está embaixo do ponteiro.
  const raio = new Raycaster();
  const ponto = new Vector2();
  function teclaEm(evento: PointerEvent): Tecla | undefined {
    const r = tela.getBoundingClientRect();
    ponto.set(((evento.clientX - r.left) / r.width) * 2 - 1, -((evento.clientY - r.top) / r.height) * 2 + 1);
    raio.setFromCamera(ponto, camera);
    const [acerto] = raio.intersectObjects(capas, false);
    return acerto ? porCapa.get(acerto.object) : undefined;
  }

  function apertar(t: Tecla) {
    window.clearTimeout(t.soltar);
    t.desde = performance.now();
    t.apertada = true;
    animar();
  }
  function soltar(t: Tecla) {
    if (!t.apertada) return;
    window.clearTimeout(t.soltar);
    const falta = Math.max(0, MINIMO - (performance.now() - t.desde));
    t.soltar = window.setTimeout(() => {
      t.apertada = false;
      animar();
    }, falta);
  }

  // Cada dedo (ou o mouse) aperta uma tecla; sair de cima dela também solta.
  const apertadas = new Map<number, Tecla>();
  tela.addEventListener('pointerdown', (evento) => {
    const t = teclaEm(evento);
    if (!t) return;
    apertadas.set(evento.pointerId, t);
    apertar(t);
  });
  tela.addEventListener('pointermove', (evento) => {
    const t = teclaEm(evento);
    const presa = apertadas.get(evento.pointerId);
    if (presa && presa !== t) {
      soltar(presa);
      apertadas.delete(evento.pointerId);
    }
    if (evento.pointerType !== 'mouse') return;
    tela.style.cursor = t ? 'pointer' : '';
    if (t !== emCima) {
      emCima = t;
      animar();
    }
  });
  const fim = (evento: PointerEvent) => {
    const t = apertadas.get(evento.pointerId);
    if (t) soltar(t);
    apertadas.delete(evento.pointerId);
  };
  tela.addEventListener('pointerup', fim);
  tela.addEventListener('pointercancel', fim);
  tela.addEventListener('pointerleave', (evento) => {
    fim(evento);
    if (emCima) {
      emCima = undefined;
      tela.style.cursor = '';
      animar();
    }
  });

  new ResizeObserver(ajustarTamanho).observe(tela);
  ajustarTamanho();
}
