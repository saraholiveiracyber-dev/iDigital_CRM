// =========================================================
// iDigital CRM
// AUTENTICAÇÃO
// =========================================================

(function () {

    "use strict";

    // =====================================================
    // CONFIGURAÇÃO
    // =====================================================

    const PAGINAS_PUBLICAS = [
        "",
        "index.html",
        "login.html",
        "recuperar-senha.html"
    ];

    // =====================================================
    // UTILITÁRIOS
    // =====================================================

    function obterPaginaAtual() {

        return (
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase() || "index.html"
        );

    }


    function estaEmPaginaPublica() {

        return PAGINAS_PUBLICAS.includes(
            obterPaginaAtual()
        );

    }


    function mostrarAviso(
        mensagem,
        tipo = "error"
    ) {

        const notice =
            document.getElementById("loginNotice");

        if (!notice) return;

        notice.className =
            `notice ${tipo} show`;

        notice.textContent =
            mensagem;

    }


    function obterEmail() {

        const campo =
            document.getElementById("email");

        return campo
            ? campo.value.trim()
            : "";

    }


    // =====================================================
    // INICIALIZAÇÃO
    // =====================================================

    document.addEventListener(
        "DOMContentLoaded",
        inicializarAutenticacao
    );


    async function inicializarAutenticacao() {

        const client =
            window.supabaseClient;

        // =================================================
        // SUPABASE NÃO CARREGADO
        // =================================================

        if (!client) {

            console.error(
                "SupabaseClient não encontrado."
            );

            return;

        }


        const paginaAtual =
            obterPaginaAtual();

        const paginaPublica =
            estaEmPaginaPublica();


        try {

            // =============================================
            // VERIFICAR SESSÃO
            // =============================================

            const {
                data,
                error
            } =
                await client.auth.getSession();


            if (error) {

                console.error(
                    "Erro ao verificar sessão:",
                    error
                );

                return;

            }


            const session =
                data?.session || null;


            // =============================================
            // USUÁRIO LOGADO EM LOGIN/INDEX
            // =============================================

            if (
                paginaPublica &&
                session &&
                (
                    paginaAtual === "login.html" ||
                    paginaAtual === "index.html" ||
                    paginaAtual === ""
                )
            ) {

                window.location.replace(
                    "dashboard.html"
                );

                return;

            }


            // =============================================
            // USUÁRIO NÃO LOGADO
            // =============================================

            if (
                !paginaPublica &&
                !session
            ) {

                window.location.replace(
                    "login.html"
                );

                return;

            }


            // =============================================
            // CONFIGURAR LOGIN
            // =============================================

            configurarLogin(client);


            // =============================================
            // RECUPERAÇÃO DE SENHA
            // =============================================

            configurarRecuperacaoSenha(client);


            // =============================================
            // ALTERAÇÃO DE SENHA
            // =============================================

            configurarAlteracaoSenha(client);


        } catch (error) {

            console.error(
                "Erro ao inicializar autenticação:",
                error
            );

        }

    }


    // =====================================================
    // LOGIN
    // =====================================================

    function configurarLogin(client) {

        const form =
            document.getElementById(
                "loginForm"
            );


        if (!form) return;


        // Evita cadastrar o evento duas vezes
        if (
            form.dataset.authConfigured === "true"
        ) {

            return;

        }


        form.dataset.authConfigured = "true";


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const email =
                    obterEmail();


                const senhaCampo =
                    document.getElementById(
                        "senha"
                    );


                const password =
                    senhaCampo
                        ? senhaCampo.value
                        : "";


                // =========================================
                // VALIDAÇÃO
                // =========================================

                if (!email || !password) {

                    mostrarAviso(
                        "Informe e-mail e senha.",
                        "error"
                    );

                    return;

                }


                const button =
                    form.querySelector(
                        "button[type='submit']"
                    );


                if (button) {

                    button.disabled = true;

                    button.textContent =
                        "Entrando...";

                }


                mostrarAviso(
                    "",
                    ""
                );


                try {

                    const {
                        data,
                        error
                    } =
                        await client.auth
                            .signInWithPassword({

                                email: email,

                                password: password

                            });


                    if (error) {

                        throw error;

                    }


                    if (!data?.session) {

                        throw new Error(
                            "Login realizado, mas nenhuma sessão foi criada."
                        );

                    }


                    mostrarAviso(
                        "Login realizado com sucesso!",
                        "success"
                    );


                    setTimeout(
                        function () {

                            window.location.replace(
                                "dashboard.html"
                            );

                        },
                        400
                    );


                } catch (error) {

                    console.error(
                        "Erro no login:",
                        error
                    );


                    mostrarAviso(
                        traduzirErroLogin(
                            error?.message
                        ),
                        "error"
                    );


                    if (button) {

                        button.disabled =
                            false;

                        button.textContent =
                            "Entrar no CRM";

                    }

                }

            }
        );

    }


    // =====================================================
    // RECUPERAR SENHA
    // =====================================================

    function configurarRecuperacaoSenha(
        client
    ) {

        const forgotBtn =
            document.getElementById(
                "forgotBtn"
            );


        if (!forgotBtn) return;


        if (
            forgotBtn.dataset.authConfigured ===
            "true"
        ) {

            return;

        }


        forgotBtn.dataset.authConfigured =
            "true";


        forgotBtn.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                const email =
                    obterEmail();


                if (!email) {

                    mostrarAviso(
                        "Informe seu e-mail primeiro.",
                        "error"
                    );

                    return;

                }


                const textoOriginal =
                    forgotBtn.textContent;


                forgotBtn.disabled = true;

                forgotBtn.textContent =
                    "Enviando...";


                try {

                    /*
                     * Usa a página atual como base.
                     * Isso funciona tanto no localhost
                     * quanto no domínio publicado.
                     */

                    const redirectTo =
                        new URL(
                            "login.html",
                            window.location.href
                        ).href;


                    const {
                        error
                    } =
                        await client.auth
                            .resetPasswordForEmail(
                                email,
                                {
                                    redirectTo
                                }
                            );


                    if (error) {

                        throw error;

                    }


                    mostrarAviso(
                        "Link de recuperação enviado para seu e-mail.",
                        "success"
                    );


                } catch (error) {

                    console.error(
                        "Erro na recuperação:",
                        error
                    );


                    mostrarAviso(
                        traduzirErroLogin(
                            error?.message
                        ),
                        "error"
                    );


                } finally {

                    forgotBtn.disabled =
                        false;

                    forgotBtn.textContent =
                        textoOriginal;

                }

            }
        );

    }


    // =====================================================
    // ALTERAÇÃO DE SENHA
    // =====================================================

    function configurarAlteracaoSenha(
        client
    ) {

        const form =
            document.getElementById(
                "resetPasswordForm"
            );


        if (!form) return;


        if (
            form.dataset.authConfigured ===
            "true"
        ) {

            return;

        }


        form.dataset.authConfigured =
            "true";


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const senha =
                    document.getElementById(
                        "novaSenha"
                    )?.value || "";


                const confirmar =
                    document.getElementById(
                        "confirmarSenha"
                    )?.value || "";


                if (!senha) {

                    mostrarAviso(
                        "Informe a nova senha.",
                        "error"
                    );

                    return;

                }


                if (senha.length < 6) {

                    mostrarAviso(
                        "A senha deve ter pelo menos 6 caracteres.",
                        "error"
                    );

                    return;

                }


                if (senha !== confirmar) {

                    mostrarAviso(
                        "As senhas não coincidem.",
                        "error"
                    );

                    return;

                }


                const button =
                    form.querySelector(
                        "button[type='submit']"
                    );


                if (button) {

                    button.disabled = true;

                    button.textContent =
                        "Salvando...";

                }


                try {

                    const {
                        error
                    } =
                        await client.auth.updateUser({
                            password: senha
                        });


                    if (error) {

                        throw error;

                    }


                    mostrarAviso(
                        "Senha alterada com sucesso!",
                        "success"
                    );


                    setTimeout(
                        function () {

                            window.location.replace(
                                "dashboard.html"
                            );

                        },
                        700
                    );


                } catch (error) {

                    console.error(
                        "Erro ao alterar senha:",
                        error
                    );


                    mostrarAviso(
                        traduzirErroLogin(
                            error?.message
                        ),
                        "error"
                    );


                    if (button) {

                        button.disabled =
                            false;

                        button.textContent =
                            "Alterar senha";

                    }

                }

            }
        );

    }


    // =====================================================
    // TRADUÇÃO DE ERROS
    // =====================================================

    function traduzirErroLogin(
        mensagem
    ) {

        if (!mensagem) {

            return (
                "Não foi possível realizar a operação."
            );

        }


        const texto =
            String(mensagem)
                .toLowerCase();


        if (
            texto.includes(
                "invalid login credentials"
            )
        ) {

            return (
                "E-mail ou senha incorretos."
            );

        }


        if (
            texto.includes(
                "email not confirmed"
            )
        ) {

            return (
                "Seu e-mail ainda não foi confirmado."
            );

        }


        if (
            texto.includes(
                "too many requests"
            )
        ) {

            return (
                "Muitas tentativas. Aguarde alguns minutos."
            );

        }


        if (
            texto.includes(
                "user not found"
            )
        ) {

            return (
                "Usuário não encontrado."
            );

        }


        if (
            texto.includes(
                "password should be at least"
            )
        ) {

            return (
                "A senha precisa ter pelo menos 6 caracteres."
            );

        }


        if (
            texto.includes(
                "network"
            )
        ) {

            return (
                "Erro de conexão. Verifique sua internet."
            );

        }


        return mensagem;

    }


    // =====================================================
    // API GLOBAL
    // =====================================================

    window.crmAuth = {

        paginaAtual:
            obterPaginaAtual,

        paginaPublica:
            estaEmPaginaPublica,

        traduzirErro:
            traduzirErroLogin

    };

})();