import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/config';
import Database from './config/database';
import router from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';

class Server {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.server.port;

    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private async initializeDatabase(): Promise<void> {
    await Database.getInstance().connect();
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
    }));

    // Rate limiting
    this.app.use(generalLimiter);

    // Request parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Compression
    this.app.use(compression());

    // Logging
    if (config.server.environment === 'development') {
      this.app.use(morgan('dev'));
    }
  }

  private initializeRoutes(): void {
    // API Routes
    this.app.use('/api', router);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        database: Database.getInstance().isConnectionActive() ? 'CONNECTED' : 'DISCONNECTED'
      });
    });

    // 404 Handler (debe ir después de todas las rutas)
    this.app.use(notFoundHandler);

    // Error handler (debe ir al final)
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 Server running on port ${this.port}`);
      console.log(`🌍 Environment: ${config.server.environment}`);
    });
  }
}

const server = new Server();
server.start();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT. Shutting down gracefully...');
  await Database.getInstance().disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM. Shutting down gracefully...');
  await Database.getInstance().disconnect();
  process.exit(0);
});