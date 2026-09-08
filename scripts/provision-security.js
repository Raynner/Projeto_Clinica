// Executar uma vez com credencial administrativa local. Não imprime nem grava
// a senha administrativa em novos arquivos; a conta root não é removida do servidor.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const root = path.join(__dirname, '..');

async function main() {
    const envPath = path.join(root, '.env');
    const original = fs.readFileSync(envPath, 'utf8');
    const env = dotenv.parse(original);
    if (!['localhost', '127.0.0.1', '::1'].includes(env.DB_HOST)) throw new Error('Este provisionador é exclusivo do MySQL local.');
    if (env.DB_USER !== 'root') throw new Error('A configuração já não usa root; não executar novamente sem revisão administrativa.');
    const admin = await mysql.createConnection({ host: env.DB_HOST, port: Number(env.DB_PORT), user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME });
    let teste;
    try {
        const migration = fs.readFileSync(path.join(root, 'database/migrations/002_auth_security.sql'), 'utf8');
        for (const statement of migration.split(';').map(x => x.trim()).filter(Boolean)) await admin.query(statement);
        const user = 'praxis_app_' + crypto.randomBytes(4).toString('hex');
        const password = crypto.randomBytes(36).toString('base64url');
        const account = mysql.escape(user) + "@'localhost'";
        await admin.query('CREATE USER ' + account + ' IDENTIFIED BY ' + mysql.escape(password));
        // Concessões por tabela, sem ALL PRIVILEGES, GRANT OPTION ou permissão DDL.
        for (const [table, privileges] of [
            ['usuarios', 'SELECT, INSERT, UPDATE'], ['pais', 'SELECT, INSERT, UPDATE'],
            ['pacientes', 'SELECT, INSERT, UPDATE, DELETE'], ['convenio', 'SELECT, INSERT, UPDATE, DELETE'],
            ['atendimento', 'SELECT, INSERT, UPDATE, DELETE'],
            ['auth_sessions', 'SELECT, INSERT, UPDATE, DELETE'], ['auth_rate_limits', 'SELECT, INSERT, UPDATE, DELETE']
        ]) await admin.query('GRANT ' + privileges + ' ON ' + mysql.escapeId(env.DB_NAME) + '.' + mysql.escapeId(table) + ' TO ' + account);
        teste = await mysql.createConnection({ host: env.DB_HOST, port: Number(env.DB_PORT), user, password, database: env.DB_NAME });
        for (const table of ['usuarios', 'pais', 'pacientes', 'convenio', 'atendimento', 'auth_sessions', 'auth_rate_limits']) {
            await teste.query('SELECT 1 FROM ' + mysql.escapeId(table) + ' LIMIT 0');
        }
        const [grants] = await teste.query('SHOW GRANTS');
        if (JSON.stringify(grants).includes('ALL PRIVILEGES') || JSON.stringify(grants).includes('GRANT OPTION')) throw new Error('Permissões excessivas detectadas.');
        // Somente troca a configuração após conectar e verificar a conta nova.
        const updated = { ...env, DB_USER: user, DB_PASSWORD: password,
            NODE_ENV: 'development', BIND_HOST: '127.0.0.1',
            APP_ORIGIN: env.APP_ORIGIN || `http://localhost:${env.PORT || 5000}`,
            TRUSTED_PROXIES: '', DB_TLS: 'false' };
        delete updated.JWT_SECRET; // JWT legado não é mais aceito.
        const output = Object.entries(updated).map(([key, value]) => key + '=' + JSON.stringify(value)).join('\n') + '\n';
        fs.writeFileSync(envPath, output, { mode: 0o600 });
        console.log(JSON.stringify({ migrationApplied: true, applicationUsesRoot: false, tableGrants: grants.length - 1, envUpdated: true }));
    } finally { if (teste) await teste.end(); await admin.end(); }
}
main().catch(erro => { console.error('Provisionamento falhou:', erro.code || erro.message); process.exitCode = 1; });
