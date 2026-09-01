const bcrypt = require("bcrypt");

const usuarioRepository = require("../repositories/usuarioRepository");

async function cadastrarUsuario(dados) {
    const { nome, email, senha } = dados;

    //VALIDAÇÃO

    if (!nome || !email || !senha) {

        const erro = new Error("Nome, email e senha são obrigatórios.");

        erro.status = 400;
        throw erro;
    }

    if (senha.length < 6) {

        const erro = new Error("A senha deve possuir pelo menos 6 caracteres.");

        erro.status = 400;
        throw erro;
    }

    // VERIFICAR SE EMAIL JÁ EXISTE

    const usuarioExistente = await usuarioRepository.buscarPorEmail(email);

    if (usuarioExistente) {
        const erro = new Error("Já existe um usuário cadastrado com este email.");
        
        erro.status = 409;
        throw erro;
    }

    // GERAR HASH DA SENHA

    const senhaHash = await bcrypt.hash(senha, 10);


    //CADASTRAR

    const resultado = await usuarioRepository.cadastrar({
        nome,
        email,
        senha: senhaHash,
        ativo: true
    });

    return {
        usuario_id: resultado.insertId,
        nome,
        email,
        ativo: true
    };
}

async function buscarUsuarioPorId(id) {
    
    const usuario = await usuarioRepository.buscarPorId(id);

    if (!usuario) {

        const erro = new Error("Usuário não encontrado.");

        erro.status = 404;
        throw erro;
    }

    return usuario;
}

module. exports = {
    cadastrarUsuario,
    buscarUsuarioPorId
};