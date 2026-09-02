const connection = require("../config/database");

// LISTAR TODOS OS ATENDIMENTOS PARA AS FIOTERAPEUTAS

function buscarTodos(usuario_id) {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                aten.id_paciente,
                aten.atendimento_id,
                aten.data_atendimento,
                aten.horario_atendimento,
                aten.id_paciente,
                aten.usuario_id,
                paci.nome__completo_paciente,
                pa.nome_completo,
                con.nome_convenio,
                aten.presenca,
                con.valor

            FROM atendimento aten
            JOIN pacientes paci
                ON aten.id_paciente = paci.paciente_id
            JOIN pais pa
                ON paci.id_responsavel = pa.pais_id
            JOIN convenio con
                ON paci.id_convenio = con.convenio_id
            WHERE aten.usuario_id = ?
                ORDER BY
                    aten.data_atendimento,
                    aten.horario_atendimento 
        `;

        connection.query(
            sql,
            [usuario_id],
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

// LISTAR TODOS OS ATENDIMENTOS PARA O ADMIN

function buscarTodosAdmin() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                aten.atendimento_id,
                aten.data_atendimento,
                aten.horario_atendimento,
                aten.id_paciente,
                aten.usuario_id,
                paci.nome__completo_paciente,
                pa.nome_completo,
                con.nome_convenio,
                aten.presenca,
                con.valor,
		        usu.nome AS nome_fisioterapeuta

            FROM atendimento aten
            JOIN pacientes paci
                ON aten.id_paciente = paci.paciente_id
            JOIN pais pa
                ON paci.id_responsavel = pa.pais_id
            JOIN convenio con
                ON paci.id_convenio = con.convenio_id
	    JOIN usuarios usu
		ON aten.usuario_id = usu.usuario_id
          
                ORDER BY
                    aten.data_atendimento,
                    aten.horario_atendimento 
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

// BUSCAR ATENDIMENTO POR ID

function buscarPorId(id, usuario_id) {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                a.atendimento_id,
                a.data_atendimento,
                a.horario_atendimento,
                a.id_paciente,
                p.nome__completo_paciente AS paciente,
                c.nome_convenio AS convenio,
                a.presenca

            FROM atendimento a

            INNER JOIN pacientes p
                ON a.id_paciente = p.paciente_id

            INNER JOIN convenio c
                ON p.id_convenio = c.convenio_id

            WHERE 
                a.atendimento_id = ?
                AND a.usuario_id = ?

            ORDER BY
                a.data_atendimento,
                a.horario_atendimento 
        `;

        connection.query(
            sql,
            [id, usuario_id],
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

function buscarPorIdAdmin(id) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                a.atendimento_id,
                a.data_atendimento,
                a.horario_atendimento,
                a.presenca,
                a.id_paciente,
                a.usuario_id,
                p.nome__completo_paciente,
                u.nome AS nome_fisioterapeuta
            FROM atendimento a
            INNER JOIN pacientes p
                ON a.id_paciente = p.paciente_id
            INNER JOIN usuarios u
                ON a.usuario_id = u.usuario_id
            WHERE a.atendimento_id = ?
        `;

        connection.query(sql, [id], (err, resultados) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(resultados[0] || null);
        });
    });
}

// CADASTRAR ATENDIMENTO

function cadastrar(dados) {

     return new Promise((resolve, reject) => {

        const {
            data_atendimento,
            horario_atendimento,
            id_paciente,
            presenca,
            usuario_id
        } = dados;

        const sql = `
            INSERT INTO atendimento
            (
                data_atendimento,
                horario_atendimento,
                id_paciente,
                presenca,
                usuario_id
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        connection.query(
            sql,
            [
                data_atendimento,
                horario_atendimento,
                id_paciente,
                presenca,
                usuario_id
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

// ATUALIZAR ATENDIMENTO

function atualizar(id, dados, usuario_id) {

    return new Promise((resolve, reject) => {

        const {
            dataAtendimento,
            horario,
            idPaciente,
            presenca
        } = dados;

        const sql = `
            UPDATE atendimento
            SET
                data_atendimento = ?,
                horario_atendimento = ?,
                id_paciente = ?,
                presenca = ?

            WHERE atendimento_id = ?
            AND usuario_id = ?
        `;

        connection.query(
            sql,
            [
                dataAtendimento,
                horario,
                idPaciente,
                presenca,
                id,
                usuario_id
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

// EXCLUIR ATENDIMENTO

function excluir(id, usuario_id) {

    return new Promise((resolve, reject) => {

        const sql = `
            DELETE FROM atendimento
            WHERE atendimento_id = ?
            AND usuario_id = ?
        `;

        connection.query(
            sql,
            [id, usuario_id],
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
    buscarTodosAdmin,
    buscarPorId,
    cadastrar,
    atualizar,
    excluir,
    buscarPorIdAdmin
};