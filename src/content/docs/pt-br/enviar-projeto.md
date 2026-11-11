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

O firmware do Polpad One é GPL, então um firmware modificado também precisa ser,
e precisa trazer o código-fonte ou um link para ele.

## Passo a passo

1. Abra o [repositório do site](https://github.com/gabriel-re-pires/site_polpad)
   e clique em **Fork**.
2. No seu fork, entre na pasta `comunidade` e clique em **Add file →
   Create new file**.
3. No campo do nome, digite o nome da pasta do projeto, uma barra e
   `projeto.yml`, por exemplo `case-com-tampa-de-acrilico/projeto.yml`. Ao
   digitar a barra, o GitHub cria a pasta. Use só letras minúsculas,
   números e hífen no nome da pasta.
4. Cole o conteúdo do `projeto.yml` (modelo abaixo), preencha e clique em
   **Commit changes**.
5. Entre na pasta que você criou, clique em **Add file → Upload files** e
   envie a imagem de capa, as fotos e os arquivos do projeto. Clique em
   **Commit changes** de novo.
6. Volte à página do seu fork e clique em **Contribute → Open pull
   request**.
7. Uma checagem automática confere o seu envio. Se ela ficar vermelha,
   clique em **Details** para ver o arquivo e o motivo.
8. Depois da revisão, o projeto aparece no site.

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
- Até **30 arquivos** por projeto.
- Extensões aceitas: `.yml .md .jpg .jpeg .png .webp .stl .3mf .step .json .bin`.
  Sem `.zip`: envie os arquivos soltos. `.bin` só em projeto `firmware`.
- O conteúdo tem de bater com a extensão: um arquivo renomeado para `.png`
  que não é imagem é recusado.
- Um projeto por PR, e o PR só pode mexer na pasta do seu projeto.
