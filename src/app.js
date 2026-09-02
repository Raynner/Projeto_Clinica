// Selecionando os métodos do Express e do path e exportando

const express = require("express");
const path = require("path");

const pacienteRoutes = require("./routes/pacienteRoutes");

const convenioRoutes = require("./routes/convenioRoutes");

const atendimentoRoutes = require("./routes/atendimentoRoutes");

const usuarioRoutes = require("./routes/usuarioRoutes");

const authRoutes = require("./routes/authRoutes");

const notFound = require("./middlewares/notFound");

const errorHandler = require("./middlewares/errorHandler");

const app = express();

// MIDDLEWARES


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    express.static(
        path.join(__dirname, "..", "client")
    )
);

// Rotas da API

app.use(
    "/api/pacientes", pacienteRoutes
);

app.use(
    "/api/convenios", convenioRoutes
);

app.use(
    "/api/atendimentos", atendimentoRoutes
);

app.use(
    "/api/usuarios", usuarioRoutes
);

app.use(
    "/api/auth", authRoutes
);

// ROTA NÃO ENCONTRADA

app.use(notFound);

// TRATAMENTO GLOBAL DE ERROS

app.use(errorHandler);

module.exports = app;