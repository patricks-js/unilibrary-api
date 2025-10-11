### Requisitos da API de Gerenciamento de Livros (RESTful)

#### 1. Rotas de Livros (Integração com API Pública)

O objetivo é que as rotas de busca e visualização de livros sejam um *proxy* ou um **agregador de dados** que consulta uma API pública (como Open Library ou Google Books API) e formata a resposta para o frontend.

| Método HTTP | Endpoint (URI) | Descrição | Origem dos Dados |
| :--- | :--- | :--- | :--- |
| `GET` | `/books` | Lista de livros com suporte a busca, filtragem e ordenação (pelos critérios do Capstone: título, autor, categoria, popularidade). Deve repassar os parâmetros de consulta para a API pública. | **API Pública de Livros** (Ex: Google Books API) |
| `GET` | `/books/{id}` | Retorna informações detalhadas de um livro específico. | **API Pública de Livros** (pelo ID externo) |

**Observação:**
* A API local deve garantir que os dados da API pública sejam formatados de forma **consistente** (JSON) antes de serem enviados ao frontend.
* Pode ser necessário implementar um mecanismo de **cache** no *backend* para reduzir requisições repetidas à API pública e melhorar a performance.

#### 2. Rotas de Empréstimos e Devoluções

Gerenciamento do estado dos livros e seus prazos, que são dados exclusivos da biblioteca universitária.

| Método HTTP | Endpoint (URI) | Descrição | Persistência Local |
| :--- | :--- | :--- | :--- |
| `GET` | `/loans` | Lista os empréstimos do usuário autenticado (incluindo prazos e status). | Banco de Dados/Persistência Local |
| `POST` | `/loans` | Cria um novo empréstimo de livro para o usuário. | Banco de Dados/Persistência Local |
| `PATCH` | `/loans/{loanId}/devolucao` | Registra a devolução de um livro. | Banco de Dados/Persistência Local |
| `GET` | `/loans/history` | Retorna o histórico de empréstimos (usuário autenticado). | Banco de Dados/Persistência Local |

#### 4. Rotas de Lista de Desejos e Status de Leitura (Opcional/Avançado)

Dados vinculados ao perfil do usuário para gerenciar a lista de desejos e o progresso de leitura.

| Método HTTP | Endpoint (URI) | Descrição | Persistência Local |
| :--- | :--- | :--- | :--- |
| `GET` | `/whish-list` | Lista de desejos do usuário. | Banco de Dados/Persistência Local |
| `POST` | `/whish-list` | Adiciona um livro à lista de desejos. | Banco de Dados/Persistência Local |
| `DELETE` | `/whish-list/{bookId}` | Remove um livro da lista de desejos. | Banco de Dados/Persistência Local |
| `PUT`/`PATCH`| `/reading/{bookId}`| Atualiza o status de leitura ("Lendo", "Concluído", etc.) para o livro. | Banco de Dados/Persistência Local |

---

### Requisitos Técnicos e de Boas Práticas

Além das rotas, sua API precisa seguir boas práticas de engenharia de software para ser robusta e segura:

1.  **Design RESTful Consistente:**
    * Usar **substantivos no plural** para as coleções nas URIs (ex: `/books`, `/loans`) em INGLES.
    * Utilizar os **verbos HTTP apropriados** (`GET`, `POST`, `PATCH`, `DELETE`) para cada operação.
    * Usar **JSON** como formato de dados padrão para envio e recebimento.

2.  **Tratamento de Erros:**
    * Retornar **códigos de status HTTP** apropriados (ex: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`).
    * Incluir mensagens de erro claras e informativas no corpo da resposta.

3.  **Escalabilidade e Performance:**
    * Implementar **Paginação** para rotas que retornam grandes listas (como `/books` e `/loans`).
    * Utilizar *query parameters* para **Filtragem e Ordenação** na rota `/books` (ex: `GET /books?category=ficcao&ordem=autor`).

