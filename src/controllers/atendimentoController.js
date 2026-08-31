const atendimentoService = require("../services/atendimentoService");

// GET /api/atendimentos

async function listarAtendimentos(req, res) {

    try {

        const atendimentos =
            await atendimentoService.listarAtendimentos();

        res.status(200).json(atendimentos);

    } catch (erro) {

        console.error(
            "Erro ao listar atendimentos:",
            erro
        );

        res.status(
            erro.status || 500
        ).json({

            erro:
                erro.message ||
                "Erro interno do servidor."

        });
    }
}

// GET /api/atendimentos/:id

async function buscarAtendimento(req, res) {

    try {

        const { id } = req.params;

        const atendimento =
            await atendimentoService.buscarAtendimento(id);

        res.status(200).json(atendimento);

    } catch (erro) {

        console.error(
            "Erro ao buscar atendimento:",
            erro
        );

        res.status(
            erro.status || 500
        ).json({

            erro:
                erro.message ||
                "Erro interno do servidor."

        });
    }
}

// POST

async function cadastrarAtendimento(req, res) {

    try {

        const resultado =
            await atendimentoService.cadastrarAtendimento(
                req.body
            );

        res.status(201).json({

            mensagem:
                "Atendimento cadastrado com sucesso.",

            atendimento_id:
                resultado.insertId

        });

    } catch (erro) {

        console.error(
            "Erro ao cadastrar atendimento:",
            erro
        );

        res.status(
            erro.status || 500
        ).json({

            erro:
                erro.message ||
                "Erro interno do servidor."

        });
    }
}

// PUT

async function atualizarAtendimento(req, res) {

    try {

        const { id } = req.params;

        const resultado =
            await atendimentoService.atualizarAtendimento(
                id,
                req.body
            );

        res.status(200).json({

            mensagem:
                "Atendimento atualizado com sucesso.",

            atendimento_id:
                Number(id),

            registros_alterados:
                resultado.affectedRows

        });

    } catch (erro) {

        console.error(
            "Erro ao atualizar atendimento:",
            erro
        );

        res.status(
            erro.status || 500
        ).json({

            erro:
                erro.message ||
                "Erro interno do servidor."

        });
    }
}

// DELETE

async function excluirAtendimento(req, res) {

    try {

        const { id } = req.params;

        const resultado =
            await atendimentoService.excluirAtendimento(id);

        res.status(200).json({

            mensagem:
                "Atendimento excluído com sucesso.",

            atendimento_id:
                Number(id),

            registros_excluidos:
                resultado.affectedRows

        });

    } catch (erro) {

        console.error(
            "Erro ao excluir atendimento:",
            erro
        );

        res.status(
            erro.status || 500
        ).json({

            erro:
                erro.message ||
                "Erro interno do servidor."

        });
    }
}

module.exports = {
    listarAtendimentos,
    buscarAtendimento,
    cadastrarAtendimento,
    atualizarAtendimento,
    excluirAtendimento
};