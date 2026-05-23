# Eu Gênio

O **Eu Gênio** é uma aplicação web moderna para resolução de problemas de Pesquisa Operacional, com foco em Programação Linear e Sistemas Lineares.

## 🏗️ Arquitetura MVC e DAO

Este projeto foi refatorado para seguir o padrão de arquitetura **MVC (Model-View-Controller)** e **DAO (Data Access Object)**, garantindo uma separação clara de responsabilidades e facilitando a manutenção e escalabilidade.

### Estrutura de Diretórios

- **`src/models`**: Contém as definições de dados e regras de negócio.
  - `Variable.ts`, `ProblemData.ts`, `SimplexResult.ts`: Interfaces de dados.
  - `SimplexSolver.ts`: Lógica do algoritmo Simplex.
  - `LinearSolver.ts`: Lógica para resolução de sistemas lineares.

- **`src/views`** (Representado por `src/app`): Camada de apresentação (React/Next.js).
  - `page.tsx`: Tela Inicial.
  - `modeling/page.tsx`: Tela de Modelagem.
  - `execucao/page.tsx`: Tela de Resultados/Execução.
  - `linear/page.tsx`: Tela de Sistemas Lineares.

- **`src/controllers`**: Controladores que intermediam a comunicação entre a View e o Model.
  - `ProjectController.ts`: Gerencia o fluxo de dados do projeto (parsing de arquivos, execução do solver).
  - `AuthController.ts`: Gerencia a autenticação do usuário.

- **`src/dao`**: Objetos de Acesso a Dados.
  - `SupabaseClientDAO.ts`: Singleton para conexão com o Supabase.
  - `AuthDAO.ts`: Abstração das operações de autenticação.

- **`src/utils`**: Funções utilitárias compartilhadas.

## 🚀 Tecnologias

- **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons.
- **Backend/Database**: Supabase (PostgreSQL, Auth).
- **Visualização**: Recharts.

## 🛠️ Configuração e Execução

1.  **Instalar dependências**:
    ```bash
    npm install
    ```

2.  **Configurar variáveis de ambiente**:
    Crie um arquivo `.env.local` na raiz com suas credenciais do Supabase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=sua_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
    ```

3.  **Executar em desenvolvimento**:
    ```bash
    npm run dev
    ```

4.  **Acessar**: Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📚 Funcionalidades

- **Programação Linear**: Resolução pelo método Simplex (Maximização e Minimização).
- **Sistemas Lineares**: Resolução por Eliminação Gaussiana.
- **Análise de Sensibilidade**: Visualização do Tableau, Preços Sombra e Dualidade.
- **Método Gráfico**: Visualização 2D para problemas com 2 variáveis.
- **Importação**: Suporte a arquivos de texto no formato TORA.
