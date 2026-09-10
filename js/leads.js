(() => {
    "use strict";

    /* =========================================================
       ESTADO
    ========================================================= */

    let oportunidades = [];
    let oportunidadeEditandoId = null;


    /* =========================================================
       DOM
    ========================================================= */

    const $ = (id) => document.getElementById(id);

    const tableBody = $("leadsTableBody");
    const emptyState = $("leadsEmpty");
    const resultCount = $("resultCount");
    const refreshBtn = $("refreshLeadsBtn");

    const modal = $("leadModal");
    const modalOverlay = $("leadModalOverlay");
    const modalTitle = $("leadModalTitle");

    const form = $("leadForm");

    const leadId = $("leadId");
    const leadNome = $("leadNome");
    const leadContato = $("leadContato");
    const leadEmail = $("leadEmail");
    const leadServico = $("leadServico");
    const leadValor = $("leadValor");
    const leadOrigem = $("leadOrigem");
    const leadEtapa = $("leadEtapa");
    const leadOrigemId = $("leadOrigemId");
    const leadObs = $("leadObs");

    const saveBtn = $("saveLeadBtn");


    /* =========================================================
       SUPABASE
    ========================================================= */

    function obterSupabase() {
        return window.supabaseClient || null;
    }


    async function obterUsuario() {
        const supabase = obterSupabase();

        if (!supabase) {
            return null;
        }

        try {
            const { data, error } =
                await supabase.auth.getUser();

            if (error) {
                console.warn(
                    "[CRM] Usuário não disponível:",
                    error.message
                );

                return null;
            }

            return data?.user || null;

        } catch (error) {

            console.warn(
                "[CRM] Erro ao obter usuário:",
                error
            );

            return null;
        }
    }


    /* =========================================================
       HELPERS
    ========================================================= */

    function escapar(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function normalizar(valor) {
        return String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }


    function campo(objeto, nomes, fallback = "") {
        for (const nome of nomes) {
            if (
                objeto &&
                objeto[nome] !== undefined &&
                objeto[nome] !== null &&
                String(objeto[nome]).trim() !== ""
            ) {
                return objeto[nome];
            }
        }

        return fallback;
    }


    /* =========================================================
       VALOR
    ========================================================= */

    function valorNumero(valor) {

        if (typeof valor === "number") {
            return Number.isFinite(valor)
                ? valor
                : 0;
        }

        let texto = String(valor ?? "")
            .trim()
            .replace(/R\$/gi, "")
            .replace(/\s/g, "");

        if (!texto) {
            return 0;
        }

        /*
         * Exemplos:
         *
         * 1.500,50 -> 1500.50
         * 1500,50  -> 1500.50
         * 1500.50  -> 1500.50
         */

        if (
            texto.includes(".") &&
            texto.includes(",")
        ) {
            texto = texto
                .replace(/\./g, "")
                .replace(",", ".");
        } else if (texto.includes(",")) {
            texto = texto.replace(",", ".");
        }

        texto = texto.replace(/[^\d.-]/g, "");

        const numero = Number(texto);

        return Number.isFinite(numero)
            ? numero
            : 0;
    }


    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
    }


    function formatarValorInput(valor) {

        const numero = valorNumero(valor);

        if (!numero) {
            return "";
        }

        return numero.toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    /* =========================================================
       TEXTO
    ========================================================= */

    function obterIniciais(nome) {

        const partes =
            String(nome || "Cliente")
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        if (!partes.length) {
            return "CL";
        }

        if (partes.length === 1) {
            return partes[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            partes[0][0] +
            partes[partes.length - 1][0]
        ).toUpperCase();
    }


    function formatarData(data) {

        if (!data) {
            return "—";
        }

        const objeto = new Date(data);

        if (Number.isNaN(objeto.getTime())) {
            return String(data);
        }

        return objeto.toLocaleDateString("pt-BR");
    }


    function formatarDataHora(data) {

        if (!data) {
            return "—";
        }

        const objeto = new Date(data);

        if (Number.isNaN(objeto.getTime())) {
            return String(data);
        }

        return objeto.toLocaleString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    function definirTexto(id, valor) {

        const elemento = $(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    }


    /* =========================================================
       STATUS
    ========================================================= */

    function normalizarStatus(
        status,
        fallback = "novo"
    ) {

        const valor =
            normalizar(status)
                .replace(/-/g, "_")
                .replace(/\s+/g, "_");

        if (!valor) {
            return fallback;
        }

        if (
            [
                "novo",
                "nova",
                "recebido",
                "aberto"
            ].includes(valor)
        ) {
            return "novo";
        }

        if (
            [
                "pendente",
                "aguardando",
                "pending",
                "aguardando_pagamento"
            ].includes(valor)
        ) {
            return "pendente";
        }

        if (
            [
                "em_andamento",
                "andamento",
                "em_producao",
                "producao",
                "processando",
                "fazendo"
            ].includes(valor)
        ) {
            return "em_andamento";
        }

        if (
            [
                "fechado",
                "concluido",
                "finalizado",
                "entregue",
                "feito",
                "paid",
                "pago",
                "aprovado",
                "aprovada",
                "completo",
                "completa"
            ].includes(valor)
        ) {
            return "fechado";
        }

        if (
            [
                "cancelado",
                "cancelada",
                "perdido",
                "cancelled",
                "refunded",
                "reembolsado",
                "reembolsada"
            ].includes(valor)
        ) {
            return "cancelado";
        }

        return fallback;
    }


    function nomeStatus(status) {

        const nomes = {
            novo: "Novo",
            pendente: "Pendente",
            em_andamento: "Em andamento",
            fechado: "Concluído",
            cancelado: "Cancelado"
        };

        return nomes[status] || "Novo";
    }


    function nomeTipo(tipo) {

        const nomes = {
            orcamento: "Orçamento",
            ebook: "Kiwify",
            lead: "Lead"
        };

        return nomes[tipo] || "Oportunidade";
    }


    function obterNomeOrigem(origem) {

        const nomes = {
            site: "Site",
            kiwify: "Kiwify",
            instagram: "Instagram",
            whatsapp: "WhatsApp",
            indicacao: "Indicação",
            google: "Google",
            outro: "Outro"
        };

        const chave =
            normalizar(origem)
                .replace(/\s+/g, "_");

        return nomes[chave] ||
            String(origem || "Outro");
    }


    /* =========================================================
       NORMALIZAÇÃO - ORÇAMENTO
    ========================================================= */

    function normalizarOrcamento(item) {

        return {
            id: `orcamento-${item.id}`,

            origemId: item.id,

            bancoId: item.id,

            tipo: "orcamento",

            nome: String(
                campo(
                    item,
                    [
                        "nome",
                        "cliente",
                        "nome_cliente",
                        "empresa"
                    ],
                    "Cliente do orçamento"
                )
            ),

            email: String(
                campo(
                    item,
                    ["email"],
                    ""
                )
            ),

            contato: String(
                campo(
                    item,
                    [
                        "whatsapp",
                        "telefone",
                        "contato"
                    ],
                    ""
                )
            ),

            servico: String(
                campo(
                    item,
                    [
                        "servicos",
                        "servico",
                        "projeto",
                        "tipo_servico"
                    ],
                    "Orçamento"
                )
            ),

            valor: valorNumero(
                campo(
                    item,
                    [
                        "valor",
                        "valor_total",
                        "valor_estimado"
                    ],
                    0
                )
            ),

            status: normalizarStatus(
                campo(
                    item,
                    ["status"],
                    "novo"
                ),
                "novo"
            ),

            origem: "site",

            origemLabel: "Site",

            observacoes: String(
                campo(
                    item,
                    [
                        "mensagem",
                        "observacoes",
                        "observacao"
                    ],
                    ""
                )
            ),

            prazo: String(
                campo(
                    item,
                    ["prazo"],
                    ""
                )
            ),

            created_at: campo(
                item,
                ["created_at"],
                ""
            ),

            raw: item
        };
    }


    /* =========================================================
       NORMALIZAÇÃO - KIWIFY
    ========================================================= */

    function normalizarKiwify(item) {

        /*
         * Produto
         */

        const produtoNome =
            String(
                campo(
                    item,
                    [
                        "produto_nome",
                        "nome_produto",
                        "product_name",
                        "produto",
                        "product",
                        "tema",
                        "titulo",
                        "nome_ebook"
                    ],
                    "Produto Kiwify"
                )
            );


        const produtoId =
            String(
                campo(
                    item,
                    [
                        "produto_id",
                        "product_id",
                        "id_produto",
                        "product_code",
                        "produto_codigo"
                    ],
                    ""
                )
            );


        /*
         * Cliente
         */

        const nome =
            String(
                campo(
                    item,
                    [
                        "nome",
                        "customer_name",
                        "buyer_name",
                        "cliente",
                        "nome_cliente"
                    ],
                    "Cliente Kiwify"
                )
            );


        const email =
            String(
                campo(
                    item,
                    [
                        "email",
                        "customer_email",
                        "buyer_email"
                    ],
                    ""
                )
            );


        const telefone =
            String(
                campo(
                    item,
                    [
                        "telefone",
                        "phone",
                        "customer_phone",
                        "whatsapp",
                        "contato"
                    ],
                    ""
                )
            );


        /*
         * Valor
         *
         * Prioridade:
         *
         * valor
         * valor_pago
         * valor_total
         * valor_produto
         * price
         * amount
         * purchase_amount
         */

        let valor = valorNumero(
            campo(
                item,
                [
                    "valor",
                    "valor_pago",
                    "valor_total",
                    "valor_produto",
                    "preco",
                    "preco_produto",
                    "price",
                    "amount",
                    "purchase_amount",
                    "total"
                ],
                0
            )
        );


        /*
         * Se o valor vier em centavos.
         *
         * Exemplo:
         * 5000 -> R$ 50,00
         * 19700 -> R$ 197,00
         */

        if (
            Number.isInteger(valor) &&
            valor >= 1000 &&
            valor % 100 === 0
        ) {
            valor = valor / 100;
        }


        /*
         * Status
         */

        const statusOriginal =
            campo(
                item,
                ["status"],
                "pendente"
            );

        const statusTexto =
            normalizar(statusOriginal)
                .replace(/-/g, "_")
                .replace(/\s+/g, "_");


        let status =
            normalizarStatus(
                statusOriginal,
                "pendente"
            );


        /*
         * Vendas pagas da Kiwify
         * entram como oportunidade concluída.
         */

        if (
            [
                "paid",
                "pago",
                "aprovado",
                "aprovada",
                "payment_approved",
                "pagamento_aprovado",
                "completed",
                "completo",
                "completa"
            ].includes(statusTexto)
        ) {
            status = "fechado";
        }


        /*
         * Datas
         */

        const dataCompra =
            campo(
                item,
                [
                    "data_compra",
                    "purchase_date",
                    "created_at"
                ],
                ""
            );


        const dataPagamento =
            campo(
                item,
                [
                    "data_pagamento",
                    "paid_at",
                    "payment_date"
                ],
                ""
            );


        /*
         * Pedido
         */

        const pedidoId =
            String(
                campo(
                    item,
                    [
                        "transaction_id",
                        "kiwify_id",
                        "order_id",
                        "kiwify_order_id",
                        "order"
                    ],
                    ""
                )
            );


        return {

            id: `kiwify-${item.id}`,

            origemId: item.id,

            bancoId: item.id,

            tipo: "ebook",

            nome,

            email,

            contato: telefone,

            /*
             * Aqui aparece o produto REAL
             * vendido na Kiwify.
             */

            servico: produtoNome,

            produtoNome,

            produtoId,

            valor,

            status,

            origem: "kiwify",

            origemLabel: "Kiwify",

            plano:
                campo(
                    item,
                    [
                        "plano",
                        "product_plan",
                        "plan"
                    ],
                    ""
                ),

            payment_url:
                campo(
                    item,
                    [
                        "payment_url",
                        "checkout_url",
                        "payment_link"
                    ],
                    ""
                ),

            kiwify_order_id:
                pedidoId,

            paid_at:
                dataPagamento || null,

            data_compra:
                dataCompra || null,

            observacoes: [
                item.descricao
                    ? `Descrição: ${item.descricao}`
                    : "",

                item.produto_codigo
                    ? `Código do produto: ${item.produto_codigo}`
                    : "",

                item.metodo_pagamento
                    ? `Pagamento: ${item.metodo_pagamento}`
                    : "",

                item.parcelas
                    ? `Parcelas: ${item.parcelas}`
                    : "",

                item.afiliado_nome
                    ? `Afiliado: ${item.afiliado_nome}`
                    : ""
            ]
                .filter(Boolean)
                .join("\n"),

            created_at:
                item.created_at ||
                dataCompra ||
                "",

            raw: item
        };
    }


    /* =========================================================
       COMPATIBILIDADE
    ========================================================= */

    function normalizarEbook(item) {
        return normalizarKiwify(item);
    }


    /* =========================================================
       NORMALIZAÇÃO - LEAD MANUAL
    ========================================================= */

    function normalizarLead(item) {

        const etapaOriginal =
            campo(
                item,
                [
                    "etapa",
                    "status"
                ],
                "novo"
            );


        const status =
            normalizarStatus(
                etapaOriginal,
                "novo"
            );


        return {

            id: `lead-${item.id}`,

            origemId: item.id,

            bancoId: item.id,

            tipo: "lead",

            nome: String(
                campo(
                    item,
                    [
                        "nome",
                        "cliente",
                        "nome_cliente"
                    ],
                    "Lead"
                )
            ),

            email: String(
                campo(
                    item,
                    ["email"],
                    ""
                )
            ),

            contato: String(
                campo(
                    item,
                    [
                        "contato",
                        "telefone",
                        "whatsapp"
                    ],
                    ""
                )
            ),

            servico: String(
                campo(
                    item,
                    [
                        "servico",
                        "servicos",
                        "projeto",
                        "tipo_servico"
                    ],
                    "Projeto"
                )
            ),

            valor: valorNumero(
                campo(
                    item,
                    [
                        "valor_estimado",
                        "valor",
                        "valor_total"
                    ],
                    0
                )
            ),

            status,

            etapa:
                campo(
                    item,
                    ["etapa"],
                    status
                ),

            origem:
                campo(
                    item,
                    ["origem"],
                    "outro"
                ),

            origemLabel:
                obterNomeOrigem(
                    campo(
                        item,
                        ["origem"],
                        "outro"
                    )
                ),

            observacoes: String(
                campo(
                    item,
                    [
                        "observacoes",
                        "observacao",
                        "mensagem"
                    ],
                    ""
                )
            ),

            user_id:
                item.user_id || null,

            created_at:
                item.created_at || "",

            raw: item
        };
    }


    /* =========================================================
       BUSCAR ORÇAMENTOS
    ========================================================= */

    async function buscarOrcamentos() {

        const supabase =
            obterSupabase();

        if (!supabase) {
            throw new Error(
                "Supabase não configurado."
            );
        }


        const { data, error } =
            await supabase
                .from("orcamentos")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        return data || [];
    }


    /* =========================================================
       BUSCAR KIWIFY
    ========================================================= */

    async function buscarEbooks() {

        const supabase =
            obterSupabase();

        if (!supabase) {
            throw new Error(
                "Supabase não configurado."
            );
        }


        /*
         * Busca TODOS os registros.
         *
         * Não usamos:
         *
         * limit
         * single
         * maybeSingle
         *
         * Portanto cada venda vira uma
         * oportunidade separada.
         */

        const { data, error } =
            await supabase
                .from("ebook_pedidos")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        console.log(
            "[CRM] Vendas Kiwify encontradas:",
            data?.length || 0
        );


        console.table(
            (data || []).map(item => ({
                id: item.id,
                produto:
                    item.produto_nome ||
                    item.nome_produto ||
                    item.produto ||
                    item.product_name,
                valor:
                    item.valor ||
                    item.valor_pago ||
                    item.valor_total,
                status: item.status
            }))
        );


        return data || [];
    }


    /* =========================================================
       BUSCAR LEADS MANUAIS
    ========================================================= */

    async function buscarLeadsManuais() {

        const supabase =
            obterSupabase();

        if (!supabase) {
            return [];
        }


        let query =
            supabase
                .from("leads")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        const usuario =
            await obterUsuario();


        if (usuario?.id) {
            query =
                query.eq(
                    "user_id",
                    usuario.id
                );
        }


        const { data, error } =
            await query;


        if (error) {

            console.warn(
                "[CRM] Leads manuais não carregados:",
                error.message
            );

            return [];
        }


        return data || [];
    }


    /* =========================================================
       CARREGAR OPORTUNIDADES
    ========================================================= */

    async function carregarOportunidades() {

        const supabase =
            obterSupabase();


        if (!supabase) {

            console.error(
                "[CRM] Supabase não configurado."
            );

            return;
        }


        mostrarCarregando();


        let orcamentos = [];
        let ebooks = [];
        let leads = [];


        try {

            orcamentos =
                await buscarOrcamentos();

        } catch (error) {

            console.error(
                "[CRM] Erro em orcamentos:",
                error
            );
        }


        try {

            ebooks =
                await buscarEbooks();

        } catch (error) {

            console.error(
                "[CRM] Erro em ebook_pedidos:",
                error
            );
        }


        try {

            leads =
                await buscarLeadsManuais();

        } catch (error) {

            console.error(
                "[CRM] Erro em leads:",
                error
            );
        }


        /*
         * IMPORTANTE:
         *
         * Cada registro da Kiwify
         * permanece separado.
         */

        oportunidades = [

            ...orcamentos.map(
                normalizarOrcamento
            ),

            ...ebooks.map(
                normalizarKiwify
            ),

            ...leads.map(
                normalizarLead
            )

        ];


        oportunidades.sort(
            (a, b) => {

                const dataA =
                    new Date(
                        a.created_at || 0
                    ).getTime();

                const dataB =
                    new Date(
                        b.created_at || 0
                    ).getTime();

                return dataB - dataA;
            }
        );


        console.log(
            "[CRM] Total de oportunidades:",
            oportunidades.length
        );


        console.log(
            "[CRM] Total Kiwify:",
            oportunidades.filter(
                item =>
                    item.tipo === "ebook"
            ).length
        );


        console.log(
            "[CRM] Valor Kiwify:",
            oportunidades
                .filter(
                    item =>
                        item.tipo === "ebook"
                )
                .reduce(
                    (total, item) =>
                        total +
                        valorNumero(
                            item.valor
                        ),
                    0
                )
        );


        atualizarTudo();
    }


    /* =========================================================
       LOADING
    ========================================================= */

    function mostrarCarregando() {

        if (!tableBody) {
            return;
        }


        emptyState?.classList.add(
            "hidden"
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="leads-loading">
                        <div class="loading-spinner"></div>
                        <span>
                            Carregando oportunidades...
                        </span>
                    </div>
                </td>
            </tr>
        `;
    }


    /* =========================================================
       ESTATÍSTICAS
    ========================================================= */

    function atualizarEstatisticas() {

        const total =
            oportunidades.length;


        const orcamentos =
            oportunidades.filter(
                item =>
                    item.tipo === "orcamento"
            ).length;


        const ebooks =
            oportunidades.filter(
                item =>
                    item.tipo === "ebook"
            ).length;


        const novos =
            oportunidades.filter(
                item =>
                    item.status === "novo"
            ).length;


        const pendentes =
            oportunidades.filter(
                item =>
                    item.status === "pendente"
            ).length;


        const andamento =
            oportunidades.filter(
                item =>
                    item.status === "em_andamento"
            ).length;


        const fechados =
            oportunidades.filter(
                item =>
                    item.status === "fechado"
            ).length;


        const cancelados =
            oportunidades.filter(
                item =>
                    item.status === "cancelado"
            ).length;


        /*
         * SOMA TODAS AS OPORTUNIDADES
         */

        const valor =
            oportunidades
                .filter(
                    item =>
                        item.status !== "cancelado"
                )
                .reduce(
                    (totalAtual, item) =>
                        totalAtual +
                        valorNumero(
                            item.valor
                        ),
                    0
                );


        /*
         * SOMA SOMENTE KIWIFY
         */

        const valorKiwify =
            oportunidades
                .filter(
                    item =>
                        item.tipo === "ebook" &&
                        item.status !== "cancelado"
                )
                .reduce(
                    (totalAtual, item) =>
                        totalAtual +
                        valorNumero(
                            item.valor
                        ),
                    0
                );


        definirTexto(
            "totalOrcamentosSite",
            orcamentos
        );


        definirTexto(
            "totalEbookPedidos",
            ebooks
        );


        definirTexto(
            "totalPendentes",
            pendentes
        );


        definirTexto(
            "valorOportunidades",
            formatarMoeda(valor)
        );


        definirTexto(
            "pipelineNovo",
            novos
        );


        definirTexto(
            "pipelinePendente",
            pendentes
        );


        definirTexto(
            "pipelineAndamento",
            andamento
        );


        definirTexto(
            "pipelineFechado",
            fechados
        );


        definirTexto(
            "pipelineCancelado",
            cancelados
        );


        definirTexto(
            "pipelineCount",
            `${total} ${
                total === 1
                    ? "oportunidade"
                    : "oportunidades"
            }`
        );


        /*
         * Caso exista um contador específico
         * para Kiwify.
         */

        definirTexto(
            "valorKiwify",
            formatarMoeda(valorKiwify)
        );
    }


    /* =========================================================
       TABELA
    ========================================================= */

    function renderizarTabela(
        dados = oportunidades
    ) {

        if (!tableBody) {
            return;
        }


        if (resultCount) {

            resultCount.textContent =
                `${dados.length} ${
                    dados.length === 1
                        ? "registro"
                        : "registros"
                }`;
        }


        tableBody.innerHTML = "";


        if (!dados.length) {

            emptyState?.classList.remove(
                "hidden"
            );

            return;
        }


        emptyState?.classList.add(
            "hidden"
        );


        dados.forEach(
            oportunidade => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                const nome =
                    escapar(
                        oportunidade.nome
                    );


                const email =
                    escapar(
                        oportunidade.email
                    );


                const contato =
                    escapar(
                        oportunidade.contato
                    );


                const servico =
                    escapar(
                        oportunidade.servico
                    );


                const origem =
                    escapar(
                        oportunidade.origemLabel
                    );


                const iniciais =
                    escapar(
                        obterIniciais(
                            oportunidade.nome
                        )
                    );


                const status =
                    oportunidade.status;


                const id =
                    escapar(
                        oportunidade.id
                    );


                const origemId =
                    escapar(
                        oportunidade.origemId
                    );


                const whatsapp =
                    oportunidade.contato
                        ? `
                            <button
                                type="button"
                                class="table-action"
                                data-action="whatsapp"
                                data-id="${id}"
                                title="Abrir WhatsApp"
                            >
                                ☎
                            </button>
                        `
                        : "";


                const pagamento =
                    oportunidade.tipo === "ebook" &&
                    oportunidade.payment_url
                        ? `
                            <button
                                type="button"
                                class="table-action"
                                data-action="payment"
                                data-id="${id}"
                                title="Abrir pagamento"
                            >
                                $
                            </button>
                        `
                        : "";


                const editar =
                    oportunidade.tipo === "lead"
                        ? `
                            <button
                                type="button"
                                class="table-action"
                                data-action="edit"
                                data-id="${origemId}"
                                title="Editar lead"
                            >
                                ✎
                            </button>

                            <button
                                type="button"
                                class="table-action delete"
                                data-action="delete"
                                data-id="${origemId}"
                                title="Excluir lead"
                            >
                                ×
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                class="table-action"
                                data-action="view"
                                data-id="${id}"
                                title="Ver detalhes"
                            >
                                ◉
                            </button>
                        `;


                tr.innerHTML = `

                    <td>
                        <div class="table-client">

                            <div class="table-avatar">
                                ${iniciais}
                            </div>

                            <div class="table-client-name">

                                <strong>
                                    ${nome}
                                </strong>

                                ${
                                    email
                                        ? `
                                            <small>
                                                ${email}
                                            </small>
                                        `
                                        : ""
                                }

                                ${
                                    contato
                                        ? `
                                            <small>
                                                ${contato}
                                            </small>
                                        `
                                        : ""
                                }

                            </div>

                        </div>
                    </td>


                    <td>

                        <span
                            class="lead-type ${escapar(
                                oportunidade.tipo
                            )}"
                        >
                            ${nomeTipo(
                                oportunidade.tipo
                            )}
                        </span>

                    </td>


                    <td>

                        <div
                            class="table-service"
                            title="${servico}"
                        >
                            ${servico || "—"}
                        </div>

                    </td>


                    <td>

                        <div class="table-value">

                            ${
                                oportunidade.valor > 0
                                    ? formatarMoeda(
                                        oportunidade.valor
                                    )
                                    : "—"
                            }

                        </div>

                    </td>


                    <td>

                        <select
                            class="status-select"
                            data-status-id="${origemId}"
                            data-status-tipo="${escapar(
                                oportunidade.tipo
                            )}"
                        >

                            <option
                                value="novo"
                                ${
                                    status === "novo"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Novo
                            </option>

                            <option
                                value="pendente"
                                ${
                                    status === "pendente"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Pendente
                            </option>

                            <option
                                value="em_andamento"
                                ${
                                    status === "em_andamento"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Em andamento
                            </option>

                            <option
                                value="fechado"
                                ${
                                    status === "fechado"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Concluído
                            </option>

                            <option
                                value="cancelado"
                                ${
                                    status === "cancelado"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Cancelado
                            </option>

                        </select>

                    </td>


                    <td>

                        <span class="origin-badge">
                            ${origem}
                        </span>

                    </td>


                    <td>

                        <div
                            class="table-date"
                            title="${escapar(
                                formatarDataHora(
                                    oportunidade.created_at
                                )
                            )}"
                        >
                            ${formatarData(
                                oportunidade.created_at
                            )}
                        </div>

                    </td>


                    <td>

                        <div class="table-actions">

                            ${whatsapp}

                            ${pagamento}

                            ${editar}

                        </div>

                    </td>

                `;


                tableBody.appendChild(tr);
            }
        );
    }


    /* =========================================================
       WHATSAPP
    ========================================================= */

    function abrirWhatsApp(
        oportunidade
    ) {

        let numero =
            String(
                oportunidade.contato || ""
            ).replace(/\D/g, "");


        if (!numero) {
            return;
        }


        if (
            numero.length === 10 ||
            numero.length === 11
        ) {
            numero =
                `55${numero}`;
        }


        const mensagem =
            `Olá, ${
                oportunidade.nome || ""
            }! Tudo bem? Estou entrando em contato sobre ${
                oportunidade.tipo === "ebook"
                    ? `sua compra do produto "${oportunidade.produtoNome || oportunidade.servico}"`
                    : oportunidade.tipo === "orcamento"
                        ? "seu orçamento"
                        : "seu projeto"
            }.`;


        const url =
            `https://wa.me/${numero}?text=${encodeURIComponent(
                mensagem
            )}`;


        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );
    }


    /* =========================================================
       PAGAMENTO
    ========================================================= */

    function abrirPagamento(
        oportunidade
    ) {

        if (
            !oportunidade?.payment_url
        ) {
            return;
        }


        window.open(
            oportunidade.payment_url,
            "_blank",
            "noopener,noreferrer"
        );
    }


    /* =========================================================
       ALTERAR STATUS
    ========================================================= */

    async function alterarStatus(
        id,
        tipo,
        status
    ) {

        const supabase =
            obterSupabase();


        if (!supabase) {
            return;
        }


        let tabela = "";


        if (tipo === "orcamento") {
            tabela = "orcamentos";
        }


        if (tipo === "ebook") {
            tabela = "ebook_pedidos";
        }


        if (tipo === "lead") {
            tabela = "leads";
        }


        if (!tabela) {
            return;
        }


        try {

            let resultado;


            /*
             * ORÇAMENTO / KIWIFY
             */

            if (
                tipo === "orcamento" ||
                tipo === "ebook"
            ) {

                resultado =
                    await supabase
                        .from(tabela)
                        .update({
                            status
                        })
                        .eq(
                            "id",
                            id
                        );

            } else {

                /*
                 * LEAD
                 */

                const usuario =
                    await obterUsuario();


                let query =
                    supabase
                        .from("leads")
                        .update({
                            status
                        })
                        .eq(
                            "id",
                            id
                        );


                if (usuario?.id) {

                    query =
                        query.eq(
                            "user_id",
                            usuario.id
                        );
                }


                resultado =
                    await query;


                /*
                 * Compatibilidade com
                 * tabela que usa etapa.
                 */

                if (resultado.error) {

                    let queryEtapa =
                        supabase
                            .from("leads")
                            .update({
                                etapa: status
                            })
                            .eq(
                                "id",
                                id
                            );


                    if (usuario?.id) {

                        queryEtapa =
                            queryEtapa.eq(
                                "user_id",
                                usuario.id
                            );
                    }


                    resultado =
                        await queryEtapa;
                }
            }


            if (resultado.error) {
                throw resultado.error;
            }


            await carregarOportunidades();

        } catch (error) {

            console.error(
                "[CRM] Erro ao alterar status:",
                error
            );


            await carregarOportunidades();
        }
    }


    /* =========================================================
       MODAL
    ========================================================= */

    function abrirModal() {

        if (!modal) {
            return;
        }


        modal.classList.remove(
            "hidden"
        );


        modal.classList.add(
            "show"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";


        setTimeout(
            () =>
                leadNome?.focus(),
            100
        );
    }


    function fecharModal() {

        if (!modal) {
            return;
        }


        modal.classList.remove(
            "show"
        );


        modal.classList.add(
            "hidden"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow =
            "";


        oportunidadeEditandoId =
            null;
    }


    function limparFormulario() {

        form?.reset();


        if (leadId) {
            leadId.value = "";
        }


        if (leadEtapa) {
            leadEtapa.value =
                "novo";
        }


        if (leadOrigem) {
            leadOrigem.value =
                "outro";
        }


        if (leadValor) {
            leadValor.value = "";
        }


        if (leadOrigemId) {
            leadOrigemId.value = "";
        }


        if (modalTitle) {
            modalTitle.textContent =
                "Novo lead";
        }


        if (saveBtn) {

            saveBtn.textContent =
                "Salvar lead";

            saveBtn.disabled =
                false;
        }


        oportunidadeEditandoId =
            null;
    }


    function abrirNovoLead() {

        limparFormulario();

        abrirModal();
    }


    /* =========================================================
       EDITAR LEAD
    ========================================================= */

    function editarLead(id) {

        const lead =
            oportunidades.find(
                item =>
                    item.tipo === "lead" &&
                    String(
                        item.origemId
                    ) === String(id)
            );


        if (!lead) {
            return;
        }


        oportunidadeEditandoId =
            lead.origemId;


        if (leadId) {
            leadId.value =
                lead.origemId;
        }


        if (leadNome) {
            leadNome.value =
                lead.nome || "";
        }


        if (leadContato) {
            leadContato.value =
                lead.contato || "";
        }


        if (leadEmail) {
            leadEmail.value =
                lead.email || "";
        }


        if (leadServico) {
            leadServico.value =
                lead.servico || "";
        }


        if (leadValor) {
            leadValor.value =
                formatarValorInput(
                    lead.valor
                );
        }


        if (leadOrigem) {
            leadOrigem.value =
                lead.origem || "outro";
        }


        if (leadEtapa) {
            leadEtapa.value =
                lead.status || "novo";
        }


        if (leadOrigemId) {
            leadOrigemId.value =
                lead.origemId || "";
        }


        if (leadObs) {
            leadObs.value =
                lead.observacoes || "";
        }


        if (modalTitle) {
            modalTitle.textContent =
                "Editar lead";
        }


        if (saveBtn) {
            saveBtn.textContent =
                "Salvar alterações";
        }


        abrirModal();
    }


    /* =========================================================
       SALVAR LEAD
    ========================================================= */

    async function salvarLead(event) {

        event.preventDefault();


        const supabase =
            obterSupabase();


        const usuario =
            await obterUsuario();


        if (
            !supabase ||
            !usuario?.id
        ) {

            alert(
                "Sua sessão não está disponível. Faça login novamente."
            );

            return;
        }


        const nome =
            leadNome?.value.trim();


        if (!nome) {

            leadNome?.focus();

            return;
        }


        const payload = {

            user_id:
                usuario.id,

            nome,

            contato:
                leadContato?.value.trim() ||
                null,

            email:
                leadEmail?.value.trim() ||
                null,

            valor_estimado:
                valorNumero(
                    leadValor?.value
                ),

            etapa:
                leadEtapa?.value ||
                "novo",

            origem:
                leadOrigem?.value ||
                "outro",

            servico:
                leadServico?.value.trim() ||
                null,

            observacoes:
                leadObs?.value.trim() ||
                null
        };


        if (saveBtn) {

            saveBtn.disabled = true;

            saveBtn.textContent =
                oportunidadeEditandoId
                    ? "Salvando..."
                    : "Cadastrando...";
        }


        try {

            let resultado;


            if (
                oportunidadeEditandoId
            ) {

                resultado =
                    await supabase
                        .from("leads")
                        .update(payload)
                        .eq(
                            "id",
                            oportunidadeEditandoId
                        )
                        .eq(
                            "user_id",
                            usuario.id
                        );

            } else {

                resultado =
                    await supabase
                        .from("leads")
                        .insert(
                            payload
                        );
            }


            if (resultado.error) {
                throw resultado.error;
            }


            fecharModal();

            limparFormulario();

            await carregarOportunidades();

        } catch (error) {

            console.error(
                "[CRM] Erro ao salvar lead:",
                error
            );


            alert(
                "Não foi possível salvar o lead.\n\n" +
                (
                    error.message ||
                    "Verifique o Supabase."
                )
            );

        } finally {

            if (saveBtn) {

                saveBtn.disabled =
                    false;

                saveBtn.textContent =
                    "Salvar lead";
            }
        }
    }


    /* =========================================================
       EXCLUIR LEAD
    ========================================================= */

    async function excluirLead(id) {

        const lead =
            oportunidades.find(
                item =>
                    item.tipo === "lead" &&
                    String(
                        item.origemId
                    ) === String(id)
            );


        if (!lead) {
            return;
        }


        const confirmar =
            window.confirm(
                `Excluir o lead "${lead.nome}"?`
            );


        if (!confirmar) {
            return;
        }


        const supabase =
            obterSupabase();


        const usuario =
            await obterUsuario();


        if (
            !supabase ||
            !usuario?.id
        ) {
            return;
        }


        try {

            const { error } =
                await supabase
                    .from("leads")
                    .delete()
                    .eq(
                        "id",
                        id
                    )
                    .eq(
                        "user_id",
                        usuario.id
                    );


            if (error) {
                throw error;
            }


            await carregarOportunidades();

        } catch (error) {

            console.error(
                "[CRM] Erro ao excluir lead:",
                error
            );


            alert(
                "Não foi possível excluir o lead."
            );
        }
    }


    /* =========================================================
       DETALHES
    ========================================================= */

    function visualizarOportunidade(id) {

        const oportunidade =
            oportunidades.find(
                item =>
                    String(item.id) ===
                    String(id)
            );


        if (!oportunidade) {
            return;
        }


        const detalhes = [

            `CLIENTE: ${oportunidade.nome}`,

            oportunidade.email
                ? `E-mail: ${oportunidade.email}`
                : "",

            oportunidade.contato
                ? `WhatsApp: ${oportunidade.contato}`
                : "",

            `Tipo: ${nomeTipo(
                oportunidade.tipo
            )}`,

            oportunidade.produtoNome
                ? `Produto: ${oportunidade.produtoNome}`
                : "",

            `Projeto: ${oportunidade.servico}`,

            oportunidade.valor > 0
                ? `Valor: ${formatarMoeda(
                    oportunidade.valor
                )}`
                : "Valor: Não informado",

            `Status: ${nomeStatus(
                oportunidade.status
            )}`,

            `Origem: ${oportunidade.origemLabel}`,

            oportunidade.produtoId
                ? `Produto ID: ${oportunidade.produtoId}`
                : "",

            oportunidade.plano
                ? `Plano: ${oportunidade.plano}`
                : "",

            oportunidade.prazo
                ? `Prazo: ${oportunidade.prazo}`
                : "",

            oportunidade.paid_at
                ? `Pagamento: ${formatarDataHora(
                    oportunidade.paid_at
                )}`
                : "",

            oportunidade.kiwify_order_id
                ? `Pedido Kiwify: ${oportunidade.kiwify_order_id}`
                : "",

            oportunidade.observacoes
                ? `\n${oportunidade.observacoes}`
                : ""

        ]
            .filter(Boolean)
            .join("\n");


        window.alert(
            detalhes
        );
    }


    /* =========================================================
       EVENTOS DA TABELA
    ========================================================= */

    tableBody?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            const oportunidade =
                oportunidades.find(
                    item =>
                        String(item.id) ===
                        String(id)
                );


            if (
                action === "whatsapp" &&
                oportunidade
            ) {

                abrirWhatsApp(
                    oportunidade
                );
            }


            if (
                action === "payment" &&
                oportunidade
            ) {

                abrirPagamento(
                    oportunidade
                );
            }


            if (action === "edit") {
                editarLead(id);
            }


            if (action === "delete") {
                excluirLead(id);
            }


            if (action === "view") {
                visualizarOportunidade(id);
            }
        }
    );


    tableBody?.addEventListener(
        "change",
        event => {

            const select =
                event.target.closest(
                    "[data-status-id]"
                );


            if (!select) {
                return;
            }


            alterarStatus(

                select.dataset.statusId,

                select.dataset.statusTipo,

                select.value
            );
        }
    );


    /* =========================================================
       PIPELINE
    ========================================================= */

    document
        .querySelectorAll(
            "[data-filter-status]"
        )
        .forEach(
            elemento => {

                elemento.addEventListener(
                    "click",
                    () => {

                        const status =
                            elemento.dataset
                                .filterStatus;


                        const dados =
                            oportunidades.filter(
                                item =>
                                    item.status ===
                                    status
                            );


                        renderizarTabela(
                            dados
                        );


                        document
                            .querySelector(
                                ".leads-list-card"
                            )
                            ?.scrollIntoView({
                                behavior:
                                    "smooth",
                                block:
                                    "start"
                            });
                    }
                );
            }
        );


    /* =========================================================
       MODAL - EVENTOS
    ========================================================= */

    $("novoLeadBtn")
        ?.addEventListener(
            "click",
            abrirNovoLead
        );


    $("emptyNewLeadBtn")
        ?.addEventListener(
            "click",
            abrirNovoLead
        );


    $("fecharLeadModal")
        ?.addEventListener(
            "click",
            fecharModal
        );


    $("cancelarLeadBtn")
        ?.addEventListener(
            "click",
            fecharModal
        );


    modalOverlay?.addEventListener(
        "click",
        fecharModal
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal &&
                !modal.classList.contains(
                    "hidden"
                )
            ) {
                fecharModal();
            }
        }
    );


    form?.addEventListener(
        "submit",
        salvarLead
    );


    /* =========================================================
       VALOR
    ========================================================= */

    leadValor?.addEventListener(
        "input",
        () => {

            leadValor.value =
                leadValor.value.replace(
                    /[^\d,.-]/g,
                    ""
                );
        }
    );


    leadValor?.addEventListener(
        "blur",
        () => {

            const valor =
                valorNumero(
                    leadValor.value
                );


            leadValor.value =
                valor
                    ? formatarValorInput(
                        valor
                    )
                    : "";
        }
    );


    /* =========================================================
       REFRESH
    ========================================================= */

    refreshBtn?.addEventListener(
        "click",
        carregarOportunidades
    );


    /* =========================================================
       DATA
    ========================================================= */

    function atualizarDataHoje() {

        const elemento =
            $("todayText");


        if (!elemento) {
            return;
        }


        elemento.textContent =
            new Date().toLocaleDateString(
                "pt-BR",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "long"
                }
            );
    }


    /* =========================================================
       ATUALIZAÇÃO
    ========================================================= */

    function atualizarTudo() {

        atualizarEstatisticas();

        renderizarTabela();
    }


    /* =========================================================
       API GLOBAL
    ========================================================= */

    window.crmLeads = {

        reload:
            carregarOportunidades,

        novo:
            abrirNovoLead,

        editar:
            editarLead,

        excluir:
            excluirLead,

        atualizar:
            atualizarTudo,

        listar:
            () => [...oportunidades]
    };


    /* =========================================================
       INIT
    ========================================================= */

    function iniciar() {

        atualizarDataHoje();

        carregarOportunidades();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );

    } else {

        iniciar();
    }

})();