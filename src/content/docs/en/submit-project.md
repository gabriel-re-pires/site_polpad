---
titulo: Submit a project
descricao: How to send your case, profile, build or firmware to the community.
chave: enviar-projeto
ordem: 4
fonte: https://github.com/gabriel-re-pires/site_polpad/blob/main/CONTRIBUTING.md
---

Community projects live in this site's repository, one per folder. You send
yours as a GitHub *pull request* (PR) and it shows up on the site after
review. You can do it all from the browser, without installing Git.

## What you can send

| Type | Examples | Accepted licenses |
|---|---|---|
| `case` | case variant, keycaps, stand | CC-BY-4.0, CC-BY-SA-4.0, CERN-OHL-S-2.0 |
| `perfil` (profile) | profile exported from the app (OBS, Photoshop, games…) | CC0-1.0, CC-BY-4.0 |
| `build` | "here is how I built mine": photos, parts, changes | CC-BY-4.0, CC-BY-SA-4.0, CERN-OHL-S-2.0 |
| `firmware` | modified firmware | GPL-3.0-or-later |

The Polpad firmware is GPL, so modified firmware must be GPL too and must
include its source code or a link to it.

## Step by step

1. Open the [site repository](https://github.com/gabriel-re-pires/site_polpad)
   and click **Fork**.
2. In your fork, go into the `comunidade` folder and click **Add file →
   Upload files**.
3. Pick a folder name for your project, using only lowercase letters,
   numbers and hyphens (for example `acrylic-top-case`). Upload the files
   to `comunidade/<name>/`:
   - a `projeto.yml` (template below);
   - a cover image;
   - photos and project files, if any.
4. Click **Commit changes**, then **Contribute → Open pull request**.
5. An automatic check looks at your submission. If something is wrong, the
   message on the PR names the file and the reason.
6. After review, the project shows up on the site.

## The projeto.yml file

The field names are in Portuguese; keep them as they are.

```yaml
titulo: Acrylic top case           # title
tipo: case                         # case | perfil | build | firmware
autor:                             # author
  nome: Your name
  github: your-username             # optional
descricao: |                       # description
  A short text about the project.

  Blank lines separate paragraphs.
licenca: CC-BY-4.0                 # license, one accepted for the type
data: 2026-11-07                   # date
capa: cover.jpg                    # cover image
fotos: [photo1.jpg, photo2.jpg]    # optional: photos
arquivos:                          # optional: files inside the folder
  - files/top.stl
links:                             # optional: large or external files
  - titulo: Printables
    url: https://www.printables.com/...
versao_firmware: 2.1.0             # optional: firmware version tested
```

## Limits

- Each image up to **1 MB**.
- The whole folder up to **25 MB**. For bigger files, use `links`
  (Printables, Thingiverse, a release on your GitHub…).
- Accepted extensions: `.yml .md .jpg .png .webp .stl .3mf .step .json .bin .zip`.
- One project per PR, and the PR may only touch your project's folder.
