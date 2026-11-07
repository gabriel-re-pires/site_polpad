---
titulo: Montagem
descricao: Peças, pinagem do ESP32-C3 SuperMini e impressão do case.
chave: montagem
ordem: 1
fonte: https://github.com/gabriel-re-pires/polpad/blob/main/docs/PINAGEM.md
---

O Polpad é um macropad de 18 teclas com display, feito em volta de um
ESP32-C3 SuperMini. O módulo e o display ocupam o canto superior esquerdo da
placa, onde ficariam as duas primeiras teclas.

## Peças

| Peça | Quantidade |
|---|---|
| Módulo ESP32-C3 SuperMini | 1 |
| Switches mecânicos (soquetes Kailh hot-swap) | 18 |
| Diodos (um por tecla) | 18 |
| Display OLED SSD1306 0,96" 128×64, I2C | 1 |
| Placa (PCB) do Polpad | 1 |
| Case impresso em 3D (tampa e base) | 1 |

Os arquivos da placa e o esquemático serão publicados em breve.

## Pinagem

As teclas formam uma matriz de 4 linhas por 5 colunas, com 18 das 20
posições ocupadas.

|            | **GPIO0** | **GPIO1** | **GPIO2** | **GPIO3** | **GPIO4** |
|------------|-----------|-----------|-----------|-----------|-----------|
| **GPIO10** | —         | —         | SW10      | SW11      | SW18      |
| **GPIO7**  | SW1       | SW4       | SW9       | SW12      | SW17      |
| **GPIO6**  | SW2       | SW5       | SW8       | SW13      | SW16      |
| **GPIO5**  | SW3       | SW6       | SW7       | SW14      | SW15      |

- **Linhas:** GPIO 10, 7, 6 e 5, de cima para baixo, do lado dos diodos.
- **Colunas:** GPIO 0, 1, 2, 3 e 4, da esquerda para a direita, do lado dos
  soquetes.
- **Diodos:** cátodo voltado para a linha (COL2ROW).
- **Display:** I2C com SDA no GPIO8 e SCL no GPIO9, alimentado em 3V3,
  endereço 0x3C.
- **Livres:** GPIO 20 e 21.

## Imprimir o case

O case tem duas peças: a tampa, com a moldura das teclas e a janela do
display, e a base.

- **STL:** fatie `case_top.stl` e `case_bottom.stl` no fatiador da sua
  impressora.
- **G-code pronto:** existe um para a Creality Ender-3 V3 SE (Cura 5.12,
  camada de 0,12 mm). Ele só serve para essa impressora.

Os arquivos estão na página [Baixar](../../baixar/).
