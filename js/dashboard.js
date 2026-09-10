/* =========================================================
   iDigital CRM Premium 2.0
   DASHBOARD.JS
   DASHBOARD EXECUTIVO
   INTEGRAÇÃO KIWIFY + SUPABASE
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

        const numero =
            converterNumero(valor);

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


    /* =====================================================
       VALOR GENÉRICO
    ====================================================== */

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
                item[campo] !== null &&
                item[campo] !== ""
            ) {

                return converterNumero(
                    item[campo]
                );
            }
        }

        return 0;
    }


    /* =====================================================
       VALOR KIWIFY
    ====================================================== */

    function getValorKiwify(pedido) {

        if (!pedido) {
            return 0;
        }

        /*
         * Pedido pago:
         * usa primeiro valor_pago.
         */

        if (
            statusPago(pedido.status)
        ) {

            const valorPago =
                converterNumero(
                    pedido.valor_pago
                );

            if (valorPago > 0) {
                return valorPago;
            }
        }

        /*
         * Pedido pendente:
         * usa valor_total.
         */

        const valorTotal =
            converterNumero(
                pedido.valor_total
            );

        if (valorTotal > 0) {
            return valorTotal;
        }

        /*
         * Fallback
         */

        return converterNumero(
            pedido.valor
        );
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
            "data_compra",
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
            saudacao = "Bom dia";
        } else if (hora < 18) {
            saudacao = "Boa tarde";
        } else {
            saudacao = "Boa noite";
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

            estado.userId =
                usuario.id || null;

            if (!uuidValido(estado.userId)) {

                console.error(
                    "UUID do usuário inválido:",
                    estado.userId
                );

                estado.userId = null;

                return null;
            }

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

                        console.log(
                            "Kiwify carregada:",
                            estado.ebookPedidos.length,
                            "pedidos"
                        );

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
       FINANCEIRO MANUAL
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
       KIWIFY
    ====================================================== */

    function calcularKiwify() {

        const pagos =
            estado.ebookPedidos.filter(
                pedido =>
                    statusPago(
                        pedido.status
                    )
            );

        const pendentes =
            estado.ebookPedidos.filter(
                pedido =>
                    !statusPago(
                        pedido.status
                    )
            );

        const receitaPaga =
            pagos.reduce(
                (
                    total,
                    pedido
                ) =>
                    total +
                    getValorKiwify(pedido),
                0
            );

        const valorPendente =
            pendentes.reduce(
                (
                    total,
                    pedido
                ) =>
                    total +
                    getValorKiwify(pedido),
                0
            );

        return {
            total:
                estado.ebookPedidos.length,

            pagos,

            pendentes,

            quantidadePagos:
                pagos.length,

            quantidadePendentes:
                pendentes.length,

            receitaPaga,

            valorPendente
        };
    }


    /* =====================================================
       INDICADORES
    ====================================================== */

    function atualizarIndicadores() {

        /* =================================================
           CLIENTES
        ================================================== */

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


        /* =================================================
           LEADS
        ================================================== */

        if ($("#mLeads")) {

            $("#mLeads").textContent =
                estado.leads.length;
        }


        /* =================================================
           FINANCEIRO MANUAL
        ================================================== */

        const entradasManuais =
            calcularEntradasPagas();

        const despesas =
            calcularSaidasPagas();

        const entradasPendentes =
            calcularEntradasPendentes();


        /* =================================================
           KIWIFY
        ================================================== */

        const kiwify =
            calcularKiwify();


        console.log(
            "Resumo Kiwify:",
            kiwify
        );


        /* =================================================
           RECEITA TOTAL
        ================================================== */

        const receitaTotal =
            entradasManuais +
            kiwify.receitaPaga;


        if ($("#mReceita")) {

            $("#mReceita").textContent =
                money(receitaTotal);
        }


        /* =================================================
           COBRANÇAS A RECEBER
        ================================================== */

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


        /* =================================================
           TOTAL A RECEBER
        ================================================== */

        const aReceber =
            cobrancasAReceber +
            entradasPendentes +
            kiwify.valorPendente;


        if ($("#mReceber")) {

            $("#mReceber").textContent =
                money(aReceber);
        }


        /* =================================================
           VENDAS KIWIFY
        ================================================== */

        if ($("#mKiwify")) {

            $("#mKiwify").textContent =
                kiwify.total;
        }


        /* =================================================
           TOTAL DE PEDIDOS
        ================================================== */

        if ($("#mPedidos")) {

            $("#mPedidos").textContent =
                kiwify.total;
        }


        /* =================================================
           ORÇAMENTOS
        ================================================== */

        renderOrcamentos(
            estado.orcamentos
        );


        /* =================================================
           SALDO
        ================================================== */

        const saldo =
            receitaTotal -
            despesas;


        atualizarResumoFinanceiro(
            receitaTotal,
            despesas,
            saldo
        );


        /* =================================================
           PERFORMANCE
        ================================================== */

        if ($("#performanceReceita")) {

            $("#performanceReceita").textContent =
                money(receitaTotal);
        }


        if ($("#performanceVendas")) {

            $("#performanceVendas").textContent =
                kiwify.quantidadePagos;
        }


        if ($("#performanceClientes")) {

            $("#performanceClientes").textContent =
                clientesAtivos.length;
        }


        if ($("#performanceLeads")) {

            $("#performanceLeads").textContent =
                estado.leads.length;
        }


        /* =================================================
           HISTÓRICO
        ================================================== */

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
            [
                ...estado.financeiro
            ]
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


        if (!uuidValido(userId)) {

            console.error(
                "UUID inválido recebido do Supabase:",
                userId
            );

            alert(
                "Sua sessão de usuário não é válida. Faça login novamente."
            );

            return;
        }


        estado.userId =
            userId;


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


            if (resultado.error) {

                console.error(
                    "ERRO AO INSERIR FINANCEIRO:",
                    resultado.error
                );

                alert(
                    "Erro ao salvar lançamento:\n\n" +
                    resultado.error.message
                );

                return;
            }


            alert(
                "Lançamento salvo com sucesso!"
            );


            const form =
                $("#dashboardFinanceForm");

            if (form) {
                form.reset();
            }


            definirDataAtual();


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
            return;
        }

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


                /* =========================================
                   ENTRADAS MANUAIS PAGAS
                ========================================== */

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


                /* =========================================
                   KIWIFY PAGAS
                ========================================== */

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
                                    getValorKiwify(
                                        pedido
                                    );
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


            await carregarUsuario(
                supabase
            );


            await carregarDados(
                supabase
            );


            atualizarIndicadores();


            renderRevenueChart();


            vincularFormulario();


            if (!recarregando) {

                console.log(
                    "iDigital CRM | Dashboard Premium iniciado."
                );

                console.log(
                    "User ID:",
                    estado.userId
                );

                console.log(
                    "Pedidos Kiwify:",
                    estado.ebookPedidos.length
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