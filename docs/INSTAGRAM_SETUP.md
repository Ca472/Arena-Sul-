# Instagram automático na home

Este guia conecta a conta `@arenasulsports` ao portal para mostrar os Reels
recentes e os Stories ainda ativos. A integração é somente de leitura: o site
não publica, apaga ou altera conteúdo, não lê mensagens e não responde a
comentários.

## Resumo para a responsável pelo Instagram

Ela não precisa programar, criar variáveis ou manipular token. A participação
dela se limita a confirmar a conta e autorizar o aplicativo oficial da Arena.

### Antes da autorização

1. No Instagram, confirmar que `@arenasulsports` é uma conta profissional do
   tipo **Empresa** ou **Criador de conteúdo** e que o perfil está público.
2. Confirmar que o e-mail e o telefone de recuperação estão atualizados.
3. Ativar a autenticação em dois fatores.
4. Manter o Instagram aberto no celular e, de preferência, também no
   computador em que será feita a autorização.

O fluxo escolhido é **Instagram API with Instagram Login**. Para esse fluxo, a
Meta não exige que o perfil esteja vinculado a uma Página do Facebook.

### No momento da autorização

1. O desenvolvedor cria o aplicativo da Arena no painel da Meta e adiciona
   `@arenasulsports` como conta de teste/autorizada.
2. A responsável abre somente o link oficial enviado pelo desenvolvedor e
   confere que o endereço pertence a `instagram.com` ou `facebook.com`.
3. Ela entra na própria conta, seleciona somente `@arenasulsports` e aprova o
   acesso básico solicitado pelo aplicativo da Arena.
4. Ao aparecer a confirmação de sucesso, ela avisa ao desenvolvedor que a
   autorização foi concluída.

Ela **não deve enviar** senha, código de autenticação em dois fatores, segredo
do aplicativo ou token por WhatsApp, e-mail ou chat. O login e os códigos são
digitados somente pela própria responsável na tela oficial da Meta/Instagram.

### Mensagem pronta para encaminhar

> Olá! Para colocar automaticamente os Reels e Stories da Arena Sul no novo
> site, precisamos autorizar uma integração oficial e somente de leitura do
> Instagram. A conta precisa estar como profissional (Empresa ou Criador) e
> pública. Você receberá um link oficial da Meta/Instagram, fará o login na
> própria `@arenasulsports`, selecionará essa conta e aprovará apenas o acesso
> básico. Não será necessário enviar senha, código de dois fatores nem token
> para ninguém. Quando aparecer a confirmação, basta nos avisar. Faremos o
> restante da configuração técnica e um teste antes de ativar no site.

## Parte técnica do desenvolvedor

### 1. Criar e configurar o aplicativo

1. Acessar [Meus aplicativos da Meta](https://developers.facebook.com/apps/)
   com a conta responsável pelo projeto.
2. No fluxo atual da Meta, escolher o caso de uso
   **Gerenciar mensagens e conteúdo no Instagram**. O painel configura o produto
   Instagram e a área **Configuração da API com o Login do Instagram**.
3. Em **Configurar o login da empresa no Instagram**, cadastrar exatamente:

   ```text
   https://arena-sul-portal.vercel.app/api/instagram/oauth/callback
   ```

   O valor deve ser idêntico no painel e em `INSTAGRAM_OAUTH_REDIRECT_URI`, sem
   diferença de protocolo, caminho ou barra final.
4. Confirmar o campo **ID do app do Instagram**. Ele não é necessariamente o
   mesmo ID geral exibido na URL do painel da Meta.
5. Solicitar somente `instagram_business_basic`. Reels fazem parte da mídia da
   conta e não exigem permissão separada. Não solicitar publicação, mensagens,
   comentários ou insights para este portal.

O Standard Access é suficiente enquanto `@arenasulsports` estiver adicionada
como conta de teste ou vinculada a um papel do app. Advanced Access e App Review
passam a ser necessários para conectar contas profissionais fora dos papéis de
teste e administração do aplicativo.

### 2. Gerar o convite seguro

1. Configurar as variáveis server-only listadas na próxima seção e publicar o
   callback antes de salvar o redirect no painel da Meta.
2. Entrar em `/admin/integracoes/instagram` e clicar em
   **Gerar link de autorização**.
3. Enviar somente o link gerado pelo portal à responsável. Ele é temporário e
   funciona uma vez.
4. A responsável abre a página da Arena Sul e clica em
   **Continuar no Instagram**. O `state` e o cookie de segurança são criados no
   navegador dela; não abrir o fluxo em um computador e copiar a URL final para
   outro.
5. A callback troca o código por token curto e, no servidor, por token longo:

   ```text
   GET https://graph.instagram.com/access_token
   grant_type=ig_exchange_token
   client_secret=<segredo do app>
   access_token=<token curto>
   ```

6. O portal consulta `GET /v26.0/me?fields=user_id,username`, aceita somente
   `@arenasulsports`, cifra o token com AES-256-GCM e salva apenas o valor cifrado
   no banco. App Secret, código e tokens não aparecem em página ou log.

Um token longo normalmente vale cerca de 60 dias. Registrar a data de emissão,
confirmar a validade antes de ativar a produção e planejar a renovação antes da
expiração.

### 3. Configurar a Vercel

Cadastrar como valores **Sensitive** e somente no servidor em **Production**.
Não copiar a service-role, o App Secret ou a chave AES de produção para previews
gerais de pull requests. Um Preview que precise testar o OAuth deve usar projeto
Supabase e aplicativo Meta separados, com credenciais próprias. Somente o
redirect e o username não são secretos:

```text
SUPABASE_SERVICE_ROLE_KEY=<chave server-only do projeto>
INSTAGRAM_APP_ID=<ID do app do Instagram>
INSTAGRAM_APP_SECRET=<segredo do app do Instagram>
INSTAGRAM_OAUTH_REDIRECT_URI=https://arena-sul-portal.vercel.app/api/instagram/oauth/callback
INSTAGRAM_EXPECTED_USERNAME=arenasulsports
INSTAGRAM_TOKEN_ENCRYPTION_KEY=<32 bytes aleatórios em base64>
INSTAGRAM_GRAPH_VERSION=v26.0
```

Nunca usar o prefixo `NEXT_PUBLIC_` nessas credenciais. A service-role ignora
RLS e, por isso, fica isolada no módulo server-only da integração. Depois de
salvar as variáveis, fazer um novo deployment para que a aplicação receba os
valores.

### 4. Validar antes de ativar em produção

1. Confirmar o perfil com `GET /v26.0/me?fields=user_id,username`.
2. Consultar `/v26.0/{user_id}/media` e confirmar que os Reels chegam com
   `media_product_type=REELS`.
3. Publicar ou manter um Story ativo e consultar
   `/v26.0/{user_id}/stories`.
4. Validar em um ambiente isolado ou, após o primeiro deploy controlado em
   Production, que as miniaturas, os links e o vídeo abrem o perfil oficial
   correto.

A documentação pública da Meta ainda apresenta a referência de Stories com
ênfase no fluxo antigo de Facebook Login. Por isso, o teste real do endpoint de
Stories no fluxo Instagram Login é obrigatório. Se a Meta recusar esse endpoint
mesmo com token e ID válidos, a alternativa oficial é usar **Instagram API with
Facebook Login**, que exige uma Página do Facebook vinculada e permissões
adicionais. Não usar scraping.

## Atualização e manutenção

- Stories ativos são consultados com cache de 5 minutos. Stories expirados,
  arquivados e Destaques não são tratados como Stories ativos pela integração.
- Reels são consultados com cache de 15 minutos.
- A integração usa polling/cache; não precisa de webhook para este portal.
- Se não houver Story ativo, o site mostra um estado neutro e mantém os Reels.
- Se a API estiver indisponível ou o token expirar, o portal volta aos cards
  institucionais e aos links oficiais, sem expor erro técnico ao visitante.
- As URLs temporárias de mídia retornadas pela Meta não são gravadas no banco.
- Revisar mensalmente o estado da conexão no painel administrativo e programar
  a reautorização antes do prazo informado pela Meta para o token longo. Esta
  primeira versão não renova tokens no caminho público para evitar corridas e
  gravações concorrentes.
- Se a Meta revogar a autorização ou o token expirar, gerar um novo convite e
  pedir uma nova autorização à responsável pela conta. A nova credencial
  substitui a anterior de forma cifrada, sem mudar a identidade vinculada.
- A responsável pode revogar o acesso depois em **Instagram > Permissões de
  sites > Aplicativos e sites > Ativos**.

## Fontes oficiais

- [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/)
- [Criar e configurar um app do Instagram](https://developers.facebook.com/docs/instagram-platform/create-an-instagram-app)
- [Business Login, OAuth e tokens](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)
- [Primeira chamada e identificação da conta](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started)
- [Standard Access, Advanced Access e App Review](https://developers.facebook.com/docs/instagram-platform/app-review)
- [Renovação de token](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token)
- [Referência de Stories](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/stories)
- [Documentação oficial da API no Postman](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)
- [Contas profissionais no Instagram](https://www.facebook.com/help/instagram/138925576505882)
