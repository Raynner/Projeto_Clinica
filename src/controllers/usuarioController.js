const usuarioService = require("../services/usuarioService");

// LISTAR OS USUÁRIOS

async function listarUsuarios(req, res, next) {
    try {
        const usuarios = await usuarioService.listarUsuarios();

        res.status(200).json(usuarios);
    } catch (erro) {
        next(erro);
    }
}

async function cadastrarUsuario(req, res, next) {
    
    try {
        const usuario = await usuarioService.cadastrarUsuario(req.body);

        res.status(201).json(usuario);

    } catch (erro) {

        next(erro);
    }
}

async function buscarUsuarioPorId(req, res, next) {

    try {

        const id = req.params.id;

        const usuario_id = req.usuario.usuario_id;

        const usuario = await usuarioService.buscarUsuarioPorId(id, usuario_id);

        res.status(200).json(usuario);

    } catch (erro) {

        next(erro);
    }
}

// atualizar status do usuário

async function atualizarStatusUsuario(req, res, next) {
    try {
        const { id } = req.params;
        const { ativo } = req.body;

        const resultado =
            await usuarioService.atualizarStatusUsuario(
                id,
                ativo,
                req.usuario
            );

        res.status(200).json({
            mensagem: ativo
                ? "Usuário ativado com sucesso."
                : "Usuário desativado com sucesso.",
            ...resultado
        });

    } catch (erro) {
        next(erro);
    }
}

module.exports = {
    cadastrarUsuario,
    buscarUsuarioPorId,
    listarUsuarios,
    atualizarStatusUsuario
}