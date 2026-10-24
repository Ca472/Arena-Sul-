# Blog da Arena Sul

O blog faz parte do painel atual. Não exige WordPress nem outro login.

## Publicar um artigo

1. Acesse [o painel do blog](https://www.arenasulsports.com/admin/blog) e entre com seu e-mail e senha administrativos habituais.
2. Clique em **Criar artigo**.
3. Preencha **Título**, **Resumo** e **Conteúdo do artigo**. O endereço é sugerido a partir do título e pode ser ajustado antes da publicação.
4. Escreva no editor visual. Use as opções de fonte, tamanho, cor, destaque, títulos, negrito, itálico, sublinhado, listas e alinhamento para organizar o texto. Também é possível inserir links, citações, divisores e tabelas.
5. Para colocar uma foto entre os parágrafos, posicione o cursor e use **+ Fotos**. Você pode escolher várias imagens e depois ajustar a descrição, a legenda, a largura e o alinhamento de cada uma. Cada foto deve ser JPG, PNG ou WebP de até 3 MB; são permitidas até 20 fotos dentro de um artigo. A imagem de capa continua disponível separadamente e é opcional.
6. Clique em **Prévia** para conferir o texto com sua formatação e suas fotos.
7. Clique em **Salvar rascunho** para continuar depois ou em **Publicar artigo** para colocá-lo no site.
8. Confira o resultado em [Blog](https://www.arenasulsports.com/blog). O artigo terá seu próprio endereço para compartilhar.

Para publicar, o título deve ter pelo menos 3 caracteres, o resumo 20 e o texto 80. Os limites são 120, 240 e 80 mil caracteres, respectivamente. Rascunhos podem ser salvos incompletos e ficam apenas no painel.

## Editar ou retirar do ar

Em **Blog**, clique em **Editar artigo**. Para atualizar um artigo já publicado, use **Salvar e manter publicado**. Para retirá-lo do site e preservá-lo no painel, use **Retirar do ar e salvar rascunho**. Você poderá publicá-lo novamente depois.

Evite mudar o endereço de um artigo que já foi divulgado: a alteração muda seu link. Se outra pessoa salvar o mesmo artigo enquanto você estiver editando, o painel pedirá que atualize a página para proteger a edição mais recente.

Não há salvamento automático. Salve o rascunho antes de sair da página. O modo demonstração local permite testar a interface e a prévia, mas não salva nem publica.

As fotos do corpo são enviadas quando você as insere; salve o artigo para guardar sua posição no texto. Até a publicação, elas ficam restritas aos administradores. Se remover uma foto já salva, o arquivo que não estiver mais em uso será removido após salvar a nova versão do artigo. Espere o envio das imagens terminar antes de salvar ou publicar.

## Ferramentas do editor

- **Fontes e tamanhos:** Montserrat, Arial, Georgia e Times New Roman, com tamanhos entre 12 e 32 px. Selecione um trecho para alterar sua formatação ou escolha a opção antes de continuar digitando.
- **Texto:** títulos, negrito, itálico, sublinhado, texto riscado, cor e destaque de fundo.
- **Organização:** alinhamento à esquerda, centro, direita ou justificado, listas com marcadores ou números, citações e divisores.
- **Tabelas:** inserir uma tabela e adicionar ou remover suas linhas e colunas.
- **Fotos:** inserir no ponto desejado, editar a descrição e a legenda e escolher tamanho e alinhamento. A descrição ajuda quem usa leitor de tela; a legenda aparece abaixo da foto.
- **Revisão:** desfazer, refazer, limpar a formatação e conferir a prévia.

Os artigos novos usam o editor visual. Artigos antigos em Markdown continuam editáveis no formato original. Não é necessário instalar programas nem contratar um serviço de edição separado.

## Acesso

O blog usa os mesmos administradores já cadastrados no site. Nenhuma senha nova é criada pelo módulo. Se necessário, use **Esqueci minha senha** na tela de login e conclua a recuperação no mesmo navegador em que a solicitou.

## Busca e compartilhamento

Cada artigo publicado inclui título, descrição, endereço canônico e dados estruturados de artigo. O sitemap inclui automaticamente o blog e os artigos publicados. O resumo aparece nos cards e também é usado como descrição para buscadores e compartilhamentos.

A publicação torna o conteúdo disponível para rastreamento; os mecanismos de busca decidem quando indexá-lo e como exibi-lo. Não há garantia de posição ou prazo de indexação. O blog começa vazio para receber os textos da equipe da Arena Sul.

## Implantação técnica

A migração `supabase/migrations/20261024195848_arena_blog.sql` cria `blog_posts` e o bucket privado `blog-images`, sem conteúdo inicial. A migração `20261024211244_arena_blog_rich_content.sql` acrescenta o formato visual e as referências das fotos do corpo. As leituras públicas exigem artigo publicado e data de publicação vigente. As políticas de Storage liberam somente a capa e as fotos vinculadas a um artigo publicado; imagens de rascunho e arquivos órfãos permanecem privados. Todas as gravações exigem um administrador da tabela `admins`.

O módulo usa a sessão e a chave pública do Supabase já configuradas no site. Não requer uma nova credencial privilegiada. O limite de requisição de Server Actions é 4 MB; cada imagem é limitada a 3 MiB para manter margem para o formulário. As fotos do corpo usam endereços estáveis em `/api/blog/images/`, com autorização no servidor e URLs assinadas de curta duração. Esse caminho é permitido no robots.txt para as imagens de artigos publicados.

O editor Tiptap salva um documento JSON normalizado no servidor, com lista permitida de nós, marcas, fontes, cores e imagens pertencentes ao próprio artigo. A prévia e a página pública usam o mesmo renderizador React, sem interpretar HTML bruto. O limite é de 80 mil caracteres de texto visível e 300 mil caracteres de JSON; a estrutura também tem limites de profundidade, elementos, tabelas e imagens. O formato Markdown anterior continua suportado.
