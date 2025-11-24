# EnergizaWeb Backend

Backend API desenvolvida em Node.js + TypeScript com Express.js para a aplicação EnergizaWeb Dashboard.

## Features

-   API RESTful
-   TypeScript
-   Conexão com SQL Server
-   Validação de dados com Zod
-   Tratamento de erros global
-   Arquitetura modular e escalável

## Pré-requisitos

-   Node.js (v18+)
-   NPM ou Yarn
-   Uma instância do SQL Server rodando

## Instalação

1.  **Clone o repositório** (ou certifique-se de que esta pasta `backend` está no seu projeto).

2.  **Navegue até a pasta do backend:**
    ```bash
    cd backend
    ```

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

## Configuração

1.  **Crie um arquivo `.env`** na raiz da pasta `backend/`. Você pode copiar o `.env.example`:
    ```bash
    cp .env.example .env
    ```

2.  **Edite o arquivo `.env`** com as suas credenciais do SQL Server e a porta desejada para a API:
    ```
    PORT=3001
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_SERVER=localhost
    DB_DATABASE=your_db_name
    DB_PORT=1433
    DB_ENCRYPT=false
    ```

3.  **Crie as tabelas no banco de dados.** Você precisará criar as tabelas correspondentes aos `types` definidos em `src/types.ts`. Exemplo de script SQL para a tabela `People`:

    ```sql
    CREATE TABLE People (
        id VARCHAR(255) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        nickname NVARCHAR(255),
        personType NVARCHAR(50) NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        phone NVARCHAR(50),
        birthDate DATE,
        street NVARCHAR(255),
        number NVARCHAR(50),
        complement NVARCHAR(255),
        neighborhood NVARCHAR(255),
        city NVARCHAR(255),
        state NVARCHAR(50),
        zipCode NVARCHAR(50),
        country NVARCHAR(100),
        createdAt DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Tabela para documentos (relação 1-N com People)
    CREATE TABLE Documents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        personId VARCHAR(255) FOREIGN KEY REFERENCES People(id) ON DELETE CASCADE,
        type NVARCHAR(50) NOT NULL,
        number NVARCHAR(100) NOT NULL
    );
    ```

## Scripts Disponíveis

-   **Para rodar em modo de desenvolvimento (com hot-reload):**
    ```bash
    npm run dev
    ```
    O servidor estará rodando em `http://localhost:3001` (ou a porta que você configurou).

-   **Para compilar o projeto para produção:**
    ```bash
    npm run build
    ```
    Isso irá gerar os arquivos JavaScript na pasta `dist/`.

-   **Para rodar a versão de produção (após o build):**
    ```bash
    npm run start
    ```

## Estrutura da API

A API segue os padrões RESTful. O CRUD de Pessoas está totalmente implementado como exemplo.

-   `GET /api/people` - Lista todas as pessoas
-   `GET /api/people/:id` - Busca uma pessoa pelo ID
-   `POST /api/people` - Cria uma nova pessoa
-   `PUT /api/people/:id` - Atualiza uma pessoa
-   `DELETE /api/people/:id` - Deleta uma pessoa
