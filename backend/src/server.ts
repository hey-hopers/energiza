// backend/src/server.ts
import app from './app';
import './config/database'; // Initializes database connection
import { closePool } from './config/database';
import * as userRepository from './repositories/userRepository'; 

const PORT = process.env.PORT || 3001;

// Adicionar esta lógica antes de iniciar o servidor
const initializeServer = async () => {
  try {
    console.log('Invalidando todas as sessões ativas...');
    await userRepository.invalidateAllSessions();
    console.log('Todas as sessões ativas invalidadas com sucesso.');

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`${signal} recebido: encerrando servidor HTTP`);
      
      server.close(async () => {
        console.log('Servidor HTTP fechado');
        await closePool();
        process.exit(0);
      });
      
      // Força o fechamento após 10 segundos
      setTimeout(() => {
        console.error('Forçando encerramento...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Erro ao iniciar o servidor ou invalidar sessões:', error);
    process.exit(1);
  }
};

initializeServer();