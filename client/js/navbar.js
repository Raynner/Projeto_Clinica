// ==========================================
// NAVBAR DO SISTEMA
// ==========================================

function carregarNavbar() {

    const navbarContainer =
        document.getElementById("navbar");

    if (!navbarContainer) {
        console.error(
            'Elemento com id="navbar" não encontrado.'
        );

        return;
    }


    // ==========================================
    // USUÁRIO LOGADO
    // ==========================================

    const usuario =
        getUsuarioLogado();


    if (!usuario) {

        window.location.href =
            "/login.html";

        return;
    }


    // ==========================================
    // IDENTIFICAR PÁGINA ATUAL
    // ==========================================

    const paginaAtual =
        window.location.pathname;


    function classeAtiva(caminhos) {

        if (
            caminhos.includes(
                paginaAtual
            )
        ) {
            return "ativo";
        }

        return "";
    }


    // ==========================================
    // MENU ADMIN
    // ==========================================

    let menuAdmin = "";


    if (usuario.perfil === "ADMIN") {

        menuAdmin = `
            <a
                href="/usuarios.html"
                class="
                    ${classeAtiva([
                        "/usuarios.html"
                    ])}
                "
            >
                Usuários
            </a>
        `;
    }


    // ==========================================
    // CRIAR NAVBAR
    // ==========================================

    navbarContainer.innerHTML = `

        <header class="navbar">

            <div class="navbar-conteudo">

                <!-- LOGO -->

                <a
                    href="/"
                    class="navbar-logo"
                >
                    Projeto.dev
                </a>


                <!-- MENU -->

                <nav class="navbar-menu">

                    <a
                        href="/"
                        class="
                            ${classeAtiva([
                                "/",
                                "/index.html"
                            ])}
                        "
                    >
                        Início
                    </a>


                    <a
                        href="/pacientes.html"
                        class="
                            ${classeAtiva([
                                "/pacientes.html"
                            ])}
                        "
                    >
                        Pacientes
                    </a>


                    <a
                        href="/paciente.html"
                        class="
                            ${classeAtiva([
                                "/paciente.html"
                            ])}
                        "
                    >
                        Cadastrar Paciente
                    </a>


                    <a
                        href="/convenio.html"
                        class="
                            ${classeAtiva([
                                "/convenio",
                                "/convenio.html"
                            ])}
                        "
                    >
                        Convênios
                    </a>


                    <a
                        href="/atendimentos.html"
                        class="
                            ${classeAtiva([
                                "/atendimentos.html"
                            ])}
                        "
                    >
                        Atendimentos
                    </a>


                    ${menuAdmin}

                </nav>


                <!-- USUÁRIO -->

                <div class="navbar-usuario">

                    <div class="navbar-usuario-info">

                        <span class="navbar-nome">
                            ${escapeHtmlNavbar(usuario.nome)}
                        </span>

                        <span class="navbar-perfil">
                            ${escapeHtmlNavbar(usuario.perfil)}
                        </span>

                    </div>


                    <button
                        type="button"
                        id="navbarBtnLogout"
                        class="navbar-logout"
                    >
                        Sair
                    </button>

                </div>

            </div>

        </header>

    `;


    // ==========================================
    // BOTÃO LOGOUT
    // ==========================================

    const btnLogout =
        document.getElementById(
            "navbarBtnLogout"
        );


    if (btnLogout) {

        btnLogout.addEventListener(
            "click",
            logout
        );
    }
}


// ==========================================
// ESCAPAR TEXTO INSERIDO NO HTML
// ==========================================

function escapeHtmlNavbar(valor) {

    const elemento =
        document.createElement("div");

    elemento.textContent =
        valor ?? "";

    return elemento.innerHTML;
}


// ==========================================
// INICIALIZAR NAVBAR
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    carregarNavbar
);