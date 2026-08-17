# Arena Sul Sports — portal e galeria de eventos

Reconstrução completa do site da Arena Sul Sports em Next.js, baseada no material institucional fornecido pelo cliente e nas informações públicas do site atual. O projeto inclui portal responsivo, páginas públicas de eventos e uma área administrativa pronta para autenticação e persistência com Supabase.

## O que está implementado

- Home responsiva com a identidade azul-marinho e laranja do material institucional.
- História, estrutura, modalidades, locação para eventos, escolas, empresas, manifesto, contato e localização.
- CTAs diretos para o WhatsApp oficial.
- Destaque editorial do Instagram no rodapé, com link para o perfil e para o destaque “Eventos”.
- Listagem pública em `/eventos` e página individual em `/eventos/[slug]`.
- Área ADMIN em `/admin` para criar, editar, publicar e despublicar eventos.
- Upload múltiplo de fotos com prévia, validação de formato/tamanho e remoção.
- Supabase Auth, Postgres, Storage privado e Row Level Security (RLS).
- Modo demonstração seguro e explicitamente não persistente para avaliar o protótipo sem credenciais.
- SEO local, Open Graph, Twitter Card, JSON-LD, sitemap com eventos e `robots.txt`.

O bloco do Instagram usa links oficiais estáveis. Ele não tenta copiar um feed ao vivo por scraping: um feed automático exigiria acesso autorizado à API da Meta ou um provedor aprovado.

## Rotas

| Rota | Uso |
|---|---|
| `/` | Portal institucional e destaques de eventos |
| `/eventos` | Galeria pública de todos os eventos publicados |
| `/eventos/[slug]` | Descrição e álbum público de um evento |
| `/admin/login` | Login administrativo no modo Supabase |
| `/admin` | Dashboard de conteúdo |
| `/admin/eventos/novo` | Cadastro de evento e upload múltiplo |
| `/admin/eventos/[id]/editar` | Edição, publicação e remoção de fotos |

## Documentação de referência

- [Auditoria do site atual](docs/AUDITORIA_SITE_ATUAL.md): inventário permanente de conteúdo, rotas, contatos, ativos, fontes públicas e problemas encontrados na versão Wix.
- [Validação de conteúdo](docs/CONTENT_VALIDATION.md): itens que exigem confirmação do cliente antes do lançamento.
- [Configuração do ADMIN e Supabase](docs/ADMIN_SUPABASE_SETUP.md): preparação da autenticação, banco, Storage e operação real.

## Stack e arquitetura

- Next.js 16 App Router, React 19 e TypeScript.
- CSS responsivo com componentes React e `next/image`.
- Supabase Auth para login.
- Supabase Postgres para eventos e metadados.
- Supabase Storage privado para as imagens.
- Vercel como destino de hospedagem.

No modo real, o navegador autenticado envia as fotos diretamente ao Storage. Uma Server Action revalida os dados, grava os metadados e atualiza o portal. Visitantes consultam somente eventos publicados; as fotos são entregues por URLs assinadas de uma hora geradas no servidor.

## Executar localmente

Requisitos: Node.js 20+ e pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

No Windows PowerShell, substitua o `cp` por:

```powershell
Copy-Item .env.example .env.local
```

Abra [http://localhost:3000](http://localhost:3000). Sem credenciais, o projeto entra em modo demonstração.

## Variáveis de ambiente

```env
DEMO_MODE=true
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Com `DEMO_MODE=true`, a interface ADMIN pode ser testada, mas nada é salvo. Para a operação real:

1. Crie e prepare o projeto Supabase seguindo [docs/ADMIN_SUPABASE_SETUP.md](docs/ADMIN_SUPABASE_SETUP.md).
2. Configure `DEMO_MODE=false`.
3. Preencha a URL e a chave `anon/publishable` do Supabase.
4. Defina `NEXT_PUBLIC_SITE_URL` com o domínio final, sem barra no fim.
5. Faça um novo build/deploy, pois a origem permitida das imagens é derivada da URL do Supabase durante o build.

Não é necessária uma `service_role` key. Nunca exponha uma chave privilegiada com prefixo `NEXT_PUBLIC_`.

## Verificação

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Antes de ativar o modo real, valide também o fluxo completo descrito na documentação do ADMIN: autenticação, rascunho, publicação, upload, exibição pública e remoção.

## Publicar no GitHub e na Vercel

O projeto está preparado para um repositório Git e para importação na Vercel.

1. Crie um repositório privado no GitHub e envie a branch `main`.
2. Na Vercel, importe o repositório e mantenha o framework detectado como Next.js.
3. Para uma primeira apresentação sem banco, configure `DEMO_MODE=true`.
4. Para produção, aplique a migração do Supabase e cadastre todas as variáveis acima.
5. Confirme `NEXT_PUBLIC_SITE_URL` com o domínio real e gere um novo deploy.
6. Faça o smoke test das rotas públicas e administrativas.

## Conteúdo e direitos de uso

Os textos e imagens iniciais foram reconstruídos a partir do PDF entregue e das fontes públicas oficiais, sem copiar o código Wix. Antes do lançamento, o cliente deve aprovar os números, superlativos e direitos de imagem. O checklist detalhado está em [docs/CONTENT_VALIDATION.md](docs/CONTENT_VALIDATION.md).

Em especial, solicite:

- logotipo original em SVG ou PNG de alta resolução;
- fotos originais, não apenas as versões comprimidas dentro do PDF;
- confirmação das licenças de imagens e autorização das pessoas retratadas;
- confirmação de capacidade, estacionamento, números de participantes e alegações como “maior arena da região”.

## Imagem social

`public/images/arena-sul-og-background.jpg` foi criada especificamente para o Open Graph deste protótipo, usando a paleta do material institucional. O logo continua vindo do arquivo do cliente; a imagem social não inventa nem redesenha a marca.
