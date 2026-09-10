"use strict";

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
    SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
        ? createClient(
              SUPABASE_URL,
              SUPABASE_SERVICE_ROLE_KEY,
              {
                  auth: {
                      autoRefreshToken: false,
                      persistSession: false
                  }
              }
          )
        : null;

/* ============================================================
   HELPERS
============================================================ */

function primeiro(...valores) {
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

    const n = Number(texto);

    return Number.isFinite(n) ? n : 0;
}

/*
 * Kiwify envia os valores financeiros em centavos.
 */
function reaisDeCentavos(valor) {
    return Number(
        (numero(valor) / 100).toFixed(2)
    );
}

function dataValida(valor) {
    if (!valor) {
        return null;
    }

    const data = new Date(
        String(valor).replace(" ", "T")
    );

    if (Number.isNaN(data.getTime())) {
        return null;
    }

    return data.toISOString();
}

/* ============================================================
   STATUS
============================================================ */

function normalizarStatus(payload) {
    const status = String(
        primeiro(
            payload.order_status,
            payload.status,
            payload.payment_status,
            ""
        )
    )
        .toLowerCase()
        .trim()
        .replace(/[_-]/g, " ");

    const evento = String(
        payload.webhook_event_type || ""
    )
        .toLowerCase()
        .trim();

    /*
     * Eventos que representam pagamento confirmado
     */
  if (
    status === "paid" ||
    status === "approved" ||
    status === "completed" ||
    status === "complete" ||
    status === "confirmed" ||
    evento.includes("approved") ||
    evento.includes("paid") ||
    evento.includes("sale_completed") ||
    evento.includes("subscription_charge")
) {
        return "pago";
    }

    /*
     * Cancelamento / reembolso / chargeback
     */
    if (
        status.includes("refunded") ||
        status.includes("refund") ||
        status.includes("cancel") ||
        status.includes("chargeback") ||
        evento.includes("refund") ||
        evento.includes("chargeback") ||
        evento.includes("cancel")
    ) {
        return "cancelado";
    }

    /*
     * waiting_payment
     * waiting
     * pending
     * pix_created
     * billet_created
     */
    return "pendente";
}

/* ============================================================
   MÉTODO DE PAGAMENTO
============================================================ */

function normalizarMetodo(payload) {
    const metodo = String(
        primeiro(
            payload.payment_method,
            payload.paymentMethod,
            payload.metodo_pagamento,
            ""
        )
    )
        .toLowerCase()
        .trim();

    if (metodo.includes("pix")) {
        return "PIX";
    }

    if (
        metodo.includes("boleto") ||
        metodo.includes("billet")
    ) {
        return "Boleto";
    }

    if (
        metodo.includes("credit") ||
        metodo.includes("card") ||
        metodo.includes("credito")
    ) {
        return "Cartão";
    }

    if (
        metodo.includes("debit") ||
        metodo.includes("debito")
    ) {
        return "Débito";
    }

    return metodo
        ? payload.payment_method
        : "Não informado";
}

/* ============================================================
   MONTAGEM DO REGISTRO
============================================================ */

function montarRegistro(payload) {
    const customer =
        payload.Customer ||
        payload.customer ||
        {};

    const product =
        payload.Product ||
        payload.product ||
        {};

    const commissions =
        payload.Commissions ||
        payload.commissions ||
        {};

    const status =
        normalizarStatus(payload);

    /*
     * Valor principal da venda.
     *
     * Prioridade:
     * charge_amount
     * product_base_price
     * settlement_amount
     */

    const valorTotalCentavos =
        primeiro(
            commissions.charge_amount,
            commissions.product_base_price,
            payload.amount,
            payload.value,
            payload.total
        );

    const valorTotal =
        reaisDeCentavos(
            valorTotalCentavos
        );

    const valorLiquido =
        reaisDeCentavos(
            primeiro(
                commissions.settlement_amount,
                payload.valor_liquido,
                payload.net_amount
            )
        );

    let valorPago = 0;

    if (status === "pago") {
        valorPago = valorTotal;
    }

    /*
     * Dados do cliente
     */

    const nome =
        primeiro(
            customer.full_name,
            customer.name,
            customer.nome
        );

    const email =
        primeiro(
            customer.email
        );

    const telefone =
        primeiro(
            customer.mobile,
            customer.phone,
            customer.telefone
        );

    const documento =
        primeiro(
            customer.CPF,
            customer.cpf,
            customer.document,
            customer.documento,
            customer.cnpj
        );

    /*
     * Identificadores
     */

    const orderId =
        primeiro(
            payload.order_id,
            payload.orderId
        );

    const transactionId =
        primeiro(
            payload.transaction_id,
            payload.transactionId
        );

    const kiwifyId =
        primeiro(
            payload.kiwify_id,
            payload.id,
            payload.order_ref
        );

    /*
     * Datas
     */

    const dataCompra =
        dataValida(
            primeiro(
                payload.created_at,
                payload.createdAt
            )
        );

    const dataPagamento =
        dataValida(
            primeiro(
                payload.approved_date,
                payload.paid_at,
                payload.payment_date
            )
        );

    /*
     * Parcelas
     */

    const parcelasNumero =
        Number(
            primeiro(
                payload.installments,
                payload.parcelas,
                1
            )
        );

    /*
     * Quantidade
     */

    const quantidadeNumero =
        Number(
            primeiro(
                payload.quantity,
                payload.quantidade,
                1
            )
        );

    /*
     * Afiliado
     */

    const afiliado =
        (
            commissions.commissioned_stores ||
            []
        ).find(
            item =>
                String(item.type || "")
                    .toLowerCase() ===
                "affiliate"
        );

    return {
        kiwify_id: kiwifyId,

        transaction_id:
            transactionId,

        order_id:
            orderId,

        produto_id:
            primeiro(
                product.product_id,
                product.id
            ),

        produto_nome:
            primeiro(
                product.product_name,
                product.name,
                "E-book"
            ),

        produto_codigo:
            primeiro(
                product.product_code,
                product.code
            ),

        produto_tipo:
            primeiro(
                payload.product_type,
                "ebook"
            ),

        nome,

        email,

        telefone,

        documento,

        valor:
            valorTotal,

        valor_pago:
            valorPago,

        valor_total:
            valorTotal,

        valor_liquido:
            valorLiquido,

        moeda:
            commissions.currency ||
            "BRL",

        status,

        metodo_pagamento:
            normalizarMetodo(payload),

        parcelas:
            Number.isFinite(parcelasNumero)
                ? parcelasNumero
                : 1,

        quantidade:
            Number.isFinite(quantidadeNumero)
                ? quantidadeNumero
                : 1,

        afiliado_id:
            afiliado?.affiliate_id ||
            null,

        afiliado_nome:
            afiliado?.custom_name ||
            null,

        origem:
            "kiwify",

        data_compra:
            dataCompra,

        data_pagamento:
            dataPagamento,

        descricao:
            primeiro(
                product.product_name,
                "E-book"
            ),

        observacoes:
            primeiro(
                payload.webhook_event_type,
                payload.order_status
            ),

        raw_payload:
            payload,

        updated_at:
            new Date().toISOString()
    };
}

/* ============================================================
   LOCALIZAR PEDIDO
============================================================ */

async function localizarPedido(registro) {

    if (registro.order_id) {

        const { data, error } =
            await supabase
                .from("ebook_pedidos")
                .select("id")
                .eq(
                    "order_id",
                    registro.order_id
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

    if (registro.transaction_id) {

        const { data, error } =
            await supabase
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

        const { data, error } =
            await supabase
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
   SALVAR
============================================================ */

async function salvarPedido(registro) {

    const idExistente =
        await localizarPedido(registro);

    if (idExistente) {

        const { data, error } =
            await supabase
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

    const { data, error } =
        await supabase
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

module.exports = async function handler(
    req,
    res
) {

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

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    /*
     * GET
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
     * POST
     */

    if (req.method !== "POST") {

        return res.status(405).json({
            ok: false,
            error: "Método não permitido."
        });
    }

    /*
     * Ambiente
     */

    if (!supabase) {

        return res.status(500).json({
            ok: false,
            error:
                "Supabase não configurado."
        });
    }

    try {

        const payload =
            req.body || {};

        console.log(
            "[KIWIFY] Evento recebido:",
            payload.webhook_event_type
        );

        console.log(
            "[KIWIFY] Pedido:",
            payload.order_id
        );

        /*
         * Montar registro
         */

        const registro =
            montarRegistro(payload);

        console.log(
            "[KIWIFY] Registro:",
            {
                nome: registro.nome,
                email: registro.email,
                telefone: registro.telefone,
                documento:
                    registro.documento,
                produto:
                    registro.produto_nome,
                valor:
                    registro.valor_total,
                valor_pago:
                    registro.valor_pago,
                status:
                    registro.status,
                metodo:
                    registro.metodo_pagamento,
                order_id:
                    registro.order_id
            }
        );

        /*
         * Salvar
         */

        const resultado =
            await salvarPedido(
                registro
            );

        console.log(
            "[KIWIFY] Salvo:",
            resultado.action,
            resultado.data?.id
        );

        return res.status(200).json({

            ok: true,

            message:
                resultado.action ===
                "inserted"
                    ? "Pedido inserido no Supabase."
                    : "Pedido atualizado no Supabase.",

            action:
                resultado.action,

            pedido_id:
                resultado.data?.id ||
                null,

            order_id:
                registro.order_id ||
                null,

            status:
                registro.status,

            metodo_pagamento:
                registro.metodo_pagamento,

            valor:
                registro.valor_total
        });

    } catch (error) {

        console.error(
            "[KIWIFY] ERRO:",
            error
        );

        return res.status(500).json({

            ok: false,

            error:
                error?.message ||
                "Erro ao processar webhook.",

            details:
                error?.details ||
                null,

            hint:
                error?.hint ||
                null,

            code:
                error?.code ||
                null
        });
    }
};