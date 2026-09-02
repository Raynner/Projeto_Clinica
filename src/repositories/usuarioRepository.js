const connection = require("../config/database");

// BUSCAR TODOS

function buscarTodos() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                usuario_id,
                nome,
                email,
                ativo,
                perfil,
                criado_em
            FROM usuarios
            ORDER BY nome ASC
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

// BUSCAR USUÁRIO POR EMAIL

function buscarPorEmail(email) {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                usuario_id,
                nome,
                email,
                senha,
                ativo,
                perfil,
                criado_em
            FROM usuarios
            WHERE email = ?
        `;

        connection.query(sql, [email], (err, resultados) => {

            if (err) {
                reject(err);
                return;
            }

            resolve (resultados[0] || null);
        });
    });
}

// BUSCAR USUÁRIO POR ID

function buscarPorId(id) {

    return new Promise ((resolve, reject) => {

        const sql = `
            SELECT
                usuario_id,
                nome,
                email,
                ativo,
                perfil,
                criado_em
            FROM usuarios
            WHERE usuario_id = ?
        `;

        connection.query( sql, [id], (err, resultados) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(resultados[0] || null);
        });
    });
}

// CADASTRAR USUÁRIO

function cadastrar (usuario) {

    return new Promise((resolve, reject) => {

        const sql = `
            INSERT INTO usuarios (
                nome,
                email,
                senha,
                ativo
            )
            VALUES (?, ?, ?, ?)
        `;

        connection.query(
            sql,
            [
                usuario.nome,
                usuario.email,
                usuario.senha,
                usuario.ativo
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

// ATUALIZAR STATUS

function atualizarStatus(id, ativo) {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE usuarios
            SET ativo = ?
            WHERE usuario_id = ?
        `;

        connection.query(sql, [ativo, id], (err, resultado) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(resultado);
        });
    });
}

module.exports = {
    buscarPorEmail,
    buscarPorId,
    cadastrar,
    buscarTodos,
    atualizarStatus
}