const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usuarioRepository = require("../repositories/usuarioRepository");

async function login(email, senha) {
    
    // Validar dados recebidos

    if (!email ||  !senha) {

        const erro = new Error("Email e senha são obrigatórios.");

        erro.status = 400;
        throw erro;
    }

    // Buscar usuário pelo email

    const usuario = await usuarioRepository.buscarPorEmail(email);

    if (!usuario) {

        const erro = new Error("Email ou senha inválidos.");

        erro.status = 401;
        throw erro;
    }

    // VALIDA SE O USUÁRIO ESTÁ ATIVO

    if (!usuario.ativo) {
        const erro = new Error("Usuário inativo. Entre em contato com o administrador.");
        erro.status = 403;
        throw erro;
    }


    // Comparar senha informada com o hash do banco

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {

        const erro = new Error("Email ou senha inválidos.");

        erro.status = 401;

        throw erro;
    }

    // Gerar token

    const token = jwt.sign(

        {
            usuario_id: usuario.usuario_id,
            nome: usuario.nome,
            email: usuario.email, 
            perfil: usuario.perfil
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "8h"
        }
    );

    return {
        token,

        usuario: {
            usuario_id: usuario.usuario_id,
            nome: usuario.nome,
            email: usuario.email
        }
    };
}

module.exports = {
    login
}
