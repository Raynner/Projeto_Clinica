const connection = require("../config/database");

// LISTAR TODOS OS CONVÊNIOS

function buscarTodos() {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                convenio_id,
                nome_convenio,
                valor
            FROM convenio
            ORDER BY nome_convenio
        `;

        connection.query(
            sql,
            (err, resultados) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(resultados);
            }
        );

    });
}

// BUSCAR CONVÊNIO POR ID

function buscarPorId(id) {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                convenio_id,
                nome_convenio,
                valor
            FROM convenio
            WHERE convenio_id = ?
        `;

        connection.query(
            sql,
            [id],
            (err, resultados) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(resultados[0]);
            }
        );

    });
}

// CADASTRAR CONVÊNIO

function cadastrar(dados) {

    return new Promise((resolve, reject) => {

        const {
            nomeConvenio,
            valor
        } = dados;

        const sql = `
            INSERT INTO convenio
            (
                nome_convenio,
                valor
            )
            VALUES (?, ?)
        `;

        connection.query(
            sql,
            [
                nomeConvenio,
                valor
            ],
            (err, resultado) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(resultado);
            }
        );

    });
}

// ATUALIZAR CONVÊNIO

function atualizar(id, dados) {

    return new Promise((resolve, reject) => {

        const {
            nomeConvenio,
            valor
        } = dados;

        const sql = `
            UPDATE convenio
            SET
                nome_convenio = ?,
                valor = ?
            WHERE convenio_id = ?
        `;

        connection.query(
            sql,
            [
                nomeConvenio,
                valor,
                id
            ],
            (err, resultado) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(resultado);
            }
        );

    });
}

// EXCLUIR CONVÊNIO

function excluir(id) {

    return new Promise((resolve, reject) => {

        const sql = `
            DELETE FROM convenio
            WHERE convenio_id = ?
        `;

        connection.query(
            sql,
            [id],
            (err, resultado) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(resultado);
            }
        );

    });
}

module.exports = {
    buscarTodos,
    buscarPorId,
    cadastrar,
    atualizar,
    excluir
};