(() => {
    "use strict";

    /* =========================================================
       iDIGITAL CRM
       LEADS & OPORTUNIDADES
       SITE + KIWIFY + LEADS MANUAIS

       VERSÃO CORRIGIDA

       KIWIFY:
       - Produtos
       - PIX
       - Boleto
       - Cartão
       - Pagamentos pagos
       - Pagamentos em aberto
       - Valores
       - Saldo em aberto
       - Status financeiro separado do CRM
       - Não altera pagamento pelo pipeline
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

    function caminho(objeto, caminhos, fallback = "") {
        for (const caminhoAtual of caminhos) {
            const partes = caminhoAtual.split(".");
            let atual = objeto;

            for (const parte of partes) {
                if (
                    atual === null ||
                    atual === undefined
                ) {
                    atual = undefined;
                    break;
                }

                atual = atual[parte];
            }

            if (
                atual !== undefined &&
                atual !== null &&
                String(atual).trim() !== ""
            ) {
                return atual;
            }
        }

        return fallback;
    }

    /* =========================================================
       VALORES
    ========================================================= */

    function valorNumero(valor) {
        if (
            typeof valor === "number"
        ) {
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
        else if (
            texto.includes(",")
        ) {
            texto = texto.replace(",", ".");
        }

        texto = texto.replace(
            /[^\d.-]/g,
            ""
        );

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
        const numero =
            valorNumero(valor);

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

    /*
     * Calcula o saldo real.
     *
     * Exemplo:
     * valorTotal = 197
     * valorPago = 0
     * saldo = 197
     *
     * valorTotal = 197
     * valorPago = 197
     * saldo = 0
     */

    function calcularSaldo(item) {
        const total = valorNumero(
            item.valorTotal ??
            item.valor ??
            0
        );

        const pago = valorNumero(
            item.valorPago ??
            0
        );

        if (
            pago > 0 &&
            total > 0
        ) {
            return Math.max(
                total - pago,
                0
            );
        }

        return total;
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

        if (
            Number.isNaN(
                objeto.getTime()
            )
        ) {
            return String(data);
        }

        return objeto.toLocaleDateString(
            "pt-BR"
        );
    }

    function formatarDataHora(data) {
        if (!data) {
            return "—";
        }

        const objeto = new Date(data);

        if (
            Number.isNaN(
                objeto.getTime()
            )
        ) {
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
       STATUS CRM
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
                "pendente_pagamento",
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
                "payment_approved",
                "pagamento_aprovado",
                "completed",
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
                "reembolsada",
                "chargeback"
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

        return nomes[tipo] ||
            "Oportunidade";
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
       STATUS PAGAMENTO
    ========================================================= */

    function normalizarStatusPagamento(status) {
        const valor =
            normalizar(status)
                .replace(/-/g, "_")
                .replace(/\s+/g, "_");

        if (
            [
                "paid",
                "pago",
                "approved",
                "aprovado",
                "aprovada",
                "completed",
                "complete",
                "completo",
                "completa",
                "confirmed",
                "confirmado",
                "payment_approved",
                "pagamento_aprovado",
                "paid_approved",
                "success",
                "sucesso"
            ].includes(valor)
        ) {
            return "pago";
        }

        if (
            [
                "cancelled",
                "canceled",
                "cancelado",
                "cancelada",
                "refunded",
                "reembolsado",
                "reembolsada",
                "chargeback",
                "chargedback"
            ].includes(valor)
        ) {
            return "cancelado";
        }

        return "pendente";
    }

    function nomeStatusPagamento(status) {
        const nomes = {
            pago: "Pago",
            pendente: "Em aberto",
            cancelado: "Cancelado"
        };

        return nomes[status] ||
            "Em aberto";
    }

    /* =========================================================
       MÉTODO DE PAGAMENTO
    ========================================================= */

    function normalizarMetodoPagamento(metodo) {
        const valor =
            normalizar(metodo);

        if (
            valor.includes("pix")
        ) {
            return "PIX";
        }

        if (
            valor.includes("boleto") ||
            valor.includes("bank_slip") ||
            valor.includes("bank slip")
        ) {
            return "Boleto";
        }

        if (
            valor.includes("credit") ||
            valor.includes("credito") ||
            valor.includes("card") ||
            valor.includes("cartao")
        ) {
            return "Cartão";
        }

        if (
            valor.includes("debit") ||
            valor.includes("debito")
        ) {
            return "Débito";
        }

        return metodo
            ? String(metodo)
            : "Não informado";
    }

    /* =========================================================
       ORÇAMENTO
    ========================================================= */

    function normalizarOrcamento(item) {
        const valor =
            valorNumero(
                campo(
                    item,
                    [
                        "valor",
                        "valor_total",
                        "valor_estimado"
                    ],
                    0
                )
            );

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

            valor,

            valorPago: 0,

            valorTotal: valor,

            saldoAberto: valor,

            status: normalizarStatus(
                campo(
                    item,
                    ["status"],
                    "novo"
                ),
                "novo"
            ),

            statusPagamento: null,

            statusPagamentoLabel: null,

            metodoPagamento: null,

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

            created_at:
                campo(
                    item,
                    ["created_at"],
                    ""
                ),

            raw: item
        };
    }

    /* =========================================================
       KIWIFY
    ========================================================= */

    function normalizarKiwify(item) {

        /*
         * PRODUTO
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
                        "id_produto"
                    ],
                    ""
                )
            );

        const produtoCodigo =
            String(
                campo(
                    item,
                    [
                        "produto_codigo",
                        "product_code"
                    ],
                    ""
                )
            );

        /*
         * CLIENTE
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
         * =====================================================
         * VALOR TOTAL
         * =====================================================
         *
         * Prioridade:
         *
         * valor_total
         * valor
         * valor_produto
         * amount
         */

        const valorTotal =
            valorNumero(
                campo(
                    item,
                    [
                        "valor_total",
                        "valor",
                        "valor_produto",
                        "preco",
                        "price",
                        "amount",
                        "purchase_amount",
                        "total"
                    ],
                    0
                )
            );

        /*
         * =====================================================
         * VALOR PAGO
         * =====================================================
         */

        let valorPago =
            valorNumero(
                campo(
                    item,
                    [
                        "valor_pago",
                        "valor_total_pago",
                        "paid_amount"
                    ],
                    0
                )
            );

        /*
         * Se o pedido está pago e valor_pago
         * não veio preenchido, usamos o total.
         */

        /*
         * =====================================================
         * VALOR LÍQUIDO
         * =====================================================
         */

        const valorLiquido =
            valorNumero(
                campo(
                    item,
                    [
                        "valor_liquido",
                        "net_amount"
                    ],
                    0
                )
            );

        /*
         * =====================================================
         * STATUS PAGAMENTO
         * =====================================================
         */

        const statusOriginal =
            String(
                campo(
                    item,
                    [
                        "status",
                        "status_pagamento",
                        "payment_status"
                    ],
                    "pendente"
                )
            );

        const statusPagamento =
            normalizarStatusPagamento(
                statusOriginal
            );

        /*
         * Pedido pago sem valor_pago:
         * considera valor total como pago.
         */

        if (
            statusPagamento === "pago" &&
            valorPago <= 0
        ) {
            valorPago = valorTotal;
        }

        /*
         * =====================================================
         * SALDO EM ABERTO
         * =====================================================
         */

        const saldoAberto =
            statusPagamento === "pendente"
                ? Math.max(
                    valorTotal - valorPago,
                    0
                )
                : 0;

        /*
         * =====================================================
         * STATUS CRM
         * =====================================================
         */

        let status = "pendente";

        if (
            statusPagamento === "pago"
        ) {
            status = "fechado";
        }

        if (
            statusPagamento === "cancelado"
        ) {
            status = "cancelado";
        }

        /*
         * =====================================================
         * MÉTODO PAGAMENTO
         * =====================================================
         */

        const metodoOriginal =
            campo(
                item,
                [
                    "metodo_pagamento",
                    "payment_method",
                    "payment_type",
                    "metodo",
                    "forma_pagamento"
                ],
                ""
            );

        const metodoPagamento =
            normalizarMetodoPagamento(
                metodoOriginal
            );

        /*
         * =====================================================
         * IDENTIFICADORES
         * =====================================================
         */

        const transactionId =
            String(
                campo(
                    item,
                    [
                        "transaction_id",
                        "kiwify_transaction_id"
                    ],
                    ""
                )
            );

        const orderId =
            String(
                campo(
                    item,
                    [
                        "order_id",
                        "kiwify_order_id"
                    ],
                    ""
                )
            );

        const kiwifyId =
            String(
                campo(
                    item,
                    [
                        "kiwify_id"
                    ],
                    ""
                )
            );

        /*
         * =====================================================
         * DATAS
         * =====================================================
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
         * =====================================================
         * LINK PAGAMENTO
         * =====================================================
         */

        const paymentUrl =
            String(
                campo(
                    item,
                    [
                        "payment_url",
                        "checkout_url",
                        "payment_link",
                        "url_pagamento"
                    ],
                    ""
                )
            );

        /*
         * =====================================================
         * OBSERVAÇÕES
         * =====================================================
         */

        const observacoes = [
            item.descricao
                ? `Descrição: ${item.descricao}`
                : "",

            produtoCodigo
                ? `Código: ${produtoCodigo}`
                : "",

            metodoPagamento &&
            metodoPagamento !==
                "Não informado"
                ? `Pagamento: ${metodoPagamento}`
                : "",

            item.parcelas
                ? `Parcelas: ${item.parcelas}`
                : "",

            statusPagamento === "pago"
                ? "Pagamento confirmado"
                : statusPagamento === "pendente"
                    ? "Pagamento em aberto"
                    : "Pagamento cancelado",

            item.afiliado_nome
                ? `Afiliado: ${item.afiliado_nome}`
                : ""
        ]
            .filter(Boolean)
            .join("\n");

        /*
         * =====================================================
         * RETORNO
         * =====================================================
         */

        return {

            id:
                `kiwify-${item.id}`,

            origemId:
                item.id,

            bancoId:
                item.id,

            tipo:
                "ebook",

            nome,

            email,

            contato:
                telefone,

            servico:
                produtoNome,

            produtoNome,

            produtoId,

            produtoCodigo,

            valor:
                valorTotal,

            valorPago,

            valorTotal,

            valorLiquido,

            saldoAberto,

            status,

            statusPagamento,

            statusPagamentoLabel:
                nomeStatusPagamento(
                    statusPagamento
                ),

            metodoPagamento,

            origem:
                "kiwify",

            origemLabel:
                "Kiwify",

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
                paymentUrl,

            transaction_id:
                transactionId,

            order_id:
                orderId,

            kiwify_id:
                kiwifyId,

            kiwify_order_id:
                orderId ||
                transactionId ||
                kiwifyId,

            paid_at:
                dataPagamento ||
                null,

            data_compra:
                dataCompra ||
                null,

            data_pagamento:
                dataPagamento ||
                null,

            observacoes,

            created_at:
                item.created_at ||
                dataCompra ||
                "",

            raw:
                item
        };
    }

    /* =========================================================
       COMPATIBILIDADE
    ========================================================= */

    function normalizarEbook(item) {
        return normalizarKiwify(item);
    }

    /* =========================================================
       LEAD MANUAL
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

        const valor =
            valorNumero(
                campo(
                    item,
                    [
                        "valor_estimado",
                        "valor",
                        "valor_total"
                    ],
                    0
                )
            );

        return {

            id:
                `lead-${item.id}`,

            origemId:
                item.id,

            bancoId:
                item.id,

            tipo:
                "lead",

            nome:
                String(
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

            email:
                String(
                    campo(
                        item,
                        ["email"],
                        ""
                    )
                ),

            contato:
                String(
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

            servico:
                String(
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

            valor,

            valorPago: 0,

            valorTotal: valor,

            saldoAberto: valor,

            status,

            statusPagamento: null,

            statusPagamentoLabel: null,

            metodoPagamento: null,

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

            observacoes:
                String(
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
                item.user_id ||
                null,

            created_at:
                item.created_at ||
                "",

            raw:
                item
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

        const {
            data,
            error
        } =
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

        console.log(
            "[CRM] Orçamentos encontrados:",
            data?.length || 0
        );

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

        console.log(
            "[CRM] Consultando ebook_pedidos..."
        );

        const {
            data,
            error
        } =
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

            console.error(
                "[CRM] ERRO KIWIFY / SUPABASE:",
                error
            );

            throw error;
        }

        console.log(
            "[CRM] Vendas Kiwify encontradas:",
            data?.length || 0
        );

        if (
            data &&
            data.length
        ) {

            console.table(
                data.map(
                    item => {

                        const normalizado =
                            normalizarKiwify(
                                item
                            );

                        return {

                            id:
                                item.id,

                            produto:
                                normalizado.produtoNome,

                            cliente:
                                normalizado.nome,

                            valor:
                                normalizado.valor,

                            pago:
                                normalizado.valorPago,

                            aberto:
                                normalizado.saldoAberto,

                            status:
                                normalizado.statusPagamento,

                            metodo:
                                normalizado.metodoPagamento,

                            order_id:
                                normalizado.order_id,

                            transaction_id:
                                normalizado.transaction_id
                        };
                    }
                )
            );

        } else {

            console.warn(
                "[CRM] A tabela ebook_pedidos retornou ZERO registros."
            );

            console.warn(
                "[CRM] Verifique se existem vendas na tabela Supabase."
            );
        }

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

        if (
            usuario?.id
        ) {

            query =
                query.eq(
                    "user_id",
                    usuario.id
                );
        }

        const {
            data,
            error
        } =
            await query;

        if (error) {

            console.warn(
                "[CRM] Leads manuais não carregados:",
                error.message
            );

            return [];
        }

        console.log(
            "[CRM] Leads manuais encontrados:",
            data?.length || 0
        );

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
            "[CRM] =================================="
        );

        console.log(
            "[CRM] TOTAL OPORTUNIDADES:",
            oportunidades.length
        );

        const kiwify =
            oportunidades.filter(
                item =>
                    item.tipo === "ebook"
            );

        console.log(
            "[CRM] TOTAL KIWIFY:",
            kiwify.length
        );

        const pago =
            kiwify.filter(
                item =>
                    item.statusPagamento ===
                    "pago"
            );

        const aberto =
            kiwify.filter(
                item =>
                    item.statusPagamento ===
                    "pendente"
            );

        const cancelado =
            kiwify.filter(
                item =>
                    item.statusPagamento ===
                    "cancelado"
            );

        console.log(
            "[CRM] KIWIFY PAGOS:",
            pago.length
        );

        console.log(
            "[CRM] KIWIFY EM ABERTO:",
            aberto.length
        );

        console.log(
            "[CRM] KIWIFY CANCELADOS:",
            cancelado.length
        );

        console.log(
            "[CRM] VALOR KIWIFY PAGO:",
            formatarMoeda(
                pago.reduce(
                    (total, item) =>
                        total +
                        valorNumero(
                            item.valorPago
                        ),
                    0
                )
            )
        );

        console.log(
            "[CRM] VALOR KIWIFY ABERTO:",
            formatarMoeda(
                aberto.reduce(
                    (total, item) =>
                        total +
                        valorNumero(
                            item.saldoAberto
                        ),
                    0
                )
            )
        );

        console.log(
            "[CRM] =================================="
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
                    item.tipo ===
                    "orcamento"
            ).length;

        const ebooks =
            oportunidades.filter(
                item =>
                    item.tipo ===
                    "ebook"
            ).length;

        const novos =
            oportunidades.filter(
                item =>
                    item.status ===
                    "novo"
            ).length;

        const pendentes =
            oportunidades.filter(
                item =>
                    item.status ===
                    "pendente"
            ).length;

        const andamento =
            oportunidades.filter(
                item =>
                    item.status ===
                    "em_andamento"
            ).length;

        const fechados =
            oportunidades.filter(
                item =>
                    item.status ===
                    "fechado"
            ).length;

        const cancelados =
            oportunidades.filter(
                item =>
                    item.status ===
                    "cancelado"
            ).length;

        /*
         * =====================================================
         * VALOR TOTAL DAS OPORTUNIDADES
         * =====================================================
         */

        const valor =
            oportunidades
                .filter(
                    item =>
                        item.status !==
                        "cancelado"
                )
                .reduce(
                    (
                        totalAtual,
                        item
                    ) =>
                        totalAtual +
                        valorNumero(
                            item.valor
                        ),
                    0
                );

        /*
         * =====================================================
         * KIWIFY
         * =====================================================
         */

        const kiwify =
            oportunidades.filter(
                item =>
                    item.tipo ===
                    "ebook"
            );

        /*
         * TOTAL GERADO
         */

        const valorKiwifyTotal =
            kiwify
                .filter(
                    item =>
                        item.statusPagamento !==
                        "cancelado"
                )
                .reduce(
                    (
                        totalAtual,
                        item
                    ) =>
                        totalAtual +
                        valorNumero(
                            item.valorTotal ??
                            item.valor
                        ),
                    0
                );

        /*
         * TOTAL PAGO
         */

        const valorKiwifyPago =
            kiwify
                .filter(
                    item =>
                        item.statusPagamento ===
                        "pago"
                )
                .reduce(
                    (
                        totalAtual,
                        item
                    ) =>
                        totalAtual +
                        valorNumero(
                            item.valorPago ||
                            item.valor
                        ),
                    0
                );

        /*
         * TOTAL EM ABERTO
         */

        const valorKiwifyAberto =
            kiwify
                .filter(
                    item =>
                        item.statusPagamento ===
                        "pendente"
                )
                .reduce(
                    (
                        totalAtual,
                        item
                    ) =>
                        totalAtual +
                        valorNumero(
                            item.saldoAberto ??
                            item.valor
                        ),
                    0
                );

        /*
         * =====================================================
         * PIX EM ABERTO
         * =====================================================
         */

        const pixAbertos =
            kiwify.filter(
                item =>
                    item.statusPagamento ===
                    "pendente" &&
                    normalizar(
                        item.metodoPagamento
                    ) === "pix"
            );

        const valorPixAberto =
            pixAbertos.reduce(
                (
                    totalAtual,
                    item
                ) =>
                    totalAtual +
                    valorNumero(
                        item.saldoAberto ??
                        item.valor
                    ),
                0
            );

        /*
         * =====================================================
         * BOLETO EM ABERTO
         * =====================================================
         */

        const boletosAbertos =
            kiwify.filter(
                item =>
                    item.statusPagamento ===
                    "pendente" &&
                    normalizar(
                        item.metodoPagamento
                    ) === "boleto"
            );

        const valorBoletoAberto =
            boletosAbertos.reduce(
                (
                    totalAtual,
                    item
                ) =>
                    totalAtual +
                    valorNumero(
                        item.saldoAberto ??
                        item.valor
                    ),
                0
            );

        /*
         * =====================================================
         * CONTADORES KIWIFY
         * =====================================================
         */

        const pixCount =
            pixAbertos.length;

        const boletoCount =
            boletosAbertos.length;

        const kiwifyPagoCount =
            kiwify.filter(
                item =>
                    item.statusPagamento ===
                    "pago"
            ).length;

        const kiwifyAbertoCount =
            kiwify.filter(
                item =>
                    item.statusPagamento ===
                    "pendente"
            ).length;

        /*
         * =====================================================
         * HTML PRINCIPAL
         * =====================================================
         */

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
         * =====================================================
         * CAMPOS KIWIFY
         * =====================================================
         */

        definirTexto(
            "valorKiwify",
            formatarMoeda(
                valorKiwifyTotal
            )
        );

        definirTexto(
            "kiwifyPago",
            formatarMoeda(
                valorKiwifyPago
            )
        );

        definirTexto(
            "kiwifyAberto",
            formatarMoeda(
                valorKiwifyAberto
            )
        );

        definirTexto(
            "kiwifyPixAberto",
            formatarMoeda(
                valorPixAberto
            )
        );

        definirTexto(
            "kiwifyBoletoAberto",
            formatarMoeda(
                valorBoletoAberto
            )
        );

        definirTexto(
            "kiwifyPixCount",
            pixCount
        );

        definirTexto(
            "kiwifyBoletoCount",
            boletoCount
        );

        definirTexto(
            "kiwifyPagoCount",
            kiwifyPagoCount
        );

        definirTexto(
            "kiwifyAbertoCount",
            kiwifyAbertoCount
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

                /*
                 * =================================================
                 * WHATSAPP
                 * =================================================
                 */

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
                                WhatsApp
                            </button>
                        `
                        : "";

                /*
                 * =================================================
                 * PAGAMENTO
                 * =================================================
                 */

                const pagamento =
                    oportunidade.tipo ===
                        "ebook" &&
                    oportunidade.payment_url
                        ? `
                            <button
                                type="button"
                                class="table-action"
                                data-action="payment"
                                data-id="${id}"
                                title="Abrir pagamento"
                            >
                                Pagar
                            </button>
                        `
                        : "";

                /*
                 * =================================================
                 * EDITAR
                 * =================================================
                 */

                const editar =
                    oportunidade.tipo ===
                        "lead"
                        ? `
                            <button
                                type="button"
                                class="table-action"
                                data-action="edit"
                                data-id="${origemId}"
                                title="Editar lead"
                            >
                                Editar
                            </button>

                            <button
                                type="button"
                                class="table-action delete"
                                data-action="delete"
                                data-id="${origemId}"
                                title="Excluir lead"
                            >
                                Excluir
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
                                Ver
                            </button>
                        `;

                /*
                 * =================================================
                 * BLOCO FINANCEIRO KIWIFY
                 * =================================================
                 */

                let financeiro = "";

                if (
                    oportunidade.tipo ===
                    "ebook"
                ) {

                    const pagamentoStatus =
                        oportunidade.statusPagamento ||
                        "pendente";

                    const pagamentoLabel =
                        oportunidade.statusPagamentoLabel ||
                        nomeStatusPagamento(
                            pagamentoStatus
                        );

                    const metodo =
                        escapar(
                            oportunidade.metodoPagamento ||
                            "Não informado"
                        );

                    const saldo =
                        calcularSaldo(
                            oportunidade
                        );

                    financeiro = `
                        <div
                            class="kiwify-payment-info"
                            title="Pagamento: ${metodo}"
                        >

                            <span
                                class="payment-status ${escapar(
                                    pagamentoStatus
                                )}"
                            >
                                ${escapar(
                                    pagamentoLabel
                                )}
                            </span>

                            <small>
                                ${metodo}
                            </small>

                            ${
                                pagamentoStatus ===
                                "pendente"
                                    ? `
                                        <small>
                                            Em aberto:
                                            ${formatarMoeda(
                                                saldo
                                            )}
                                        </small>
                                    `
                                    : ""
                            }

                        </div>
                    `;
                }

                /*
                 * =================================================
                 * STATUS
                 * =================================================
                 */

                let statusControle = "";

                if (
                    oportunidade.tipo ===
                    "ebook"
                ) {

                    /*
                     * Kiwify:
                     * status financeiro é somente leitura.
                     */

                    statusControle = `
                        <span
                            class="status-badge ${escapar(
                                oportunidade.statusPagamento ||
                                "pendente"
                            )}"
                            title="Status financeiro controlado pelo webhook Kiwify"
                        >
                            ${escapar(
                                nomeStatusPagamento(
                                    oportunidade.statusPagamento ||
                                    "pendente"
                                )
                            )}
                        </span>
                    `;

                } else {

                    statusControle = `
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
                                    status ===
                                    "novo"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Novo
                            </option>

                            <option
                                value="pendente"
                                ${
                                    status ===
                                    "pendente"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Pendente
                            </option>

                            <option
                                value="em_andamento"
                                ${
                                    status ===
                                    "em_andamento"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Em andamento
                            </option>

                            <option
                                value="fechado"
                                ${
                                    status ===
                                    "fechado"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Concluído
                            </option>

                            <option
                                value="cancelado"
                                ${
                                    status ===
                                    "cancelado"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Cancelado
                            </option>

                        </select>
                    `;
                }

                /*
                 * =================================================
                 * LINHA
                 * =================================================
                 */

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

                            ${
                                oportunidade.tipo ===
                                "ebook"
                                    ? financeiro
                                    : ""
                            }

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

                            ${
                                oportunidade.tipo ===
                                    "ebook" &&
                                oportunidade.statusPagamento ===
                                    "pendente"
                                    ? `
                                        <small
                                            class="table-open-value"
                                        >
                                            Aberto:
                                            ${formatarMoeda(
                                                oportunidade.saldoAberto
                                            )}
                                        </small>
                                    `
                                    : ""
                            }

                        </div>

                    </td>

                    <td>

                        ${statusControle}

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

                tableBody.appendChild(
                    tr
                );
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
                oportunidade.contato ||
                ""
            ).replace(
                /\D/g,
                ""
            );

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

            alert(
                "Este pedido não possui link de pagamento disponível."
            );

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

        /*
         * KIWIFY
         *
         * NUNCA alterar status financeiro
         * pelo CRM.
         */

        if (
            tipo === "ebook"
        ) {

            console.info(
                "[CRM] Status Kiwify é somente leitura."
            );

            await carregarOportunidades();

            return;
        }

        try {

            let resultado;

            /*
             * ORÇAMENTO
             */

            if (
                tipo === "orcamento"
            ) {

                resultado =
                    await supabase
                        .from(
                            "orcamentos"
                        )
                        .update({
                            status
                        })
                        .eq(
                            "id",
                            id
                        );

            }

            /*
             * LEAD
             */

            else if (
                tipo === "lead"
            ) {

                const usuario =
                    await obterUsuario();

                let query =
                    supabase
                        .from("leads")
                        .update({
                            etapa:
                                status
                        })
                        .eq(
                            "id",
                            id
                        );

                if (
                    usuario?.id
                ) {

                    query =
                        query.eq(
                            "user_id",
                            usuario.id
                        );
                }

                resultado =
                    await query;
            }

            else {
                return;
            }

            if (
                resultado.error
            ) {
                throw resultado.error;
            }

            await carregarOportunidades();

        } catch (error) {

            console.error(
                "[CRM] Erro ao alterar status:",
                error
            );

            alert(
                "Não foi possível alterar o status."
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
                    item.tipo ===
                        "lead" &&
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
                lead.origem ||
                "outro";
        }

        if (leadEtapa) {
            leadEtapa.value =
                lead.status ||
                "novo";
        }

        if (leadOrigemId) {
            leadOrigemId.value =
                lead.origemId ||
                "";
        }

        if (leadObs) {
            leadObs.value =
                lead.observacoes ||
                "";
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

    async function salvarLead(
        event
    ) {

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

            saveBtn.disabled =
                true;

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
                        .update(
                            payload
                        )
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

            if (
                resultado.error
            ) {
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

    async function excluirLead(
        id
    ) {

        const lead =
            oportunidades.find(
                item =>
                    item.tipo ===
                        "lead" &&
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

            const {
                error
            } =
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

    function visualizarOportunidade(
        id
    ) {

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

            oportunidade.produtoId
                ? `Produto ID: ${oportunidade.produtoId}`
                : "",

            oportunidade.produtoCodigo
                ? `Código: ${oportunidade.produtoCodigo}`
                : "",

            `Projeto: ${oportunidade.servico}`,

            oportunidade.valor > 0
                ? `Valor: ${formatarMoeda(
                    oportunidade.valor
                )}`
                : "Valor: Não informado",

            `Status CRM: ${nomeStatus(
                oportunidade.status
            )}`,

            oportunidade.statusPagamento
                ? `Status pagamento: ${nomeStatusPagamento(
                    oportunidade.statusPagamento
                )}`
                : "",

            oportunidade.metodoPagamento
                ? `Forma de pagamento: ${oportunidade.metodoPagamento}`
                : "",

            oportunidade.valorTotal > 0
                ? `Valor total: ${formatarMoeda(
                    oportunidade.valorTotal
                )}`
                : "",

            oportunidade.valorPago > 0
                ? `Valor pago: ${formatarMoeda(
                    oportunidade.valorPago
                )}`
                : "",

            oportunidade.statusPagamento ===
                "pendente"
                ? `Valor em aberto: ${formatarMoeda(
                    oportunidade.saldoAberto
                )}`
                : "",

            oportunidade.origemLabel
                ? `Origem: ${oportunidade.origemLabel}`
                : "",

            oportunidade.plano
                ? `Plano: ${oportunidade.plano}`
                : "",

            oportunidade.parcelas
                ? `Parcelas: ${oportunidade.parcelas}`
                : "",

            oportunidade.data_compra
                ? `Compra: ${formatarDataHora(
                    oportunidade.data_compra
                )}`
                : "",

            oportunidade.paid_at
                ? `Pagamento: ${formatarDataHora(
                    oportunidade.paid_at
                )}`
                : "",

            oportunidade.order_id
                ? `Order ID: ${oportunidade.order_id}`
                : "",

            oportunidade.transaction_id
                ? `Transaction ID: ${oportunidade.transaction_id}`
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
       EVENTOS TABELA
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
                        String(
                            item.id
                        ) === String(id)
                );

            if (
                action ===
                    "whatsapp" &&
                oportunidade
            ) {

                abrirWhatsApp(
                    oportunidade
                );
            }

            if (
                action ===
                    "payment" &&
                oportunidade
            ) {

                abrirPagamento(
                    oportunidade
                );
            }

            if (
                action === "edit"
            ) {

                editarLead(id);
            }

            if (
                action === "delete"
            ) {

                excluirLead(id);
            }

            if (
                action === "view"
            ) {

                visualizarOportunidade(
                    id
                );
            }
        }
    );

    /* =========================================================
       STATUS
    ========================================================= */

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
       MODAL EVENTOS
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
                event.key ===
                    "Escape" &&
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
       VALOR INPUT
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
                    weekday:
                        "long",

                    day:
                        "2-digit",

                    month:
                        "long"
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
            () => [
                ...oportunidades
            ],

        listarKiwify:
            () =>
                oportunidades.filter(
                    item =>
                        item.tipo ===
                        "ebook"
                ),

        listarKiwifyAbertos:
            () =>
                oportunidades.filter(
                    item =>
                        item.tipo ===
                            "ebook" &&
                        item.statusPagamento ===
                            "pendente"
                ),

        valorKiwifyAberto:
            () =>
                oportunidades
                    .filter(
                        item =>
                            item.tipo ===
                                "ebook" &&
                            item.statusPagamento ===
                                "pendente"
                    )
                    .reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            valorNumero(
                                item.saldoAberto ??
                                item.valor
                            ),
                        0
                    ),

        valorKiwifyPago:
            () =>
                oportunidades
                    .filter(
                        item =>
                            item.tipo ===
                                "ebook" &&
                            item.statusPagamento ===
                                "pago"
                    )
                    .reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            valorNumero(
                                item.valorPago ||
                                item.valor
                            ),
                        0
                    ),

        valorPixAberto:
            () =>
                oportunidades
                    .filter(
                        item =>
                            item.tipo ===
                                "ebook" &&
                            item.statusPagamento ===
                                "pendente" &&
                            normalizar(
                                item.metodoPagamento
                            ) ===
                                "pix"
                    )
                    .reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            valorNumero(
                                item.saldoAberto ??
                                item.valor
                            ),
                        0
                    ),

        valorBoletoAberto:
            () =>
                oportunidades
                    .filter(
                        item =>
                            item.tipo ===
                                "ebook" &&
                            item.statusPagamento ===
                                "pendente" &&
                            normalizar(
                                item.metodoPagamento
                            ) ===
                                "boleto"
                    )
                    .reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            valorNumero(
                                item.saldoAberto ??
                                item.valor
                            ),
                        0
                    )
    };

    /* =========================================================
       INIT
    ========================================================= */

    function iniciar() {

        console.log(
            "[CRM] Leads & Oportunidades iniciando..."
        );

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

