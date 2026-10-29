# Avaliações do Google

## Estado publicado

A nota e o total foram conferidos no perfil público do Google Maps em
28/10/2026: nota 4,6 e 735 avaliações. O total inclui todas as notas.
Os quatro depoimentos selecionados em 24/10/2026 têm cinco estrelas e texto.

Os dados ficam em `src/lib/google-reviews/curated.ts`. A data `verifiedOn`
representa a conferência real, não a data de uma visita ao site ou de um deploy.
O site identifica os depoimentos como uma seleção e mostra a data da consulta.
O contador **ainda não é automático**. O responsável pelo projeto informou que
somente o cliente tem acesso ao Perfil da Empresa da Arena Sul.

## O que falta para a sincronização automática

1. O responsável pelo Perfil da Empresa deve participar da autorização. Não
   solicitar senha, código de autenticação ou tokens por WhatsApp.
2. Preparar um projeto Google Cloud aprovado para a Business Profile API, com
   as APIs necessárias e um cliente OAuth de aplicação web. O perfil da Arena
   Sul precisa estar verificado. A aprovação e o acesso não são concedidos
   apenas pelo link público do estabelecimento.
3. Implementar o fluxo OAuth e apresentar ao responsável o link oficial do
   Google para consentimento. O escopo exigido é `business.manage`, que permite
   gestão do perfil; a aplicação deve implementar somente consultas GET.
4. Depois da autorização, identificar a conta e a localização corretas da
   Arena Sul e consultar `accounts.locations.reviews.list`, seguindo a paginação.
5. Usar `averageRating` e `totalReviewCount` da resposta completa. Selecionar
   apenas avaliações `FIVE` com comentário não vazio. Para chamar a seleção de
   "últimas recebidas", percorrer as páginas e ordenar por `createTime`;
   `orderBy=updateTime desc` ordena pela última alteração.
6. Definir uma frequência de atualização, guardar a data da consulta
   bem-sucedida e respeitar o cache temporário permitido pelo Google. Se uma
   consulta falhar, não avançar artificialmente a data ou a contagem.
7. Testar a integração real antes de substituir a seleção manual e retirar
   qualquer indicação de conferência manual.

A Places API não substitui essa seleção: retorna até cinco avaliações por
relevância e não garante as quatro avaliações mais recentes que atendam ao filtro.

## Fontes oficiais

- [Listagem de avaliações](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list)
- [Pré-requisitos](https://developers.google.com/my-business/content/prereqs)
- [Configuração básica](https://developers.google.com/my-business/content/basic-setup)
- [Políticas de conteúdo e cache](https://developers.google.com/my-business/content/policies)
- [Places API: recurso Place](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places)
