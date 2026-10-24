# Blog da Arena Sul

O blog faz parte do painel atual. Não exige WordPress nem outro login.

## Publicar um artigo

1. Acesse [o painel do blog](https://www.arenasulsports.com/admin/blog) e entre com seu e-mail e senha administrativos habituais.
2. Clique em **Criar artigo**.
3. Preencha **Título**, **Resumo** e **Conteúdo do artigo**. O endereço é sugerido a partir do título e pode ser ajustado antes da publicação.
4. Use **Subtítulo**, **Negrito**, **Lista** e **Inserir link** para formatar. Clique em **Prévia** para conferir o texto.
5. Se quiser, escolha uma imagem de capa JPG, PNG ou WebP de até 3 MB e descreva o que aparece na foto.
6. Clique em **Salvar rascunho** para continuar depois ou em **Publicar artigo** para colocá-lo no site.
7. Confira o resultado em [Blog](https://www.arenasulsports.com/blog). O artigo terá seu próprio endereço para compartilhar.

Para publicar, o título deve ter pelo menos 3 caracteres, o resumo 20 e o texto 80. Os limites são 120, 240 e 80 mil caracteres, respectivamente. Rascunhos podem ser salvos incompletos e ficam apenas no painel.

## Editar ou retirar do ar

Em **Blog**, clique em **Editar artigo**. Para atualizar um artigo já publicado, use **Salvar e manter publicado**. Para retirá-lo do site e preservá-lo no painel, use **Retirar do ar e salvar rascunho**. Você poderá publicá-lo novamente depois.

Evite mudar o endereço de um artigo que já foi divulgado: a alteração muda seu link. Se outra pessoa salvar o mesmo artigo enquanto você estiver editando, o painel pedirá que atualize a página para proteger a edição mais recente.

Não há salvamento automático. Salve o rascunho antes de sair da página. O modo demonstração local permite testar a interface e a prévia, mas não salva nem publica.

## Acesso

O blog usa os mesmos administradores já cadastrados no site. Nenhuma senha nova é criada pelo módulo. Se necessário, use **Esqueci minha senha** na tela de login e conclua a recuperação no mesmo navegador em que a solicitou.

## Busca e compartilhamento

Cada artigo publicado inclui título, descrição, endereço canônico e dados estruturados de artigo. O sitemap inclui automaticamente o blog e os artigos publicados. O resumo aparece nos cards e também é usado como descrição para buscadores e compartilhamentos.

A publicação torna o conteúdo disponível para rastreamento; os mecanismos de busca decidem quando indexá-lo e como exibi-lo. Não há garantia de posição ou prazo de indexação. O blog começa vazio para receber os textos da equipe da Arena Sul.

## Implantação técnica

A migração `supabase/migrations/20261024195848_arena_blog.sql` cria `blog_posts` e o bucket privado `blog-images`, sem conteúdo inicial. As leituras públicas exigem artigo publicado e data de publicação vigente. As políticas de Storage liberam somente a capa vinculada a um artigo publicado; imagens de rascunho e arquivos órfãos permanecem privados. Todas as gravações exigem um administrador da tabela `admins`.

O módulo usa a sessão e a chave pública do Supabase já configuradas no site. Não requer uma nova credencial privilegiada. O limite de requisição de Server Actions é 4 MB; a capa é limitada a 3 MiB para manter margem para o formulário. A prévia e a página pública usam o mesmo renderizador Markdown, com HTML bruto desativado.
