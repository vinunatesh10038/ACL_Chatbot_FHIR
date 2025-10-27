import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { mcpRouter } from './mcp/routes';
import { chatRouter } from './routes/chat';

const logger = console; // simple logger
const app = express();

// 🛡️ Security headers
app.use(helmet());

// Apply the CORS middleware globally for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // if you need cookies/auth
}));

// ✅ Parse incoming JSON
app.use(express.json({ limit: '1mb' }));

// ✅ Routes
app.use('/mcp', mcpRouter);
app.use('/chat', chatRouter);

// ✅ Server start
const port = Number(process.env.PORT || 8081);
app.listen(port, () => {
  logger.info({ port }, 'MCP Chatbot backend listening');
});
