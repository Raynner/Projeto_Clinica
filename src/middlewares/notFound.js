function notFound(req, res) {

    res.status(404).json({
        erro: "Rota não encontrada."
    });
}

module.exports = notFound;