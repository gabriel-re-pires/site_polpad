---
titulo: Firmware
descricao: Flash and update the firmware from the software, and how the Polpad One connects to your computer.
chave: firmware
ordem: 3
fonte: https://github.com/gabriel-re-pires/polpad/blob/main/firmware/README.md
---

The firmware is the program that runs inside the Polpad One. You do not need
the Arduino IDE or any other tool: the Polpad software flashes the firmware over
USB.

## Flash or update

1. Plug the Polpad One in over USB and open Polpad.
2. In the menu (☰), choose **Gravar firmware** (flash firmware).
3. Check the port. Under **Firmware a gravar** (firmware to flash), keep
   **Último release publicado no GitHub** (latest GitHub release) selected.
4. Click **Gravar firmware** and wait for it to finish. **Do not unplug the
   cable halfway:** an interrupted flash leaves the Polpad One without
   firmware until you flash it again.

The software shows the version on the device and warns you when the release is
older than that. It also tells you when new firmware comes out.

The **Arquivo .bin no computador** (.bin file on this computer) option is
for firmware you downloaded by hand, such as the `.bin` on the
[Download](../../download/) page or community firmware.

## How the Polpad One connects

The Polpad One works **plugged into a computer over USB, with the Polpad
software open** (even minimized to the tray). Keys go over USB, the software runs
the profile actions and the display shows what the software sends.

### Bluetooth: in development

The ESP32-C3 has Bluetooth, and a wireless mode has already been started in the
firmware: without the software, the Polpad One would become a Bluetooth keyboard
with fixed shortcuts. This mode **has not been tested yet and is not ready to
use**, so for now use the Polpad One over the cable. Once it is ready, this guide
will explain how to pair it.
