const convenioService = require("../services/convenioService");

// GET /api/convenios

async function listarConvenios(req, res) {

    try {

        const convenios =
            await convenioService.listarConvenios();

        res.status(200).json(convenios);

    } catch (erro) {

        console.error(
            "Erro ao listar convênios:",
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

// GET /api/convenios/:id

async function buscarConvenio(req, res) {

    try {

        const { id } = req.params;

        const convenio =
            await convenioService.buscarConvenio(id);

        res.status(200).json(convenio);

    } catch (erro) {

        console.error(
            "Erro ao buscar convênio:",
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

// POST /api/convenios

async function cadastrarConvenio(req, res) {

    try {

        const dados = req.body;

        const resultado =
            await convenioService.cadastrarConvenio(
                dados
            );

        res.status(201).json({

            mensagem:
                "Convênio cadastrado com sucesso.",

            convenio_id:
                resultado.insertId

        });

    } catch (erro) {

        console.error(
            "Erro ao cadastrar convênio:",
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

// PUT /api/convenios/:id

async function atualizarConvenio(req, res) {

    try {

        const { id } = req.params;

        const dados = req.body;

        const resultado =
            await convenioService.atualizarConvenio(
                id,
                dados
            );

        res.status(200).json({

            mensagem:
                "Convênio atualizado com sucesso.",

            convenio_id: Number(id),

            registros_alterados:
                resultado.affectedRows

        });

    } catch (erro) {

        console.error(
            "Erro ao atualizar convênio:",
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

// DELETE /api/convenios/:id

async function excluirConvenio(req, res) {

    try {

        const { id } = req.params;

        const resultado =
            await convenioService.excluirConvenio(id);

        res.status(200).json({

            mensagem:
                "Convênio excluído com sucesso.",

            convenio_id: Number(id),

            registros_excluidos:
                resultado.affectedRows

        });

    } catch (erro) {

        console.error(
            "Erro ao excluir convênio:",
            erro
        );

        /*
         * 1451 é o código do MySQL para
         * tentativa de exclusão de registro
         * que possui Foreign Key relacionada.
         */

        if (erro.errno === 1451) {

            return res.status(409).json({

                erro:
                    "Não é possível excluir o convênio porque existem pacientes vinculados."

            });
        }


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
    listarConvenios,
    buscarConvenio,
    cadastrarConvenio,
    atualizarConvenio,
    excluirConvenio
};