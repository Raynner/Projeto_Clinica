const usuarioService = require("../services/usuarioService");

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
        const usuario = await usuarioService.buscarUsuarioPorId(req.params.id);

        res.status(200).json(usuario);

    } catch (erro) {

        next(erro);
    }
}

module.exports = {
    cadastrarUsuario,
    buscarUsuarioPorId
}