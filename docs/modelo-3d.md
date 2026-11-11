# Modelo 3D do Polpad

A página inicial tem um palco com o macropad em 3D: dá para girar, trocar a cor
do case e, rolando a página, desmontar camada por camada. O topo da página tem
uma segunda cena, mais leve: uma ilustração parada do Polpad One, montada com
formas simples (sem baixar o GLB), em que as teclas afundam e acendem em limão
ao clicar.

| Arquivo | O que é |
|---|---|
| `public/modelos/polpad.glb` | O modelo que o site carrega |
| `scripts/descomprimir-glb.mjs` | Prepara um GLB comprimido com meshopt para o site |
| `src/scripts/modelo3d.ts` | A cena (three.js), baixada só quando a seção chega perto da tela |
| `src/scripts/macropad3d.ts` | A ilustração 3D do topo da página |
| `src/scripts/pecas3d.ts` | Peças usadas pelas duas cenas: a keycap e a imagem do display |
| `src/components/Macropad.astro` | O lugar da ilustração no topo, com um desenho em CSS de reserva (sem WebGL ou sem JavaScript) |
| `src/components/Modelo3D.astro` | O palco, as legendas e os controles |
| `src/lib/polpad.ts` | As medidas da tampa, das teclas e do display, usadas pela ilustração do topo |

## De onde vem o modelo

É o mesmo GLB do portfólio (`meu_portifolio/public/projetos/macropad/modelo.glb`),
montado no Blender: tampa e base com as medidas dos STL de impressão, placa,
ESP32-C3, display OLED, soquetes hot-swap, switches e keycaps. Está em
milímetros, e cada peça tem `extras.group`:

| `group` | Camada no site | Ao abrir |
|---|---|---|
| `keycap` | Keycaps | sobe 116 mm |
| `switch` | Switches | sobe 84 mm |
| `case_top` | Tampa | sobe 42 mm |
| `pcb`, `mcu`, `oled`, `socket` | Placa | fica parada |
| `case_bottom` | Base | desce 45 mm |

As camadas saem uma depois da outra (a coreografia está em `COREOGRAFIA`, em
`src/scripts/modelo3d.ts`). O site ainda:

- troca a malha das keycaps, que tem uma rachadura no meio, por uma forma
  refeita com as mesmas medidas;
- pinta o case com a cor escolhida (material `Case_Shell`) e as keycaps de
  escuro (material `Keycap`);
- acende o display com "POLPAD" em cima do material `OLED_Screen`.

## Atualizar o modelo

O GLB exportado pelo glTF-Transform vem comprimido com meshopt, que o navegador
só abre com WebAssembly, e a política de segurança do site (`vercel.json`) não
permite isso. Por isso o arquivo passa pelo script, que descomprime uma vez e
grava um GLB comum (cerca de 1,6 MB, carregado só perto da seção):

```bash
npm run modelo -- caminho/para/modelo.glb
```

A saída padrão é `public/modelos/polpad.glb`. O teste
`tests/descomprimir-glb.test.mjs` confere que o modelo publicado não depende do
meshopt e que as 18 teclas estão nas mesmas posições de `src/lib/polpad.ts`.

## Trocar por outro modelo

Qualquer GLB serve: salve por cima de `public/modelos/polpad.glb`.

- Sem os grupos acima, o site mostra o modelo inteiro, com as cores do próprio
  arquivo, sem as legendas e sem o seletor de cor.
- Para a vista aberta, dê a cada peça a propriedade `afastamento`, em
  milímetros (no Blender, uma *custom property* do objeto, exportada com
  "Custom Properties" ligado). Ao abrir, a peça sobe esse tanto; valor negativo
  desce.
- Mantenha o arquivo leve: até uns 2 MB, sem texturas grandes.
