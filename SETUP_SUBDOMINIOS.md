# Setup de Subdomínios Multi-Tenant — `{prefeitura}.digiurban.com.br`

Guia para colocar os subdomínios de município no ar. O **código já está pronto**
(resolução por host, landing white-label, sessão por município, painel de
configuração). Falta apenas a **infraestrutura**, descrita aqui.

Estratégia escolhida: **DNS + TLS via Cloudflare** (wildcard automático, sem
renovação manual de certificado).

---

## Visão geral

```
navegador
  → https://palmital.digiurban.com.br
  → Cloudflare (TLS wildcard *.digiurban.com.br no Edge — automático)
  → VPS 72.60.10.108:443 (Nginx do host, server_name wildcard)
  → localhost:3060 (Nginx do container → backend/frontend)
  → getByHost extrai "palmital" de TENANT_BASE_DOMAIN → tenant certo
```

Sem os 3 itens abaixo, todo subdomínio cai no tenant default (ou nem resolve).

---

## Passo 1 — Migrar o DNS para o Cloudflare  *(você, no registrador + Cloudflare)*

1. Criar conta em https://dash.cloudflare.com e **adicionar o site `digiurban.com.br`**.
2. O Cloudflare importa os registros atuais — **confira** que estão lá:
   - `A  digiurban.com.br   → 72.60.10.108`
   - `A  www               → 72.60.10.108`
   - registros de e-mail (MX, e os do `mail`/`smtp` do ultrazend) — **preservar**.
3. **Adicionar o wildcard:**
   - `A  *  → 72.60.10.108`  **(Proxy: laranja/ativado)**
4. Trocar os **nameservers** no registrador do domínio (onde `digiurban.com.br`
   foi registrado) para os que o Cloudflare indicar
   (ex.: `xxx.ns.cloudflare.com`). Propagação: minutos a algumas horas.
5. Em **SSL/TLS → Overview**, definir o modo **Full** (não "Flexible").
   O cert do servidor (Let's Encrypt de `digiurban.com.br`) continua servindo o
   tráfego Cloudflare→VPS; o cert que o navegador vê é o wildcard do Cloudflare.

> ⚠️ **E-mail:** o servidor SMTP (`ultrazend-smtp`, portas 25/587) e os registros
> MX **não devem ser proxied** (nuvem cinza no Cloudflare) — Cloudflare não faz
> proxy de SMTP. Deixe MX e qualquer `mail`/`smtp` como **DNS only (cinza)**.

Após isto: `palmital.digiurban.com.br` resolve e abre com HTTPS válido — sem
mexer em certbot.

---

## Passo 2 — Nginx do host: aceitar subdomínios  *(já aplicado na VPS)*

`/etc/nginx/sites-enabled/digiurban.conf` passa a ter no `server_name`:

```nginx
server_name digiurban.com.br www.digiurban.com.br *.digiurban.com.br;
```

O bloco de `proxy_pass http://localhost:3060` e o `proxy_set_header Host $host`
já repassam o subdomínio ao container. Nada mais muda aqui.

> Como o TLS do navegador termina no Cloudflare, o cert do host **não precisa**
> cobrir os subdomínios — o Cloudflare fala com a origem via SNI
> `digiurban.com.br`, coberto pelo cert atual. O certbot `--nginx` continua
> renovando normalmente os dois nomes existentes.

---

## Passo 3 — Variáveis de ambiente  *(no `docker-compose.vps.yml`, versionado)*

Já adicionadas ao compose:

```yaml
# serviço digiurban-vps → environment:
- TENANT_BASE_DOMAIN=${TENANT_BASE_DOMAIN:-digiurban.com.br}
- TENANT_DEFAULT_HOSTS=${TENANT_DEFAULT_HOSTS:-digiurban.com.br,www.digiurban.com.br}

# build args do frontend:
- NEXT_PUBLIC_TENANT_BASE_DOMAIN=${NEXT_PUBLIC_TENANT_BASE_DOMAIN:-digiurban.com.br}
```

- `TENANT_BASE_DOMAIN` — o backend usa para extrair o slug do subdomínio
  (`getByHost`). **Sem ela, subdomínios caem no default.**
- `TENANT_DEFAULT_HOSTS` — hosts que continuam sendo o tenant default (o domínio
  raiz institucional).
- `NEXT_PUBLIC_TENANT_BASE_DOMAIN` — o front usa na troca de município
  (`MunicipioSwitcher`) para montar a URL do subdomínio destino.

O deploy aplica no rebuild. (Aplicado imediatamente na VPS também — ver abaixo.)

---

## Passo 4 — Validar

```bash
# resolve pelo Cloudflare e abre com HTTPS válido?
curl -sI https://palmital.digiurban.com.br/ | head -1

# o backend resolveu o tenant certo?
curl -s https://palmital.digiurban.com.br/api/public/tenant-config | jq .tenant.slug
# → "palmital"

# a landing white-label aparece? (abrir no navegador)
#   https://palmital.digiurban.com.br  → identidade da prefeitura,
#   login do cidadão em destaque, acesso de servidores no rodapé
```

No painel super-admin, a aba **Endereço** de cada município mostra a URL final e
permite editar o slug/domínio próprio; a lista e o wizard exibem o endereço.

---

## Resumo do que faz o quê

| Item | Onde | Quem |
|---|---|---|
| DNS wildcard `* → VPS` | Cloudflare | **você** |
| TLS wildcard | Cloudflare (Edge, automático) | **você** (ao migrar NS) |
| `server_name *.digiurban.com.br` | Nginx do host | ✅ aplicado |
| `TENANT_BASE_DOMAIN` etc. | compose/env | ✅ aplicado |
| Resolução por host, landing, sessão | código | ✅ pronto |

Depois da migração de NS (Passo 1), tudo funciona sem novos deploys.
