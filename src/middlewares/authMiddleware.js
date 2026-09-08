const sessions = require('../repositories/sessionRepository');
const { configuracao } = require('../config/security');
function lerToken(req) {
    const nome = configuracao().cookieName;
    const cookies = (req.headers.cookie || '').split(';').map(x => x.trim());
    const encontrados = cookies.filter(x => x.startsWith(nome + '='));
    // Não aceita JWT legado nem cookies duplicados/ambíguos.
    if (encontrados.length !== 1) return null;
    const token = encontrados[0].slice(nome.length + 1);
    return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}
async function autenticar(req, res, next) {
    try {
        const token = lerToken(req);
        const sessao = token ? await sessions.buscar(token) : null;
        if (!sessao) return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
        if (!sessao.ativo) return res.status(403).json({ erro: 'Usuário inativo.' });
        if (!['ADMIN', 'FISIOTERAPEUTA'].includes(sessao.perfil)) return res.status(403).json({ erro: 'Acesso não autorizado.' });
        req.usuario = { usuario_id: sessao.usuario_id, nome: sessao.nome, email: sessao.email, perfil: sessao.perfil };
        req.sessao = { token, trocarSenha: Boolean(sessao.trocar_senha) };
        // Senhas legadas fracas só permitem consultar a sessão, trocar senha e sair.
        if (req.sessao.trocarSenha && !['/api/auth/me', '/api/auth/senha', '/api/auth/logout'].includes(req.originalUrl.split('?')[0])) {
            return res.status(403).json({ erro: 'Atualize sua senha para continuar.', codigo: 'TROCAR_SENHA' });
        }
        next();
    } catch (erro) { next(erro); }
}
module.exports = autenticar;
module.exports.lerToken = lerToken;
