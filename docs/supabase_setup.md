# Configuração do Supabase (Banco de Dados e Autenticação)

Este projeto utiliza o Supabase para Banco de Dados (PostgreSQL) e Autenticação.

## 1. Criar Conta e Projeto

1.  Acesse [supabase.com](https://supabase.com/) e crie uma conta.
2.  Crie um novo projeto ("New Project").
3.  Defina o nome, senha do banco e região.

## 2. Configurar Autenticação

1.  No painel do seu projeto, vá em **Authentication** (ícone de usuários).
2.  Vá em **Providers**.
3.  Certifique-se de que **Email** está habilitado.
4.  (Opcional) Desabilite "Confirm email" se quiser que os usuários façam login imediatamente sem verificar o email (útil para testes).

## 3. Criar Tabelas e Políticas de Segurança (RLS)

1.  Vá em **SQL Editor** (ícone de terminal).
2.  Clique em "New query".
3.  Copie e cole TODO o conteúdo do arquivo `database_schema.sql` deste projeto.
    *   Este script cria as tabelas `profiles`, `projects`, etc.

## 5. Testar

1.  Rode o projeto: `npm run dev`.
2.  Acesse `http://localhost:3000`.
3.  Clique em "Criar Conta" e registre um usuário.
4.  Se o login for automático ou você conseguir logar, a integração está funcionando!