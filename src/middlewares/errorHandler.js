function errorHandler(err, req, res, next) {
    // Não registra corpo, senha, cookie ou SQL de erros internos.
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
    if (status === 500) console.error('Falha interna:', err.code || err.name);
    res.status(status).json({ erro: status === 500 ? 'Erro interno do servidor.' : err.message });
}
module.exports = errorHandler;
