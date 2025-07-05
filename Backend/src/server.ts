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
    this.port = Number(process.env.PORT) || config.server.port; // Usa process.env.PORT o el valor de config

    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await Database.getInstance().connect();
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      process.exit(1); // Termina la aplicación si no puede conectar a la DB
    }
  }

  private initializeMiddlewares(): void {
    // Force HTTPS in production
    if (config.server.environment === 'production') {
      this.app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
          return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        return next();
      });
    }

    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
    }));

    // Rate limiting
    this.app.use(generalLimiter);

    // Request parsing with size limits
    this.app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '5mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '5mb' }));

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
        database: Database.getInstance().isConnectionActive() ? 'CONNECTED' : 'DISCONNECTED',
        environment: config.server.environment,
        port: this.port
      });
    });

    // 404 Handler
    this.app.use(notFoundHandler);

    // Error handler
    this.app.use(errorHandler);
  }

  public start(): void {
    const server = this.app.listen(this.port, () => {
      console.log(`
        🚀 Server running on port ${this.port}
        🌍 Environment: ${config.server.environment}
        🔄 CORS Origin: ${config.cors.origin}
        🕒 Started at: ${new Date().toISOString()}
      `);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${this.port} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    server.on('listening', () => {
      console.log('✅ Server is ready to accept connections');
    });
  }
}

// Iniciar servidor
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

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
  process.exit(1);
});