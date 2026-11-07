# Site do Polpad

Site do [Polpad](https://github.com/gabriel-re-pires/polpad): downloads, docs e
projetos da comunidade. Feito com [Astro](https://astro.build), publicado no
GitHub Pages.

## Rodar

Precisa de Node 22.23 ou mais novo.

```bash
npm install
npm run dev        # http://localhost:4321/site_polpad/
```

## Verificar

```bash
npm test           # testes (Vitest)
npm run build      # astro check + build + conferência dos links internos
npm run preview    # serve o dist/
```

## Comunidade

Os projetos ficam em `comunidade/<nome>/`. Para conferir os envios:

```bash
npm run validar    # arquivos, extensões, tamanhos e caminhos citados
npm run build      # esquema do projeto.yml e licença por tipo
```

Num PR, o workflow **Validar comunidade** roda as duas coisas. O guia para
quem envia está em `CONTRIBUTING.md` e em `/docs/enviar-projeto/`.

**Antes de aprovar um PR, olhe sempre a aba "Files changed".** O check roda com
o código do próprio PR: alguém mal-intencionado pode alterar o script de
validação para dar verde. Um PR de comunidade só deve ter arquivos dentro de
`comunidade/<nome>/`. Se aparecer qualquer arquivo fora dessa pasta
(`scripts/`, `src/`, `.github/`, `package*.json`…), não aprove.

## Publicar

O workflow **Publicar** gera o site e publica no GitHub Pages a cada push no
`main`. Na primeira vez, ative em Settings → Pages → Source: **GitHub
Actions**.

Enquanto não houver domínio próprio, o site fica em
`https://gabriel-re-pires.github.io/site_polpad/`.

### Ligar o domínio polpad.com.br

1. Em `site.config.mjs`: `SITE = 'https://polpad.com.br'` e `BASE = '/'`.
2. Crie `public/CNAME` contendo só `polpad.com.br`.
3. No registro.br, configure o DNS:
   - registros **A** de `polpad.com.br` para `185.199.108.153`,
     `185.199.109.153`, `185.199.110.153` e `185.199.111.153`;
   - **CNAME** de `www` para `gabriel-re-pires.github.io`.
4. Em Settings → Pages, informe o domínio e marque **Enforce HTTPS**.
5. Verifique o domínio na conta do GitHub (Settings → Pages → Verified
   domains), para ninguém sequestrá-lo.
6. Troque os links `gabriel-re-pires.github.io/site_polpad` em
   `CONTRIBUTING.md` e `.github/PULL_REQUEST_TEMPLATE.md`.

O planejamento está em `docs/planejamento/`.
