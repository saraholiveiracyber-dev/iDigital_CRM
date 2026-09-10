/**
 * ============================================================
 * iDigital CRM
 * API — Kiwify Webhook
 * ============================================================
 *
 * Endpoint:
 * POST /api/kiwify-webhook
 *
 * Variáveis necessárias na Vercel:
 * SUPABASE_URL
 * SUPABASE_SERVICE_ROLE_KEY
 *
 * Tabela:
 * public.ebook_pedidos
 * ============================================================
 */

"use strict";

const { createClient } = require("@supabase/supabase-js");

/* ============================================================
   CONFIGURAÇÃO
============================================================ */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

/* ============================================================
   HELPERS
============================================================ */

function primeiroValor(...valores) {
    for (const valor of valores) {
        if (
            valor !== undefined &&
            valor !== null &&
            valor !== ""
        ) {
            return valor;
        }
    }

    return null;
}

function caminho(obj, caminhos) {
    for (const caminhoAtual of caminhos) {
        const partes = caminhoAtual.split(".");
        let atual = obj;

        for (const parte of partes) {
            if (
                atual === undefined ||
                atual === null
            ) {
                break;
            }

            atual = atual[parte];
        }

        if (
            atual !== undefined &&
            atual !== null &&
            atual !== ""
        ) {
            return atual;
        }
    }

    return null;
}

function numero(valor) {
    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return 0;
    }

    if (typeof valor === "number") {
        return Number.isFinite(valor) ? valor : 0;
    }

    let texto = String(valor)
        .trim()
        .replace(/[R$\s]/g, "");

    /*
     * Trata:
     * 89,90
     * 89.90
     * 1.299,90
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

    const resultado = Number(texto);

    return Number.isFinite(resultado)
        ? resultado
        : 0;
}

function dataValida(valor) {
    if (!valor) {
        return null;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return null;
    }

    return data.toISOString();
}

/* ============================================================
   STATUS DO PEDIDO
============================================================ */

function normalizarStatus(valor) {
    const texto = String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[_-]/g, " ");

    /*
     * PAGOS
     */

    const pagos = [
        "paid",
        "pago",
        "pagamento aprovado",
        "approved",
        "aprovado",
        "completed",
        "complete",
        "confirmed",
        "confirmado",
        "success",
        "successful",
        "succeeded",
        "captured",
        "authorized",
        "autorizado"
    ];

    if (pagos.includes(texto)) {
        return "pago";
    }

    /*
     * CANCELADOS / REEMBOLSADOS
     */

    const cancelados = [
        "cancelled",
        "canceled",
        "cancelado",
        "refunded",
        "refund",
        "reembolsado",
        "chargeback",
        "chargedback",
        "recusado",
        "rejected",
        "denied",
        "failed",
        "failure"
    ];

    if (cancelados.includes(texto)) {
        return "cancelado";
    }

    /*
     * TODO O RESTANTE FICA COMO PENDENTE
     *
     * Exemplos:
     * waiting_payment
     * waiting
     * pending
     * pendente
     * boleto
     * pix aguardando
     */

    return "pendente";
}

/* ============================================================
   MÉTODO DE PAGAMENTO
============================================================ */

function normalizarMetodoPagamento(valor) {
    const texto = String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[_-]/g, " ");

    if (
        texto.includes("pix")
    ) {
        return "PIX";
    }

    if (
        texto.includes("boleto") ||
        texto.includes("bank slip") ||
        texto.includes("bankslip")
    ) {
        return "Boleto";
    }

    if (
        texto.includes("credit") ||
        texto.includes("credito") ||
        texto.includes("cartao") ||
        texto.includes("card")
    ) {
        return "Cartão";
    }

    if (
        texto.includes("debit") ||
        texto.includes("debito")
    ) {
        return "Débito";
    }

    if (texto) {
        return valor;
    }

    return "Não informado";
}

/* ============================================================
   EXTRAÇÃO DO CLIENTE
============================================================ */

function extrairCliente(payload) {
    const cliente =
        payload?.customer ||
        payload?.client ||
        payload?.buyer ||
        payload?.comprador ||
        payload?.data?.customer ||
        payload?.data?.buyer ||
        {};

    return {
        nome: primeiroValor(
            cliente.name,
            cliente.nome,
            payload.name,
            payload.nome,
            payload.customer_name,
            payload.buyer_name,
            payload.data?.name,
            payload.data?.nome
        ),

        email: primeiroValor(
            cliente.email,
            payload.email,
            payload.customer_email,
            payload.buyer_email,
            payload.data?.email
        ),

        telefone: primeiroValor(
            cliente.phone,
            cliente.telefone,
            cliente.mobile,
            payload.phone,
            payload.telefone,
            payload.customer_phone,
            payload.buyer_phone,
            payload.data?.phone
        ),

        documento: primeiroValor(
            cliente.document,
            cliente.documento,
            cliente.cpf,
            payload.document,
            payload.documento,
            payload.cpf,
            payload.customer_document,
            payload.buyer_document,
            payload.data?.document
        )
    };
}

/* ============================================================
   EXTRAÇÃO DO PRODUTO
============================================================ */

function extrairProduto(payload) {
    const produto =
        payload?.product ||
        payload?.produto ||
        payload?.data?.product ||
        payload?.data?.produto ||
        {};

    const offer =
        payload?.offer ||
        payload?.oferta ||
        payload?.data?.offer ||
        payload?.data?.oferta ||
        {};

    return {
        id: primeiroValor(
            produto.id,
            produto.product_id,
            produto.codigo,
            payload.product_id,
            payload.produto_id,
            payload.data?.product_id
        ),

        nome: primeiroValor(
            produto.name,
            produto.nome,
            produto.title,
            payload.product_name,
            payload.produto_nome,
            payload.produto,
            payload.product,
            payload.data?.product_name,
            "E-book"
        ),

        codigo: primeiroValor(
            produto.code,
            produto.codigo,
            produto.slug,
            payload.product_code,
            payload.produto_codigo
        ),

        tipo: primeiroValor(
            produto.type,
            produto.tipo,
            payload.product_type,
            "ebook"
        ),

        oferta: primeiroValor(
            offer.name,
            offer.nome,
            offer.title,
            payload.offer_name,
            payload.oferta
        )
    };
}

/* ============================================================
   EXTRAÇÃO DOS IDENTIFICADORES
============================================================ */

function extrairIdentificadores(payload) {
    return {
        kiwify_id: primeiroValor(
            payload.kiwify_id,
            payload.kiwifyId,
            payload.id,
            payload.data?.id
        ),

        transaction_id: primeiroValor(
            payload.transaction_id,
            payload.transactionId,
            payload.kiwify_transaction_id,
            payload.data?.transaction_id,
            payload.transaction?.id
        ),

        order_id: primeiroValor(
            payload.order_id,
            payload.orderId,
            payload.kiwify_order_id,
            payload.data?.order_id,
            payload.order?.id
        )
    };
}

/* ============================================================
   EXTRAÇÃO FINANCEIRA
============================================================ */

function extrairFinanceiro(payload) {
    const payment =
        payload?.payment ||
        payload?.pagamento ||
        payload?.data?.payment ||
        payload?.data?.pagamento ||
        {};

    const sale =
        payload?.sale ||
        payload?.venda ||
        payload?.data?.sale ||
        payload?.data?.venda ||
        {};

    const valorTotal = numero(
        primeiroValor(
            payload.valor_total,
            payload.valorTotal,
            payload.total,
            payload.amount,
            payload.purchase_amount,

            sale.valor_total,
            sale.total,
            sale.amount,

            payload.data?.valor_total,
            payload.data?.total,

            payload.valor,
            payload.value,
            payload.price,

            payment.amount,
            payment.value
        )
    );

    let valorPago = numero(
        primeiroValor(
            payload.valor_pago,
            payload.valorPago,
            payload.paid_amount,
            payload.amount_paid,

            sale.valor_pago,
            sale.paid_amount,

            payment.paid_amount,
            payment.amount_paid
        )
    );

    const status = normalizarStatus(
        primeiroValor(
            payload.status,
            payload.payment_status,
            payload.sale_status,
            payload.data?.status,
            payment.status,
            sale.status
        )
    );

    /*
     * Se o pedido está pago e a Kiwify não enviou
     * valor_pago separado, usamos o valor total.
     */

    if (
        status === "pago" &&
        valorPago <= 0
    ) {
        valorPago = valorTotal;
    }

    const valorLiquido = numero(
        primeiroValor(
            payload.valor_liquido,
            payload.valorLiquido,
            payload.net_amount,
            payload.net_value,

            sale.valor_liquido,
            sale.net_amount,

            payment.net_amount
        )
    );

    const metodo = normalizarMetodoPagamento(
        primeiroValor(
            payload.metodo_pagamento,
            payload.metodoPagamento,
            payload.payment_method,
            payload.paymentMethod,
            payload.method,

            payment.method,
            payment.payment_method,
            payment.type,

            sale.payment_method
        )
    );

    const parcelasNumero = Number(
        primeiroValor(
            payload.parcelas,
            payload.installments,
            payload.installment_count,
            payment.installments,
            sale.installments,
            1
        )
    );

    const quantidadeNumero = Number(
        primeiroValor(
            payload.quantidade,
            payload.quantity,
            payload.qty,
            sale.quantity,
            1
        )
    );

    return {
        valor: valorTotal,
        valor_total: valorTotal,
        valor_pago: valorPago,
        valor_liquido: valorLiquido,
        moeda: primeiroValor(
            payload.moeda,
            payload.currency,
            payment.currency,
            "BRL"
        ),
        status,
        metodo_pagamento: metodo,
        parcelas: Number.isFinite(parcelasNumero)
            ? parcelasNumero
            : 1,
        quantidade: Number.isFinite(quantidadeNumero)
            ? quantidadeNumero
            : 1
    };
}

/* ============================================================
   EXTRAÇÃO DE DATAS
============================================================ */

function extrairDatas(payload) {
    const payment =
        payload?.payment ||
        payload?.pagamento ||
        payload?.data?.payment ||
        {};

    const dataCompra = dataValida(
        primeiroValor(
            payload.data_compra,
            payload.dataCompra,
            payload.purchase_date,
            payload.created_at,
            payload.createdAt,
            payload.created,
            payload.data?.created_at,
            payload.data?.createdAt
        )
    );

    const dataPagamento = dataValida(
        primeiroValor(
            payload.data_pagamento,
            payload.dataPagamento,
            payload.paid_at,
            payload.paidAt,
            payload.payment_date,
            payload.paymentDate,
            payment.paid_at,
            payment.paidAt,
            payload.data?.paid_at
        )
    );

    return {
        data_compra: dataCompra,
        data_pagamento: dataPagamento
    };
}

/* ============================================================
   MONTAR REGISTRO
============================================================ */

function montarRegistro(payload) {
    const cliente = extrairCliente(payload);
    const produto = extrairProduto(payload);
    const ids = extrairIdentificadores(payload);
    const financeiro = extrairFinanceiro(payload);
    const datas = extrairDatas(payload);

    const afiliado =
        payload?.affiliate ||
        payload?.afiliado ||
        payload?.data?.affiliate ||
        {};

    return {
        kiwify_id: ids.kiwify_id,

        transaction_id:
            ids.transaction_id,

        order_id:
            ids.order_id,

        produto_id:
            produto.id,

        produto_nome:
            produto.nome,

        produto_codigo:
            produto.codigo,

        produto_tipo:
            produto.tipo,

        nome:
            cliente.nome,

        email:
            cliente.email,

        telefone:
            cliente.telefone,

        documento:
            cliente.documento,

        valor:
            financeiro.valor,

        valor_pago:
            financeiro.valor_pago,

        valor_total:
            financeiro.valor_total,

        valor_liquido:
            financeiro.valor_liquido,

        moeda:
            financeiro.moeda,

        status:
            financeiro.status,

        metodo_pagamento:
            financeiro.metodo_pagamento,

        parcelas:
            financeiro.parcelas,

        quantidade:
            financeiro.quantidade,

        afiliado_id:
            primeiroValor(
                afiliado.id,
                afiliado.affiliate_id,
                payload.affiliate_id,
                payload.afiliado_id
            ),

        afiliado_nome:
            primeiroValor(
                afiliado.name,
                afiliado.nome,
                payload.affiliate_name,
                payload.afiliado_nome
            ),

        origem:
            "kiwify",

        data_compra:
            datas.data_compra,

        data_pagamento:
            datas.data_pagamento,

        descricao:
            primeiroValor(
                payload.descricao,
                payload.description,
                produto.oferta,
                produto.nome
            ),

        observacoes:
            primeiroValor(
                payload.observacoes,
                payload.observations,
                payload.note,
                payload.notes
            ),

        raw_payload:
            payload,

        updated_at:
            new Date().toISOString()
    };
}

/* ============================================================
   LOCALIZAR PEDIDO EXISTENTE
============================================================ */

async function localizarPedido(registro) {
    if (!supabase) {
        throw new Error(
            "Supabase não configurado."
        );
    }

    /*
     * Prioridade:
     * 1. order_id
     * 2. transaction_id
     * 3. kiwify_id
     */

    if (registro.order_id) {
        const { data, error } = await supabase
            .from("ebook_pedidos")
            .select("id")
            .eq("order_id", registro.order_id)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {
            return data.id;
        }
    }

    if (registro.transaction_id) {
        const { data, error } = await supabase
            .from("ebook_pedidos")
            .select("id")
            .eq(
                "transaction_id",
                registro.transaction_id
            )
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {
            return data.id;
        }
    }

    if (registro.kiwify_id) {
        const { data, error } = await supabase
            .from("ebook_pedidos")
            .select("id")
            .eq(
                "kiwify_id",
                registro.kiwify_id
            )
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {
            return data.id;
        }
    }

    return null;
}

/* ============================================================
   SALVAR NO SUPABASE
============================================================ */

async function salvarPedido(registro) {
    const idExistente =
        await localizarPedido(registro);

    if (idExistente) {
        const { data, error } = await supabase
            .from("ebook_pedidos")
            .update(registro)
            .eq("id", idExistente)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return {
            action: "updated",
            data
        };
    }

    const { data, error } = await supabase
        .from("ebook_pedidos")
        .insert(registro)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return {
        action: "inserted",
        data
    };
}

/* ============================================================
   HANDLER
============================================================ */

module.exports = async function handler(req, res) {

    /*
     * CORS
     */

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    /*
     * OPTIONS
     */

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    /*
     * GET = TESTE
     */

    if (req.method === "GET") {
        return res.status(200).json({
            ok: true,
            service: "kiwify-webhook",
            status: "online",
            database:
                !!(
                    SUPABASE_URL &&
                    SUPABASE_SERVICE_ROLE_KEY
                ),
            timestamp:
                new Date().toISOString()
        });
    }

    /*
     * Somente POST para receber eventos
     */

    if (req.method !== "POST") {
        return res.status(405).json({
            ok: false,
            error: "Método não permitido."
        });
    }

    /*
     * Verificar ambiente
     */

    if (
        !SUPABASE_URL ||
        !SUPABASE_SERVICE_ROLE_KEY
    ) {
        console.error(
            "[KIWIFY] Variáveis do Supabase ausentes."
        );

        return res.status(500).json({
            ok: false,
            error:
                "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurada."
        });
    }

    try {

        const payload = req.body || {};

        console.log(
            "[KIWIFY] Webhook recebido."
        );

        console.log(
            "[KIWIFY] Evento:",
            primeiroValor(
                payload.event,
                payload.event_type,
                payload.type,
                payload.status,
                "não informado"
            )
        );

        /*
         * Montar registro
         */

        const registro =
            montarRegistro(payload);

        /*
         * Segurança mínima:
         * precisa existir algum identificador.
         */

        if (
            !registro.order_id &&
            !registro.transaction_id &&
            !registro.kiwify_id
        ) {
            console.warn(
                "[KIWIFY] Nenhum identificador encontrado."
            );

            /*
             * Ainda salvamos caso a Kiwify tenha enviado
             * dados de cliente/venda.
             */

            if (
                !registro.email &&
                !registro.nome
            ) {
                return res.status(400).json({
                    ok: false,
                    error:
                        "Webhook sem identificador ou dados do cliente."
                });
            }
        }

        /*
         * Salvar
         */

        const resultado =
            await salvarPedido(registro);

        /*
         * Log resumido
         */

        console.log(
            "[KIWIFY] Pedido salvo:",
            {
                action:
                    resultado.action,

                id:
                    resultado.data?.id,

                order_id:
                    registro.order_id,

                transaction_id:
                    registro.transaction_id,

                nome:
                    registro.nome,

                email:
                    registro.email,

                status:
                    registro.status,

                metodo_pagamento:
                    registro.metodo_pagamento,

                valor:
                    registro.valor_total
            }
        );

        /*
         * Resposta
         */

        return res.status(200).json({
            ok: true,

            message:
                resultado.action === "inserted"
                    ? "Pedido inserido no Supabase."
                    : "Pedido atualizado no Supabase.",

            action:
                resultado.action,

            pedido_id:
                resultado.data?.id || null,

            order_id:
                registro.order_id || null,

            transaction_id:
                registro.transaction_id || null,

            status:
                registro.status,

            metodo_pagamento:
                registro.metodo_pagamento,

            valor:
                registro.valor_total
        });

    } catch (error) {

        console.error(
            "[KIWIFY] ERRO:"
        );

        console.error({
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code
        });

        return res.status(500).json({
            ok: false,

            error:
                error?.message ||
                "Erro ao processar webhook.",

            details:
                error?.details || null,

            hint:
                error?.hint || null,

            code:
                error?.code || null
        });
    }
};