# Bonmarché — instruções do projeto

## Fonte de verdade e escopo

- Desenvolva o Bonmarché do zero. Não procure, recupere ou reutilize código, layouts ou identidade visual de projetos anteriores.
- Siga a especificação técnica Bonmarché v1.1 fornecida pelo usuário e as decisões aprovadas posteriormente. Preserve seus requisitos funcionais, não funcionais e critérios de aceitação; não amplie o escopo sem aprovação.
- A aplicação é um cardápio público com um painel protegido para um único administrador. Não existe cadastro público de administradores.

## Stack e arquitetura

- Use Next.js App Router, React e TypeScript; Tailwind CSS e shadcn/ui; Supabase PostgreSQL, Auth e Storage; Zod e React Hook Form; hospedagem na Vercel.
- Não crie um backend Express separado nem use disco local efêmero ou sessões em memória como persistência.
- Escolha versões estáveis e compatíveis no início da implementação; não fixe versões antigas apenas por constarem no planejamento.
- Preserve separação clara entre rotas, componentes, funcionalidades, integrações e tipos. Adapte a estrutura proposta somente com justificativa técnica.

## Regras funcionais e de dados

- Os dados principais são `profiles`, `categories`, `products` e `store_settings`. Deve existir exatamente um registro de configurações do estabelecimento.
- Todo produto pertence a uma categoria, tem preço não negativo e no máximo uma imagem principal. Categorias e produtos podem ser arquivados, restaurados ou excluídos definitivamente.
- Produto indisponível continua visível e identificado como indisponível; produto arquivado não aparece no cardápio. Categorias arquivadas ocultam seus produtos sem arquivá-los.
- Antes de excluir uma categoria que tenha produtos, oferecer explicitamente excluir os produtos associados ou transferi-los para outra categoria; evitar exclusões parciais.
- Imagens de produtos, categorias e logotipo ficam no Supabase Storage. Validar formato e tamanho. Após substituição ou exclusão bem-sucedida, limpar a imagem anterior somente se ela não for usada por outro registro.
- Alterações administrativas só devem informar sucesso e revalidar as páginas públicas afetadas depois da confirmação da operação no banco. Use revalidação, não WebSockets.

## Segurança e confiabilidade

- Habilite RLS e limite a leitura pública aos dados necessários ao cardápio; restrinja escrita ao administrador autorizado.
- Proteja rotas e operações administrativas no servidor e valide a sessão com Supabase Auth. Não implemente cadastro público de administrador.
- Nunca exponha `service_role`, segredos ou operações privilegiadas ao navegador. Use variáveis de ambiente para credenciais e configurações.
- Valide entradas no servidor, evite operações duplicadas/inconsistentes e apresente erros e sucessos de forma clara, sem reportar sucesso após falhas.
- Documente decisões técnicas para os pontos que a especificação deixa em aberto, sem contrariar seus requisitos.

## Processo de design e entrega

- Antes de construir interfaces, apresente uma proposta de identidade visual inteiramente original para cardápio e painel, incluindo cores, tipografia, componentes, estados e responsividade, e aguarde validação do usuário.
- Mantenha uma linguagem visual consistente entre a área pública e a administrativa; projete para celular e desktop com acessibilidade, contraste e navegação adequados.
- Implemente e teste por etapas. Verifique autenticação e autorização, CRUD, arquivamento/restauração/exclusão, uploads e limpeza de imagens, persistência, revalidação e responsividade.
- Ao concluir, forneça instruções para execução local, configuração dos serviços e deploy.
