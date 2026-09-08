const service = require('../services/authService');
const sessions = require('../repositories/sessionRepository');
const { lerToken } = require('../middlewares/authMiddleware');
const { configuracao } = require('../config/security');
function opcoesCookie() {
    return { httpOnly: true, secure: configuracao().secure, sameSite: 'strict', path: '/' };
}
async function login(req, res, next) {
    try {
        const resultado = await service.login(req.body?.email, req.body?.senha);
        // Rotaciona a sessão do navegador; nenhum token aparece na resposta JSON.
        const anterior = lerToken(req);
        if (anterior) await sessions.revogar(anterior);
        res.cookie(configuracao().cookieName, resultado.token, { ...opcoesCookie(), maxAge: configuracao().absoluteMs });
        res.json({ mensagem: 'Login realizado com sucesso.', trocarSenha: resultado.trocarSenha });
    } catch (erro) { next(erro); }
}
async function logout(req, res, next) {
    try {
        const token = lerToken(req);
        if (token) await sessions.revogar(token);
        // Só confirma saída após revogar no servidor. Funciona também com sessão expirada.
        res.clearCookie(configuracao().cookieName, opcoesCookie());
        res.sendStatus(204);
    } catch (erro) { next(erro); }
}
function me(req, res) {
    res.json({ usuario: req.usuario, trocarSenha: req.sessao.trocarSenha });
}
async function alterarSenha(req, res, next) {
    try {
        await service.alterarSenha(req.usuario.usuario_id, req.body?.senhaAtual, req.body?.novaSenha);
        res.clearCookie(configuracao().cookieName, opcoesCookie());
        res.json({ mensagem: 'Senha alterada. Entre novamente em todos os dispositivos.' });
    } catch (erro) { next(erro); }
}
module.exports = { login, logout, me, alterarSenha };
