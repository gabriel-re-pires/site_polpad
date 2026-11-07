---
titulo: Assembly
descricao: Parts, ESP32-C3 SuperMini pinout and printing the case.
chave: montagem
ordem: 1
fonte: https://github.com/gabriel-re-pires/polpad/blob/main/docs/PINAGEM.md
---

The Polpad is an 18-key macropad with a display, built around an ESP32-C3
SuperMini. The module and the display sit in the top-left corner of the
board, where the first two keys would be.

## Parts

| Part | Quantity |
|---|---|
| ESP32-C3 SuperMini module | 1 |
| Mechanical switches (Kailh hot-swap sockets) | 18 |
| Diodes (one per key) | 18 |
| SSD1306 0.96" 128×64 I2C OLED display | 1 |
| Polpad board (PCB) | 1 |
| 3D-printed case (top and bottom) | 1 |

The board files and the schematic will be published soon.

## Pinout

The keys form a 4-row by 5-column matrix, with 18 of the 20 positions
used.

|            | **GPIO0** | **GPIO1** | **GPIO2** | **GPIO3** | **GPIO4** |
|------------|-----------|-----------|-----------|-----------|-----------|
| **GPIO10** | —         | —         | SW10      | SW11      | SW18      |
| **GPIO7**  | SW1       | SW4       | SW9       | SW12      | SW17      |
| **GPIO6**  | SW2       | SW5       | SW8       | SW13      | SW16      |
| **GPIO5**  | SW3       | SW6       | SW7       | SW14      | SW15      |

- **Rows:** GPIO 10, 7, 6 and 5, top to bottom, on the diode side.
- **Columns:** GPIO 0, 1, 2, 3 and 4, left to right, on the socket side.
- **Diodes:** cathode towards the row (COL2ROW).
- **Display:** I2C with SDA on GPIO8 and SCL on GPIO9, powered from 3V3,
  address 0x3C.
- **Free:** GPIO 20 and 21.

## Printing the case

The case has two parts: the top, with the key frame and the display
window, and the bottom.

- **STL:** slice `case_top.stl` and `case_bottom.stl` for your printer.
- **Ready-made G-code:** there is one for the Creality Ender-3 V3 SE
  (Cura 5.12, 0.12 mm layers). It only works on that printer.

The files are on the [Download](../../download/) page.
