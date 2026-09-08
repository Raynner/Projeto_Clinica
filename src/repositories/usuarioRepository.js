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

async function atualizarStatus(id, ativo) {
    const conn = await connection.promise().getConnection();
    try {
        await conn.beginTransaction();
        const [resultado] = await conn.execute('UPDATE usuarios SET ativo = ? WHERE usuario_id = ?', [ativo, id]);
        // Bloquear e reativar não ressuscita cookies antigos: revoga todas as sessões.
        await conn.execute('DELETE FROM auth_sessions WHERE usuario_id = ?', [id]);
        await conn.commit();
        return resultado;
    } catch (erro) { await conn.rollback(); throw erro; }
    finally { conn.release(); }
}
async function buscarCredenciaisPorId(id) {
    // Uso exclusivo de autenticação; este método nunca é retornado por controllers de usuários.
    const [rows] = await connection.promise().execute('SELECT usuario_id, senha FROM usuarios WHERE usuario_id = ?', [id]);
    return rows[0] || null;
}

module.exports = {
    buscarPorEmail,
    buscarCredenciaisPorId,
    buscarPorId,
    cadastrar,
    buscarTodos,
    atualizarStatus
}