---
titulo: Firmware
descricao: Gravar e atualizar o firmware pelo app, e usar o macropad sem o app via Bluetooth.
chave: firmware
ordem: 3
fonte: https://github.com/gabriel-re-pires/polpad/blob/main/firmware/README.md
---

O firmware é o programa que roda dentro do macropad. Você não precisa de
Arduino IDE nem de outras ferramentas: o app do Polpad grava o firmware pelo
cabo USB.

## Gravar ou atualizar

1. Conecte o macropad pelo cabo USB e abra o Polpad.
2. No menu (☰), escolha **Gravar firmware**.
3. Confira a porta. Em **Firmware a gravar**, deixe marcado
   **Último release publicado no GitHub**.
4. Clique em **Gravar firmware** e espere terminar. **Não desconecte o cabo
   no meio:** a gravação interrompida deixa o macropad sem firmware até uma
   nova gravação.

O app mostra a versão que está no aparelho e avisa quando o release é mais
antigo que ela. Ele também avisa quando sai um firmware novo.

A opção **Arquivo .bin no computador** serve para gravar um firmware
baixado à mão, como o `.bin` da página [Baixar](../../baixar/) ou um
firmware da comunidade.

## Com e sem o app

- **Com o app aberto** (mesmo minimizado na bandeja): as teclas vão pelo
  USB e o app executa as ações do perfil. O display mostra o que o app
  manda.
- **Sem o app**, ou em outro computador, tablet ou celular: o macropad vira
  um **teclado Bluetooth** com atalhos fixos. A troca entre os dois modos é
  automática.

### Parear pelo Bluetooth

1. Ligue o macropad. A tela mostra o polvo girando e "Aguardando conexão".
2. No Windows, abra **Configurações → Bluetooth e dispositivos → Adicionar
   dispositivo → Bluetooth**. No Android ou no macOS, abra a tela de
   Bluetooth.
3. Escolha **Polpad**. Não precisa de PIN.

Se o pareamento der problema, remova o dispositivo no sistema e pareie de
novo.
