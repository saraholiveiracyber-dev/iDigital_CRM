/* =========================================================
   iDIGITAL CRM PREMIUM 2.0
   AGENDA • SOCIAL MEDIA • MARKETING DIGITAL • EVENTOS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /* =====================================================
       CONFIGURAÇÃO
    ===================================================== */

    const TABLE = "agenda";


    /* =====================================================
       ELEMENTOS
    ===================================================== */

    const novoEventoBtn =
        document.getElementById("novoEventoBtn");

    const fecharAgendaModal =
        document.getElementById("fecharAgendaModal");

    const cancelarAgendaBtn =
        document.getElementById("cancelarAgendaBtn");

    const agendaModal =
        document.getElementById("agendaModal");

    const agendaForm =
        document.getElementById("agendaForm");

    const agendaModalTitle =
        document.getElementById("agendaModalTitle");

    const agendaList =
        document.getElementById("agendaList");

    const agendaEmpty =
        document.getElementById("agendaEmpty");

    const filtroAgenda =
        document.getElementById("filtroAgenda");

    const atualizarAgendaBtn =
        document.getElementById("atualizarAgendaBtn");

    const agendaId =
        document.getElementById("agendaId");

    const agendaTitulo =
        document.getElementById("agendaTitulo");

    const agendaCliente =
        document.getElementById("agendaCliente");

    const agendaData =
        document.getElementById("agendaData");

    const agendaHora =
        document.getElementById("agendaHora");

    const agendaTipo =
        document.getElementById("agendaTipo");

    const agendaStatus =
        document.getElementById("agendaStatus");

    const agendaObservacoes =
        document.getElementById("agendaObservacoes");


    /* =====================================================
       MÉTRICAS
    ===================================================== */

    const agendaHoje =
        document.getElementById("agendaHoje");

    const agendaSemana =
        document.getElementById("agendaSemana");

    const agendaProximos =
        document.getElementById("agendaProximos");

    const agendaConcluidos =
        document.getElementById("agendaConcluidos");

    const conteudosHoje =
        document.getElementById("conteudosHoje");

    const publicacoesSemana =
        document.getElementById("publicacoesSemana");

    /*
       Compatibilidade com HTML atual.
       O elemento entregasPendentes representa
       atualmente a quantidade de EVENTOS ativos.
    */
    const eventosPendentes =
        document.getElementById("entregasPendentes");


    /* =====================================================
       DATA ATUAL
    ===================================================== */

    const todayText =
        document.getElementById("todayText");

    const todayDate =
        document.getElementById("todayDate");


    /* =====================================================
       CALENDÁRIO
    ===================================================== */

    const calendarDays =
        document.getElementById("calendarDays");

    const mesAtual =
        document.getElementById("mesAtual");

    const mesAnterior =
        document.getElementById("mesAnterior");

    const mesProximo =
        document.getElementById("mesProximo");

    const miniAgendaHoje =
        document.getElementById("miniAgendaHoje");

    const miniNextEvent =
        document.getElementById("miniNextEvent");


    /* =====================================================
       ESTADO
    ===================================================== */

    let eventos = [];

    let dataCalendario = new Date();

    let dataSelecionada = new Date();


    /* =====================================================
       SUPABASE
    ===================================================== */

    function getSupabase() {

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.from === "function"
        ) {
            return window.supabaseClient;
        }

        if (
            window.supabase &&
            typeof window.supabase.from === "function"
        ) {
            return window.supabase;
        }

        console.error(
            "Supabase não encontrado."
        );

        return null;
    }


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function pad(valor) {

        return String(valor).padStart(2, "0");

    }


    function dataLocalString(data) {

        if (!(data instanceof Date) || isNaN(data)) {
            return "";
        }

        return [
            data.getFullYear(),
            pad(data.getMonth() + 1),
            pad(data.getDate())
        ].join("-");

    }


    function hojeString() {

        return dataLocalString(
            new Date()
        );

    }


    function formatarData(data) {

        if (!data) {
            return "";
        }

        const valor =
            String(data).slice(0, 10);

        const partes =
            valor.split("-");

        if (partes.length !== 3) {
            return String(data);
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }


    function formatarHora(hora) {

        if (!hora) {
            return "";
        }

        return String(hora).slice(0, 5);

    }


    function escapeHTML(valor) {

        if (
            valor === null ||
            valor === undefined
        ) {
            return "";
        }

        return String(valor)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    function setText(elemento, valor) {

        if (elemento) {
            elemento.textContent = valor;
        }

    }


    /* =====================================================
       TIPOS DE ATIVIDADE
    ===================================================== */

    function nomeTipo(tipo) {

        const tipos = {

            post: "Post",

            reels: "Reels",

            stories: "Stories",

            conteudo: "Conteúdo",

            design: "Design",

            trafego: "Tráfego Pago",

            reuniao: "Reunião",

            evento: "Evento",

            cliente: "Atendimento",

            atendimento: "Atendimento",

            ligacao: "Ligação",

            tarefa: "Tarefa",

            outro: "Outro"

        };

        return tipos[tipo] || "Outro";

    }


    function classeTipo(tipo) {

        const valor =
            String(tipo || "").toLowerCase();

        if (
            valor === "reuniao" ||
            valor === "cliente" ||
            valor === "atendimento"
        ) {
            return "meeting";
        }

        if (valor === "evento") {
            return "event";
        }

        return "content";

    }


    function iconeTipo(tipo) {

        const mapa = {

            post: "P",

            reels: "R",

            stories: "S",

            conteudo: "C",

            design: "D",

            trafego: "T",

            reuniao: "R",

            evento: "E",

            cliente: "A",

            atendimento: "A",

            ligacao: "L",

            tarefa: "✓",

            outro: "O"

        };

        return mapa[tipo] || "O";

    }


    /* =====================================================
       STATUS
    ===================================================== */

    function nomeStatus(status) {

        const statusMap = {

            agendado: "Agendado",

            pendente: "Pendente",

            em_andamento: "Em andamento",

            concluido: "Concluído",

            cancelado: "Cancelado"

        };

        return statusMap[status] || "Agendado";

    }


    function classeStatus(status) {

        switch (status) {

            case "concluido":
                return "success";

            case "cancelado":
                return "danger";

            case "pendente":
                return "warning";

            case "em_andamento":
                return "gold";

            case "agendado":
            default:
                return "gold";

        }

    }


    /* =====================================================
       SEMANA
    ===================================================== */

    function inicioSemana(
        data = new Date()
    ) {

        const resultado =
            new Date(data);

        const dia =
            resultado.getDay();

        resultado.setDate(
            resultado.getDate() - dia
        );

        resultado.setHours(
            0,
            0,
            0,
            0
        );

        return resultado;

    }


    function fimSemana(
        data = new Date()
    ) {

        const resultado =
            inicioSemana(data);

        resultado.setDate(
            resultado.getDate() + 6
        );

        resultado.setHours(
            23,
            59,
            59,
            999
        );

        return resultado;

    }


    /* =====================================================
       DATA DO EVENTO
    ===================================================== */

    function eventoData(evento) {

        if (!evento) {
            return null;
        }

        let dataBase = null;


        /*
           Prioridade:
           1. coluna data
           2. data_inicio
        */

        if (evento.data) {

            const valor =
                String(evento.data).slice(0, 10);

            const partes =
                valor.split("-");

            if (partes.length === 3) {

                const ano =
                    Number(partes[0]);

                const mes =
                    Number(partes[1]) - 1;

                const dia =
                    Number(partes[2]);

                if (
                    !isNaN(ano) &&
                    !isNaN(mes) &&
                    !isNaN(dia)
                ) {

                    dataBase =
                        new Date(
                            ano,
                            mes,
                            dia
                        );

                }

            }

        }


        if (
            !dataBase &&
            evento.data_inicio
        ) {

            const inicio =
                new Date(
                    evento.data_inicio
                );

            if (
                !Number.isNaN(
                    inicio.getTime()
                )
            ) {

                dataBase = inicio;

            }

        }


        if (!dataBase) {
            return null;
        }


        /*
           Aplica horário da coluna hora.
        */

        if (evento.hora) {

            const partesHora =
                String(evento.hora)
                    .split(":");

            const horas =
                Number(partesHora[0]) || 0;

            const minutos =
                Number(partesHora[1]) || 0;

            dataBase.setHours(
                horas,
                minutos,
                0,
                0
            );

        }

        return dataBase;

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function mostrarToast(
        mensagem,
        tipo = "success"
    ) {

        let toast =
            document.getElementById(
                "agendaToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );

            toast.id =
                "agendaToast";

            toast.className =
                "agenda-toast";

            document.body.appendChild(
                toast
            );

        }


        toast.textContent =
            mensagem;

        toast.className =
            `agenda-toast ${tipo} show`;


        clearTimeout(
            toast._timeout
        );


        toast._timeout =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                2800
            );

    }


    /* =====================================================
       DATA ATUAL
    ===================================================== */

    function atualizarDataAtual() {

        const agora =
            new Date();

        const texto =
            agora.toLocaleDateString(
                "pt-BR",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );

        const textoCapitalizado =
            texto.charAt(0).toUpperCase() +
            texto.slice(1);


        setText(
            todayText,
            textoCapitalizado
        );

        setText(
            todayDate,
            textoCapitalizado
        );

    }


    /* =====================================================
       CARREGAR EVENTOS
    ===================================================== */

    async function carregarEventos() {

        const supabase =
            getSupabase();

        if (!supabase) {
            return;
        }


        try {

            if (agendaList) {

                agendaList.innerHTML = `
                    <div class="agenda-loading">
                        Carregando agenda...
                    </div>
                `;

            }


            const {
                data,
                error
            } = await supabase
                .from(TABLE)
                .select("*")
                .order(
                    "data",
                    {
                        ascending: true,
                        nullsFirst: false
                    }
                )
                .order(
                    "hora",
                    {
                        ascending: true,
                        nullsFirst: false
                    }
                );


            if (error) {
                throw error;
            }


            eventos =
                Array.isArray(data)
                    ? data
                    : [];


            renderizarTudo();

        }
        catch (error) {

            console.error(
                "Erro ao carregar agenda:",
                error
            );

            eventos = [];


            if (agendaList) {

                agendaList.innerHTML = `
                    <div class="agenda-loading">
                        Não foi possível carregar a agenda.
                    </div>
                `;

            }


            mostrarToast(
                "Erro ao carregar agenda.",
                "error"
            );

        }

    }


    /* =====================================================
       RENDERIZAR TUDO
    ===================================================== */

    function renderizarTudo() {

        renderizarLista();

        atualizarMetricas();

        renderizarCalendario();

        renderizarProximoEvento();

    }


    /* =====================================================
       FILTROS
    ===================================================== */

    function eventosFiltrados() {

        const filtro =
            filtroAgenda
                ? filtroAgenda.value
                : "todos";


        const agora =
            new Date();

        const hoje =
            hojeString();

        const inicio =
            inicioSemana(agora);

        const fim =
            fimSemana(agora);


        return eventos.filter(
            evento => {

                const dataEvento =
                    eventoData(evento);


                switch (filtro) {

                    case "hoje":

                        return (
                            evento.data === hoje
                        );


                    case "semana":

                        return (
                            dataEvento &&
                            dataEvento >= inicio &&
                            dataEvento <= fim
                        );


                    case "conteudo":

                        return [
                            "post",
                            "reels",
                            "stories",
                            "conteudo",
                            "design"
                        ].includes(
                            evento.tipo
                        );


                    case "reuniao":

                        return (
                            evento.tipo ===
                            "reuniao"
                        );


                    case "evento":

                        return (
                            evento.tipo ===
                            "evento"
                        );


                    case "pendentes":

                        return [
                            "pendente",
                            "em_andamento",
                            "agendado"
                        ].includes(
                            evento.status
                        );


                    case "concluidos":

                        return (
                            evento.status ===
                            "concluido"
                        );


                    default:

                        return true;

                }

            }
        );

    }


    /* =====================================================
       CLIENTE
    ===================================================== */

    function nomeCliente(evento) {

        /*
           A tabela agenda atual possui cliente_id,
           mas não possui uma coluna cliente.

           Mantemos somente compatibilidade com
           possíveis dados já enviados pelo frontend.
        */

        return (
            evento?.cliente_nome ||
            evento?.clienteNome ||
            ""
        );

    }


    /* =====================================================
       RENDERIZAR LISTA
    ===================================================== */

    function renderizarLista() {

        if (!agendaList) {
            return;
        }


        const lista =
            eventosFiltrados();


        if (!lista.length) {

            agendaList.innerHTML = "";

            if (agendaEmpty) {

                agendaEmpty.classList.remove(
                    "hidden"
                );

            }

            return;

        }


        if (agendaEmpty) {

            agendaEmpty.classList.add(
                "hidden"
            );

        }


        agendaList.innerHTML =
            lista
                .map(
                    criarEventoHTML
                )
                .join("");

    }


    /* =====================================================
       HTML DO EVENTO
    ===================================================== */

    function criarEventoHTML(
        evento
    ) {

        const concluido =
            evento.status ===
            "concluido";


        const hora =
            formatarHora(
                evento.hora
            ) || "--:--";


        const cliente =
            nomeCliente(
                evento
            );


        const tipo =
            evento.tipo || "outro";


        const status =
            evento.status || "agendado";


        return `
            <article
                class="agenda-item ${concluido ? "completed" : ""}"
                data-id="${escapeHTML(evento.id)}"
            >

                <div class="agenda-item-time">
                    ${escapeHTML(hora)}
                </div>


                <div
                    class="agenda-item-line ${classeTipo(tipo)}"
                    data-type="${escapeHTML(tipo)}"
                ></div>


                <div class="agenda-item-main">

                    <strong class="agenda-item-title">
                        ${escapeHTML(evento.titulo || "Sem título")}
                    </strong>


                    ${
                        cliente
                            ? `
                                <span class="agenda-item-client">
                                    ${escapeHTML(cliente)}
                                </span>
                            `
                            : ""
                    }


                    <div class="agenda-item-meta">

                        <span class="agenda-badge gold">
                            ${escapeHTML(nomeTipo(tipo))}
                        </span>


                        <span class="agenda-badge ${classeStatus(status)}">
                            ${escapeHTML(nomeStatus(status))}
                        </span>


                        ${
                            evento.data
                                ? `
                                    <span class="agenda-badge">
                                        ${escapeHTML(
                                            formatarData(evento.data)
                                        )}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                </div>


                <div class="agenda-item-actions">

                    ${
                        status !== "concluido" &&
                        status !== "cancelado"
                            ? `
                                <button
                                    type="button"
                                    class="agenda-action-btn"
                                    data-action="concluir"
                                    data-id="${escapeHTML(evento.id)}"
                                    title="Concluir"
                                    aria-label="Concluir"
                                >
                                    ✓
                                </button>
                            `
                            : ""
                    }


                    <button
                        type="button"
                        class="agenda-action-btn"
                        data-action="editar"
                        data-id="${escapeHTML(evento.id)}"
                        title="Editar"
                        aria-label="Editar"
                    >
                        ✎
                    </button>


                    <button
                        type="button"
                        class="agenda-action-btn danger"
                        data-action="excluir"
                        data-id="${escapeHTML(evento.id)}"
                        title="Excluir"
                        aria-label="Excluir"
                    >
                        ×
                    </button>

                </div>

            </article>
        `;

    }


    /* =====================================================
       MÉTRICAS
    ===================================================== */

    function atualizarMetricas() {

        const hoje =
            hojeString();

        const agora =
            new Date();

        const inicio =
            inicioSemana(agora);

        const fim =
            fimSemana(agora);


        const hojeEventos =
            eventos.filter(
                evento =>
                    evento.data === hoje
            );


        const semanaEventos =
            eventos.filter(
                evento => {

                    const data =
                        eventoData(
                            evento
                        );

                    return (
                        data &&
                        data >= inicio &&
                        data <= fim
                    );

                }
            );


        const proximos =
            eventos.filter(
                evento => {

                    const data =
                        eventoData(
                            evento
                        );

                    return (
                        data &&
                        data >= agora &&
                        evento.status !==
                            "concluido" &&
                        evento.status !==
                            "cancelado"
                    );

                }
            );


        const concluidos =
            eventos.filter(
                evento =>
                    evento.status ===
                    "concluido"
            );


        const conteudos =
            hojeEventos.filter(
                evento =>
                    [
                        "post",
                        "reels",
                        "stories",
                        "conteudo",
                        "design"
                    ].includes(
                        evento.tipo
                    )
            );


        const publicacoes =
            semanaEventos.filter(
                evento =>
                    [
                        "post",
                        "reels",
                        "stories"
                    ].includes(
                        evento.tipo
                    )
            );


        const eventosAtivos =
            eventos.filter(
                evento =>
                    evento.tipo === "evento" &&
                    evento.status !== "concluido" &&
                    evento.status !== "cancelado"
            );


        setText(
            agendaHoje,
            hojeEventos.length
        );


        setText(
            agendaSemana,
            semanaEventos.length
        );


        setText(
            agendaProximos,
            proximos.length
        );


        setText(
            agendaConcluidos,
            concluidos.length
        );


        setText(
            conteudosHoje,
            conteudos.length
        );


        setText(
            publicacoesSemana,
            publicacoes.length
        );


        setText(
            eventosPendentes,
            eventosAtivos.length
        );

    }


    /* =====================================================
       CALENDÁRIO
    ===================================================== */

    function renderizarCalendario() {

        if (!calendarDays) {
            return;
        }


        const ano =
            dataCalendario.getFullYear();

        const mes =
            dataCalendario.getMonth();


        const primeiroDia =
            new Date(
                ano,
                mes,
                1
            ).getDay();


        const ultimoDia =
            new Date(
                ano,
                mes + 1,
                0
            ).getDate();


        const ultimoDiaMesAnterior =
            new Date(
                ano,
                mes,
                0
            ).getDate();


        if (mesAtual) {

            const nomeMes =
                dataCalendario.toLocaleDateString(
                    "pt-BR",
                    {
                        month: "long",
                        year: "numeric"
                    }
                );

            mesAtual.textContent =
                nomeMes.charAt(0).toUpperCase() +
                nomeMes.slice(1);

        }


        let html = "";


        /*
           Dias do mês anterior
        */

        for (
            let i = primeiroDia - 1;
            i >= 0;
            i--
        ) {

            const dia =
                ultimoDiaMesAnterior - i;


            html += `
                <button
                    type="button"
                    class="calendar-day other-month"
                    disabled
                    tabindex="-1"
                >
                    ${dia}
                </button>
            `;

        }


        /*
           Dias do mês atual
        */

        for (
            let dia = 1;
            dia <= ultimoDia;
            dia++
        ) {

            const data =
                new Date(
                    ano,
                    mes,
                    dia
                );


            const dataString =
                dataLocalString(
                    data
                );


            const hoje =
                dataString ===
                hojeString();


            const selecionado =
                dataString ===
                dataLocalString(
                    dataSelecionada
                );


            const temEvento =
                eventos.some(
                    evento =>
                        evento.data ===
                        dataString
                );


            html += `
                <button
                    type="button"
                    class="
                        calendar-day
                        ${hoje ? "today" : ""}
                        ${selecionado ? "selected" : ""}
                        ${temEvento ? "has-event" : ""}
                    "
                    data-date="${dataString}"
                    aria-label="${dia}"
                >
                    ${dia}
                </button>
            `;

        }


        /*
           Dias restantes
        */

        const totalCelulas =
            primeiroDia +
            ultimoDia;


        const restantes =
            totalCelulas % 7 === 0
                ? 0
                :
                7 -
                (totalCelulas % 7);


        for (
            let dia = 1;
            dia <= restantes;
            dia++
        ) {

            html += `
                <button
                    type="button"
                    class="calendar-day other-month"
                    disabled
                    tabindex="-1"
                >
                    ${dia}
                </button>
            `;

        }


        calendarDays.innerHTML =
            html;

    }


    /* =====================================================
       SELECIONAR DIA
    ===================================================== */

    function selecionarDia(
        data
    ) {

        if (!(data instanceof Date)) {
            return;
        }


        dataSelecionada =
            new Date(data);


        renderizarCalendario();


        const dataString =
            dataLocalString(
                dataSelecionada
            );


        const eventosDoDia =
            eventos
                .filter(
                    evento =>
                        evento.data ===
                        dataString
                )
                .sort(
                    (a, b) => {

                        const horaA =
                            eventoData(a);

                        const horaB =
                            eventoData(b);

                        if (!horaA) return 1;
                        if (!horaB) return -1;

                        return horaA - horaB;

                    }
                );


        if (!agendaList) {
            return;
        }


        if (eventosDoDia.length) {

            agendaList.innerHTML =
                eventosDoDia
                    .map(
                        criarEventoHTML
                    )
                    .join("");


            if (agendaEmpty) {

                agendaEmpty.classList.add(
                    "hidden"
                );

            }

        }
        else {

            agendaList.innerHTML =
                "";

            if (agendaEmpty) {

                agendaEmpty.classList.remove(
                    "hidden"
                );

            }

        }

    }


    /* =====================================================
       PRÓXIMO COMPROMISSO
    ===================================================== */

    function renderizarProximoEvento() {

        if (!miniNextEvent) {
            return;
        }


        const agora =
            new Date();


        const proximos =
            eventos
                .filter(
                    evento => {

                        const data =
                            eventoData(
                                evento
                            );

                        return (
                            data &&
                            data >= agora &&
                            evento.status !==
                                "concluido" &&
                            evento.status !==
                                "cancelado"
                        );

                    }
                )
                .sort(
                    (a, b) =>
                        eventoData(a) -
                        eventoData(b)
                );


        if (!proximos.length) {

            miniNextEvent.innerHTML = `

                <div class="mini-event-icon">
                    ✓
                </div>

                <div class="mini-event-content">

                    <strong>
                        Nenhum compromisso
                    </strong>

                    <span>
                        Sua agenda está livre.
                    </span>

                </div>

            `;

            return;

        }


        const evento =
            proximos[0];


        const dataEvento =
            eventoData(evento);


        const dataFormatada =
            dataEvento
                ? formatarData(
                    dataLocalString(dataEvento)
                )
                : "";


        const horaFormatada =
            evento.hora
                ? formatarHora(evento.hora)
                : "";


        miniNextEvent.innerHTML = `

            <div class="mini-event-icon">
                ${escapeHTML(
                    iconeTipo(evento.tipo)
                )}
            </div>

            <div class="mini-event-content">

                <strong>
                    ${escapeHTML(
                        evento.titulo || "Sem título"
                    )}
                </strong>

                <span>
                    ${escapeHTML(dataFormatada)}
                    ${
                        horaFormatada
                            ? ` • ${escapeHTML(horaFormatada)}`
                            : ""
                    }
                </span>

            </div>

        `;

    }


    /* =====================================================
       ABRIR MODAL
    ===================================================== */

    function abrirModal(
        evento = null
    ) {

        if (!agendaModal) {
            return;
        }


        if (agendaForm) {
            agendaForm.reset();
        }


        if (agendaId) {
            agendaId.value =
                evento?.id || "";
        }


        if (evento) {

            if (agendaModalTitle) {

                agendaModalTitle.textContent =
                    "Editar compromisso";

            }


            if (agendaTitulo) {

                agendaTitulo.value =
                    evento.titulo || "";

            }


            if (agendaCliente) {

                agendaCliente.value =
                    nomeCliente(evento);

            }


            if (agendaData) {

                agendaData.value =
                    evento.data || "";

            }


            if (agendaHora) {

                agendaHora.value =
                    evento.hora
                        ? String(
                            evento.hora
                        ).slice(0, 5)
                        : "";

            }


            if (agendaTipo) {

                agendaTipo.value =
                    evento.tipo ||
                    "outro";

            }


            if (agendaStatus) {

                agendaStatus.value =
                    evento.status ||
                    "agendado";

            }


            if (agendaObservacoes) {

                agendaObservacoes.value =
                    evento.observacoes ||
                    "";

            }

        }
        else {

            if (agendaModalTitle) {

                agendaModalTitle.textContent =
                    "Novo compromisso";

            }


            if (agendaData) {

                agendaData.value =
                    dataLocalString(
                        dataSelecionada
                    );

            }


            if (agendaStatus) {

                agendaStatus.value =
                    "agendado";

            }

        }


        agendaModal.classList.remove(
            "hidden"
        );


        agendaModal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "modal-open"
        );


        setTimeout(
            () => {

                if (agendaTitulo) {
                    agendaTitulo.focus();
                }

            },
            50
        );

    }


    /* =====================================================
       FECHAR MODAL
    ===================================================== */

    function fecharModal() {

        if (!agendaModal) {
            return;
        }


        agendaModal.classList.add(
            "hidden"
        );


        agendaModal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.classList.remove(
            "modal-open"
        );

    }


    /* =====================================================
       SALVAR EVENTO
    ===================================================== */

    async function salvarEvento(e) {

        e.preventDefault();


        const supabase =
            getSupabase();


        if (!supabase) {

            mostrarToast(
                "Supabase não configurado.",
                "error"
            );

            return;

        }


        const titulo =
            agendaTitulo
                ? agendaTitulo.value.trim()
                : "";


        const data =
            agendaData
                ? agendaData.value
                : "";


        const hora =
            agendaHora
                ? agendaHora.value
                : "";


        const tipo =
            agendaTipo
                ? agendaTipo.value
                : "outro";


        const status =
            agendaStatus
                ? agendaStatus.value
                : "agendado";


        const observacoes =
            agendaObservacoes
                ? agendaObservacoes.value.trim()
                : "";


        if (!titulo) {

            mostrarToast(
                "Informe o título.",
                "error"
            );

            if (agendaTitulo) {
                agendaTitulo.focus();
            }

            return;

        }


        if (!data) {

            mostrarToast(
                "Informe a data.",
                "error"
            );

            if (agendaData) {
                agendaData.focus();
            }

            return;

        }


        /*
           IMPORTANTE:

           A tabela agenda possui:

           cliente_id
           lead_id

           Não possui:

           cliente

           Portanto o campo visual agendaCliente
           NÃO é enviado ao Supabase.
        */


        const dados = {

            titulo,

            data,

            hora:
                hora || null,

            tipo,

            status,

            observacoes:
                observacoes || null,

            concluido:
                status === "concluido",

            updated_at:
                new Date().toISOString()

        };


        /*
           Preenche data_inicio.
        */

        const horario =
            hora || "00:00";


        dados.data_inicio =
            `${data}T${horario}:00`;


        /*
           Se o status não for concluído,
           concluido precisa ser false.
        */

        if (
            status !==
            "concluido"
        ) {

            dados.concluido =
                false;

        }


        try {

            const id =
                agendaId
                    ? agendaId.value.trim()
                    : "";


            /* =============================================
               ATUALIZAR
            ============================================= */

            if (id) {

                const {
                    error
                } = await supabase
                    .from(TABLE)
                    .update(dados)
                    .eq(
                        "id",
                        id
                    );


                if (error) {
                    throw error;
                }


                mostrarToast(
                    "Compromisso atualizado."
                );

            }


            /* =============================================
               CRIAR
            ============================================= */

            else {

                let userId =
                    null;


                try {

                    const {
                        data: authData,
                        error: authError
                    } =
                        await supabase
                            .auth
                            .getUser();


                    if (authError) {
                        throw authError;
                    }


                    userId =
                        authData
                            ?.user
                            ?.id ||
                        null;

                }
                catch (authError) {

                    console.error(
                        "Erro de autenticação:",
                        authError
                    );

                }


                if (!userId) {

                    mostrarToast(
                        "Usuário não autenticado.",
                        "error"
                    );

                    return;

                }


                dados.user_id =
                    userId;


                const {
                    error
                } = await supabase
                    .from(TABLE)
                    .insert([
                        dados
                    ]);


                if (error) {
                    throw error;
                }


                mostrarToast(
                    tipo === "evento"
                        ? "Evento agendado com sucesso."
                        : "Compromisso criado."
                );

            }


            fecharModal();


            await carregarEventos();

        }
        catch (error) {

            console.error(
                "Erro ao salvar agenda:",
                error
            );


            let mensagem =
                "Não foi possível salvar o compromisso.";


            if (error?.message) {
                mensagem =
                    error.message;
            }


            mostrarToast(
                mensagem,
                "error"
            );

        }

    }


    /* =====================================================
       CONCLUIR
    ===================================================== */

    async function concluirEvento(
        id
    ) {

        const supabase =
            getSupabase();


        if (!supabase) {
            return;
        }


        try {

            const {
                error
            } = await supabase
                .from(TABLE)
                .update({

                    status:
                        "concluido",

                    concluido:
                        true,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    id
                );


            if (error) {
                throw error;
            }


            mostrarToast(
                "Atividade concluída."
            );


            await carregarEventos();

        }
        catch (error) {

            console.error(
                "Erro ao concluir atividade:",
                error
            );


            mostrarToast(
                error?.message ||
                "Erro ao concluir atividade.",
                "error"
            );

        }

    }


    /* =====================================================
       EXCLUIR
    ===================================================== */

    async function excluirEvento(
        id
    ) {

        const evento =
            eventos.find(
                item =>
                    String(item.id) ===
                    String(id)
            );


        if (!evento) {
            return;
        }


        const confirmar =
            window.confirm(
                `Excluir "${evento.titulo || "este compromisso"}"?`
            );


        if (!confirmar) {
            return;
        }


        const supabase =
            getSupabase();


        if (!supabase) {
            return;
        }


        try {

            const {
                error
            } = await supabase
                .from(TABLE)
                .delete()
                .eq(
                    "id",
                    id
                );


            if (error) {
                throw error;
            }


            mostrarToast(
                "Compromisso excluído."
            );


            await carregarEventos();

        }
        catch (error) {

            console.error(
                "Erro ao excluir:",
                error
            );


            mostrarToast(
                error?.message ||
                "Erro ao excluir compromisso.",
                "error"
            );

        }

    }


    /* =====================================================
       CLIQUES NA LISTA
    ===================================================== */

    if (agendaList) {

        agendaList.addEventListener(
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


                const evento =
                    eventos.find(
                        item =>
                            String(item.id) ===
                            String(id)
                    );


                if (!evento) {
                    return;
                }


                if (
                    action ===
                    "editar"
                ) {

                    abrirModal(
                        evento
                    );

                    return;

                }


                if (
                    action ===
                    "concluir"
                ) {

                    concluirEvento(
                        id
                    );

                    return;

                }


                if (
                    action ===
                    "excluir"
                ) {

                    excluirEvento(
                        id
                    );

                }

            }
        );

    }


    /* =====================================================
       CLIQUES CALENDÁRIO
    ===================================================== */

    if (calendarDays) {

        calendarDays.addEventListener(
            "click",
            event => {

                const botao =
                    event.target.closest(
                        "[data-date]"
                    );


                if (!botao) {
                    return;
                }


                const data =
                    new Date(
                        `${botao.dataset.date}T12:00:00`
                    );


                if (
                    Number.isNaN(
                        data.getTime()
                    )
                ) {
                    return;
                }


                selecionarDia(
                    data
                );

            }
        );

    }


    /* =====================================================
       MÊS ANTERIOR
    ===================================================== */

    if (mesAnterior) {

        mesAnterior.addEventListener(
            "click",
            () => {

                dataCalendario.setMonth(
                    dataCalendario.getMonth() - 1
                );


                renderizarCalendario();

            }
        );

    }


    /* =====================================================
       PRÓXIMO MÊS
    ===================================================== */

    if (mesProximo) {

        mesProximo.addEventListener(
            "click",
            () => {

                dataCalendario.setMonth(
                    dataCalendario.getMonth() + 1
                );


                renderizarCalendario();

            }
        );

    }


    /* =====================================================
       HOJE
    ===================================================== */

    if (miniAgendaHoje) {

        miniAgendaHoje.addEventListener(
            "click",
            () => {

                const hoje =
                    new Date();


                dataCalendario =
                    new Date(
                        hoje
                    );


                dataSelecionada =
                    new Date(
                        hoje
                    );


                renderizarCalendario();

                renderizarLista();

            }
        );

    }


    /* =====================================================
       NOVO COMPROMISSO
    ===================================================== */

    if (novoEventoBtn) {

        novoEventoBtn.addEventListener(
            "click",
            () => {

                abrirModal();

            }
        );

    }


    /* =====================================================
       FECHAR MODAL
    ===================================================== */

    if (fecharAgendaModal) {

        fecharAgendaModal.addEventListener(
            "click",
            fecharModal
        );

    }


    if (cancelarAgendaBtn) {

        cancelarAgendaBtn.addEventListener(
            "click",
            fecharModal
        );

    }


    if (agendaModal) {

        const overlay =
            agendaModal.querySelector(
                ".modal-overlay"
            );


        if (overlay) {

            overlay.addEventListener(
                "click",
                fecharModal
            );

        }

    }


    /* =====================================================
       ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                agendaModal &&
                !agendaModal.classList.contains(
                    "hidden"
                )
            ) {

                fecharModal();

            }

        }
    );


    /* =====================================================
       FORMULÁRIO
    ===================================================== */

    if (agendaForm) {

        agendaForm.addEventListener(
            "submit",
            salvarEvento
        );

    }


    /* =====================================================
       FILTRO
    ===================================================== */

    if (filtroAgenda) {

        filtroAgenda.addEventListener(
            "change",
            () => {

                renderizarLista();

            }
        );

    }


    /* =====================================================
       ATUALIZAR
    ===================================================== */

    if (atualizarAgendaBtn) {

        atualizarAgendaBtn.addEventListener(
            "click",
            async () => {

                atualizarAgendaBtn.disabled =
                    true;

                try {

                    await carregarEventos();

                }
                finally {

                    atualizarAgendaBtn.disabled =
                        false;

                }

            }
        );

    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    atualizarDataAtual();


    dataCalendario =
        new Date();


    dataSelecionada =
        new Date();


    renderizarCalendario();


    carregarEventos();

});