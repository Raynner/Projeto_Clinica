function getToken() {
    return sessionStorage.getItem("token");
}

function salvarToken(token) {
    sessionStorage.setItem("token", token);
}

function removerToken() {
    sessionStorage.removeItem("token");
}

function estaAutenticado() {
    return !!getToken();
}

function logout() {
    removerToken();
    window.location.href = "/login.html";
}

async function fetchAutenticado(url, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
    };

    const resposta = await fetch(url, {
        ...options,
        headers
    });

    if (resposta.status === 401) {
        removerToken();
        window.location.href = "/login.html";
        return;
    }

    if (resposta.status === 403) {
        const dados = await resposta
            .clone()
            .json()
            .catch(() => null);

        if (
            dados &&
            (
                dados.erro === "Usuário inativo." ||
                dados.erro?.includes("Usuário inativo")
            )
        ) {
            removerToken();
            window.location.href = "/login.html";
            return;
        }
    }

    return resposta;
}

function protegerPagina() {
    if (!estaAutenticado()) {
        window.location.href = "/login.html";
    }
}

function getUsuarioLogado() {
    const token = getToken();

    if (!token) {
        return null;
    }

    try {
        const payloadBase64 =
            token.split(".")[1];

        const payloadJson =
            atob(
                payloadBase64
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            );

        return JSON.parse(payloadJson);

    } catch (erro) {
        console.error(
            "Erro ao decodificar token:",
            erro
        );

        return null;
    }
}

function usuarioEhAdmin() {
    const usuario = getUsuarioLogado();

    return usuario?.perfil === "ADMIN";
}

function usuarioEhFisioterapeuta() {
    const usuario = getUsuarioLogado();

    return usuario?.perfil === "FISIOTERAPEUTA";
}