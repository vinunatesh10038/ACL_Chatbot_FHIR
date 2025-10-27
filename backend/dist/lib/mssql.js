"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = void 0;
exports.getDbPool = getDbPool;
const mssql_1 = __importDefault(require("mssql"));
exports.sql = mssql_1.default;
const config = {
    server: process.env.DB_SERVER || 'localhost',
    port: Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME || 'your_database',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};
let pool = null;
async function getDbPool() {
    if (!pool) {
        pool = await mssql_1.default.connect(config);
    }
    return pool;
}
