const jwt = require("jsonwebtoken");
const usuarioRepository = require("../repositories/usuarioRepository");

async function autenticarToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                erro: "Token não fornecido."
            });
        }

        const partes = authHeader.split(" ");

        if (
            partes.length !== 2 ||
            partes[0] !== "Bearer"
        ) {
            return res.status(401).json({
                erro: "Token inválido."
            });
        }

        const token = partes[1];

        const usuarioToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const usuarioAtual =
            await usuarioRepository.buscarPorId(
                usuarioToken.usuario_id
            );

        if (!usuarioAtual) {
            return res.status(401).json({
                erro: "Usuário não encontrado."
            });
        }

        if (!usuarioAtual.ativo) {
            return res.status(403).json({
                erro: "Usuário inativo."
            });
        }

        req.usuario = {
            usuario_id: usuarioAtual.usuario_id,
            nome: usuarioAtual.nome,
            email: usuarioAtual.email,
            perfil: usuarioAtual.perfil
        };

        next();

    } catch (erro) {
        if (erro.name === "TokenExpiredError") {
            return res.status(401).json({
                erro: "Token expirado."
            });
        }

        if (erro.name === "JsonWebTokenError") {
            return res.status(401).json({
                erro: "Token inválido."
            });
        }

        console.error("Erro na autenticação:", erro);

        return res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
}

module.exports = autenticarToken;