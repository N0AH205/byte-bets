import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { apiRouter } from './routes/api';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Restrict this in production
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/v1', apiRouter);

// Error Handling
app.use(errorHandler);

// Socket.IO Logic
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  // Example game event
  socket.on('placeBet', (data) => {
    logger.info({ data }, 'Bet received');
    // Delegate to services in a real app
    setTimeout(() => {
      socket.emit('betResult', { won: Math.random() > 0.5, payout: data.amount * 2 });
    }, 1000);
  });
});

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.info(`Game server running on port ${PORT}`);
});
