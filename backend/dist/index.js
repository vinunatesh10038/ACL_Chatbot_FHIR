"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = require("./mcp/routes");
const chat_1 = require("./routes/chat");
const logger = console; // simple logger
const app = (0, express_1.default)();
// 🛡️ Security headers
app.use((0, helmet_1.default)());
// Apply the CORS middleware globally for all routes
app.use((0, cors_1.default)({
    origin: 'http://10.1.9.25:3008',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // if you need cookies/auth
}));
// ✅ Parse incoming JSON
app.use(express_1.default.json({ limit: '1mb' }));
// ✅ Routes
app.use('/mcp', routes_1.mcpRouter);
app.use('/chat', chat_1.chatRouter);
// ✅ Server start
const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
    logger.info({ port }, 'MCP Chatbot backend listening');
});
