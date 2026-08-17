# Auditoria do site atual da Arena Sul Sports

Auditoria somente leitura realizada em **17 de agosto de 2026** sobre o site público [arenasulsports.com](https://www.arenasulsports.com/), seus links oficiais e páginas públicas relacionadas. O objetivo deste documento é preservar o inventário usado como referência para a reconstrução do portal; ele não representa aprovação final do cliente para publicar todos os dados encontrados.

## Como interpretar as informações

- **Observado diretamente:** conteúdo, comportamento, metadados ou ativos encontrados no site atual.
- **Fonte pública externa — validar:** informação encontrada no Instagram, Linktree, Waze ou Wellhub. Pode estar correta, mas deve ser confirmada com o cliente antes da publicação.
- **Volátil:** métrica, horário, publicação ou URL temporária que pode mudar sem aviso.
- **Inferência:** conclusão técnica derivada da inspeção, explicitamente identificada como tal.

## Resumo executivo

O site atual é uma landing page de página única criada no Wix. Ele apresenta três fotos de abertura, um breve histórico, cinco modalidades, a indicação de 13 quadras de areia, uma foto panorâmica, um mapa, um link de contato via Linktree e um link para o Instagram.

Não foram encontrados páginas separadas, galeria atualizável, agenda, preços, horários em texto, formulário, reserva on-line, área administrativa ou integração de feed do Instagram. A identidade visual é recuperável e consistente — azul-marinho, laranja, branco, Poppins e Avenir —, mas a versão móvel está quebrada, o SEO é incompleto e parte da navegação está mal configurada.

## Plataforma e arquitetura atuais

- Construtor: Wix.com Website Builder.
- Servidor observado: Pepyaka, com cache Wix/Fastly.
- Estrutura: uma única página pública.
- Mapa: Google Maps em iframe Wix.
- CDN de imagens: static.wixstatic.com.
- HTML inicial observado: aproximadamente 539 KB.
- HTTPS: ativo, com HSTS e X-Content-Type-Options.
- Não foram observados nos cabeçalhos da resposta: Content-Security-Policy, Referrer-Policy, Permissions-Policy ou X-Frame-Options.

O [sitemap principal](https://www.arenasulsports.com/sitemap.xml) referencia o [sitemap de páginas](https://www.arenasulsports.com/pages-sitemap.xml), que contém somente a página inicial. O sitemap informa última modificação em 17/07/2025, enquanto o copyright visível permanece em 2023.

## Rotas e navegação

| Destino | Tipo atual | Resultado observado |
|---|---|---|
| / | Página pública única | Página institucional completa |
| Página Inicial | Âncora Wix na mesma URL | Volta aproximadamente ao topo |
| Sobre Nós | Âncora Wix na mesma URL | Mal configurada: leva para perto do topo/hero, não posiciona a seção corretamente |
| Aulas | Âncora Wix na mesma URL | Leva para as modalidades |
| Quadras | Âncora Wix na mesma URL | Leva para a contagem e o panorama das quadras |
| Localização | Âncora Wix na mesma URL | Leva para o mapa |
| Contato | Link externo | Abre o Linktree em nova aba |
| Instagram | Link externo | Abre o perfil oficial em nova aba |

As âncoras usam atributos internos do Wix e não acrescentam hashes à URL. Por isso, não existe um endereço compartilhável para cada seção.

## Conteúdo textual observado

### Sobre nós

> Nossa trajetória se cruza com o nascimento da história das locações de quadras de futebol Society em São José dos Campos. A primeira quadra nasceu no bairro Santana, há 30 anos, com a Sand Sports e de lá para cá, pudemos construir uma história do Futebol Society na cidade e região, além de promover a saúde pelo esporte - com o lema Esporte é Saúde - e cativar muitos amigos.
>
> Dessa experiência nasce a Arena Sul Sports, criada com a missão de promover a saúde e qualidade de vida de nossos clientes em um ambiente acolhedor e familiar, proporcionando as melhores condições para a prática do esporte.
>
> Já somos um negócio de sucesso pois contamos com a colaboração de profissionais motivados e capacitados que nos ajuda a manter e conquistar clientes fiéis e satisfeitos.

O trecho final contém uma concordância a corrigir: “profissionais [...] que nos ajuda” deveria ser “que nos ajudam”.

### Modalidades e estrutura

- Futebol Society — “1 quadra”.
- Beach Tennis.
- Futevôlei.
- Funcional.
- Vôlei de Areia.
- Chamada principal: “13 QUADRAS PARA ESPORTES DE AREIA”.

O site não apresenta preços, planos, grade de aulas, professores, políticas de reserva, horários, formas de pagamento, capacidade, regras de chuva ou cancelamento, eventos, convênios ou descrição das comodidades.

## Contatos e localização

### Observado nos canais ligados pelo site

- Endereço apontado pelo mapa: **Rua Maurício Cardoso, 220, Jardim Sul, São José dos Campos — SP, CEP 12236-495**.
- [Rota no Google Maps](https://www.google.com/maps/dir/?api=1&destination=R.%20Maur%C3%ADcio%20Cardoso%2C%20220%20-%20Jardim%20Sul%2C%20S%C3%A3o%20Jos%C3%A9%20dos%20Campos%20-%20SP%2C%2012236-495%2C%20Brasil).
- Telefone/WhatsApp: **(12) 3307-1093**.
- [WhatsApp direto](https://wa.me/551233071093).
- [Linktree oficial](https://linktr.ee/arenasulsports).
- [Instagram oficial @arenasulsports](https://www.instagram.com/arenasulsports/).

O Linktree possui dois botões para o mesmo número:

- “Whatsapp - Futebol Societyy”, com erro de digitação;
- “Whatsapp - Quadras de Areia - Day Use - Locação - Churrasco”.

### Horários em fontes externas — validar com o cliente

O [Waze](https://www.waze.com/live-map/directions/br/sp/arena-sul-sports?to=place.ChIJkWB_KrNKzJQR-wIxev1IPvc) e a página da Arena no [Wellhub](https://wellhub.com/pt-br/search/partners/arena-sul-sports/) exibiam os mesmos horários na data da auditoria:

| Dia | Horário informado |
|---|---|
| Segunda a sexta | 07:00–23:30 |
| Sábado | 08:00–22:00 |
| Domingo | 08:00–20:00 |

Esses horários são **voláteis** e podem mudar em feriados. Não devem ser publicados sem confirmação.

O Wellhub também relacionava área infantil, banheiro acessível, bebedouro, cafeteria, chuveiro, acessibilidade para cadeira de rodas, estacionamento, estacionamento acessível, itens de higiene, minibar, quadras, raquete, vestiário e Wi‑Fi. Essa lista é de **fonte pública externa** e precisa de validação item a item.

## Identidade visual e composição

### Paleta observada

| Uso | Cor |
|---|---|
| Azul-marinho principal | #071C4A |
| Laranja | #FF7300 |
| Carvão | #262626 |
| Branco | #FFFFFF |
| Cinza de apoio | #7D7D7D |

### Tipografia observada

- Títulos: Poppins Bold.
- Navegação: Poppins SemiBold.
- Texto institucional e copyright: Avenir LT Light.
- Fallback geral: Arial/Helvetica.

Tamanhos aproximados no desktop:

- “Sobre nós”: 45 px;
- “Aulas” e “Localização”: 50 px;
- chamada das 13 quadras: 31 px;
- modalidades: 18 px;
- texto institucional: 17 px;
- menu: 16 px;
- copyright: 15 px.

### Ordem visual da página

1. Cabeçalho branco de aproximadamente 107 px, fixado no topo durante a rolagem.
2. Logo, menu horizontal e ícone cinza do Instagram.
3. Hero com três fotografias verticais: visão da Arena, quadras de areia e espaço com churrasqueira.
4. Seção azul-marinho com título laranja “Sobre nós” e texto branco centralizado.
5. Seção “Aulas” com cinco imagens verticais e nomes das modalidades.
6. Chamada “13 QUADRAS PARA ESPORTES DE AREIA”.
7. Panorama das quadras.
8. Título “Localização” e mapa Google em largura integral.
9. Barra laranja com “© 2023 Arena Sul Sports”.
10. Faixa carvão vazia.

O site atual **não possui destaque do Instagram no rodapé**; há somente um ícone no cabeçalho.

## Inventário de ativos públicos

Os links abaixo apontam para os arquivos originais públicos no CDN do Wix. Eles servem para rastreabilidade e referência. Os originais somam aproximadamente 38 MB e não devem ser enviados diretamente ao novo portal sem recorte, redimensionamento e conversão. A autorização de uso e os direitos de imagem precisam ser confirmados com o cliente.

| Uso observado | Resolução original | Ativo público |
|---|---:|---|
| Logo, com recorte aplicado pelo Wix | 596 × 842 | [Logo Arena Sports Color-01.png](https://static.wixstatic.com/media/fff9e3_4cb2e8397e014fb5b8e5dfa76825e89c~mv2.png) |
| Hero — visão da Arena | 3648 × 2432 | [_63A3045.jpg](https://static.wixstatic.com/media/fff9e3_68b7af8f574241d6ae4e08d0e757bd22~mv2.jpg) |
| Hero — quadras de areia | 1473 × 2000 | [563A0276_edited.jpg](https://static.wixstatic.com/media/fff9e3_1735767713f64aa48ead233420dd13bc~mv2.jpg) |
| Hero — churrasqueira e mesas | 629 × 720 | [WhatsApp Image 2023-02-03](https://static.wixstatic.com/media/fff9e3_4accb8929c2e4b82a7673226128e6740~mv2.jpg) |
| Card Futebol Society, imagem de banco | 4993 × 3333 | [Jogando futebol ao pôr do sol](https://static.wixstatic.com/media/11062b_dbda8378ae8141ce9b940a50301bc714~mv2.jpg) |
| Card Beach Tennis | 2017 × 1452 | [Design sem nome (3).png](https://static.wixstatic.com/media/fff9e3_e11bc6187bac429b824c1fa9c66b8056~mv2.png) |
| Card Futevôlei | 838 × 1280 | [WhatsApp Image 2023-03-22](https://static.wixstatic.com/media/fff9e3_9f597cb1bc484a90b0d12b37b7a79c81~mv2.jpeg) |
| Card Funcional | 830 × 1280 | [Design sem nome (1).png](https://static.wixstatic.com/media/fff9e3_66cc2ca3678d4ffb94842a42f6d550ea~mv2.png) |
| Card Vôlei de Areia, cerca de 14,8 MB | 3648 × 5472 | [_63A1124.jpg](https://static.wixstatic.com/media/fff9e3_69c9b0f153a94bab9e0acf47d6c005db~mv2.jpg) |
| Panorama das quadras | 3648 × 2432 | [_63A3052.jpg](https://static.wixstatic.com/media/fff9e3_78dc31391150427e8c6f4e8ed34243d9~mv2.jpg) |

Nove das onze imagens visíveis usam nomes de arquivo como texto alternativo. Os textos alternativos precisam ser reescritos de acordo com o conteúdo e a função de cada imagem.

## Instagram oficial

### Métricas voláteis observadas em 17/08/2026

- 643 publicações;
- 10.767 seguidores;
- 413 contas seguidas.

Esses números não devem ser gravados no código nem tratados como promessa de alcance.

A bio pública relacionava 13 quadras de areia, Futebol Society, Futevôlei, Beach Tennis, Vôlei, Funcional e o endereço da Arena.

### Destaques públicos

| Destaque | URL pública |
|---|---|
| Aulas | [Instagram](https://www.instagram.com/stories/highlights/18045771856293724/) |
| Locação | [Instagram](https://www.instagram.com/stories/highlights/17973788713382239/) |
| Arena Sul | [Instagram](https://www.instagram.com/stories/highlights/17909903128759069/) |
| Day Use | [Instagram](https://www.instagram.com/stories/highlights/17996612545337681/) |
| Eventos | [Instagram](https://www.instagram.com/stories/highlights/17901721567915380/) |
| Wellhub/TotalPass | [Instagram](https://www.instagram.com/stories/highlights/17886881024995202/) |
| Parceiros | [Instagram](https://www.instagram.com/stories/highlights/17943746230754758/) |
| Tour360 | [Instagram](https://www.instagram.com/stories/highlights/17910596825719485/) |
| Gravações | [Instagram](https://www.instagram.com/stories/highlights/18265469290047100/) |

As URLs das capas e miniaturas hospedadas em fbcdn.net são temporárias e **não podem ser fixadas no código**. Para um feed vivo, será necessário acesso autorizado à API da Meta ou um provedor aprovado. Permalinks do perfil, destaques e publicações são a referência pública estável.

### Serviços divulgados recentemente — validar detalhes comerciais

Publicações oficiais recentes indicavam:

- benefícios para mensalistas, horários fixos, uso de quadra e churrasqueira — [publicação](https://www.instagram.com/arenasulsports/reel/DVOq9d0ETKg/);
- campeonatos, aniversários, eventos corporativos, escolares e confraternizações — [publicação](https://www.instagram.com/arenasulsports/reel/Dbda6MsR-yW/);
- Campo Society, estacionamento e reserva de horário — [publicação](https://www.instagram.com/arenasulsports/reel/DbYYtboBmdv/);
- turmas de Beach Tennis — [publicação](https://www.instagram.com/arenasulsports/reel/DbGXK_ch2Cq/);
- turmas de vôlei de praia — [publicação](https://www.instagram.com/arenasulsports/reel/Da0VpQDh0wO/);
- turmas de Futevôlei — [publicação](https://www.instagram.com/arenasulsports/reel/DaiUDKSBR7c/);
- renovação da areia das quadras — [publicação](https://www.instagram.com/arenasulsports/reel/Da0-zZWJi99/).

Essas publicações comprovam atividade recente, mas preços, benefícios, professores, disponibilidade e condições são **voláteis** e precisam de aprovação do cliente.

## SEO e metadados

### Presente

- idioma HTML definido como português;
- título “Página Inicial | Arena Sul Sports”;
- canonical para a página inicial;
- Open Graph básico com título, URL, nome do site e tipo website;
- Twitter Card do tipo summary_large_image;
- robots.txt liberando a indexação da página principal;
- sitemap válido.

### Ausente ou inadequado

- meta description;
- og:description e og:image;
- twitter:description e twitter:image;
- JSON-LD de LocalBusiness, SportsActivityLocation ou equivalente;
- endereço, telefone e horário em texto semântico fora do mapa;
- favicon próprio — o site usa o ícone genérico do Wix;
- manifesto de PWA;
- páginas específicas indexáveis para modalidades, eventos e locação;
- título local descritivo;
- hierarquia correta de títulos: a página começa com H2 e o único H1 surge depois de H2 e H3;
- consistência de idioma: o HTML declara português, mas o cabeçalho HTTP observado informa content-language: en.

## Mobile e responsividade

Em uma viewport de 390 × 844 px, foram medidos:

- largura interna da página: 980 px;
- largura da viewport: 390 px;
- transbordamento horizontal: 590 px;
- hero ainda dividido em três colunas;
- cards das modalidades em uma faixa horizontal fixa;
- menu desktop completo, sem menu móvel;
- ícone do Instagram posicionado fora da área visível inicial.

**Conclusão observada:** o site não possui uma versão móvel funcional. Conteúdo e controles só ficam acessíveis mediante rolagem horizontal.

## Acessibilidade

### Pontos positivos

- botão “Ir para o conteúdo principal”;
- navegação com semântica de navigation;
- link do Instagram com aria-label;
- iframe com título “Google Maps”.

### Problemas

- nove imagens com texto alternativo baseado em nome de arquivo;
- hierarquia de títulos incorreta;
- conteúdo fora da viewport no mobile;
- item ativo laranja de 16 px sobre branco com contraste aproximado de 2,73:1;
- copyright branco de 15 px sobre laranja com o mesmo contraste aproximado;
- ambos os usos de contraste falham WCAG AA;
- endereço e telefone não estão disponíveis como conteúdo textual principal.

## Desempenho e estabilidade

- O HTML inicial tem aproximadamente 539 KB.
- As imagens observadas usam loading="auto"; não foi identificado lazy loading efetivo.
- Até imagens abaixo da primeira dobra recebem fetchpriority="high".
- Os originais chegam a aproximadamente 14,8 MB.
- O mapa carrega a API Google sem o padrão assíncrono recomendado.
- O console registra uso do marcador legado google.maps.Marker.
- O componente Wix do mapa emitiu erros de JSON.parse durante a inspeção; o mapa ainda apareceu, mas a implementação atual é instável.

## Links quebrados, inconsistências e conteúdo desatualizado

- O “Tour 360” do Linktree aponta para [sht.gd/ArenaSulSports](https://sht.gd/ArenaSulSports), que exibiu uma página de domínio estacionado/à venda, não o tour.
- A âncora “Sobre Nós” não leva corretamente à seção.
- O contato usa http://linktr.ee/arenasulsports e depende de redirecionamento para HTTPS.
- O antigo domínio arenasulsports.com.br, citado em materiais históricos, não resolveu durante a auditoria.
- O copyright continua em 2023.
- Há uma faixa carvão vazia depois do copyright.
- O favicon é o padrão Wix.
- O Linktree contém “Societyy”.
- O site não expõe telefone, horário ou endereço completo em texto, apesar de possuir seção de contato/localização.
- Não há galeria de eventos nem destaque do Instagram no rodapé.

## Implicações para a reconstrução

### Preservar como referência

- logotipo e identidade azul-marinho/laranja;
- Poppins como tipografia de destaque;
- história da marca e lema “Esporte é Saúde”;
- modalidades oferecidas;
- endereço e WhatsApp;
- fotografias próprias da estrutura, após validação de direitos;
- presença visual de esporte, convivência, eventos e família.

### Confirmar antes de publicar

- número exato de quadras de areia e de Society;
- horários de funcionamento;
- capacidade de público e estacionamento;
- comodidades do Wellhub;
- professores e grade de aulas;
- benefícios e regras dos planos de mensalistas;
- Day Use, churrasqueiras, eventos e condições de locação;
- preços, pagamento, chuva, reagendamento e cancelamento;
- autorização das pessoas retratadas;
- licença da fotografia de banco usada em Futebol Society;
- uso de alegações como “maior arena da região”.

### Reconstruir tecnicamente

- layout responsivo mobile-first;
- navegação com âncoras/rotas estáveis e acessíveis;
- CTAs diretos de WhatsApp e reserva;
- galeria pública de eventos alimentada pela área ADMIN;
- upload, publicação e remoção sem alteração de código;
- hierarquia semântica e textos alternativos adequados;
- SEO local, metadados sociais, JSON-LD, sitemap e favicon próprios;
- imagens responsivas e otimizadas, com lazy loading fora da dobra;
- endereço, telefone, horários e rotas disponíveis em texto;
- rodapé útil com contato, navegação, copyright dinâmico e destaque oficial do Instagram;
- integração de Instagram baseada em permalinks oficiais, API autorizada ou curadoria no ADMIN, nunca em scraping ou URLs temporárias do CDN.

## Fontes públicas consultadas

- [Site atual](https://www.arenasulsports.com/)
- [Robots.txt](https://www.arenasulsports.com/robots.txt)
- [Sitemap](https://www.arenasulsports.com/sitemap.xml)
- [Sitemap de páginas](https://www.arenasulsports.com/pages-sitemap.xml)
- [Linktree oficial](https://linktr.ee/arenasulsports)
- [Instagram oficial](https://www.instagram.com/arenasulsports/)
- [Waze](https://www.waze.com/live-map/directions/br/sp/arena-sul-sports?to=place.ChIJkWB_KrNKzJQR-wIxev1IPvc)
- [Wellhub](https://wellhub.com/pt-br/search/partners/arena-sul-sports/)
