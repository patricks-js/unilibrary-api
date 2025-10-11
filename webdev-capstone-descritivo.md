# Projeto Capstone --- Desenvolvimento Web

## Visão Geral

O **Projeto Capstone** tem como objetivo construir uma **Aplicação de
Página Única (SPA)** moderna, rápida e responsiva, utilizando frameworks
e bibliotecas atuais para oferecer uma experiência de usuário fluida e
de alta qualidade.

A aplicação permitirá **gerenciar e explorar livros** de uma
**biblioteca universitária**, integrando-se a uma API pública de
livros.\
Os usuários poderão:

-   Navegar por um catálogo de livros obtido de uma API pública.\
-   Visualizar informações detalhadas sobre cada obra.\
-   Buscar por palavras-chave.\
-   Filtrar por categorias e ordenar por critérios como autor, gênero ou
    popularidade.\
-   Realizar e acompanhar **empréstimos de livros**.\
-   Gerenciar **prazos de devolução**.\
-   (Opcionalmente) criar uma **lista de desejos**, recebendo
    notificações quando livros desejados estiverem disponíveis.

------------------------------------------------------------------------

## Requisitos Principais do Sistema

### 1. Navegação de Livros

-   Exibir livros obtidos de uma API pública (ex: **Open Library API**
    ou **Google Books API**).\
-   Mostrar detalhes como capa, título, autor, descrição, gênero e
    status de disponibilidade.

### 2. Busca e Filtragem

-   Permitir busca por título, autor ou palavras-chave.\
-   Implementar filtragem baseada em categorias (ex: ficção, ciência,
    história).\
-   Ordenar resultados por data de publicação, autor ou popularidade.\
-   Garantir eficiência ao lidar com grandes volumes de dados.

### 3. Sistema de Empréstimo

-   Permitir que usuários emprestem livros e acompanhem prazos de
    devolução.\
-   Implementar sistema de reserva para livros já emprestados.\
-   Armazenar o histórico de empréstimos de forma persistente (ex:
    localStorage ou banco de dados).

### 4. Página de Detalhes do Livro

-   Exibir uma página dedicada com informações detalhadas sobre o
    livro.\
-   Incluir um rastreador de status de leitura (ex: "Lendo",
    "Concluído", "Lista de desejos").

### 5. Lista de Desejos (Funcionalidade Avançada Opcional)

-   Permitir que usuários criem e gerenciem uma lista de livros
    desejados.\
-   Enviar notificações quando livros da lista ficarem disponíveis para
    empréstimo.

### 6. Design Responsivo

-   Garantir uma experiência de usuário fluida em todos os
    dispositivos.\
-   Adotar uma abordagem **mobile-first** para os layouts.

### 7. Interface de Usuário e Acessibilidade

-   Permitir navegação por teclado e uso de atributos **ARIA**.\
-   Garantir uma interface intuitiva, acessível e visualmente atrativa.

### 8. Otimização de Performance

-   Implementar **carregamento tardio (lazy loading)** de imagens e
    recursos.\
-   Otimizar a aplicação para tempos de carregamento reduzidos e melhor
    performance geral.

### 9. Medidas de Segurança

-   Implementar validação e sanitização de entradas para prevenir
    **ataques XSS**.\
-   Garantir a transmissão segura de dados via **HTTPS**.\
-   Adicionar mecanismos de **autenticação segura**.\
-   Validar formulários no lado do cliente para submissões seguras e sem
    erros.

### 10. Construção e Implantação

-   Utilizar **arquivos de ambiente** distintos para desenvolvimento e
    produção.\
-   Implantar a aplicação em um ambiente **serverless** ou **PaaS** (ex:
    Vercel, Netlify, AWS Amplify).

------------------------------------------------------------------------

## Stack Tecnológico

  -----------------------------------------------------------------------
  Componente                          Tecnologia
  ----------------------------------- -----------------------------------
  **Linguagem**                       TypeScript

  **Framework Frontend**              React

  **Gestão de Estado**                React Context API ou Redux Toolkit

  **Estilização**                     TailwindCSS e shadcn/ui

  **Integração com API**              TanStack Query

  **Roteamento**                      TanStack Router

  **Persistência de Dados**           Local Storage ou backend (Firebase
                                      / Supabase)

  **Implantação**                     Vercel, Netlify ou AWS Amplify
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Arquitetura

O projeto deve ser desenvolvido com foco em **modularidade**,
**escalabilidade** e **manutenibilidade**.\
Alguns princípios orientadores:

-   Definir uma estrutura clara de pastas e componentes React.\
-   Separar responsabilidades entre camadas de UI, lógica de negócio e
    acesso a dados.\
-   Utilizar **TanStack Query** para o gerenciamento eficiente de cache
    e requisições à API.\
-   Organizar o fluxo de dados com **Context API** ou **Redux
    Toolkit**.\
-   Garantir que o design siga princípios **mobile-first** e boas
    práticas de **acessibilidade**.\
-   Adotar componentes reutilizáveis com **TailwindCSS** e **shadcn/ui**
    para consistência visual.

------------------------------------------------------------------------

## Considerações Finais

Este projeto consolida a aplicação prática de conceitos fundamentais de
**desenvolvimento frontend moderno**, incluindo design responsivo,
gerenciamento de estado, integração com APIs, acessibilidade e
otimização de performance.

Além de demonstrar competências técnicas, o Capstone deve refletir uma
abordagem sólida de **engenharia de software**, evidenciando boas
práticas de arquitetura e qualidade de código.
