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
2. Criar um app com o caso de uso **Outro** e o tipo **Empresa**.
3. Adicionar o produto **Instagram** e escolher
   **Configuração da API com o Login do Instagram**.
4. Em **Instagram > Configuração da API com o Login do Instagram**, adicionar
   `@arenasulsports` e solicitar que a responsável conclua a autorização.
5. Solicitar somente `instagram_business_basic`. Reels fazem parte da mídia da
   conta e não exigem permissão separada. Não solicitar publicação, mensagens,
   comentários ou insights para este portal.

O Standard Access é suficiente enquanto `@arenasulsports` estiver adicionada
como conta de teste ou vinculada a um papel do app. Advanced Access e App Review
passam a ser necessários para conectar contas profissionais fora dos papéis de
teste e administração do aplicativo.

### 2. Obter o ID e o token sem expor segredos

1. No painel do app, usar **Gerar token** para a conta autorizada e fazer as
   primeiras chamadas de teste.
2. Verificar a validade retornada para o token. Se for um token curto, trocá-lo
   no servidor por um token longo usando o endpoint oficial `access_token`, com
   `grant_type=ig_exchange_token`. Essa troca usa o segredo do app e nunca deve
   ser feita no navegador ou registrada em logs.

   ```text
   GET https://graph.instagram.com/access_token
   grant_type=ig_exchange_token
   client_secret=<segredo do app>
   access_token=<token curto>
   ```

3. Guardar o token longo apenas durante a transferência segura para o ambiente
   do servidor. Não colar o valor em issue, commit, documentação ou mensagem.
4. Consultar `GET /v26.0/me?fields=user_id,username` com o token no cabeçalho
   `Authorization: Bearer ...`.
5. Usar o campo `user_id` retornado como `INSTAGRAM_USER_ID`. Não usar um ID
   copiado manualmente de outra tela.

Um token longo normalmente vale cerca de 60 dias. Registrar a data de emissão,
confirmar a validade antes de ativar a produção e planejar a renovação antes da
expiração.

### 3. Configurar a Vercel

Cadastrar como valores **Sensitive**, somente no servidor, primeiro no Preview
e depois em Production:

```text
INSTAGRAM_USER_ID=<user_id retornado pela API>
INSTAGRAM_ACCESS_TOKEN=<token da conta profissional>
INSTAGRAM_GRAPH_VERSION=v26.0
```

Nunca usar o prefixo `NEXT_PUBLIC_` no token. Depois de salvar as variáveis,
fazer um novo deployment para que a aplicação receba os valores.

### 4. Validar antes de ativar em produção

1. Confirmar o perfil com `GET /v26.0/me?fields=user_id,username`.
2. Consultar `/v26.0/{user_id}/media` e confirmar que os Reels chegam com
   `media_product_type=REELS`.
3. Publicar ou manter um Story ativo e consultar
   `/v26.0/{user_id}/stories`.
4. Validar no Preview que as miniaturas, os links e o vídeo abrem o perfil
   oficial correto.
5. Somente depois repetir as variáveis em Production e fazer redeploy.

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
- Programar a primeira revisão do token por volta do 45º dia. Um token longo,
  ainda válido e emitido há pelo menos 24 horas, pode ser renovado pelo endpoint
  oficial `refresh_access_token`; o novo valor deve substituir o segredo na
  Vercel.
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
