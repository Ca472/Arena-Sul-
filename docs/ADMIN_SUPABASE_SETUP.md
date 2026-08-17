# Área administrativa e Supabase

Este módulo adiciona ao portal da Arena Sul uma área protegida em `/admin`, com autenticação por e-mail e senha, cadastro e publicação de eventos e upload múltiplo de fotos. A aplicação usa somente a chave **anon/publishable** do Supabase; nenhuma chave `service_role` é necessária ou enviada ao navegador.

## 1. Testar a interface sem Supabase

Copie `.env.example` para `.env.local` e mantenha:

```env
DEMO_MODE=true
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Depois execute `pnpm dev` e abra `http://localhost:3000/admin/login`. O modo demonstração:

- libera a navegação sem credenciais;
- exibe eventos e fotos locais de exemplo;
- permite selecionar várias fotos, ver prévias e validar o formulário;
- sempre informa que **nenhuma alteração é persistida**.

Se nenhuma variável for configurada, o clone local também abre no modo demonstração. Definir explicitamente `DEMO_MODE=false` sem as duas variáveis do Supabase faz a área administrativa falhar fechada e mostrar uma mensagem de configuração.

## 2. Criar e preparar o projeto Supabase

1. Crie um projeto em [supabase.com](https://supabase.com/).
2. Aplique, nesta ordem, as migrações em `supabase/migrations/`. Prefira o CLI (`supabase db push`) para manter o histórico remoto alinhado.
3. Em **Integrations → Data API → Settings**, desabilite **Automatically expose new tables and functions**. As migrações concedem explicitamente apenas os privilégios usados pelo portal.
4. Em **Authentication → Providers**, mantenha o provedor de e-mail habilitado.
5. Configure o fluxo de convite descrito abaixo e envie o convite em **Authentication → Users → Send invitation**.
6. Assim que o convite criar o usuário, copie o UUID e registre a autorização no SQL Editor:

```sql
insert into public.admins (user_id, display_name)
values ('UUID_DO_USUARIO', 'Nome da pessoa');
```

### Primeiro acesso por convite

Em **Authentication → URL Configuration**, mantenha como **Site URL** a origem HTTPS em que o fluxo de autenticação realmente está publicado. A configuração do Supabase Auth é independente de `NEXT_PUBLIC_SITE_URL`. Não envie um convite apontando para localhost, para um deploy antigo ou para um Preview bloqueado por uma tela de login intermediária.

Em **Authentication → Email Templates → Invite user**, use o endpoint SSR do portal:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">
  Aceitar convite e definir senha
</a>
```

O callback aceita somente convites, troca o token de uso único por uma sessão em cookie e redireciona para `/admin/definir-senha`. O titular escolhe a própria senha e é desconectado em seguida, devendo comprovar a nova credencial no login normal. O callback nunca concede autorização administrativa: o acesso depende exclusivamente do UUID presente em `public.admins`.

Configure também a política de senha no próprio Supabase Auth — não apenas na interface — com pelo menos 12 caracteres, letra maiúscula, letra minúscula, número e símbolo. Ative a proteção contra senhas vazadas se o plano permitir. Para um portal somente por convite, desabilite novos cadastros públicos.

### Recuperação de senha

Em **Authentication → URL Configuration → Redirect URLs**, autorize exatamente
o callback de cada ambiente utilizado, por exemplo:

```text
https://SEU-DOMINIO.com.br/auth/recovery
```

Mantenha o link `{{ .ConfirmationURL }}` no template padrão de **Reset
Password**. O formulário público em `/admin/recuperar-senha` chama
`resetPasswordForEmail` com um `redirectTo` fixo para `/auth/recovery`. A tela
sempre responde de forma genérica, exista ou não uma conta, evitando enumeração
de administradores.

O fluxo usa PKCE: o navegador que solicita a recuperação guarda temporariamente
o verificador em cookie, e o callback servidor aceita somente o `code` de uso
único. Por isso, o link do e-mail deve ser aberto no mesmo navegador e
dispositivo em que foi solicitado. O callback grava a sessão em cookies,
revalida o usuário no Supabase e confirma o UUID em `public.admins` antes de
liberar `/admin/definir-senha`. Ele não aceita destino arbitrário, não processa
tokens no navegador e não usa chave `service_role`.

A migração cria:

- `admins`: lista explícita de usuários autorizados;
- `events`: conteúdo, datas e estado de publicação;
- `event_photos`: metadados e ordem das fotos;
- `site_settings`: configurações públicas, incluindo a referência do Instagram;
- bucket privado `event-photos`, limitado a JPG, PNG e WebP de até 10 MB;
- políticas RLS para leitura pública apenas de eventos publicados e controle total apenas por administradores.

As fotos ficam em um bucket privado. O servidor gera links assinados de uma hora somente quando a política RLS autoriza a leitura. O primeiro segmento do caminho no Storage é o UUID do evento.

### Se o SQL foi aplicado pelo SQL Editor

O SQL Editor altera o schema, mas não registra a versão em `supabase_migrations.schema_migrations`. Antes de usar `supabase db push`, reconcilie o histórico verificado:

```powershell
supabase init
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase migration list
supabase migration repair --status applied 20260817000000
supabase migration repair --status applied 20260817010000
supabase migration list
supabase db push --dry-run
```

O último comando deve informar que não há migrações pendentes. Não marque uma versão como aplicada sem antes confirmar que o schema remoto corresponde ao arquivo.

## 3. Variáveis locais e da Vercel

No Supabase, copie **Project URL** e a chave **anon/publishable** em **Project Settings → API**. Configure:

```env
DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_OU_PUBLISHABLE
NEXT_PUBLIC_SITE_URL=https://SEU-DOMINIO.com.br
```

Use os mesmos nomes em **Vercel → Project → Settings → Environment Variables** para Production, Preview e Development conforme necessário. Faça um novo deploy após alterar variáveis.

`NEXT_PUBLIC_SITE_URL` controla canonical, sitemap e metadados sociais. A origem de imagens remotas permitida pelo Next.js é derivada de `NEXT_PUBLIC_SUPABASE_URL` no build, portanto alterações nessa URL também exigem um novo deploy.

> Nunca configure `SUPABASE_SERVICE_ROLE_KEY` com prefixo `NEXT_PUBLIC_`. Este projeto não usa essa chave.

## 4. Fluxo de upload

No modo real, o navegador autenticado envia os arquivos diretamente ao Supabase Storage. Antes do envio, a interface verifica tipo, tamanho, quantidade e se o arquivo pode ser decodificado como imagem. Em seguida, uma Server Action revalida o evento e os metadados, registra tudo no banco e atualiza as páginas do portal.

Em caso de falha antes do registro, a interface tenta remover os objetos enviados para evitar arquivos órfãos. Como proteção operacional adicional, recomenda-se monitorar periodicamente objetos sem registro correspondente em `event_photos`.

## 5. Consulta pública estável

O portal público deve consumir a função server-only:

```ts
import {
  getPublishedEventBySlug,
  getPublishedEvents,
} from "@/lib/events/queries";

const events = await getPublishedEvents({ limit: 6 });

const event = await getPublishedEventBySlug("festival-arena-sul-2026");
```

Assinatura:

```ts
function getPublishedEvents(
  options?: { limit?: number },
): Promise<PublishedEvent[]>;

function getPublishedEventBySlug(
  slug: string,
): Promise<PublishedEvent | null>;
```

Os tipos `PublishedEvent`, `ArenaEvent` e `EventPhoto` são exportados por `src/lib/events/types.ts`. Cada evento retorna `photos` ordenadas e `coverPhoto` apontando para a primeira foto. No modo demonstração, a mesma assinatura retorna fixtures locais; no modo Supabase, retorna apenas registros publicados autorizados pela RLS.

As duas consultas públicas chamam `connection()` no modo Supabase. Isso força renderização por requisição e impede que o cache estático sobreviva aos links assinados, que expiram depois de uma hora. As Server Actions também chamam `revalidatePath("/")` após mutações.

## 6. Verificação antes de publicar

- Entre com um usuário que exista em `auth.users` e `public.admins`.
- Crie um rascunho com duas fotos e confirme que ele não aparece no portal público.
- Publique o evento e confirme que ele passa a aparecer.
- Remova uma foto e confirme a exclusão no banco e no Storage.
- Tente acessar `/admin` em uma janela anônima e confirme o redirecionamento para `/admin/login`.
- Solicite a recuperação para um e-mail inexistente e confirme que a resposta é idêntica à de um administrador.
- Abra o link de recuperação no mesmo navegador, defina a senha e confirme que uma nova autenticação é exigida.
- Abra o link em outro navegador e confirme a falha genérica, sem sessão nem token visível na URL final.
- Tente concluir o callback com um usuário fora de `public.admins` e confirme a remoção da sessão e a negação de acesso.
- Verifique no deploy que `DEMO_MODE=false` está configurado.
- Confirme que o Security Advisor não apresenta alertas e que a exposição automática de novos objetos da Data API está desabilitada.
- Se as migrações foram executadas pelo SQL Editor, confirme que as duas versões aparecem como local e remota em `supabase migration list`.

## 7. Limites operacionais do protótipo

O desenho atual é seguro para demonstração e para homologação controlada, mas o upload do navegador, a gravação dos metadados no Postgres e a remoção no Storage não constituem uma única transação distribuída. Uma perda de rede entre essas etapas pode deixar um objeto órfão privado. A aplicação registra falhas de remoção no servidor, e a política pública do Storage exige uma foto vinculada a um evento publicado, portanto um órfão não se torna público.

Antes de uma operação com grande volume, recomenda-se:

- concluir evento e metadados por uma função Postgres/RPC transacional;
- publicar somente depois de persistir todos os metadados;
- manter staging com prazo de expiração e limpeza automática;
- executar uma rotina que remova objetos sem registro em `event_photos`;
- testar as policies com visitante anônimo, usuário autenticado não administrador e administrador;
- regenerar `database.types.ts` a partir do projeto Supabase real depois de aplicar as migrações.

Se uma versão anterior da migração inicial já tiver sido aplicada em algum banco, não basta editar o arquivo existente: crie uma nova migração incremental com as correções. Em um projeto novo, a migração atual pode ser aplicada diretamente do zero.
