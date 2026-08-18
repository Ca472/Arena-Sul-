# Instagram automático na home

A home está preparada para mostrar automaticamente os Reels recentes e os
Stories ainda ativos de `@arenasulsports`. Sem credenciais, o portal usa o
card institucional da Arena e mantém links seguros para o perfil e os Stories;
nenhum erro da Meta derruba a página.

## Requisitos da conta

1. `@arenasulsports` precisa ser uma conta profissional Business ou Creator.
2. O cliente deve criar ou controlar o Meta App que terá acesso à conta.
3. No app, adicionar **Instagram API with Instagram Login**.
4. Autorizar `instagram_business_basic`, suficiente para a leitura de mídia e
   dos Stories da própria conta. Solicitar `instagram_business_manage_insights`
   somente se o portal passar a consultar métricas no futuro.
5. Não compartilhar a senha do Instagram com o desenvolvedor.

## Variáveis na Vercel

Cadastrar como valores **Sensitive**, somente no servidor:

```text
INSTAGRAM_USER_ID
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_GRAPH_VERSION=v25.0
```

Nunca usar `NEXT_PUBLIC_` no token. Configurar primeiro em Preview, validar o
feed real e somente depois repetir a configuração em Production.

## Atualização e comportamento

- Stories: cache de 5 minutos e exibição apenas durante a janela ativa.
- Reels: cache de 15 minutos.
- Se não houver Story ativo, a área de Stories apresenta um estado discreto e
  os Reels continuam visíveis.
- Se a API estiver indisponível ou o token expirar, o portal volta aos cards
  institucionais com links para o Instagram, sem mostrar erro técnico ao visitante.
- As URLs de mídia retornadas pela Meta são temporárias e não são gravadas no
  banco.

O token longo normalmente precisa ser renovado antes de expirar. A automação de
renovação deve usar armazenamento privado no servidor; não deve gravar o token
no repositório, no navegador ou em uma tabela acessível ao público.

## Fontes oficiais

- [Instagram API](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)
- [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [Mídia da conta](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- [Stories ativos](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/stories)
- [Renovação de token](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token)
