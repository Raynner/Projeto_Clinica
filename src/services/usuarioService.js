const bcrypt = require("bcrypt");
const { validarSenha } = require("./passwordPolicy");

const usuarioRepository = require("../repositories/usuarioRepository");

// LISTAR USUÁRIOS

async function listarUsuarios() {
    return await usuarioRepository.buscarTodos();
}

async function cadastrarUsuario(dados) {
    // Cadastro e login usam a mesma normalização de identidade.
    const nome = typeof dados.nome === 'string' ? dados.nome.trim() : '';
    const email = typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : '';
    const { senha } = dados;

    //VALIDAÇÃO

    if (!nome || !email || !senha) {

        const erro = new Error("Nome, email e senha são obrigatórios.");

        erro.status = 400;
        throw erro;
    }

    if (nome.length > 255 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const erro = new Error('Informe nome e email válidos.');
        erro.status = 400;
        throw erro;
    }

    // A política é obrigatória no servidor; o HTML é apenas uma ajuda ao usuário.
    validarSenha(senha);

    // VERIFICAR SE EMAIL JÁ EXISTE

    const usuarioExistente = await usuarioRepository.buscarPorEmail(email);

    if (usuarioExistente) {
        const erro = new Error("Já existe um usuário cadastrado com este email.");
        
        erro.status = 409;
        throw erro;
    }

    // GERAR HASH DA SENHA

    const senhaHash = await bcrypt.hash(senha, 12);


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

async function buscarUsuarioPorId(id, usuario_id) {

    if (!/^\d+$/.test(String(id))) {

        const erro = new Error(
            "O ID do usuário deve ser numérico."
        );

        erro.status = 400;

        throw erro;
    }

    if (!usuario_id) {

        const erro = new Error(
            "Usuário autenticado é obrigatório."
        );

        erro.status = 401;

        throw erro;
    }

    if (Number(id) !== Number(usuario_id)) {

        const erro = new Error(
            "Usuário não encontrado."
        );

        erro.status = 404;

        throw erro;
    }
    
    const usuario = await usuarioRepository.buscarPorId(id);

    if (!usuario) {

        const erro = new Error("Usuário não encontrado.");

        erro.status = 404;
        throw erro;
    }

    return usuario;
}

// ATUALIZAR STATUS DO USUÁRIO

async function atualizarStatusUsuario(id, ativo, usuarioAutenticado) {
    if (!/^\d+$/.test(String(id))) {
        const erro = new Error("O ID do usuário deve ser numérico.");
        erro.status = 400;
        throw erro;
    }

    if (typeof ativo !== "boolean") {
        const erro = new Error("O campo ativo deve ser verdadeiro ou falso.");
        erro.status = 400;
        throw erro;
    }

    const usuario = await usuarioRepository.buscarPorId(id);

    if (!usuario) {
        const erro = new Error("Usuário não encontrado.");
        erro.status = 404;
        throw erro;
    }

    if (Number(id) === Number(usuarioAutenticado.usuario_id)) {
        const erro = new Error(
            "O administrador não pode desativar a própria conta."
        );
        erro.status = 400;
        throw erro;
    }

    const resultado =
        await usuarioRepository.atualizarStatus(id, ativo);

    return {
        usuario_id: Number(id),
        ativo,
        registros_alterados: resultado.affectedRows
    };
}

module. exports = {
    cadastrarUsuario,
    buscarUsuarioPorId,
    listarUsuarios,
    atualizarStatusUsuario
};
