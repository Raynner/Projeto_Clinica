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
                paciente_id,
                nome__completo_paciente,
                data_nascimento
            FROM pacientes
            WHERE paciente_id = ?
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

function cadastrar(dados){

    return new Promise((resolve, reject) => {

        const {
            nomeResponsavel,
            telefone,
            endereco,
            nomePaciente,
            dataNascimento,
            idConvenio
        } = dados;

        connection.beginTransaction((err) => {

            if (err) {
                reject(err);
                return;
            }

            // 1. CADASTRO RESPONSÁVEL

            const sqlResponsavel = `
                INSERT INTO pais
                (
                    nome_completo,
                    telefone,
                    endereco
                )
                VALUES (?, ?, ?)
            `;

            connection.query(
                sqlResponsavel,
                [
                    nomeResponsavel,
                    telefone,
                    endereco
                ],
                (err, resultadoResponsavel) => {

                    if (err) {

                        return connection.rollback(() => {
                            reject(err);
                        });
                    }

                    const responsavelId = resultadoResponsavel.insertId;

                    // 2. CADASTRO PACIENTE

                    const sqlPaciente = `
                        INSERT INTO pacientes
                        (
                            nome__completo_paciente,
                            data_nascimento,
                            id_responsavel,
                            id_convenio  
                        )
                        VALUES (?, ?, ?, ?)
                    `;

                    connection.query(
                        sqlPaciente,
                        [
                            nomePaciente,
                            dataNascimento,
                            responsavelId,
                            idConvenio
                        ],
                        (err, resultadoPaciente) => {

                            if (err) {

                                return connection.rollback(() => {
                                    reject(err);
                                });
                            }

                            const pacienteId = resultadoPaciente.insertId;

                            // 3. CONFIRMAR TRANSAÇÃO

                            connection.commit((err) => {

                                if (err) {

                                    return connection.rollback(() => {
                                        reject(err);
                                    });
                                }

                                resolve({
                                    paciente_id: pacienteId,
                                    responsavel_id: responsavelId
                                });
                            });
                        }
                    );
                }
            );
        });
    });
}

function atualizar(id, dados) {

    return new Promise((resolve, reject) => {

        const {
            nomePaciente,
            dataNascimento,
            idConvenio
        } = dados;

        const sql = `
            UPDATE pacientes
            SET
                nome__completo_paciente = ?,
                data_nascimento = ?,
                id_convenio = ?
            WHERE paciente_id = ?
        `;

        connection.query(
            sql,
            [
                nomePaciente,
                dataNascimento,
                idConvenio,
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