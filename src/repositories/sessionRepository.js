const pool = require('../config/database');
const crypto = require('node:crypto');
const { configuracao } = require('../config/security');
const hash = valor => crypto.createHash('sha256').update(valor).digest('hex');

async function criar(usuario, trocarSenha) {
    const token = crypto.randomBytes(32).toString('base64url');
    const agora = Date.now();
    const config = configuracao();
    // Bloqueio da linha do usuário serializa login com troca de senha/desativação.
    const conn = await pool.promise().getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute('SELECT senha, ativo FROM usuarios WHERE usuario_id = ? FOR UPDATE', [usuario.usuario_id]);
        if (!rows[0]?.ativo || rows[0].senha !== usuario.senha) throw Object.assign(new Error('Credenciais inválidas.'), { status: 401 });
        await conn.execute('INSERT INTO auth_sessions (token_hash, usuario_id, password_fingerprint, trocar_senha, expires_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)',
            [hash(token), usuario.usuario_id, hash(usuario.senha), trocarSenha, agora + config.absoluteMs, agora]);
        await conn.commit();
        return token;
    } catch (erro) { await conn.rollback(); throw erro; }
    finally { conn.release(); }
}
async function buscar(token) {
    const agora = Date.now();
    const [rows] = await pool.promise().execute(`SELECT s.*, u.nome, u.email, u.perfil, u.ativo
        FROM auth_sessions s JOIN usuarios u ON u.usuario_id = s.usuario_id
        WHERE s.token_hash = ? AND s.expires_at > ? AND s.last_seen > ?
        AND s.password_fingerprint = SHA2(u.senha, 256)`, [hash(token), agora, agora - configuracao().idleMs]);
    const sessao = rows[0];
    if (sessao?.ativo) {
        const [resultado] = await pool.promise().execute('UPDATE auth_sessions SET last_seen = ? WHERE token_hash = ?', [agora, hash(token)]);
        if (!resultado.affectedRows) return null;
    }
    return sessao || null;
}
async function revogar(token) {
    await pool.promise().execute('DELETE FROM auth_sessions WHERE token_hash = ?', [hash(token)]);
}
async function alterarSenha(id, hashAntigo, hashNovo) {
    const conn = await pool.promise().getConnection();
    try {
        await conn.beginTransaction();
        const [r] = await conn.execute('UPDATE usuarios SET senha = ? WHERE usuario_id = ? AND senha = ? AND ativo = TRUE', [hashNovo, id, hashAntigo]);
        if (!r.affectedRows) throw Object.assign(new Error('A conta foi alterada. Entre novamente.'), { status: 401 });
        // A troca de senha encerra todas as sessões, na mesma transação.
        await conn.execute('DELETE FROM auth_sessions WHERE usuario_id = ?', [id]);
        await conn.commit();
    } catch (erro) { await conn.rollback(); throw erro; }
    finally { conn.release(); }
}
async function consumir(chave, limite, janelaMs, agora = Date.now()) {
    const expires = (Math.floor(agora / janelaMs) + 1) * janelaMs;
    const key = hash(`${chave}:${expires}`);
    // INSERT ... ON DUPLICATE KEY UPDATE evita perda de contagem entre processos.
    await pool.promise().execute('INSERT INTO auth_rate_limits (chave, hits, expires_at) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE hits = hits + 1', [key, expires]);
    const [rows] = await pool.promise().execute('SELECT hits FROM auth_rate_limits WHERE chave = ?', [key]);
    return { permitido: rows[0].hits <= limite, retryAfter: Math.max(1, Math.ceil((expires - agora) / 1000)) };
}
async function limparExpirados() {
    await pool.promise().execute('DELETE FROM auth_sessions WHERE expires_at <= ? OR last_seen <= ?', [Date.now(), Date.now() - configuracao().idleMs]);
    await pool.promise().execute('DELETE FROM auth_rate_limits WHERE expires_at <= ?', [Date.now()]);
}
module.exports = { criar, buscar, revogar, alterarSenha, consumir, limparExpirados };
