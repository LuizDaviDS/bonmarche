# Bonmarché

Cardápio online com painel administrativo, desenvolvido com Next.js e Supabase.

## Preparar o ambiente local

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env.local`.
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os valores do projeto Supabase. Não use uma chave `secret` ou `service_role`.
4. No Supabase, em **Authentication → URL Configuration**, mantenha `http://localhost:3000` como Site URL e adicione `http://localhost:3000/admin/redefinir-senha` às Redirect URLs para links de redefinição enviados pelo responsável do projeto.
5. Inicie a aplicação com `npm run dev` e abra http://localhost:3000.

O arquivo `.env.local` contém configuração local e não deve ser enviado ao GitHub.

## Acesso administrativo

- Login local: http://localhost:3000/admin/login.
- O painel não oferece solicitação de recuperação de senha. Se necessário, o responsável do projeto pode enviar um link pelo Supabase Auth; o retorno usa `/admin/redefinir-senha`.

## Comandos

- `npm run dev`: inicia o servidor de desenvolvimento.
- `npm run lint`: verifica o código com ESLint.
- `npm run build`: cria uma compilação de produção.

## Banco e painel administrativo

Antes de usar o painel, aplique em ordem todas as migrations de
`supabase/migrations/` no projeto Supabase. A migration mais recente adiciona
a operação transacional de exclusão/transferência de categorias. Consulte
`supabase/README.md` para preparar o administrador, o bucket de mídia e as
políticas de acesso.

O painel em `/admin` exige uma sessão Supabase Auth associada a um registro em
`public.profiles`. Não há cadastro público de administradores. Produtos,
categorias e configurações usam somente a chave publishable configurada em
`.env.local`; nenhuma chave `service_role` deve ser configurada no cliente.
