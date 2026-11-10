# Deploy na Vercel com polpad.com.br

O GitHub Actions faz o build e envia o resultado pronto para a Vercel
(`.github/workflows/deploy.yml`). A Vercel **não tem acesso nenhum** ao
repositório: se a conta dela for invadida, ninguém lê nem escreve no GitHub
por ela. O pior caso é trocarem o site publicado, e o próximo deploy desfaz
isso.

O workflow tem dois jobs. `build` roda o código do projeto e das
dependências, sem token. `enviar` só baixa o resultado e manda para a Vercel,
com a CLI da Vercel travada em `ferramentas/vercel/package-lock.json`.

Faça os passos na ordem. O GitHub Pages só sai no fim, quando o domínio novo
já estiver no ar.

## 1. Contas

Ative a verificação em duas etapas (de preferência por app ou chave física,
não SMS) em:

- GitHub: <https://github.com/settings/security>
- Vercel: Account Settings → Authentication
- registro.br: Minha conta → Segurança

## 2. Projeto na Vercel, sem Git

Não use "Import Git Repository" e não instale o app da Vercel no GitHub: ele
pede escrita no repositório.

```bash
npm ci --prefix ferramentas/vercel --ignore-scripts
```

```bash
npm exec --prefix ferramentas/vercel -- vercel login
```

```bash
npm exec --prefix ferramentas/vercel -- vercel project create polpad
```

Não use `vercel link`: ele tenta conectar o repositório Git. Os dois IDs de
que o deploy precisa saem destes comandos:

- `projectId`: `vercel project inspect polpad` (linha "ID", começa com `prj_`).
- `orgId`: `vercel api /v2/teams/<seu-time>` (campo `id`, começa com `team_`).

Projeto atual: `prj_ocfC8fPGWjDAqrn2B3D4qPrbagio`, time
`team_H90AHMRUcwPO0LLONKdzijXm` (GRP). Esses IDs não são segredo.

No projeto, deixe Framework = Astro e Node.js = 24.x (Settings → Build and
Deployment).

Depois, no painel da Vercel:

- Project → Settings → Git: **Connected Git Repository** tem de estar vazio.
  Se a Vercel tiver ligado o repositório sozinha, clique em Disconnect.
- Em <https://github.com/settings/installations>, a Vercel **não** pode
  aparecer. Se aparecer, clique em Configure → Uninstall.

O `vercel.json` também tem `git.deploymentEnabled: false`: mesmo que alguém
ligue o Git depois, a Vercel não faz deploy sozinha.

## 3. Token da Vercel

Account Settings → Tokens → Create:

- Scope: só a sua conta (ou o time do projeto).
- Expiration: 1 ano. Ponha um lembrete para trocar.

Copie o token. Ele só aparece uma vez.

## 4. Ambiente "production" no GitHub

No repositório: Settings → Environments → New environment → `production`.

- **Deployment branches and tags**: Selected branches → adicione `main`.
  Assim, só a `main` usa o token. PRs, inclusive os de fork, não chegam nele.
- **Environment secrets**: `VERCEL_TOKEN` = o token do passo 3.
- **Environment variables**: `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` = os
  valores do `.vercel/project.json`.

Use secret de **ambiente**, não de repositório. O workflow
`conferir-envio.yml` roda com `pull_request_target` e teria acesso a secrets
do repositório.

## 5. Primeiro deploy

Faça o merge na `main`. Em Actions → Deploy, os dois jobs têm de terminar
verdes. O job `enviar` mostra uma URL `*.vercel.app`: abra e confira o site
antes de mexer no DNS.

## 6. Domínio

Na Vercel: Project → Settings → Domains → Add:

1. `polpad.com.br`
2. `www.polpad.com.br`: escolha **Redirect to polpad.com.br** (308).

A Vercel mostra os valores de DNS de cada um. Use exatamente os que
aparecerem: o IP muda de projeto para projeto.

No registro.br: Domínios → polpad.com.br → DNS → Editar zona. Use o DNS do
próprio registro.br, que já vem com DNSSEC ligado. Confira em "DNSSEC" que o
status está ativo.

| Nome | Tipo | Valor | Para quê |
|---|---|---|---|
| (vazio) | A | IP que a Vercel mostrar | site |
| `www` | CNAME | valor que a Vercel mostrar | www |
| (vazio) | CAA | `0 issue "letsencrypt.org"` | só a Let's Encrypt (usada pela Vercel) emite certificado |
| (vazio) | TXT | `v=spf1 -all` | ninguém envia e-mail como @polpad.com.br |
| `_dmarc` | TXT | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` | servidores recusam e-mail falso do domínio |

Se um dia usar e-mail no domínio, troque o SPF e o DMARC pelos que o
provedor de e-mail pedir.

A propagação leva de minutos a algumas horas. Quando os dois domínios
ficarem "Valid Configuration" na Vercel, o HTTPS já está ativo.

## 7. Desligar o GitHub Pages

Só depois que `https://polpad.com.br` abrir certinho: Settings → Pages →
Unpublish site. Depois, em Settings → Environments, apague o ambiente
`github-pages`. O endereço `gabriel-re-pires.github.io/site_polpad` para de
funcionar.

## 8. Proteção contra abuso na Vercel

O site é estático: não há servidor nosso para derrubar nem formulário para
encher. O risco é alguém gastar a sua cota de tráfego. Os arquivos da
comunidade são baixados do GitHub, não da Vercel, o que já tira o peso maior.

- **Plano Hobby**: quando a cota acaba, a Vercel pausa o site em vez de
  cobrar. Não há conta surpresa. O Hobby é só para uso não comercial; se o
  Polpad passar a ser vendido, mude para Pro e ligue o **Spend Management**
  com limite.
- **Firewall → Bot Protection**: ligue em modo Challenge.
- **Firewall → Rules → Add Rule** (o Hobby dá 1 regra de limite):
  - If: Request Path starts with `/`
  - Then: Rate Limit, Fixed Window, 60 s, 1000 requisições, por IP
  - Action: Deny (429)

  Muita gente no Brasil divide o mesmo IP com outros clientes da operadora
  (CGNAT), então o limite tem de ser folgado: 1000 por minuto ainda segura um
  robô martelando o site. A contagem é por região, então é aproximada.
- **Sob ataque**: Firewall → **Attack Challenge Mode**. Todo visitante passa
  por um desafio até você desligar.

O `vercel.json` já manda os cabeçalhos de segurança (CSP, HSTS, anti-iframe,
nosniff). Para conferir depois do deploy:

```bash
curl -sI https://polpad.com.br/
```

ou <https://developer.mozilla.org/en-US/observatory>.

## 9. Cloudflare: não precisa

A Vercel já tem CDN, HTTPS, firewall e proteção contra DDoS. Pôr o proxy da
Cloudflare (nuvem laranja) na frente atrapalha:

- a Vercel passa a ver os IPs da Cloudflare, não os dos visitantes, e o
  limite por IP do passo 8 deixa de funcionar;
- a emissão do certificado da Vercel pode falhar;
- são dois caches para limpar e duas contas para proteger.

Usar a Cloudflare só como DNS (nuvem cinza) funciona, mas não traz nada que o
DNS do registro.br, com DNSSEC, já não dê. Só vale pensar nela se um dia
houver um ataque que o Firewall da Vercel não segure.

## 10. Repositório no GitHub

Settings do repositório:

- **Rules → Rulesets → New branch ruleset** para `main`: Require a pull
  request, Block force pushes, Restrict deletions. Não marque "Require
  status checks": as checagens só rodam em PRs que mexem em `comunidade/`, e
  os outros PRs ficariam travados esperando por elas.
- **Actions → General**:
  - Fork pull request workflows: **Require approval for all external
    contributors**. Assim, ninguém de fora roda Actions no seu repositório
    sem você aprovar.
  - Workflow permissions: **Read repository contents**.
- **Code security**: ligue Dependabot alerts, Dependabot security updates,
  Secret scanning e Push protection.

## 11. Revisão dos envios da comunidade

A checagem automática barra extensão proibida, arquivo cujo conteúdo não bate
com a extensão, `.zip`, `.bin` fora de firmware, mais de 30 arquivos, imagem
acima de 1 MB e pasta acima de 25 MB. Ela não acha vírus escondido dentro de
um arquivo válido. Antes do merge:

- Leia o diff inteiro e abra os arquivos.
- Firmware (`.bin`): só aceite com o código-fonte. Na dúvida, compile você
  mesmo e compare.
- Desconfie de conta nova, envio com pressa ou links para encurtadores.
