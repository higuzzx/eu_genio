# Especificação de Requisitos de Software
## Eu Gênio

**Versão:** 1.1
**Data:** 28/11/2025

---

## 1. Introdução

### 1.1 Propósito
Este documento especifica os requisitos de software para o **Eu Gênio**, uma aplicação web para resolução de problemas de otimização linear, sistemas de equações e análise de sensibilidade.

### 1.2 Escopo
O sistema permite:
- **Autenticação Segura**: Cadastro e login de usuários para proteção de dados.
- **Modelagem Matemática**: Definição de variáveis, função objetivo e restrições.
- **Resolução**: Algoritmo Simplex (Primal) e Eliminação Gaussiana.
- **Análise**: Visualização de Tableau, Gráficos (2D), Dualidade e Preços Sombra.
- **Persistência**: Salvamento automático de projetos na nuvem.

---

## 2. Descrição Geral

### 2.1 Stack Tecnológica
- **Frontend**: Next.js (App Router), React, TailwindCSS.
- **Backend/Banco de Dados**: Supabase (PostgreSQL) com Auth e Row Level Security (RLS).
- **Linguagem**: TypeScript.

### 2.2 Perfil de Usuário
- **Estudantes e Professores**: Foco em aprendizado, visualização passo a passo e verificação de resultados.
- **Analistas**: Foco em resolução rápida e análise de sensibilidade.

---

## 3. Funcionalidades Principais

### 3.1 Gestão de Acesso (Autenticação)
- **Login Obrigatório**: O acesso às ferramentas de cálculo é restrito a usuários autenticados.
- **Segurança de Dados**: Implementação de RLS (Row Level Security) garantindo que cada usuário acesse apenas seus próprios projetos.
- **Fluxo**: Registro (Nome, Email, Senha) e Login via Supabase Auth.

### 3.2 Programação Linear (Simplex)
- **Entrada**: Definição flexível de $N$ variáveis e $M$ restrições.
- **Otimização**: Suporte a Maximização e Minimização.
- **Algoritmo**: Simplex com tratamento para variáveis artificiais (Big M / Duas Fases).

### 3.3 Análise Avançada
- **Dualidade**: Formulação automática do problema Dual e verificação do Teorema da Dualidade Forte ($Z^* = W^*$).
- **Sensibilidade**: Cálculo de Preços Sombra (Shadow Prices) e identificação de recursos escassos.
- **Gráfico**: Visualização da região viável e curvas de nível para problemas com 2 variáveis.

### 3.4 Sistemas Lineares
- Módulo dedicado para resolução de sistemas $Ax = b$ via Eliminação Gaussiana.

---

## 4. Interface e UX

### 4.1 Navegação
- **Arquitetura Multi-página**:
    - `/login` & `/register`: Acesso.
    - `/menu`: Seleção de módulos.
    - `/setup`: Definição de variáveis.
    - `/modeling`: Modelagem de equações.
    - `/execucao`: Resultados e análises.
    - `/linear`: Sistemas lineares.

### 4.2 Usabilidade
- **Feedback Visual**: Botões com animação de clique (escala) para confirmação tátil.
- **Design Limpo**: Uso de ícones (Lucide React) e paleta de cores consistente.
- **Validação**: Prevenção de erros de entrada (NaN, campos vazios).

---

## 5. Requisitos Não-Funcionais

### 5.1 Desempenho
- Resolução instantânea (<2s) para problemas de porte acadêmico (<50 variáveis).
- Interface responsiva e fluida.

### 5.2 Segurança
- Chaves de API sensíveis (`service_role`) nunca devem ser expostas no cliente.
- Uso estrito de variáveis de ambiente (`.env.local`) para configuração.