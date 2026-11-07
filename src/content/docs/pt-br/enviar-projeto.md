---
titulo: Enviar um projeto
descricao: Como mandar o seu case, perfil, build ou firmware para a comunidade.
chave: enviar-projeto
ordem: 4
fonte: https://github.com/gabriel-re-pires/site_polpad/blob/main/CONTRIBUTING.md
---

Os projetos da comunidade ficam no repositório deste site, um por pasta. Você
envia o seu por um *pull request* (PR) no GitHub e ele entra no site depois
da revisão. Dá para fazer tudo pelo navegador, sem instalar o Git.

## O que dá para enviar

| Tipo | Exemplos | Licenças aceitas |
|---|---|---|
| `case` | variação do case, keycaps, suporte | CC-BY-4.0, CC-BY-SA-4.0, CERN-OHL-S-2.0 |
| `perfil` | perfil exportado do app (OBS, Photoshop, jogos…) | CC0-1.0, CC-BY-4.0 |
| `build` | "montei o meu assim": fotos, peças, mudanças | CC-BY-4.0, CC-BY-SA-4.0, CERN-OHL-S-2.0 |
| `firmware` | firmware modificado | GPL-3.0-or-later |

O firmware do Polpad é GPL, então um firmware modificado também precisa ser,
e precisa trazer o código-fonte ou um link para ele.

## Passo a passo

1. Abra o [repositório do site](https://github.com/gabriel-re-pires/site_polpad)
   e clique em **Fork**.
2. No seu fork, entre na pasta `comunidade` e clique em **Add file →
   Upload files**.
3. Escolha um nome para a pasta do projeto, só com letras minúsculas,
   números e hífen (por exemplo `case-com-tampa-de-acrilico`). Envie os
   arquivos para `comunidade/<nome>/`:
   - um `projeto.yml` (modelo abaixo);
   - uma imagem de capa;
   - fotos e arquivos do projeto, se tiver.
4. Clique em **Commit changes** e depois em **Contribute → Open pull
   request**.
5. Uma checagem automática confere o seu envio. Se algo estiver errado, a
   mensagem no PR diz o arquivo e o motivo.
6. Depois da revisão, o projeto aparece no site.

## O projeto.yml

```yaml
titulo: Case com tampa de acrílico
tipo: case            # case | perfil | build | firmware
autor:
  nome: Seu nome
  github: seu-usuario     # opcional
descricao: |
  Um texto curto sobre o projeto.

  Linhas em branco separam os parágrafos.
licenca: CC-BY-4.0    # uma das licenças aceitas para o tipo
data: 2026-11-07
capa: capa.jpg
fotos: [foto1.jpg, foto2.jpg]     # opcional
arquivos:                         # opcional: arquivos dentro da pasta
  - arquivos/tampa.stl
links:                            # opcional: arquivos grandes ou externos
  - titulo: Printables
    url: https://www.printables.com/...
versao_firmware: 2.1.0            # opcional: versão do firmware testada
```

## Limites

- Cada imagem com até **1 MB**.
- A pasta inteira com até **25 MB**. Para arquivos maiores, use `links`
  (Printables, Thingiverse, um release no seu GitHub…).
- Extensões aceitas: `.yml .md .jpg .png .webp .stl .3mf .step .json .bin .zip`.
- Um projeto por PR, e o PR só pode mexer na pasta do seu projeto.
