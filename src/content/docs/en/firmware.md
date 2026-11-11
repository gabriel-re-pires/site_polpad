---
titulo: Firmware
descricao: Flash and update the firmware from the app, and use the Polpad One over Bluetooth without the app.
chave: firmware
ordem: 3
fonte: https://github.com/gabriel-re-pires/polpad/blob/main/firmware/README.md
---

The firmware is the program that runs inside the Polpad One. You do not need
the Arduino IDE or any other tool: the Polpad app flashes the firmware over
USB.

## Flash or update

1. Plug the Polpad One in over USB and open Polpad.
2. In the menu (☰), choose **Gravar firmware** (flash firmware).
3. Check the port. Under **Firmware a gravar** (firmware to flash), keep
   **Último release publicado no GitHub** (latest GitHub release) selected.
4. Click **Gravar firmware** and wait for it to finish. **Do not unplug the
   cable halfway:** an interrupted flash leaves the Polpad One without
   firmware until you flash it again.

The app shows the version on the device and warns you when the release is
older than that. It also tells you when new firmware comes out.

The **Arquivo .bin no computador** (.bin file on this computer) option is
for firmware you downloaded by hand, such as the `.bin` on the
[Download](../../download/) page or community firmware.

## With and without the app

- **With the app open** (even minimized to the tray): keys go over USB and
  the app runs the profile actions. The display shows what the app sends.
- **Without the app**, or on another computer, tablet or phone: the
  Polpad One becomes a **Bluetooth keyboard** with fixed shortcuts. Switching
  between the two is automatic.

### Pairing over Bluetooth

1. Turn the Polpad One on. The screen shows the spinning octopus and
   "Aguardando conexão" (waiting for connection).
2. On Windows, open **Settings → Bluetooth & devices → Add device →
   Bluetooth**. On Android or macOS, open the Bluetooth screen.
3. Pick **Polpad**. No PIN is needed.

If pairing misbehaves, remove the device from the system and pair again.
