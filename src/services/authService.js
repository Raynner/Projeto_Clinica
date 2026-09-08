const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const usuarios = require('../repositories/usuarioRepository');
const sessions = require('../repositories/sessionRepository');
const { senhaForte, validarSenha } = require('./passwordPolicy');
// Hash fictício evita retorno imediato quando o email não existe (mitigação de timing).
const hashFicticio = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 12);
function entradaLogin(email, senha) {
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof senha !== 'string' || !senha || Buffer.byteLength(senha) > 72) {
        throw Object.assign(new Error('Email ou senha inválidos.'), { status: 401 });
    }
}
async function login(email, senha) {
    entradaLogin(email, senha);
    const usuario = await usuarios.buscarPorEmail(email.trim().toLowerCase());
    const correta = await bcrypt.compare(senha, usuario?.senha || hashFicticio);
    // Mesma resposta para conta ausente, inativa, perfil inválido ou senha incorreta.
    if (!correta || !usuario?.ativo || !['ADMIN', 'FISIOTERAPEUTA'].includes(usuario.perfil)) {
        throw Object.assign(new Error('Email ou senha inválidos.'), { status: 401 });
    }
    const trocarSenha = !senhaForte(senha);
    const token = await sessions.criar(usuario, trocarSenha);
    return { token, trocarSenha };
}
async function alterarSenha(usuarioId, senhaAtual, novaSenha) {
    validarSenha(novaSenha);
    if (typeof senhaAtual !== 'string' || Buffer.byteLength(senhaAtual) > 72) throw Object.assign(new Error('Senha atual inválida.'), { status: 400 });
    const usuario = await usuarios.buscarCredenciaisPorId(usuarioId);
    if (!usuario || !await bcrypt.compare(senhaAtual, usuario.senha)) throw Object.assign(new Error('Senha atual inválida.'), { status: 400 });
    if (await bcrypt.compare(novaSenha, usuario.senha)) throw Object.assign(new Error('A nova senha deve ser diferente da atual.'), { status: 400 });
    await sessions.alterarSenha(usuarioId, usuario.senha, await bcrypt.hash(novaSenha, 12));
}
module.exports = { login, alterarSenha };
