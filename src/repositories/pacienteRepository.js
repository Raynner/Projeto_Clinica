// RESPOSÁVEL PELO ACESSO AO BANCO DE DADOS

const { Connection } = require("mysql2");
const connection = require("../config/database");

function buscarTodos() {
    
    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                p.paciente_id,
                p.nome__completo_paciente,
                p.data_nascimento,

                r.nome_completo AS nome_responsavel,

                c.nome_convenio

            FROM pacientes p

            INNER JOIN pais r
            ON p.id_responsavel = r.pais_id

            INNER JOIN convenio c
                ON p.id_convenio = c.convenio_id

            ORDER BY p.nome__completo_paciente
    `;
        
        connection.query(sql, (err, resultados) => {

            if (err) {
                reject(err);
                return;
            }

            resolve(resultados);
        });
    });
}

function buscarPorId(id) {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                p.paciente_id,
                p.nome__completo_paciente,
                p.data_nascimento,
                p.id_convenio,
                r.nome_completo AS nome_responsavel
            FROM pacientes p
            INNER JOIN pais r ON p.id_responsavel = r.pais_id
            WHERE p.paciente_id = ?
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

async function cadastrar(dados) {
    // A transação reserva uma conexão do pool, isolada do login e de outros cadastros.
    const conn = await connection.promise().getConnection();
    try {
        await conn.beginTransaction();
        const [responsavel] = await conn.execute(
            'INSERT INTO pais (nome_completo, telefone, endereco) VALUES (?, ?, ?)',
            [dados.nomeResponsavel, dados.telefone ?? null, dados.endereco ?? null]
        );
        const [paciente] = await conn.execute(
            'INSERT INTO pacientes (nome__completo_paciente, data_nascimento, id_responsavel, id_convenio) VALUES (?, ?, ?, ?)',
            [dados.nomePaciente, dados.dataNascimento, responsavel.insertId, dados.idConvenio]
        );
        await conn.commit();
        return { paciente_id: paciente.insertId, responsavel_id: responsavel.insertId };
    } catch (erro) {
        await conn.rollback();
        throw erro;
    } finally { conn.release(); }
}

function atualizar(id, dados) {

    return new Promise((resolve, reject) => {

        const {
            nomeResponsavel,
            nomePaciente,
            dataNascimento,
            idConvenio
        } = dados;

        const sql = `
            UPDATE pacientes p
            INNER JOIN pais r ON p.id_responsavel = r.pais_id
            SET
                p.nome__completo_paciente = ?,
                p.data_nascimento = ?,
                p.id_convenio = ?,
                r.nome_completo = ?
            WHERE p.paciente_id = ?
        `;

        connection.query(
            sql,
            [
                nomePaciente,
                dataNascimento,
                idConvenio,
                nomeResponsavel,
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

function contarAtendimentosPorPaciente(id) {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT COUNT(*) AS total
            FROM atendimento
            WHERE id_paciente = ?
        `;

        connection.query(
            sql, [id], (err, resultado) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(Number(resultado[0].total));
            }
        );
    });
}

function excluir(id) {

    return new Promise((resolve, reject) => {

        const sql = `
            DELETE FROM pacientes
            WHERE paciente_id = ?
        `;

        connection.query(sql, [id], (err, resultado) => {

            if (err) {
                reject(err);
                return;
            }

            resolve(resultado);
        });
    });
}

module.exports = {
    buscarTodos,
    buscarPorId,
    cadastrar,
    atualizar,
    contarAtendimentosPorPaciente,
    excluir
};
