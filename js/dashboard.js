/* =========================================================
   iDigital CRM Premium 2.0
   DASHBOARD.JS
   DASHBOARD EXECUTIVO
   ========================================================= */

"use strict";

(function () {

    /* =====================================================
       ESTADO
    ====================================================== */

    const estado = {
        userId: null,
        clientes: [],
        leads: [],
        financeiro: [],
        cobrancas: [],
        orcamentos: [],
        ebookPedidos: []
    };


    /* =====================================================
       DOM
    ====================================================== */

    const $ = (selector) => {
        return document.querySelector(selector);
    };


    /* =====================================================
       NÚMEROS
    ====================================================== */

    function converterNumero(valor) {

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return 0;
        }

        if (typeof valor === "number") {
            return Number.isFinite(valor)
                ? valor
                : 0;
        }

        let texto = String(valor)
            .trim()
            .replace(/\s/g, "")
            .replace(/^R\$/i, "");

        /*
         * Exemplo:
         * 1.500,50
         */
        if (
            texto.includes(".") &&
            texto.includes(",")
        ) {
            texto = texto
                .replace(/\./g, "")
                .replace(",", ".");
        }

        /*
         * Exemplo:
         * 1500,50
         */
        else if (texto.includes(",")) {
            texto = texto.replace(",", ".");
        }

        const numero = Number(texto);

        return Number.isFinite(numero)
            ? numero
            : 0;
    }


    function money(valor) {

        return converterNumero(valor)
            .toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );
    }


    function moneyCompact(valor) {

        const numero = converterNumero(valor);

        if (numero >= 1000000) {

            return (
                "R$ " +
                (
                    numero / 1000000
                )
                    .toFixed(1)
                    .replace(".", ",") +
                " mi"
            );
        }

        if (numero >= 1000) {

            return (
                "R$ " +
                (
                    numero / 1000
                )
                    .toFixed(1)
                    .replace(".", ",") +
                " mil"
            );
        }

        return money(numero);
    }


    function getValor(item) {

        if (!item) {
            return 0;
        }

        const campos = [
            "valor",
            "valor_total",
            "valor_mensal",
            "preco",
            "amount",
            "total",
            "price"
        ];

        for (const campo of campos) {

            if (
                item[campo] !== undefined &&
                item[campo] !== null
            ) {
                return converterNumero(
                    item[campo]
                );
            }
        }

        return 0;
    }


    /* =====================================================
       STATUS
    ====================================================== */

    function normalizarStatus(status) {

        return String(status || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /\s+/g,
                "_"
            );
    }


    function statusPago(status) {

        return [
            "pago",
            "paga",
            "recebido",
            "recebida",
            "quitado",
            "quitada",
            "aprovado",
            "aprovada",
            "confirmado",
            "confirmada",
            "liquidado",
            "liquidada",
            "concluido",
            "concluida",
            "paid"
        ].includes(
            normalizarStatus(status)
        );
    }


    function normalizarTipo(tipo) {

        return String(tipo || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );
    }


    function ehEntrada(item) {

        return [
            "entrada",
            "receita",
            "credito"
        ].includes(
            normalizarTipo(item?.tipo)
        );
    }


    function ehSaida(item) {

        return [
            "saida",
            "despesa",
            "debito"
        ].includes(
            normalizarTipo(item?.tipo)
        );
    }


    /* =====================================================
       UUID
    ====================================================== */

    function uuidValido(valor) {

        if (typeof valor !== "string") {
            return false;
        }

        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            .test(valor);
    }


    /* =====================================================
       DATA
    ====================================================== */

    function converterData(valor) {

        if (!valor) {
            return null;
        }

        /*
         * Evita problemas de timezone em YYYY-MM-DD
         */
        if (
            typeof valor === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(valor)
        ) {

            const partes =
                valor.split("-").map(Number);

            return new Date(
                partes[0],
                partes[1] - 1,
                partes[2]
            );
        }

        const data =
            new Date(valor);

        if (
            Number.isNaN(
                data.getTime()
            )
        ) {
            return null;
        }

        return data;
    }


    function dataItem(item) {

        if (!item) {
            return null;
        }

        const campos = [
            "data_pagamento",
            "data_recebimento",
            "paid_at",
            "vencimento",
            "data",
            "created_at"
        ];

        for (const campo of campos) {

            if (!item[campo]) {
                continue;
            }

            const data =
                converterData(
                    item[campo]
                );

            if (data) {
                return data;
            }
        }

        return null;
    }


    function formatarData(valor) {

        const data =
            converterData(valor);

        if (!data) {
            return "-";
        }

        return data.toLocaleDateString(
            "pt-BR"
        );
    }


    /* =====================================================
       HTML
    ====================================================== */

    function escaparHTML(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       CABEÇALHO
    ====================================================== */

    function configurarCabecalho() {

        const agora =
            new Date();

        const hora =
            agora.getHours();

        let saudacao =
            "Olá";

        if (hora < 12) {

            saudacao =
                "Bom dia";

        } else if (hora < 18) {

            saudacao =
                "Boa tarde";

        } else {

            saudacao =
                "Boa noite";
        }


        const greeting =
            $("#dashboardGreetingText");

        if (greeting) {

            greeting.textContent =
                `${saudacao}! Aqui está o resumo da sua operação.`;
        }


        const today =
            $("#todayText");

        if (today) {

            today.textContent =
                agora.toLocaleDateString(
                    "pt-BR",
                    {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    }
                );
        }
    }


    /* =====================================================
       USUÁRIO
       
       IMPORTANTE:
       NÃO usamos window.crm.uid().
       O ID oficial vem do Supabase Auth.
    ====================================================== */

    async function carregarUsuario(supabase) {

        try {

            const resultado =
                await supabase.auth.getUser();

            if (resultado.error) {

                console.error(
                    "Erro ao obter usuário:",
                    resultado.error
                );

                estado.userId = null;

                return null;
            }

            const usuario =
                resultado?.data?.user || null;

            if (!usuario) {

                console.warn(
                    "Nenhum usuário autenticado."
                );

                estado.userId = null;

                return null;
            }


            /*
             * ID REAL DO SUPABASE AUTH
             */
            estado.userId =
                usuario.id || null;


            /*
             * Validação extra
             */
            if (!uuidValido(estado.userId)) {

                console.error(
                    "UUID do usuário inválido:",
                    estado.userId
                );

                estado.userId = null;

                return null;
            }


            console.log(
                "Usuário autenticado:",
                {
                    id: estado.userId,
                    email: usuario.email
                }
            );


            /*
             * NOME
             */
            const nome =
    usuario.user_metadata?.nome ||
    usuario.user_metadata?.name ||
    "Sarah Oliveira";


            const dashboardNome =
                $("#dashboardUserName");

            if (dashboardNome) {

                dashboardNome.textContent =
                    nome;
            }


            const userName =
                $("#userName");

            if (userName) {

                userName.textContent =
                    nome;
            }


            const userEmail =
                $("#userEmail");

            if (userEmail) {

                userEmail.textContent =
                    usuario.email || "";
            }


            /*
             * AVATAR
             */
            const avatar =
                $("#userAvatar");

            const avatarUrl =
                usuario.user_metadata?.avatar_url ||
                usuario.user_metadata?.picture ||
                null;

            if (
                avatar &&
                avatarUrl
            ) {

                avatar.style.backgroundImage =
                    `url("${avatarUrl}")`;

                avatar.style.backgroundSize =
                    "cover";

                avatar.style.backgroundPosition =
                    "center";

                avatar.textContent =
                    "";
            }


            return usuario;

        } catch (erro) {

            console.error(
                "Erro inesperado ao carregar usuário:",
                erro
            );

            estado.userId = null;

            return null;
        }
    }


    /* =====================================================
       CARREGAR DADOS
    ====================================================== */

    async function carregarDados(supabase) {

        estado.clientes = [];
        estado.leads = [];
        estado.financeiro = [];
        estado.cobrancas = [];
        estado.orcamentos = [];
        estado.ebookPedidos = [];


        const consultas = [];


        /* =================================================
           CLIENTES
        ================================================== */

        if (uuidValido(estado.userId)) {

            consultas.push({

                nome: "clientes",

                promise:
                    supabase
                        .from("clientes")
                        .select("*")
                        .eq(
                            "user_id",
                            estado.userId
                        )
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        )
                        .limit(1000)
            });


            /* =============================================
               LEADS
               
               NÃO usa user_id.
            ============================================== */

            consultas.push({

                nome: "leads",

                promise:
                    supabase
                        .from("leads")
                        .select("*")
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        )
                        .limit(1000)
            });


            /* =============================================
               FINANCEIRO
            ============================================== */

            consultas.push({

                nome: "financeiro",

                promise:
                    supabase
                        .from("financeiro")
                        .select("*")
                        .eq(
                            "user_id",
                            estado.userId
                        )
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        )
                        .limit(1000)
            });


            /* =============================================
               COBRANÇAS
            ============================================== */

            consultas.push({

                nome: "cobrancas",

                promise:
                    supabase
                        .from("cobrancas")
                        .select("*")
                        .eq(
                            "user_id",
                            estado.userId
                        )
                        .order(
                            "created_at",
                            {
                                ascending: false
                            }
                        )
                        .limit(1000)
            });
        }


        /* =================================================
           ORÇAMENTOS
        ================================================== */

        consultas.push({

            nome: "orcamentos",

            promise:
                supabase
                    .from("orcamentos")
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(1000)
        });


        /* =================================================
           KIWIFY
        ================================================== */

        consultas.push({

            nome: "ebookPedidos",

            promise:
                supabase
                    .from("ebook_pedidos")
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(1000)
        });


        const resultados =
            await Promise.allSettled(
                consultas.map(
                    item => item.promise
                )
            );


        resultados.forEach(
            (resultado, index) => {

                const nome =
                    consultas[index].nome;


                if (
                    resultado.status !==
                    "fulfilled"
                ) {

                    console.error(
                        `Erro ${nome}:`,
                        resultado.reason
                    );

                    return;
                }


                const resposta =
                    resultado.value;


                if (resposta.error) {

                    console.error(
                        `Supabase ${nome}:`,
                        resposta.error
                    );

                    return;
                }


                switch (nome) {

                    case "clientes":

                        estado.clientes =
                            resposta.data || [];

                        break;


                    case "leads":

                        estado.leads =
                            resposta.data || [];

                        break;


                    case "financeiro":

                        estado.financeiro =
                            resposta.data || [];

                        break;


                    case "cobrancas":

                        estado.cobrancas =
                            resposta.data || [];

                        break;


                    case "orcamentos":

                        estado.orcamentos =
                            resposta.data || [];

                        break;


                    case "ebookPedidos":

                        estado.ebookPedidos =
                            resposta.data || [];

                        break;
                }
            }
        );
    }


    /* =====================================================
       ORÇAMENTOS
    ====================================================== */

    function renderOrcamentos(orcamentos) {

        let novos = 0;
        let analise = 0;
        let aprovados = 0;


        orcamentos.forEach(
            (orcamento) => {

                const status =
                    normalizarStatus(
                        orcamento.status
                    );


                if (
                    [
                        "aprovado",
                        "aprovada",
                        "aceito",
                        "aceita",
                        "fechado",
                        "convertido"
                    ].includes(status)
                ) {

                    aprovados++;

                    return;
                }


                if (
                    [
                        "em_analise",
                        "analise",
                        "analisando"
                    ].includes(status)
                ) {

                    analise++;

                    return;
                }


                novos++;
            }
        );


        const total =
            orcamentos.length;


        if ($("#mOrcamentos")) {

            $("#mOrcamentos").textContent =
                total;
        }


        if ($("#dashOrcamentosNovos")) {

            $("#dashOrcamentosNovos").textContent =
                novos;
        }


        if ($("#dashOrcamentosAnalise")) {

            $("#dashOrcamentosAnalise").textContent =
                analise;
        }


        if ($("#dashOrcamentosAprovados")) {

            $("#dashOrcamentosAprovados").textContent =
                aprovados;
        }
    }


    /* =====================================================
       CÁLCULOS FINANCEIROS
    ====================================================== */

    function calcularEntradasPagas() {

        return estado.financeiro

            .filter(
                item =>
                    ehEntrada(item) &&
                    statusPago(item.status)
            )

            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    getValor(item),
                0
            );
    }


    function calcularSaidasPagas() {

        return estado.financeiro

            .filter(
                item =>
                    ehSaida(item) &&
                    statusPago(item.status)
            )

            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    getValor(item),
                0
            );
    }


    function calcularEntradasPendentes() {

        return estado.financeiro

            .filter(
                item =>
                    ehEntrada(item) &&
                    !statusPago(item.status)
            )

            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    getValor(item),
                0
            );
    }


    /* =====================================================
       INDICADORES
    ====================================================== */

    function atualizarIndicadores() {

        /*
         * CLIENTES
         */

        const clientesAtivos =
            estado.clientes.filter(
                cliente => {

                    const status =
                        normalizarStatus(
                            cliente.status
                        );

                    return ![
                        "inativo",
                        "inativa",
                        "cancelado",
                        "cancelada"
                    ].includes(status);
                }
            );


        if ($("#mClientes")) {

            $("#mClientes").textContent =
                clientesAtivos.length;
        }


        /*
         * LEADS
         */

        if ($("#mLeads")) {

            $("#mLeads").textContent =
                estado.leads.length;
        }


        /*
         * ENTRADAS MANUAIS PAGAS
         */

        const entradasManuais =
            calcularEntradasPagas();


        /*
         * DESPESAS PAGAS
         */

        const despesas =
            calcularSaidasPagas();


        /*
         * ENTRADAS PENDENTES
         */

        const entradasPendentes =
            calcularEntradasPendentes();


        /*
         * KIWIFY
         */

        const pedidosPagos =
            estado.ebookPedidos.filter(
                pedido =>
                    statusPago(
                        pedido.status
                    )
            );


        const receitaKiwify =
            pedidosPagos.reduce(
                (
                    total,
                    pedido
                ) =>
                    total +
                    getValor(pedido),
                0
            );


        /*
         * RECEITA RECEBIDA
         *
         * Manual paga
         * +
         * Kiwify paga
         */

        const receitaTotal =
            entradasManuais +
            receitaKiwify;


        if ($("#mReceita")) {

            $("#mReceita").textContent =
                money(receitaTotal);
        }


        /*
         * COBRANÇAS A RECEBER
         */

        const cobrancasAReceber =
            estado.cobrancas.reduce(
                (
                    total,
                    cobranca
                ) => {

                    if (
                        statusPago(
                            cobranca.status
                        )
                    ) {
                        return total;
                    }

                    return (
                        total +
                        getValor(cobranca)
                    );
                },
                0
            );


        const aReceber =
            cobrancasAReceber +
            entradasPendentes;


        if ($("#mReceber")) {

            $("#mReceber").textContent =
                money(aReceber);
        }


        /*
         * KIWIFY
         */

        if ($("#mKiwify")) {

            $("#mKiwify").textContent =
                pedidosPagos.length;
        }


        /*
         * PEDIDOS
         */

        if ($("#mPedidos")) {

            $("#mPedidos").textContent =
                estado.ebookPedidos.length;
        }


        /*
         * ORÇAMENTOS
         */

        renderOrcamentos(
            estado.orcamentos
        );


        /*
         * SALDO
         */

        const saldo =
            receitaTotal -
            despesas;


        atualizarResumoFinanceiro(
            receitaTotal,
            despesas,
            saldo
        );


        /*
         * PERFORMANCE
         */

        if ($("#performanceReceita")) {

            $("#performanceReceita").textContent =
                money(receitaTotal);
        }


        if ($("#performanceVendas")) {

            $("#performanceVendas").textContent =
                pedidosPagos.length;
        }


        if ($("#performanceClientes")) {

            $("#performanceClientes").textContent =
                clientesAtivos.length;
        }


        if ($("#performanceLeads")) {

            $("#performanceLeads").textContent =
                estado.leads.length;
        }


        /*
         * HISTÓRICO
         */

        renderHistoricoFinanceiro();
    }


    /* =====================================================
       RESUMO FINANCEIRO
    ====================================================== */

    function atualizarResumoFinanceiro(
        entradas,
        despesas,
        saldo
    ) {

        [
            $("#dashboardEntradas"),
            $("#summaryEntradas")
        ].forEach(
            elemento => {

                if (elemento) {

                    elemento.textContent =
                        money(entradas);
                }
            }
        );


        [
            $("#dashboardSaidas"),
            $("#summarySaidas")
        ].forEach(
            elemento => {

                if (elemento) {

                    elemento.textContent =
                        money(despesas);
                }
            }
        );


        [
            $("#dashboardSaldo"),
            $("#summarySaldo")
        ].forEach(
            elemento => {

                if (elemento) {

                    elemento.textContent =
                        money(saldo);
                }
            }
        );
    }


    /* =====================================================
       HISTÓRICO FINANCEIRO
    ====================================================== */

    function renderHistoricoFinanceiro() {

        const container =
            $("#dashboardFinanceList");


        if (!container) {
            return;
        }


        const dados =
            [...estado.financeiro]
                .sort(
                    (a, b) => {

                        const dataA =
                            dataItem(a)?.getTime() || 0;

                        const dataB =
                            dataItem(b)?.getTime() || 0;

                        return dataB - dataA;
                    }
                )
                .slice(0, 50);


        if (!dados.length) {

            container.innerHTML = `
                <div class="finance-empty">
                    Nenhum lançamento encontrado.
                </div>
            `;

            return;
        }


        container.innerHTML =
            dados.map(
                item => {

                    const entrada =
                        ehEntrada(item);


                    const tipoTexto =
                        entrada
                            ? "Entrada"
                            : "Despesa";


                    const classeTipo =
                        entrada
                            ? "entrada"
                            : "saida";


                    const status =
                        statusPago(
                            item.status
                        )
                            ? "Pago"
                            : "Pendente";


                    return `
                        <div
                            class="finance-row"
                            data-finance-id="${escaparHTML(item.id)}"
                        >

                            <div class="finance-row-type ${classeTipo}">
                                ${entrada ? "↑" : "↓"}
                            </div>

                            <div class="finance-row-info">

                                <strong>
                                    ${escaparHTML(
                                        item.descricao ||
                                        "Lançamento"
                                    )}
                                </strong>

                                <small>
                                    ${tipoTexto}
                                    •
                                    ${escaparHTML(
                                        item.categoria ||
                                        "Outros"
                                    )}
                                    •
                                    ${formatarData(
                                        item.vencimento ||
                                        item.created_at
                                    )}
                                </small>

                            </div>

                            <div class="finance-row-value ${classeTipo}">
                                ${entrada ? "+" : "-"}
                                ${money(
                                    getValor(item)
                                )}
                            </div>

                            <div class="finance-row-status">
                                ${status}
                            </div>

                        </div>
                    `;
                }
            )
            .join("");
    }


    /* =====================================================
       FORMULÁRIO FINANCEIRO
    ====================================================== */

    function definirDataAtual() {

        const campo =
            $("#financeData");


        if (
            !campo ||
            campo.value
        ) {
            return;
        }


        const hoje =
            new Date();


        const ano =
            hoje.getFullYear();


        const mes =
            String(
                hoje.getMonth() + 1
            ).padStart(2, "0");


        const dia =
            String(
                hoje.getDate()
            ).padStart(2, "0");


        campo.value =
            `${ano}-${mes}-${dia}`;
    }


    /* =====================================================
       SALVAR LANÇAMENTO
       
       CORREÇÃO PRINCIPAL:
       Busca SEMPRE o UUID diretamente do Supabase Auth.
       
       Não utiliza:
       window.crm.uid()
       
       Isso evita enviar "{}" para user_id.
    ====================================================== */

    async function salvarLancamento(evento) {

        evento.preventDefault();


        console.log(
            "iDigital CRM | Salvando lançamento..."
        );


        const supabase =
            window.supabaseClient;


        if (!supabase) {

            console.error(
                "window.supabaseClient não encontrado."
            );

            alert(
                "Supabase não foi carregado."
            );

            return;
        }


        /* =================================================
           USUÁRIO AUTENTICADO
        ================================================== */

        let userId = null;


        try {

            const resultado =
                await supabase.auth.getUser();


            if (resultado.error) {

                console.error(
                    "Erro ao buscar usuário:",
                    resultado.error
                );

                alert(
                    "Não foi possível identificar o usuário logado."
                );

                return;
            }


            userId =
                resultado?.data?.user?.id ||
                null;


        } catch (erro) {

            console.error(
                "Erro ao obter usuário:",
                erro
            );

            alert(
                "Não foi possível identificar sua sessão."
            );

            return;
        }


        /*
         * VALIDAÇÃO ABSOLUTA DO UUID
         */

        if (!uuidValido(userId)) {

            console.error(
                "UUID inválido recebido do Supabase:",
                userId,
                typeof userId
            );

            alert(
                "Sua sessão de usuário não é válida. Faça login novamente."
            );

            return;
        }


        /*
         * Atualiza estado com UUID real
         */

        estado.userId =
            userId;


        console.log(
            "UUID REAL DO USUÁRIO:",
            userId
        );


        /* =================================================
           CAMPOS
        ================================================== */

        const tipo =
            $("#financeTipo")?.value;


        const descricao =
            $("#financeDescricao")?.value
                ?.trim();


        const valorTexto =
            $("#financeValor")?.value;


        const valor =
            converterNumero(
                valorTexto
            );


        const data =
            $("#financeData")?.value;


        const categoria =
            $("#financeCategoria")?.value ||
            "outros";


        const status =
            $("#financeStatus")?.value ||
            "pago";


        console.log(
            "Dados do lançamento:",
            {
                userId,
                tipo,
                descricao,
                valor,
                data,
                categoria,
                status
            }
        );


        /* =================================================
           VALIDAÇÃO
        ================================================== */

        if (
            tipo !== "entrada" &&
            tipo !== "saida"
        ) {

            alert(
                "Selecione Entrada ou Despesa."
            );

            return;
        }


        if (!descricao) {

            alert(
                "Digite uma descrição."
            );

            $("#financeDescricao")?.focus();

            return;
        }


        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {

            alert(
                "Digite um valor válido."
            );

            $("#financeValor")?.focus();

            return;
        }


        if (
            status !== "pago" &&
            status !== "pendente"
        ) {

            alert(
                "Selecione um status válido."
            );

            return;
        }


        /* =================================================
           PAYLOAD
        ================================================== */

        const payload = {

            user_id: userId,

            descricao: descricao,

            tipo: tipo,

            categoria: categoria,

            valor: valor,

            vencimento:
                data || null,

            status: status
        };


        /*
         * IMPORTANTE:
         * user_id precisa aparecer como STRING UUID.
         */

        console.log(
            "Payload enviado ao Supabase:",
            payload
        );

        console.log(
            "Tipo do user_id:",
            typeof payload.user_id
        );


        /* =================================================
           SALVAR
        ================================================== */

        const botao =
            $("#dashboardFinanceSubmit");


        if (botao) {

            botao.disabled =
                true;

            botao.dataset.textoOriginal =
                botao.textContent;

            botao.textContent =
                "Salvando...";
        }


        try {

            const resultado =
                await supabase
                    .from("financeiro")
                    .insert([
                        payload
                    ]);


            /* =============================================
               ERRO SUPABASE
            ============================================== */

            if (resultado.error) {

                console.error(
                    "ERRO AO INSERIR FINANCEIRO:",
                    resultado.error
                );


                console.error(
                    "Código:",
                    resultado.error.code
                );


                console.error(
                    "Detalhes:",
                    resultado.error.details
                );


                console.error(
                    "Hint:",
                    resultado.error.hint
                );


                alert(
                    "Erro ao salvar lançamento:\n\n" +
                    resultado.error.message
                );


                return;
            }


            /* =============================================
               SUCESSO
            ============================================== */

            console.log(
                "Lançamento salvo com sucesso."
            );


            alert(
                "Lançamento salvo com sucesso!"
            );


            /* =============================================
               LIMPAR FORMULÁRIO
            ============================================== */

            const form =
                $("#dashboardFinanceForm");


            if (form) {

                form.reset();
            }


            /*
             * DATA VOLTA PARA HOJE
             */

            definirDataAtual();


            /*
             * RECARREGAR DASHBOARD
             */

            await iniciarDashboard(true);


        } catch (erro) {

            console.error(
                "ERRO INESPERADO AO SALVAR:",
                erro
            );


            alert(
                "Não foi possível salvar o lançamento."
            );


        } finally {

            if (botao) {

                botao.disabled =
                    false;

                botao.textContent =
                    botao.dataset.textoOriginal ||
                    "+ Adicionar lançamento";
            }
        }
    }


    /* =====================================================
       VINCULAR FORMULÁRIO
    ====================================================== */

    function vincularFormulario() {

        const form =
            $("#dashboardFinanceForm");


        if (!form) {

            console.warn(
                "Formulário #dashboardFinanceForm não encontrado."
            );

            return;
        }


        /*
         * Evita evento duplicado
         */

        if (
            form.dataset.eventoFinanceiro ===
            "true"
        ) {

            definirDataAtual();

            return;
        }


        form.addEventListener(
            "submit",
            salvarLancamento
        );


        form.dataset.eventoFinanceiro =
            "true";


        definirDataAtual();


        console.log(
            "Formulário financeiro conectado."
        );
    }


    /* =====================================================
       GRÁFICO
    ====================================================== */

    function calcularReceitaMensal() {

        const agora =
            new Date();


        const meses = [];


        for (
            let i = 5;
            i >= 0;
            i--
        ) {

            meses.push(
                new Date(
                    agora.getFullYear(),
                    agora.getMonth() - i,
                    1
                )
            );
        }


        return meses.map(
            mesAtual => {

                const mes =
                    mesAtual.getMonth();

                const ano =
                    mesAtual.getFullYear();

                let total =
                    0;


                /*
                 * ENTRADAS MANUAIS PAGAS
                 */

                estado.financeiro

                    .filter(
                        item =>
                            ehEntrada(item) &&
                            statusPago(item.status)
                    )

                    .forEach(
                        item => {

                            const data =
                                dataItem(item);


                            if (!data) {
                                return;
                            }


                            if (
                                data.getMonth() === mes &&
                                data.getFullYear() === ano
                            ) {

                                total +=
                                    getValor(item);
                            }
                        }
                    );


                /*
                 * KIWIFY
                 */

                estado.ebookPedidos

                    .filter(
                        pedido =>
                            statusPago(
                                pedido.status
                            )
                    )

                    .forEach(
                        pedido => {

                            const data =
                                dataItem(pedido);


                            if (!data) {
                                return;
                            }


                            if (
                                data.getMonth() === mes &&
                                data.getFullYear() === ano
                            ) {

                                total +=
                                    getValor(pedido);
                            }
                        }
                    );


                return total;
            }
        );
    }


    function renderRevenueChart() {

        const canvas =
            $("#revenueChart");


        if (!canvas) {
            return;
        }


        if (
            typeof Chart !== "function"
        ) {

            console.warn(
                "Chart.js não encontrado."
            );

            return;
        }


        const contexto =
            canvas.getContext("2d");


        if (!contexto) {
            return;
        }


        const agora =
            new Date();


        const meses = [];


        for (
            let i = 5;
            i >= 0;
            i--
        ) {

            meses.push(
                new Date(
                    agora.getFullYear(),
                    agora.getMonth() - i,
                    1
                )
            );
        }


        const labels =
            meses.map(
                data =>
                    data
                        .toLocaleDateString(
                            "pt-BR",
                            {
                                month: "short"
                            }
                        )
                        .replace(".", "")
                        .replace(
                            /^./,
                            letra =>
                                letra.toUpperCase()
                        )
            );


        const valores =
            calcularReceitaMensal();


        const total =
            valores.reduce(
                (
                    soma,
                    valor
                ) =>
                    soma + valor,
                0
            );


        if ($("#chartTotalReceita")) {

            $("#chartTotalReceita").textContent =
                money(total);
        }


        if (
            window.__idigitalRevenueChart
        ) {

            window
                .__idigitalRevenueChart
                .destroy();
        }


        const gradiente =
            contexto.createLinearGradient(
                0,
                0,
                0,
                340
            );


        gradiente.addColorStop(
            0,
            "rgba(201,168,93,.25)"
        );


        gradiente.addColorStop(
            1,
            "rgba(201,168,93,0)"
        );


        window.__idigitalRevenueChart =
            new Chart(
                contexto,
                {

                    type: "line",

                    data: {

                        labels,

                        datasets: [

                            {

                                label:
                                    "Receita",

                                data:
                                    valores,

                                borderColor:
                                    "#c9a85d",

                                backgroundColor:
                                    gradiente,

                                borderWidth:
                                    2.5,

                                fill:
                                    true,

                                tension:
                                    0.42,

                                pointRadius:
                                    3,

                                pointHoverRadius:
                                    6,

                                pointBackgroundColor:
                                    "#e7d49a",

                                pointBorderColor:
                                    "#090909",

                                pointBorderWidth:
                                    2
                            }
                        ]
                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,


                        interaction: {

                            intersect:
                                false,

                            mode:
                                "index"
                        },


                        plugins: {

                            legend: {

                                display:
                                    false
                            },


                            tooltip: {

                                displayColors:
                                    false,

                                backgroundColor:
                                    "#111111",

                                borderColor:
                                    "rgba(201,168,93,.35)",

                                borderWidth:
                                    1,

                                titleColor:
                                    "#e7d49a",

                                bodyColor:
                                    "#f5f2ea",

                                padding:
                                    12,


                                callbacks: {

                                    label:
                                        context =>
                                            ` ${money(
                                                context.raw
                                            )}`
                                }
                            }
                        },


                        scales: {

                            x: {

                                border: {

                                    display:
                                        false
                                },

                                grid: {

                                    display:
                                        false
                                },

                                ticks: {

                                    color:
                                        "#77736d",

                                    font: {

                                        size:
                                            10
                                    }
                                }
                            },


                            y: {

                                beginAtZero:
                                    true,

                                border: {

                                    display:
                                        false
                                },

                                grid: {

                                    color:
                                        "rgba(255,255,255,.045)"
                                },

                                ticks: {

                                    color:
                                        "#66625c",

                                    font: {

                                        size:
                                            9
                                    },

                                    callback:
                                        value =>
                                            moneyCompact(
                                                value
                                            )
                                }
                            }
                        }
                    }
                }
            );
    }


    /* =====================================================
       INICIALIZAÇÃO
    ====================================================== */

    async function iniciarDashboard(
        recarregando = false
    ) {

        try {

            configurarCabecalho();


            const supabase =
                window.supabaseClient;


            if (!supabase) {

                console.error(
                    "Supabase Client não encontrado."
                );

                return;
            }


            /*
             * USUÁRIO
             *
             * OBRIGATORIAMENTE pelo Supabase Auth.
             */

            await carregarUsuario(
                supabase
            );


            /*
             * Se não tiver UUID válido,
             * não tenta consultar tabelas
             * que dependem do usuário.
             */

            if (!uuidValido(estado.userId)) {

                console.warn(
                    "Dashboard sem usuário autenticado."
                );
            }


            /*
             * DADOS
             */

            await carregarDados(
                supabase
            );


            /*
             * INDICADORES
             */

            atualizarIndicadores();


            /*
             * GRÁFICO
             */

            renderRevenueChart();


            /*
             * FORMULÁRIO
             */

            vincularFormulario();


            if (!recarregando) {

                console.log(
                    "iDigital CRM | Dashboard Premium iniciado."
                );

                console.log(
                    "User ID:",
                    estado.userId
                );
            }

        } catch (erro) {

            console.error(
                "Erro no Dashboard:",
                erro
            );
        }
    }


    /* =====================================================
       DOM READY
    ====================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => iniciarDashboard()
        );

    } else {

        iniciarDashboard();
    }


    /* =====================================================
       EXPORTAÇÃO
    ====================================================== */

    window.idigitalDashboard = {

        iniciar:
            iniciarDashboard,

        atualizar:
            atualizarIndicadores,

        renderRevenueChart:
            renderRevenueChart,

        renderOrcamentos:
            renderOrcamentos,

        salvarLancamento:
            salvarLancamento
    };

})();