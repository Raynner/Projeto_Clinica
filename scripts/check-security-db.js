// Verifica somente o MySQL local: cria sessões/contadores artificiais e os remove.
// Não modifica senhas, perfis, pacientes, convênios ou atendimentos existentes.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
if (!['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST)) throw new Error('Teste permitido somente no banco local.');
const pool = require('../src/config/database');
const repo = require('../src/repositories/sessionRepository');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
async function main() {
    const tokens = [];
    const keys = [];
    try {
        const [grants] = await pool.promise().query('SHOW GRANTS');
        const permissoes = JSON.stringify(grants);
        assert.doesNotMatch(permissoes, /ALL PRIVILEGES|GRANT OPTION|CREATE|ALTER|DROP/);
        const [identidade] = await pool.promise().query('SELECT CURRENT_USER() AS conta');
        assert.ok(!identidade[0].conta.startsWith('root@'));
        const [users] = await pool.promise().query('SELECT usuario_id, senha, ativo FROM usuarios WHERE ativo = TRUE LIMIT 1');
        if (!users[0]) throw new Error('Nenhuma conta ativa disponível para verificar integridade referencial de sessões.');
        for (const cenario of ['logout', 'inatividade', 'absoluta', 'fingerprint']) {
            const token = await repo.criar(users[0], false); tokens.push(token);
            assert.ok(await repo.buscar(token));
            if (cenario === 'logout') await repo.revogar(token);
            if (cenario === 'inatividade') await pool.promise().execute('UPDATE auth_sessions SET last_seen = ? WHERE token_hash = ?', [Date.now() - 16 * 60000, hash(token)]);
            if (cenario === 'absoluta') await pool.promise().execute('UPDATE auth_sessions SET expires_at = ? WHERE token_hash = ?', [Date.now() - 1, hash(token)]);
            if (cenario === 'fingerprint') await pool.promise().execute('UPDATE auth_sessions SET password_fingerprint = ? WHERE token_hash = ?', ['0'.repeat(64), hash(token)]);
            assert.equal(await repo.buscar(token), null);
        }
        const namespace = 'teste:' + crypto.randomUUID();
        const agora = Date.now(); const janela = 60000;
        const expires = (Math.floor(agora / janela) + 1) * janela;
        keys.push(hash(`${namespace}:${expires}`));
        const resultados = await Promise.all(Array.from({ length: 12 }, () => repo.consumir(namespace, 5, janela, agora)));
        const [rows] = await pool.promise().execute('SELECT hits FROM auth_rate_limits WHERE chave = ?', [keys[0]]);
        assert.equal(rows[0].hits, 12);
        assert.ok(resultados.filter(x => x.permitido).length <= 5);
        console.log(JSON.stringify({ contaSemRoot: true, privilegiosMinimos: true, revogacao: true, timeoutInatividade: true, timeoutAbsoluto: true, fingerprintSenha: true, contadorConcorrente: true }));
    } finally {
        for (const token of tokens) await repo.revogar(token);
        for (const key of keys) await pool.promise().execute('DELETE FROM auth_rate_limits WHERE chave = ?', [key]);
        await pool.promise().end();
    }
}
main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });
