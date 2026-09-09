/* =========================================================
   iDigital CRM Premium 2.0
   CLIENTES & COBRANÇAS
   VERSÃO CORRIGIDA
========================================================= */

"use strict";

/* =========================================================
   ESTADO
========================================================= */

let clientes = [];
let cobrancas = [];
let financeiro = [];

let clienteDetalhesAtual = null;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


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


function numero(valor) {

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
        .replace(/R\$/gi, "");

    /*
       Aceita:

       1.234,56
       1234,56
       1234.56
    */

    if (
        texto.includes(".") &&
        texto.includes(",")
    ) {
        texto = texto
            .replace(/\./g, "")
            .replace(",", ".");
    }
    else if (
        texto.includes(",")
    ) {
        texto = texto.replace(",", ".");
    }

    const resultado = Number(texto);

    return Number.isFinite(resultado)
        ? resultado
        : 0;
}


function moeda(valor) {

    return numero(valor)
        .toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

}


function dataLocalISO(data = new Date()) {

    const ano =
        data.getFullYear();

    const mes =
        String(
            data.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            data.getDate()
        ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;

}


function dataBR(valor) {

    if (!valor) {
        return "—";
    }

    const texto = String(valor);

    const match =
        texto.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (match) {

        return `${match[3]}/${match[2]}/${match[1]}`;

    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "—";
    }

    return data.toLocaleDateString(
        "pt-BR"
    );

}


/* =========================================================
   SUPABASE
========================================================= */

function obterSupabase() {

    if (
        !window.supabaseClient
    ) {

        throw new Error(
            "Supabase não foi inicializado. Verifique o arquivo js/supabase.js."
        );

    }

    return window.supabaseClient;

}


async function obterUsuarioAtual() {

    const supabase =
        obterSupabase();

    const {
        data,
        error
    } =
        await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    if (!data?.user) {

        throw new Error(
            "Usuário não autenticado. Faça login novamente."
        );

    }

    return data.user;

}


/* =========================================================
   PARCELAMENTO
========================================================= */

function montarValoresParcelas(
    total,
    quantidade
) {

    const totalCentavos =
        Math.round(
            numero(total) * 100
        );

    const qtd =
        Math.max(
            1,
            parseInt(
                quantidade,
                10
            ) || 1
        );

    const base =
        Math.floor(
            totalCentavos / qtd
        );

    const resto =
        totalCentavos -
        (base * qtd);

    const valores = [];

    for (
        let i = 0;
        i < qtd;
        i++
    ) {

        let centavos = base;

        if (
            i === qtd - 1
        ) {
            centavos += resto;
        }

        valores.push(
            centavos / 100
        );

    }

    return valores;

}


function adicionarPeriodo(
    valor,
    indice,
    periodicidade
) {

    if (!valor) {
        return null;
    }

    const partes =
        String(valor)
            .slice(0, 10)
            .split("-")
            .map(Number);

    if (
        partes.length !== 3 ||
        partes.some(
            numero => !Number.isFinite(numero)
        )
    ) {
        return null;
    }

    const ano = partes[0];
    const mes = partes[1] - 1;
    const dia = partes[2];

    let data =
        new Date(
            ano,
            mes,
            dia,
            12
        );

    if (
        periodicidade === "mensal"
    ) {

        const alvo =
            new Date(
                ano,
                mes + indice,
                1,
                12
            );

        const ultimoDia =
            new Date(
                alvo.getFullYear(),
                alvo.getMonth() + 1,
                0,
                12
            ).getDate();

        data =
            new Date(
                alvo.getFullYear(),
                alvo.getMonth(),
                Math.min(
                    dia,
                    ultimoDia
                ),
                12
            );

    }
    else if (
        periodicidade === "semanal"
    ) {

        data.setDate(
            data.getDate() +
            (indice * 7)
        );

    }
    else if (
        periodicidade === "anual"
    ) {

        const novoAno =
            ano + indice;

        const ultimoDia =
            new Date(
                novoAno,
                mes + 1,
                0,
                12
            ).getDate();

        data =
            new Date(
                novoAno,
                mes,
                Math.min(
                    dia,
                    ultimoDia
                ),
                12
            );

    }

    return dataLocalISO(data);

}


/* =========================================================
   PREVIEW
========================================================= */

function atualizarPreviewParcelas() {

    const valor =
        $("valorContrato");

    const quantidade =
        $("quantidadeParcelas");

    const periodicidade =
        $("periodicidadeCliente");

    const parcela =
        $("valorParcela");

    const preview =
        $("parcelamentoPreview");

    if (
        !valor ||
        !quantidade ||
        !periodicidade ||
        !parcela ||
        !preview
    ) {
        return;
    }

    const total =
        numero(valor.value);

    let qtd =
        parseInt(
            quantidade.value,
            10
        ) || 1;

    if (
        qtd < 1
    ) {
        qtd = 1;
    }

    if (
        periodicidade.value === "unica"
    ) {

        qtd = 1;

        quantidade.value = "1";

        quantidade.disabled = true;

    }
    else {

        quantidade.disabled = false;

    }

    const valores =
        montarValoresParcelas(
            total,
            qtd
        );

    const primeira =
        valores[0] || 0;

    parcela.value =
        primeira.toFixed(2);

    if (!total) {

        preview.innerHTML = `
            <div class="preview-icon">◈</div>

            <div>
                <strong>
                    Defina o valor do contrato
                </strong>

                <span>
                    O sistema calculará automaticamente as parcelas.
                </span>
            </div>
        `;

        return;

    }

    if (
        periodicidade.value === "unica"
    ) {

        preview.innerHTML = `
            <div class="preview-icon">✓</div>

            <div class="preview-content">

                <strong>
                    Cobrança única
                </strong>

                <span>
                    ${moeda(total)}
                </span>

            </div>
        `;

        return;

    }

    preview.innerHTML = `
        <div class="preview-icon">◈</div>

        <div class="preview-content">

            <strong>
                ${qtd} parcelas
            </strong>

            <span>
                ${qtd}x de ${moeda(primeira)}
            </span>

            <small>
                Total do contrato:
                ${moeda(total)}
            </small>

        </div>
    `;

}


/* =========================================================
   DADOS DO CLIENTE
========================================================= */

function montarDadosCliente() {

    const nome =
        $("nome")?.value.trim() || "";

    const total =
        numero(
            $("valorContrato")?.value
        );

    let quantidade =
        parseInt(
            $("quantidadeParcelas")?.value,
            10
        ) || 1;

    if (
        quantidade < 1
    ) {
        quantidade = 1;
    }

    const periodicidade =
        $("periodicidadeCliente")?.value ||
        "mensal";

    if (
        periodicidade === "unica"
    ) {
        quantidade = 1;
    }

    const valores =
        montarValoresParcelas(
            total,
            quantidade
        );

    const primeiraParcela =
        valores[0] || 0;

    return {

        tipo:
            $("tipo")?.value ||
            "PF",

        nome,

        documento:
            $("documento")?.value.trim() ||
            null,

        email:
            $("emailCliente")?.value.trim() ||
            null,

        telefone:
            $("telefone")?.value.trim() ||
            null,

        status:
            $("statusCliente")?.value ||
            "ativo",

        produto_servico:
            $("produtoServico")?.value.trim() ||
            null,

        valor_contrato:
            Number(
                total.toFixed(2)
            ),

        quantidade_parcelas:
            quantidade,

        valor_parcela:
            Number(
                primeiraParcela.toFixed(2)
            ),

        periodicidade,

        primeiro_vencimento:
            $("primeiroVencimento")?.value ||
            null,

        endereco:
            $("endereco")?.value.trim() ||
            null,

        observacoes:
            $("observacoes")?.value.trim() ||
            null

    };

}


/* =========================================================
   GERAR COBRANÇAS
========================================================= */

async function gerarCobrancasContrato(
    cliente,
    dados,
    userId
) {

    const total =
        numero(
            dados.valor_contrato
        );

    if (
        total <= 0
    ) {
        return;
    }

    if (
        !dados.primeiro_vencimento
    ) {

        throw new Error(
            "Informe o primeiro vencimento."
        );

    }

    const quantidade =
        dados.periodicidade === "unica"
            ? 1
            : Math.max(
                1,
                parseInt(
                    dados.quantidade_parcelas,
                    10
                ) || 1
            );

    const valores =
        montarValoresParcelas(
            total,
            quantidade
        );

    const registros = [];

    for (
        let i = 0;
        i < quantidade;
        i++
    ) {

        const vencimento =
            adicionarPeriodo(
                dados.primeiro_vencimento,
                i,
                dados.periodicidade
            );

        if (!vencimento) {
            continue;
        }

        const descricao =
            dados.periodicidade === "unica"

                ? (
                    dados.produto_servico ||
                    "Cobrança única"
                )

                : `${
                    dados.produto_servico ||
                    "Contrato"
                } — Parcela ${
                    i + 1
                }/${quantidade}`;

        registros.push({

            user_id:
                userId,

            cliente_id:
                cliente.id,

            descricao,

            valor:
                Number(
                    (valores[i] || 0)
                        .toFixed(2)
                ),

            quantidade:
                1,

            periodicidade:
                dados.periodicidade,

            vencimento,

            observacoes:
                dados.observacoes ||
                null,

            status:
                "pendente",

            numero_parcela:
                i + 1,

            total_parcelas:
                quantidade

        });

    }

    if (
        !registros.length
    ) {
        return;
    }

    const supabase =
        obterSupabase();

    const {
        error
    } =
        await supabase
            .from("cobrancas")
            .insert(registros);

    if (error) {
        throw error;
    }

}


/* =========================================================
   SALVAR CLIENTE
========================================================= */

async function salvarCliente(event) {

    event.preventDefault();

    console.log(
        "Iniciando salvamento do cliente..."
    );

    const botao =
        $("salvarClienteBtn");

    if (botao) {

        botao.disabled = true;

        botao.textContent =
            "Salvando...";

    }

    try {

        const supabase =
            obterSupabase();

        const usuario =
            await obterUsuarioAtual();

        const dados =
            montarDadosCliente();

        console.log(
            "Dados preparados:",
            dados
        );

        /* =========================================
           VALIDAÇÕES
        ========================================= */

        if (!dados.nome) {

            throw new Error(
                "Informe o nome ou empresa do cliente."
            );

        }

        if (
            dados.valor_contrato < 0
        ) {

            throw new Error(
                "O valor do contrato não pode ser negativo."
            );

        }

        if (
            dados.quantidade_parcelas < 1
        ) {

            throw new Error(
                "A quantidade de parcelas deve ser pelo menos 1."
            );

        }

        /* =========================================
           ID
        ========================================= */

        const id =
            $("clienteId")?.value ||
            "";

        /* =========================================
           PAYLOAD
        ========================================= */

        const dadosInsert = {

            user_id:
                usuario.id,

            tipo:
                dados.tipo,

            nome:
                dados.nome,

            documento:
                dados.documento,

            email:
                dados.email,

            telefone:
                dados.telefone,

            status:
                dados.status,

            produto_servico:
                dados.produto_servico,

            valor_contrato:
                dados.valor_contrato,

            quantidade_parcelas:
                dados.quantidade_parcelas,

            valor_parcela:
                dados.valor_parcela,

            periodicidade:
                dados.periodicidade,

            primeiro_vencimento:
                dados.primeiro_vencimento,

            endereco:
                dados.endereco,

            observacoes:
                dados.observacoes

        };

        console.log(
            "Enviando para Supabase:",
            dadosInsert
        );

        /* =========================================
           EDITAR
        ========================================= */

        if (id) {

            const {
                error
            } =
                await supabase
                    .from("clientes")
                    .update(dadosInsert)
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

            alert(
                "Cliente atualizado com sucesso."
            );

        }

        /* =========================================
           NOVO CLIENTE
        ========================================= */

        else {

            const {
                data: clienteCriado,
                error
            } =
                await supabase
                    .from("clientes")
                    .insert(
                        dadosInsert
                    )
                    .select()
                    .single();

            if (error) {
                throw error;
            }

            if (
                !clienteCriado
            ) {

                throw new Error(
                    "O Supabase não retornou o cliente criado."
                );

            }

            console.log(
                "Cliente criado:",
                clienteCriado
            );

            /* =====================================
               GERAR COBRANÇAS
            ===================================== */

            const gerar =
                $("gerarCobrancas")?.checked;

            if (
                gerar
            ) {

                try {

                    await gerarCobrancasContrato(
                        clienteCriado,
                        dados,
                        usuario.id
                    );

                }
                catch (
                    erroCobrancas
                ) {

                    console.error(
                        "Erro ao gerar cobranças:",
                        erroCobrancas
                    );

                    alert(
                        "Cliente cadastrado, mas as parcelas não foram criadas.\n\n" +
                        erroCobrancas.message
                    );

                }

            }

            alert(
                "Cliente cadastrado com sucesso!"
            );

        }

        /* =========================================
           FECHAR
        ========================================= */

        fecharModal(
            "clienteModal"
        );

        /* =========================================
           ATUALIZAR
        ========================================= */

        await carregarTudo();

    }
    catch (erro) {

        console.error(
            "ERRO AO SALVAR CLIENTE:",
            erro
        );

        alert(
            "Erro ao salvar cliente:\n\n" +
            (
                erro?.message ||
                "Erro desconhecido."
            )
        );

    }
    finally {

        if (botao) {

            botao.disabled = false;

            botao.textContent =
                "Salvar cliente";

        }

    }

}


/* =========================================================
   CARREGAR CLIENTES
========================================================= */

async function carregarClientes() {

    const supabase =
        obterSupabase();

    const usuario =
        await obterUsuarioAtual();

    const {
        data,
        error
    } =
        await supabase
            .from("clientes")
            .select("*")
            .eq(
                "user_id",
                usuario.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {
        throw error;
    }

    clientes =
        data || [];

}


/* =========================================================
   CARREGAR COBRANÇAS
========================================================= */

async function carregarCobrancas() {

    const supabase =
        obterSupabase();

    const usuario =
        await obterUsuarioAtual();

    const {
        data,
        error
    } =
        await supabase
            .from("cobrancas")
            .select("*")
            .eq(
                "user_id",
                usuario.id
            )
            .order(
                "vencimento",
                {
                    ascending: true
                }
            );

    if (error) {
        throw error;
    }

    cobrancas =
        data || [];

}


/* =========================================================
   CARREGAR FINANCEIRO
========================================================= */

async function carregarFinanceiro() {

    const supabase =
        obterSupabase();

    const usuario =
        await obterUsuarioAtual();

    const {
        data,
        error
    } =
        await supabase
            .from("financeiro")
            .select("*")
            .eq(
                "user_id",
                usuario.id
            );

    /*
       A tabela financeiro não pode impedir
       o carregamento dos clientes.
    */

    if (error) {

        console.warn(
            "Tabela financeiro:",
            error.message
        );

        financeiro = [];

        return;

    }

    financeiro =
        data || [];

}


/* =========================================================
   STATUS
========================================================= */

function statusCobranca(
    cobranca
) {

    const status =
        normalizar(
            cobranca?.status
        );

    if (
        status === "pago" ||
        status === "recebido" ||
        status === "paid"
    ) {

        return "recebido";

    }

    if (
        status === "vencido" ||
        status === "atrasado" ||
        status === "overdue"
    ) {

        return "vencido";

    }

    if (
        cobranca?.vencimento
    ) {

        const hoje =
            dataLocalISO();

        const vencimento =
            String(
                cobranca.vencimento
            ).slice(0, 10);

        if (
            vencimento < hoje
        ) {

            return "vencido";

        }

    }

    return "pendente";

}


/* =========================================================
   COBRANÇAS DO CLIENTE
========================================================= */

function cobrancasDoCliente(
    clienteId
) {

    return cobrancas.filter(
        cobranca =>
            String(
                cobranca.cliente_id
            ) ===
            String(clienteId)
    );

}


/* =========================================================
   RESUMO
========================================================= */

function resumoCliente(
    cliente
) {

    const lista =
        cobrancasDoCliente(
            cliente.id
        );

    let recebido = 0;
    let aReceber = 0;
    let vencido = 0;

    lista.forEach(
        cobranca => {

            const valor =
                numero(
                    cobranca.valor
                );

            const status =
                statusCobranca(
                    cobranca
                );

            if (
                status === "recebido"
            ) {

                recebido += valor;

            }
            else {

                aReceber += valor;

                if (
                    status === "vencido"
                ) {

                    vencido += valor;

                }

            }

        }
    );

    return {

        contrato:
            numero(
                cliente.valor_contrato ??
                cliente.valor ??
                0
            ),

        recebido,

        aReceber,

        vencido

    };

}


/* =========================================================
   MÉTRICAS
========================================================= */

function atualizarMetricas() {

    let valorTotal = 0;
    let recebido = 0;
    let aReceber = 0;
    let vencido = 0;

    clientes.forEach(
        cliente => {

            const resumo =
                resumoCliente(
                    cliente
                );

            valorTotal +=
                resumo.contrato;

            recebido +=
                resumo.recebido;

            aReceber +=
                resumo.aReceber;

            vencido +=
                resumo.vencido;

        }
    );

    if (
        $("totalClientes")
    ) {

        $("totalClientes")
            .textContent =
            clientes.length;

    }

    if (
        $("valorTotalClientes")
    ) {

        $("valorTotalClientes")
            .textContent =
            moeda(valorTotal);

    }

    if (
        $("totalRecebido")
    ) {

        $("totalRecebido")
            .textContent =
            moeda(recebido);

    }

    if (
        $("totalAReceber")
    ) {

        $("totalAReceber")
            .textContent =
            moeda(aReceber);

    }

    if (
        $("totalVencido")
    ) {

        $("totalVencido")
            .textContent =
            moeda(vencido);

    }

}


/* =========================================================
   INICIAIS
========================================================= */

function iniciais(nome) {

    const partes =
        String(
            nome ||
            "Cliente"
        )
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (
        partes.length === 1
    ) {

        return partes[0]
            .substring(0, 2)
            .toUpperCase();

    }

    return (
        partes[0][0] +
        partes[
            partes.length - 1
        ][0]
    ).toUpperCase();

}


/* =========================================================
   FILTROS
========================================================= */

function clientesFiltrados() {

    const busca =
        normalizar(
            $("buscaCliente")?.value
        );

    const tipo =
        normalizar(
            $("filtroTipo")?.value
        );

    const status =
        normalizar(
            $("filtroStatus")?.value
        );

    const filtroCobranca =
        normalizar(
            $("filtroCobranca")?.value
        );

    return clientes.filter(
        cliente => {

            const texto =
                normalizar(
                    [
                        cliente.nome,
                        cliente.documento,
                        cliente.email,
                        cliente.telefone,
                        cliente.produto_servico
                    ].join(" ")
                );

            if (
                busca &&
                !texto.includes(
                    busca
                )
            ) {

                return false;

            }

            if (
                tipo &&
                normalizar(
                    cliente.tipo
                ) !== tipo
            ) {

                return false;

            }

            if (
                status &&
                normalizar(
                    cliente.status
                ) !== status
            ) {

                return false;

            }

            if (
                filtroCobranca
            ) {

                const lista =
                    cobrancasDoCliente(
                        cliente.id
                    );

                const alvo =
                    filtroCobranca ===
                    "aberto"
                        ? "pendente"
                        : filtroCobranca;

                const possui =
                    lista.some(
                        cobranca =>
                            statusCobranca(
                                cobranca
                            ) === alvo
                    );

                if (!possui) {
                    return false;
                }

            }

            return true;

        }
    );

}


/* =========================================================
   RENDER CLIENTES
========================================================= */

function renderizarClientes() {

    const tbody =
        $("clientesBody");

    const empty =
        $("clientesEmpty");

    if (!tbody) {
        return;
    }

    const lista =
        clientesFiltrados();

    tbody.innerHTML = "";

    if (
        !lista.length
    ) {

        empty?.classList.remove(
            "hidden"
        );

        return;

    }

    empty?.classList.add(
        "hidden"
    );

    lista.forEach(
        cliente => {

            const resumo =
                resumoCliente(
                    cliente
                );

            const qtd =
                Number(
                    cliente.quantidade_parcelas
                ) || 1;

            const parcela =
                numero(
                    cliente.valor_parcela
                ) ||
                (
                    resumo.contrato /
                    qtd
                );

            const status =
                normalizar(
                    cliente.status
                ) === "inativo"
                    ? "inativo"
                    : "ativo";

            const tr =
                document.createElement(
                    "tr"
                );

            tr.innerHTML = `

                <td>

                    <div class="client-cell">

                        <div class="client-avatar">

                            ${escapar(
                                iniciais(
                                    cliente.nome
                                )
                            )}

                        </div>

                        <div class="client-info">

                            <strong class="cliente-nome">
                                ${escapar(
                                    cliente.nome ||
                                    "Cliente"
                                )}
                            </strong>

                            <span class="cliente-documento">
                                ${escapar(
                                    cliente.documento ||
                                    "Sem documento"
                                )}
                            </span>

                            <span class="cliente-contato">
                                ${escapar(
                                    cliente.email ||
                                    cliente.telefone ||
                                    ""
                                )}
                            </span>

                        </div>

                    </div>

                </td>

                <td>

                    <div class="product-cell">

                        <strong>
                            ${escapar(
                                cliente.produto_servico ||
                                "Não informado"
                            )}
                        </strong>

                        <span>
                            ${
                                cliente.tipo === "PJ"
                                    ? "Pessoa Jurídica"
                                    : "Pessoa Física"
                            }
                        </span>

                    </div>

                </td>

                <td>

                    <div class="parcelamento-cell">

                        <strong>
                            ${
                                cliente.periodicidade ===
                                "unica"
                                    ? "Única"
                                    : `${qtd}x`
                            }
                        </strong>

                        <span>
                            de ${moeda(parcela)}
                        </span>

                    </div>

                </td>

                <td>

                    <strong class="contract-value">
                        ${moeda(
                            resumo.contrato
                        )}
                    </strong>

                </td>

                <td>

                    <span class="finance-received">
                        ${moeda(
                            resumo.recebido
                        )}
                    </span>

                </td>

                <td>

                    <span class="${
                        resumo.vencido > 0
                            ? "finance-overdue"
                            : "finance-pending"
                    }">

                        ${moeda(
                            resumo.aReceber
                        )}

                    </span>

                </td>

                <td>

                    <span class="status-cliente ${status}">

                        ${
                            status === "ativo"
                                ? "Ativo"
                                : "Inativo"
                        }

                    </span>

                </td>

                <td>

                    <div class="table-actions">

                        <button
                            type="button"
                            class="btn"
                            data-action="detalhes"
                            data-id="${escapar(cliente.id)}"
                        >
                            Ver
                        </button>

                        <button
                            type="button"
                            class="btn"
                            data-action="editar"
                            data-id="${escapar(cliente.id)}"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            class="btn btn-danger"
                            data-action="excluir"
                            data-id="${escapar(cliente.id)}"
                        >
                            Excluir
                        </button>

                    </div>

                </td>

            `;

            tbody.appendChild(
                tr
            );

        }
    );

}


/* =========================================================
   MODAL
========================================================= */

function abrirModal(id) {

    const modal =
        $(id);

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    modal.classList.add(
        "active"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    modal.style.display =
        "flex";

    document.body.classList.add(
        "modal-open"
    );

}


function fecharModal(id) {

    const modal =
        $(id);

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "active"
    );

    modal.classList.add(
        "hidden"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    modal.style.display =
        "none";

    if (
        !document.querySelector(
            ".modal:not(.hidden)"
        )
    ) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


/* =========================================================
   NOVO CLIENTE
========================================================= */

function novoCliente() {

    const form =
        $("clienteForm");

    if (form) {
        form.reset();
    }

    if (
        $("clienteId")
    ) {

        $("clienteId").value =
            "";

    }

    if (
        $("tipo")
    ) {

        $("tipo").value =
            "PF";

    }

    if (
        $("statusCliente")
    ) {

        $("statusCliente").value =
            "ativo";

    }

    if (
        $("valorContrato")
    ) {

        $("valorContrato").value =
            "0";

    }

    if (
        $("quantidadeParcelas")
    ) {

        $("quantidadeParcelas").value =
            "1";

        $("quantidadeParcelas").disabled =
            false;

    }

    if (
        $("valorParcela")
    ) {

        $("valorParcela").value =
            "0";

    }

    if (
        $("periodicidadeCliente")
    ) {

        $("periodicidadeCliente").value =
            "mensal";

    }

    if (
        $("primeiroVencimento")
    ) {

        $("primeiroVencimento").value =
            dataLocalISO();

    }

    if (
        $("gerarCobrancas")
    ) {

        $("gerarCobrancas").checked =
            true;

        $("gerarCobrancas").disabled =
            false;

    }

    if (
        $("clienteModalTitle")
    ) {

        $("clienteModalTitle")
            .textContent =
            "Novo cliente";

    }

    if (
        $("salvarClienteBtn")
    ) {

        $("salvarClienteBtn")
            .textContent =
            "Salvar cliente";

    }

    atualizarPreviewParcelas();

    abrirModal(
        "clienteModal"
    );

    setTimeout(
        () => {
            $("nome")?.focus();
        },
        100
    );

}


/* =========================================================
   EDITAR
========================================================= */

function editarCliente(id) {

    const cliente =
        clientes.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!cliente) {
        return;
    }

    $("clienteId").value =
        cliente.id || "";

    $("tipo").value =
        cliente.tipo || "PF";

    $("nome").value =
        cliente.nome || "";

    $("documento").value =
        cliente.documento || "";

    $("emailCliente").value =
        cliente.email || "";

    $("telefone").value =
        cliente.telefone || "";

    $("statusCliente").value =
        cliente.status || "ativo";

    $("produtoServico").value =
        cliente.produto_servico || "";

    $("valorContrato").value =
        numero(
            cliente.valor_contrato ??
            cliente.valor ??
            0
        ).toFixed(2);

    $("quantidadeParcelas").value =
        cliente.quantidade_parcelas ||
        1;

    $("periodicidadeCliente").value =
        cliente.periodicidade ||
        "mensal";

    $("primeiroVencimento").value =
        cliente.primeiro_vencimento ||
        "";

    $("valorParcela").value =
        numero(
            cliente.valor_parcela
        ).toFixed(2);

    $("endereco").value =
        cliente.endereco || "";

    $("observacoes").value =
        cliente.observacoes || "";

    if (
        $("gerarCobrancas")
    ) {

        $("gerarCobrancas").checked =
            false;

        $("gerarCobrancas").disabled =
            true;

    }

    if (
        $("clienteModalTitle")
    ) {

        $("clienteModalTitle")
            .textContent =
            "Editar cliente";

    }

    if (
        $("salvarClienteBtn")
    ) {

        $("salvarClienteBtn")
            .textContent =
            "Salvar alterações";

    }

    atualizarPreviewParcelas();

    abrirModal(
        "clienteModal"
    );

}


/* =========================================================
   EXCLUIR
========================================================= */

async function excluirCliente(id) {

    const cliente =
        clientes.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!cliente) {
        return;
    }

    if (
        !confirm(
            `Excluir o cliente "${cliente.nome}"?\n\nAs cobranças desse cliente também serão excluídas.`
        )
    ) {
        return;
    }

    try {

        const supabase =
            obterSupabase();

        const usuario =
            await obterUsuarioAtual();

        const {
            error: erroCobrancas
        } =
            await supabase
                .from("cobrancas")
                .delete()
                .eq(
                    "cliente_id",
                    id
                )
                .eq(
                    "user_id",
                    usuario.id
                );

        if (erroCobrancas) {
            throw erroCobrancas;
        }

        const {
            error
        } =
            await supabase
                .from("clientes")
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

        await carregarTudo();

        alert(
            "Cliente excluído com sucesso."
        );

    }
    catch (erro) {

        console.error(
            "Erro ao excluir:",
            erro
        );

        alert(
            erro.message ||
            "Não foi possível excluir o cliente."
        );

    }

}


/* =========================================================
   EVENTOS DE TABELA
========================================================= */

function configurarEventosTabela() {

    $("clientesBody")
        ?.addEventListener(
            "click",
            event => {

                const botao =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!botao) {
                    return;
                }

                const id =
                    botao.dataset.id;

                const action =
                    botao.dataset.action;

                if (
                    action ===
                    "detalhes"
                ) {

                    abrirDetalhes(
                        id
                    );

                }

                else if (
                    action ===
                    "editar"
                ) {

                    editarCliente(
                        id
                    );

                }

                else if (
                    action ===
                    "excluir"
                ) {

                    excluirCliente(
                        id
                    );

                }

            }
        );

}


/* =========================================================
   DETALHES
========================================================= */

function abrirDetalhes(id) {

    const cliente =
        clientes.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!cliente) {
        return;
    }

    clienteDetalhesAtual =
        cliente;

    const resumo =
        resumoCliente(
            cliente
        );

    if (
        $("detalhesClienteNome")
    ) {

        $("detalhesClienteNome")
            .textContent =
            cliente.nome ||
            "Cliente";

    }

    if (
        $("detalhesValorCliente")
    ) {

        $("detalhesValorCliente")
            .textContent =
            moeda(
                resumo.contrato
            );

    }

    if (
        $("detalhesRecebido")
    ) {

        $("detalhesRecebido")
            .textContent =
            moeda(
                resumo.recebido
            );

    }

    if (
        $("detalhesAReceber")
    ) {

        $("detalhesAReceber")
            .textContent =
            moeda(
                resumo.aReceber
            );

    }

    if (
        $("detalhesVencido")
    ) {

        $("detalhesVencido")
            .textContent =
            moeda(
                resumo.vencido
            );

    }

    if (
        $("detalhesDadosCliente")
    ) {

        $("detalhesDadosCliente")
            .innerHTML = `

                <div class="detail-grid">

                    <div>
                        <strong>Produto / Serviço</strong>
                        <span>
                            ${escapar(
                                cliente.produto_servico ||
                                "Não informado"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Tipo</strong>
                        <span>
                            ${
                                cliente.tipo === "PJ"
                                    ? "Pessoa Jurídica"
                                    : "Pessoa Física"
                            }
                        </span>
                    </div>

                    <div>
                        <strong>Documento</strong>
                        <span>
                            ${escapar(
                                cliente.documento ||
                                "Não informado"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>E-mail</strong>
                        <span>
                            ${escapar(
                                cliente.email ||
                                "Não informado"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Telefone</strong>
                        <span>
                            ${escapar(
                                cliente.telefone ||
                                "Não informado"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Contrato</strong>
                        <span>
                            ${moeda(
                                resumo.contrato
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Parcelamento</strong>
                        <span>
                            ${
                                cliente.periodicidade ===
                                "unica"
                                    ? "Cobrança única"
                                    : `${cliente.quantidade_parcelas || 1} parcelas`
                            }
                        </span>
                    </div>

                    <div>
                        <strong>Primeiro vencimento</strong>
                        <span>
                            ${dataBR(
                                cliente.primeiro_vencimento
                            )}
                        </span>
                    </div>

                </div>

            `;

    }

    abrirModal(
        "clienteDetalhesModal"
    );

}


/* =========================================================
   NOVA COBRANÇA
========================================================= */

function novaCobranca(
    clienteId = ""
) {

    const form =
        $("cobrancaForm");

    if (form) {
        form.reset();
    }

    if (
        $("cobQuantidade")
    ) {

        $("cobQuantidade").value =
            "1";

    }

    if (
        $("cobPeriodicidade")
    ) {

        $("cobPeriodicidade").value =
            "unica";

    }

    if (
        $("cobVencimento")
    ) {

        $("cobVencimento").value =
            dataLocalISO();

    }

    preencherClientesCobranca(
        clienteId
    );

    abrirModal(
        "cobrancaModal"
    );

}


/* =========================================================
   SELECT DE CLIENTES
========================================================= */

function preencherClientesCobranca(
    clienteId = ""
) {

    const select =
        $("cobCliente");

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Selecione um cliente
        </option>
    `;

    clientes.forEach(
        cliente => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                cliente.id;

            option.textContent =
                cliente.nome ||
                "Cliente";

            if (
                String(cliente.id) ===
                String(clienteId)
            ) {

                option.selected =
                    true;

            }

            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   CARREGAR TUDO
========================================================= */

async function carregarTudo() {

    try {

        await Promise.all([
            carregarClientes(),
            carregarCobrancas(),
            carregarFinanceiro()
        ]);

        atualizarMetricas();

        renderizarClientes();

        preencherClientesCobranca();

    }
    catch (erro) {

        console.error(
            "Erro ao carregar dados:",
            erro
        );

        const tbody =
            $("clientesBody");

        if (tbody) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        style="
                            padding:40px;
                            text-align:center;
                        "
                    >

                        <strong>
                            Não foi possível carregar os clientes.
                        </strong>

                        <br><br>

                        <small>
                            ${escapar(
                                erro.message ||
                                "Erro desconhecido."
                            )}
                        </small>

                    </td>

                </tr>

            `;

        }

    }

}


/* =========================================================
   CONFIGURAR EVENTOS
========================================================= */

function configurarEventos() {

    /* NOVO CLIENTE */

    $("novoClienteBtn")
        ?.addEventListener(
            "click",
            novoCliente
        );


    /* FORM CLIENTE */

    $("clienteForm")
        ?.addEventListener(
            "submit",
            salvarCliente
        );


    /* FECHAR CLIENTE */

    $("fecharClienteModal")
        ?.addEventListener(
            "click",
            () =>
                fecharModal(
                    "clienteModal"
                )
        );


    $("cancelarCliente")
        ?.addEventListener(
            "click",
            () =>
                fecharModal(
                    "clienteModal"
                )
        );


    /* FECHAR DETALHES */

    $("fecharDetalhesModal")
        ?.addEventListener(
            "click",
            () =>
                fecharModal(
                    "clienteDetalhesModal"
                )
        );


    /* FECHAR COBRANÇA */

    $("fecharCobrancaModal")
        ?.addEventListener(
            "click",
            () =>
                fecharModal(
                    "cobrancaModal"
                )
        );


    $("cancelarCobranca")
        ?.addEventListener(
            "click",
            () =>
                fecharModal(
                    "cobrancaModal"
                )
        );


    /* NOVA COBRANÇA */

    $("detalhesNovaCobranca")
        ?.addEventListener(
            "click",
            () => {

                novaCobranca(
                    clienteDetalhesAtual?.id ||
                    ""
                );

            }
        );


    /* PREVIEW */

    $("valorContrato")
        ?.addEventListener(
            "input",
            atualizarPreviewParcelas
        );


    $("quantidadeParcelas")
        ?.addEventListener(
            "input",
            atualizarPreviewParcelas
        );


    $("periodicidadeCliente")
        ?.addEventListener(
            "change",
            atualizarPreviewParcelas
        );


    /* FILTROS */

    $("buscaCliente")
        ?.addEventListener(
            "input",
            renderizarClientes
        );


    $("filtroTipo")
        ?.addEventListener(
            "change",
            renderizarClientes
        );


    $("filtroStatus")
        ?.addEventListener(
            "change",
            renderizarClientes
        );


    $("filtroCobranca")
        ?.addEventListener(
            "change",
            renderizarClientes
        );


    /* LIMPAR FILTROS */

    $("clearClienteFilters")
        ?.addEventListener(
            "click",
            () => {

                if (
                    $("buscaCliente")
                ) {
                    $("buscaCliente")
                        .value = "";
                }

                if (
                    $("filtroTipo")
                ) {
                    $("filtroTipo")
                        .value = "";
                }

                if (
                    $("filtroStatus")
                ) {
                    $("filtroStatus")
                        .value = "";
                }

                if (
                    $("filtroCobranca")
                ) {
                    $("filtroCobranca")
                        .value = "";
                }

                renderizarClientes();

            }
        );


    /* TABELA */

    configurarEventosTabela();


    /* OVERLAYS */

    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(
            overlay => {

                overlay.addEventListener(
                    "click",
                    () => {

                        const modal =
                            overlay.closest(
                                ".modal"
                            );

                        if (modal) {

                            fecharModal(
                                modal.id
                            );

                        }

                    }
                );

            }
        );


    /* ESC */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {
                return;
            }

            document
                .querySelectorAll(
                    ".modal:not(.hidden)"
                )
                .forEach(
                    modal => {

                        fecharModal(
                            modal.id
                        );

                    }
                );

        }
    );

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            configurarEventos();

            await carregarTudo();

            console.log(
                "iDigital CRM — Clientes carregado."
            );

        }
        catch (erro) {

            console.error(
                "Erro ao iniciar Clientes:",
                erro
            );

        }

    }
);


/* =========================================================
   API GLOBAL
========================================================= */

window.crmClientes = {

    novo:
        novoCliente,

    editar:
        editarCliente,

    detalhes:
        abrirDetalhes,

    excluir:
        excluirCliente,

    carregar:
        carregarTudo

};

window.novoCliente =
    novoCliente;

window.salvarCliente =
    salvarCliente;

window.abrirModal =
    abrirModal;

window.fecharModal =
    fecharModal;

