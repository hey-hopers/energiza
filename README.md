## Como Executar a Aplicação

Este guia detalha os passos para configurar e executar o backend, o frontend e a API Python da aplicação.

### 1. Backend

O backend é construído com Node.js e TypeScript.

1.  **Navegue até o diretório do backend:**  
   cd backend
2.  **Instale as dependências:**
   npm install
3.  **Compile o TypeScript (se necessário):**
   npm run build
4.  **Inicie o servidor em modo de desenvolvimento (com recarregamento automático):**
   npm run dev

Ou para iniciar o servidor em modo de produção: npm start


### 2. Frontend
O frontend é desenvolvido com React e Vite.

1.  **Navegue até o diretório do frontend:**
   cd frontend
2.  **Instale as dependências:**
   npm install
3.  **Inicie o servidor de desenvolvimento:**
   npm run dev

Isso geralmente iniciará a aplicação em `http://localhost:5173` (ou uma porta similar).

### 3. API Python (Worker)
A API Python é construída com FastAPI e Uvicorn.

1.  **Navegue até o diretório da API Python:** 
   cd worker-python/app
2.  **Instale as dependências:**
   pip install -r requirements.txt
3.  **Inicie o servidor Uvicorn:**    
   python -m uvicorn app.main:app --reload

Isso geralmente iniciará a API em `http://127.0.0.1:8000`.


**Observação:** Certifique-se de que todas as variáveis de ambiente necessárias (`.env` files) estejam configuradas em cada um dos respectivos diretórios, conforme a configuração do seu projeto.