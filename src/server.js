require('dotenv').config({ quiet: true });
const { configuracao } = require('./config/security');
configuracao(); // Falha antes de aceitar requisições se a configuração de produção for insegura.
const app = require('./app');
const pool = require('./config/database');
const sessions = require('./repositories/sessionRepository');
async function iniciar() {
    // Migrações e permissões devem estar prontas; não cria tabelas com a conta da aplicação.
    await pool.promise().query('SELECT token_hash FROM auth_sessions LIMIT 0');
    await pool.promise().query('SELECT chave FROM auth_rate_limits LIMIT 0');
    await sessions.limparExpirados();
    setInterval(() => sessions.limparExpirados().catch(e => console.error('Falha na limpeza de sessões:', e.code || e.name)), 60000).unref();
    // Por padrão só o host local/proxy alcança o Node; exposição de rede é decisão explícita.
    app.listen(Number(process.env.PORT || 5000), process.env.BIND_HOST || '127.0.0.1', () => console.log('Servidor iniciado.'));
}
iniciar().catch(async erro => { console.error('Inicialização recusada:', erro.code || erro.message); await pool.promise().end(); process.exitCode = 1; });
