// =========================================================
// iDIGITAL CRM
// KIWIFY WEBHOOK
// Kiwify → Vercel → Supabase → ebook_pedidos
// =========================================================

"use strict";

const { createClient } = require("@supabase/supabase-js");

// =========================================================
// CONFIGURAÇÃO
// =========================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

// =========================================================
// SUPABASE
// =========================================================

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
    );
}

// =========================================================
// FUNÇÕES AUXILIARES
// =========================================================

function primeiroValor(...valores) {
    for (const valor of valores) {
        if (
            valor !== undefined &&
            valor !== null &&
            String(valor).trim() !== ""
        ) {
            return valor;
        }
    }

    return null;
}

function numero(valor) {
    if (valor === undefined || valor === null) {
        return 0;
    }

    if (typeof valor === "number") {
        return valor;
    }

    let texto = String(valor)
        .trim()
        .replace(/[R$\s]/g, "");

    // Exemplo:
    // 89,90 → 89.90
    if (
        texto.includes(",") &&
        texto.includes(".")
    ) {
        texto = texto
            .replace(/\./g, "")
            .replace(",", ".");
    } else {
        texto = texto.replace(",", ".");
    }

    const resultado = Number(texto);

    return Number.isFinite(resultado)
        ? resultado
        : 0;
}

function normalizarStatus(status) {
    if (!status) {
        return "pendente";
    }

    const valor = String(status)
        .trim()
        .toLowerCase();

    if (
        [
            "paid",
            "pago",
            "approved",
            "aprovado",
            "completed",
            "complete",
            "concluido",
            "concluído"
        ].includes(valor)
    ) {
        return "pago";
    }

    if (
        [
            "refunded",
            "refund",
            "reembolsado",
            "chargeback",
            "chargedback",
            "cancelled",
            "canceled",
            "cancelado"
        ].includes(valor)
    ) {
        return "cancelado";
    }

    return "pendente";
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

// =========================================================
// HANDLER
// =========================================================

module.exports = async function handler(req, res) {

    // -----------------------------------------------------
    // TESTE GET
    // -----------------------------------------------------

    if (req.method === "GET") {
        return res.status(200).json({
            ok: true,
            service: "kiwify-webhook",
            app: "iDigital CRM",
            message: "Webhook Kiwify ativo."
        });
    }

    // -----------------------------------------------------
    // SOMENTE POST
    // -----------------------------------------------------

    if (req.method !== "POST") {
        return res.status(405).json({
            ok: false,
            error: "Método não permitido."
        });
    }

    // -----------------------------------------------------
    // VERIFICAR CONFIGURAÇÃO
    // -----------------------------------------------------

    if (!SUPABASE_URL) {
        console.error(
            "SUPABASE_URL não configurada."
        );

        return res.status(500).json({
            ok: false,
            error: "SUPABASE_URL não configurada."
        });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.error(
            "SUPABASE_SERVICE_ROLE_KEY não configurada."
        );

        return res.status(500).json({
            ok: false,
            error:
                "SUPABASE_SERVICE_ROLE_KEY não configurada."
        });
    }

    if (!supabase) {
        return res.status(500).json({
            ok: false,
            error:
                "Cliente Supabase não foi inicializado."
        });
    }

    // -----------------------------------------------------
    // RECEBER PAYLOAD
    // -----------------------------------------------------

    try {

        const payload = req.body || {};

        console.log(
            "===================================="
        );

        console.log(
            "WEBHOOK KIWIFY RECEBIDO"
        );

        console.log(
            JSON.stringify(
                payload,
                null,
                2
            )
        );

        console.log(
            "===================================="
        );

        // -------------------------------------------------
        // DADOS DO CLIENTE
        // -------------------------------------------------

        const cliente =
            payload.Customer ||
            payload.customer ||
            payload.cliente ||
            {};

        // -------------------------------------------------
        // DADOS DA VENDA
        // -------------------------------------------------

        const venda =
            payload.order ||
            payload.Order ||
            payload.sale ||
            payload.Sale ||
            payload.purchase ||
            {};

        // -------------------------------------------------
        // IDENTIFICADORES
        // -------------------------------------------------

        const orderId =
            primeiroValor(
                payload.order_id,
                payload.orderId,
                payload.id,
                venda.order_id,
                venda.orderId,
                venda.id
            );

        const transactionId =
            primeiroValor(
                payload.transaction_id,
                payload.transactionId,
                payload.transaction,
                venda.transaction_id,
                venda.transactionId,
                venda.transaction
            );

        // -------------------------------------------------
        // CLIENTE
        // -------------------------------------------------

        const nome =
            primeiroValor(
                payload.customer_name,
                payload.name,
                payload.nome,
                cliente.name,
                cliente.nome
            );

        const email =
            primeiroValor(
                payload.customer_email,
                payload.email,
                cliente.email
            );

        const telefone =
            primeiroValor(
                payload.customer_phone,
                payload.phone,
                payload.telefone,
                cliente.phone,
                cliente.telefone
            );

        const cpf =
            primeiroValor(
                payload.customer_cpf,
                payload.cpf,
                cliente.cpf,
                cliente.document
            );

        // -------------------------------------------------
        // PRODUTO
        // -------------------------------------------------

        const produto =
            primeiroValor(
                payload.product_name,
                payload.product,
                payload.produto,
                venda.product_name,
                venda.product
            );

        const oferta =
            primeiroValor(
                payload.offer_name,
                payload.offer,
                payload.oferta,
                venda.offer_name,
                venda.offer
            );

        // -------------------------------------------------
        // VALOR
        // -------------------------------------------------

        const valor =
            numero(
                primeiroValor(
                    payload.amount,
                    payload.value,
                    payload.valor,
                    payload.price,
                    payload.preco,
                    payload.total,
                    venda.amount,
                    venda.value,
                    venda.valor,
                    venda.price,
                    venda.total
                )
            );

        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        const statusRecebido =
            primeiroValor(
                payload.status,
                payload.payment_status,
                payload.status_pagamento,
                venda.status,
                venda.payment_status,
                venda.status_pagamento
            );

        const status =
            normalizarStatus(
                statusRecebido
            );

        // -------------------------------------------------
        // DATAS
        // -------------------------------------------------

        const dataCompra =
            dataValida(
                primeiroValor(
                    payload.created_at,
                    payload.createdAt,
                    payload.date,
                    payload.data,
                    payload.purchase_date,
                    payload.data_compra,
                    venda.created_at,
                    venda.createdAt
                )
            );

        const pagoEm =
            status === "pago"
                ? dataValida(
                    primeiroValor(
                        payload.paid_at,
                        payload.paidAt,
                        payload.payment_date,
                        payload.data_pagamento,
                        venda.paid_at,
                        venda.paidAt
                    )
                ) || new Date().toISOString()
                : null;

        // -------------------------------------------------
        // OBJETO PARA SUPABASE
        // -------------------------------------------------

        const registro = {
            nome: nome
                ? String(nome).trim()
                : null,

            email: email
                ? String(email).trim().toLowerCase()
                : null,

            telefone: telefone
                ? String(telefone).trim()
                : null,

            cpf: cpf
                ? String(cpf).trim()
                : null,

            produto: produto
                ? String(produto).trim()
                : null,

            oferta: oferta
                ? String(oferta).trim()
                : null,

            valor,

            status,

            kiwify_order_id:
                orderId
                    ? String(orderId)
                    : null,

            kiwify_transaction_id:
                transactionId
                    ? String(transactionId)
                    : null,

            data_compra:
                dataCompra,

            pago_em:
                pagoEm,

            updated_at:
                new Date().toISOString()
        };

        // -------------------------------------------------
        // VALIDAR IDENTIFICADOR
        // -------------------------------------------------

        if (
            !registro.kiwify_order_id &&
            !registro.kiwify_transaction_id
        ) {

            console.error(
                "Venda sem identificador Kiwify."
            );

            return res.status(400).json({
                ok: false,
                error:
                    "Não foi possível identificar a venda Kiwify."
            });
        }

        // -------------------------------------------------
        // VERIFICAR PEDIDO EXISTENTE
        // -------------------------------------------------

        let existente = null;

        if (registro.kiwify_order_id) {

            const resultado =
                await supabase
                    .from("ebook_pedidos")
                    .select("id")
                    .eq(
                        "kiwify_order_id",
                        registro.kiwify_order_id
                    )
                    .maybeSingle();

            if (resultado.error) {
                console.error(
                    "Erro ao consultar pedido:",
                    resultado.error
                );

                return res.status(500).json({
                    ok: false,
                    error:
                        resultado.error.message
                });
            }

            existente =
                resultado.data;
        }

        // -------------------------------------------------
        // ATUALIZAR PEDIDO EXISTENTE
        // -------------------------------------------------

        if (existente) {

            const resultado =
                await supabase
                    .from("ebook_pedidos")
                    .update(registro)
                    .eq(
                        "id",
                        existente.id
                    )
                    .select()
                    .single();

            if (resultado.error) {

                console.error(
                    "Erro ao atualizar pedido:",
                    resultado.error
                );

                return res.status(500).json({
                    ok: false,
                    error:
                        resultado.error.message
                });
            }

            console.log(
                "Pedido atualizado:",
                existente.id
            );

            return res.status(200).json({
                ok: true,
                action: "updated",
                pedido: resultado.data
            });
        }

        // -------------------------------------------------
        // NOVO PEDIDO
        // -------------------------------------------------

        registro.created_at =
            new Date().toISOString();

        const resultado =
            await supabase
                .from("ebook_pedidos")
                .insert(registro)
                .select()
                .single();

        if (resultado.error) {

            console.error(
                "Erro ao inserir pedido:",
                resultado.error
            );

            return res.status(500).json({
                ok: false,
                error:
                    resultado.error.message
            });
        }

        console.log(
            "Novo pedido salvo:",
            resultado.data
        );

        // -------------------------------------------------
        // SUCESSO
        // -------------------------------------------------

        return res.status(200).json({
            ok: true,
            action: "created",
            pedido: resultado.data
        });

    } catch (error) {

        console.error(
            "Erro interno no webhook Kiwify:",
            error
        );

        return res.status(500).json({
            ok: false,
            error:
                error.message ||
                "Erro interno no webhook."
        });
    }
};