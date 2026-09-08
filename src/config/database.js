const mysql = require('mysql2');
const fs = require('node:fs');
require('dotenv').config({ quiet: true });

// A aplicação nunca inicia com a conta administrativa; provisionamento usa script separado.
if (!process.env.DB_USER || process.env.DB_USER.toLowerCase() === 'root') {
    throw new Error('Configure um usuário MySQL exclusivo, diferente de root.');
}
if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD.length < 24) {
    throw new Error('DB_PASSWORD deve ter pelo menos 24 caracteres.');
}
const local = ['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST);
if (!local && process.env.DB_TLS !== 'true') throw new Error('MySQL remoto exige DB_TLS=true.');
// Pool evita compartilhar transações entre requisições simultâneas.
module.exports = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306), connectionLimit: 10,
    waitForConnections: true, queueLimit: 100, connectTimeout: 5000,
    ...(process.env.DB_TLS === 'true' ? { ssl: {
        rejectUnauthorized: true,
        // Valida também o nome de DB_HOST no certificado; confiar na CA não basta.
        // No Railway, o certificado deve identificar mysql.railway.internal.
        verifyIdentity: true,
        ...(process.env.DB_SSL_CA ? { ca: fs.readFileSync(process.env.DB_SSL_CA) } : {})
    } } : {})
});
