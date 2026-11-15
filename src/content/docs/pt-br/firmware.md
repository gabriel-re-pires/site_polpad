---
titulo: Firmware
descricao: Gravar e atualizar o firmware pelo software, e como o Polpad One se conecta ao computador.
chave: firmware
ordem: 3
fonte: https://github.com/gabriel-re-pires/polpad/blob/main/firmware/README.md
---

O firmware é o programa que roda dentro do Polpad One. Você não precisa de
Arduino IDE nem de outras ferramentas: o software Polpad grava o firmware pelo
cabo USB.

## Gravar ou atualizar

1. Conecte o Polpad One pelo cabo USB e abra o Polpad.
2. No menu (☰), escolha **Gravar firmware**.
3. Confira a porta. Em **Firmware a gravar**, deixe marcado
   **Último release publicado no GitHub**.
4. Clique em **Gravar firmware** e espere terminar. **Não desconecte o cabo
   no meio:** a gravação interrompida deixa o Polpad One sem firmware até uma
   nova gravação.

O software mostra a versão que está no aparelho e avisa quando o release é mais
antigo que ela. Ele também avisa quando sai um firmware novo.

A opção **Arquivo .bin no computador** serve para gravar um firmware
baixado à mão, como o `.bin` da página [Download](../../download/) ou um
firmware da comunidade.

## Como o Polpad One se conecta

O Polpad One funciona **conectado pelo cabo USB a um computador com o software
Polpad aberto** (mesmo minimizado na bandeja). As teclas vão pelo USB, o software
executa as ações do perfil e o display mostra o que o software manda.

### Bluetooth: em desenvolvimento

O ESP32-C3 tem Bluetooth, e um modo sem fio já foi iniciado no firmware: sem o
software, o Polpad One viraria um teclado Bluetooth com atalhos fixos. Esse modo
**ainda não foi testado nem está pronto para uso**, então por enquanto use o
Polpad One pelo cabo. Quando ele estiver pronto, este guia vai explicar como
parear.
