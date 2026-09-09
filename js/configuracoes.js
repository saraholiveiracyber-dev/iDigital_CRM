/* =========================================================
   iDIGITAL CRM PREMIUM 2.0
   CONFIGURAÇÕES
   PERFIL + AVATAR + SUPABASE
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIGURAÇÃO
    ===================================================== */

    const BUCKET_AVATARS = "avatars";

    const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

    const MAX_AVATAR_WIDTH = 600;

    const MAX_AVATAR_HEIGHT = 600;


    /* =====================================================
       ELEMENTOS
    ===================================================== */

    const els = {

        /* PERFIL */

        perfilForm:
            document.getElementById("perfilForm"),

        perfilNome:
            document.getElementById("perfilNome"),

        perfilEmail:
            document.getElementById("perfilEmail"),

        perfilTelefone:
            document.getElementById("perfilTelefone"),

        salvarPerfilBtn:
            document.getElementById("salvarPerfilBtn"),


        /* FOTO */

        perfilFoto:
            document.getElementById("perfilFoto"),

        alterarFotoBtn:
            document.getElementById("alterarFotoBtn"),

        removerFotoBtn:
            document.getElementById("removerFotoBtn"),

        profilePhotoImg:
            document.getElementById("profilePhotoImg"),

        profilePhotoInitial:
            document.getElementById("profilePhotoInitial"),


        /* EMPRESA */

        empresaForm:
            document.getElementById("empresaForm"),

        empresaNome:
            document.getElementById("empresaNome"),

        empresaCnpj:
            document.getElementById("empresaCnpj"),

        empresaEmail:
            document.getElementById("empresaEmail"),

        empresaTelefone:
            document.getElementById("empresaTelefone"),

        empresaEndereco:
            document.getElementById("empresaEndereco"),

        salvarEmpresaBtn:
            document.getElementById("salvarEmpresaBtn"),


        /* PREFERÊNCIAS */

        notificacoesAtivas:
            document.getElementById("notificacoesAtivas"),

        lembretesAgenda:
            document.getElementById("lembretesAgenda"),

        atualizacaoAutomatica:
            document.getElementById("atualizacaoAutomatica"),

        salvarPreferenciasBtn:
            document.getElementById(
                "salvarPreferenciasBtn"
            ),


        /* SEGURANÇA */

        alterarSenhaBtn:
            document.getElementById("alterarSenhaBtn"),

        sairContaBtn:
            document.getElementById("sairContaBtn"),

        senhaModal:
            document.getElementById("senhaModal"),

        senhaForm:
            document.getElementById("senhaForm"),

        novaSenha:
            document.getElementById("novaSenha"),

        confirmarSenha:
            document.getElementById("confirmarSenha"),

        fecharSenhaModal:
            document.getElementById("fecharSenhaModal"),

        cancelarSenhaBtn:
            document.getElementById("cancelarSenhaBtn"),

        salvarSenhaBtn:
            document.getElementById("salvarSenhaBtn"),


        /* SIDEBAR */

        userAvatar:
            document.getElementById("userAvatar"),

        userName:
            document.getElementById("userName"),

        userEmail:
            document.getElementById("userEmail"),

        logoutBtn:
            document.getElementById("logoutBtn"),


        /* DATA */

        todayText:
            document.getElementById("todayText")

    };


    /* =====================================================
       ESTADO
    ===================================================== */

    let usuarioAtual = null;

    let perfilAtual = null;

    let avatarUrlAtual = null;

    let cropper = null;

    let arquivoSelecionado = null;


    /* =====================================================
       SUPABASE
    ===================================================== */

    function getSupabase() {

        if (
            typeof supabaseClient !== "undefined" &&
            supabaseClient
        ) {
            return supabaseClient;
        }


        if (
            window.supabaseClient
        ) {
            return window.supabaseClient;
        }


        console.error(
            "supabaseClient não encontrado."
        );

        return null;
    }


    /* =====================================================
       INICIAIS
    ===================================================== */

    function obterIniciais(nome, email) {

        const texto = String(
            nome ||
            email ||
            "U"
        ).trim();


        if (!texto) {
            return "U";
        }


        const partes = texto
            .split(/\s+/)
            .filter(Boolean);


        if (partes.length >= 2) {

            return (
                partes[0][0] +
                partes[partes.length - 1][0]
            ).toUpperCase();

        }


        return texto
            .substring(0, 2)
            .toUpperCase();
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escaparHtml(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       DATA ATUAL
    ===================================================== */

    function atualizarDataAtual() {

        if (!els.todayText) {
            return;
        }


        const hoje = new Date();


        els.todayText.textContent =
            hoje.toLocaleDateString(
                "pt-BR",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );
    }


    /* =====================================================
       CARREGAR USUÁRIO
    ===================================================== */

    async function carregarUsuario() {

        const sb = getSupabase();


        if (!sb) {
            return null;
        }


        const {
            data,
            error
        } = await sb.auth.getUser();


        if (error) {

            console.error(
                "Erro ao carregar usuário:",
                error
            );

            return null;
        }


        usuarioAtual =
            data?.user || null;


        return usuarioAtual;
    }


    /* =====================================================
       CARREGAR PERFIL
    ===================================================== */

    async function carregarPerfil() {

        const sb = getSupabase();


        if (
            !sb ||
            !usuarioAtual
        ) {
            return;
        }


        const {
            data,
            error
        } = await sb
            .from("profiles")
            .select("*")
            .eq(
                "id",
                usuarioAtual.id
            )
            .maybeSingle();


        if (error) {

            console.error(
                "Erro ao consultar perfil:",
                error
            );

            return;
        }


        perfilAtual = data || null;


        /* =================================================
           CRIA PERFIL CASO NÃO EXISTA
        ================================================== */

        if (!perfilAtual) {

            const nomeInicial =
                usuarioAtual.user_metadata?.nome ||
                usuarioAtual.user_metadata?.full_name ||
                usuarioAtual.email?.split("@")[0] ||
                "Usuário";


            const {
                data: novoPerfil,
                error: criarError
            } = await sb
                .from("profiles")
                .insert({

                    id:
                        usuarioAtual.id,

                    nome:
                        nomeInicial,

                    avatar_url:
                        null

                })
                .select()
                .single();


            if (criarError) {

                console.error(
                    "Erro ao criar perfil:",
                    criarError
                );

                return;

            }


            perfilAtual = novoPerfil;
        }


        avatarUrlAtual =
            perfilAtual?.avatar_url || null;


        preencherCampos();

        atualizarAvatarVisual();
    }


    /* =====================================================
       PREENCHER CAMPOS
    ===================================================== */

    function preencherCampos() {

        const nome =
            perfilAtual?.nome ||
            usuarioAtual?.user_metadata?.nome ||
            usuarioAtual?.user_metadata?.full_name ||
            usuarioAtual?.email?.split("@")[0] ||
            "Usuário";


        const email =
            usuarioAtual?.email || "";


        /* PERFIL */

        if (els.perfilNome) {

            els.perfilNome.value =
                nome;
        }


        if (els.perfilEmail) {

            els.perfilEmail.value =
                email;
        }


        if (els.perfilTelefone) {

            els.perfilTelefone.value =
                perfilAtual?.telefone || "";
        }


        /* EMPRESA */

        if (els.empresaNome) {

            els.empresaNome.value =
                perfilAtual?.empresa || "";
        }


        if (els.empresaCnpj) {

            els.empresaCnpj.value =
                perfilAtual?.cnpj || "";
        }


        if (els.empresaEmail) {

            els.empresaEmail.value =
                perfilAtual?.email_empresa || "";
        }


        if (els.empresaTelefone) {

            els.empresaTelefone.value =
                perfilAtual?.telefone_empresa ||
                "";
        }


        if (els.empresaEndereco) {

            els.empresaEndereco.value =
                perfilAtual?.endereco_empresa ||
                "";
        }


        atualizarAvatarVisual();
    }


    /* =====================================================
       AVATAR VISUAL
    ===================================================== */

    function atualizarAvatarVisual() {

        const nome =
            perfilAtual?.nome ||
            usuarioAtual?.user_metadata?.nome ||
            usuarioAtual?.user_metadata?.full_name ||
            usuarioAtual?.email?.split("@")[0] ||
            "Usuário";


        const email =
            usuarioAtual?.email || "";


        const iniciais =
            obterIniciais(
                nome,
                email
            );


        /* =================================================
           AVATAR DA PÁGINA
        ================================================== */

        if (
            els.profilePhotoImg &&
            els.profilePhotoInitial
        ) {

            if (avatarUrlAtual) {

                els.profilePhotoImg.src =
                    avatarUrlAtual;

                els.profilePhotoImg.classList.remove(
                    "hidden"
                );

                els.profilePhotoInitial.classList.add(
                    "hidden"
                );

            } else {

                els.profilePhotoImg.removeAttribute(
                    "src"
                );

                els.profilePhotoImg.classList.add(
                    "hidden"
                );

                els.profilePhotoInitial.textContent =
                    iniciais;

                els.profilePhotoInitial.classList.remove(
                    "hidden"
                );
            }
        }


        /* =================================================
           BOTÃO REMOVER
        ================================================== */

        if (els.removerFotoBtn) {

            if (avatarUrlAtual) {

                els.removerFotoBtn.classList.remove(
                    "hidden"
                );

            } else {

                els.removerFotoBtn.classList.add(
                    "hidden"
                );
            }
        }


        /* =================================================
           AVATAR GLOBAL
        ================================================== */

        atualizarAvatarGlobal(
            avatarUrlAtual,
            iniciais,
            nome,
            email
        );
    }


    /* =====================================================
       AVATAR GLOBAL
    ===================================================== */

    function atualizarAvatarGlobal(
        url,
        iniciais,
        nome,
        email
    ) {

        document
            .querySelectorAll(
                "#userAvatar, [data-user-avatar]"
            )
            .forEach(elemento => {

                if (url) {

                    elemento.innerHTML = `
                        <img
                            src="${escaparHtml(url)}"
                            alt="Foto de ${escaparHtml(nome)}"
                        >
                    `;

                } else {

                    elemento.textContent =
                        iniciais;
                }


                elemento.title =
                    email || nome;
            });


        document
            .querySelectorAll(
                "#userName, [data-user-name]"
            )
            .forEach(elemento => {

                elemento.textContent =
                    nome;
            });


        document
            .querySelectorAll(
                "#userEmail, [data-user-email]"
            )
            .forEach(elemento => {

                elemento.textContent =
                    email;
            });
    }


    /* =====================================================
       ABRIR SELETOR DE FOTO
    ===================================================== */

    function selecionarFoto() {

        if (!els.perfilFoto) {
            return;
        }

        els.perfilFoto.click();
    }


    /* =====================================================
       PROCESSAR FOTO
    ===================================================== */

    function processarFoto(file) {

        if (!file) {
            return;
        }


        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (
            !tiposPermitidos.includes(
                file.type
            )
        ) {

            alert(
                "Selecione uma imagem JPG, PNG ou WEBP."
            );

            return;
        }


        if (
            file.size > MAX_AVATAR_SIZE
        ) {

            alert(
                "A foto deve ter no máximo 5 MB."
            );

            return;
        }


        arquivoSelecionado = file;


        /* Se Cropper.js estiver carregado,
           abre o editor. */

        if (
            typeof Cropper !== "undefined"
        ) {

            abrirEditorFoto(file);

            return;
        }


        /* Fallback: envia diretamente */

        enviarAvatar(file);
    }


    /* =====================================================
       CRIAR MODAL DE CORTE
    ===================================================== */

    function criarCropModal() {

        if (
            document.getElementById(
                "cropModal"
            )
        ) {
            return;
        }


        const modal = document.createElement(
            "div"
        );

        modal.id = "cropModal";

        modal.className = "modal hidden";


        modal.innerHTML = `

            <div class="modal-overlay"></div>

            <div class="modal-card crop-modal-card">

                <div class="modal-header">

                    <div>

                        <div class="config-kicker">
                            FOTO DE PERFIL
                        </div>

                        <h2>
                            Ajustar foto
                        </h2>

                    </div>

                    <button
                        type="button"
                        class="modal-close"
                        id="fecharCropModal"
                        aria-label="Fechar"
                    >
                        ✕
                    </button>

                </div>


                <div class="crop-area">

                    <img
                        id="cropImage"
                        src=""
                        alt="Pré-visualização da foto"
                    >

                </div>


                <div class="crop-actions">

                    <button
                        type="button"
                        class="btn"
                        id="girarCropBtn"
                    >
                        ↻ Girar
                    </button>

                    <button
                        type="button"
                        class="btn"
                        id="cancelarCropBtn"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        class="btn btn-primary"
                        id="confirmarCropBtn"
                    >
                        ✓ Usar esta foto
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(modal);


        configurarEventosCrop();
    }


    /* =====================================================
       ABRIR EDITOR
    ===================================================== */

    function abrirEditorFoto(file) {

        criarCropModal();


        const modal =
            document.getElementById(
                "cropModal"
            );

        const image =
            document.getElementById(
                "cropImage"
            );


        if (!modal || !image) {
            return;
        }


        const reader =
            new FileReader();


        reader.onload = event => {

            image.src =
                event.target.result;


            modal.classList.remove(
                "hidden"
            );


            modal.classList.add(
                "active"
            );


            image.onload = () => {

                if (cropper) {

                    cropper.destroy();

                    cropper = null;
                }


                cropper =
                    new Cropper(
                        image,
                        {

                            aspectRatio: 1,

                            viewMode: 1,

                            dragMode: "move",

                            autoCropArea: .9,

                            responsive: true,

                            restore: true,

                            guides: false,

                            center: true,

                            highlight: false,

                            background: false,

                            movable: true,

                            zoomable: true,

                            rotatable: true,

                            scalable: false,

                            cropBoxMovable: true,

                            cropBoxResizable: true,

                            toggleDragModeOnDblclick: false

                        }
                    );
            };
        };


        reader.readAsDataURL(file);
    }


    /* =====================================================
       CONFIGURAR EVENTOS DO CROP
    ===================================================== */

    function configurarEventosCrop() {

        const fechar =
            document.getElementById(
                "fecharCropModal"
            );

        const cancelar =
            document.getElementById(
                "cancelarCropBtn"
            );

        const girar =
            document.getElementById(
                "girarCropBtn"
            );

        const confirmar =
            document.getElementById(
                "confirmarCropBtn"
            );


        fechar?.addEventListener(
            "click",
            fecharEditorFoto
        );


        cancelar?.addEventListener(
            "click",
            fecharEditorFoto
        );


        girar?.addEventListener(
            "click",
            () => {

                if (cropper) {

                    cropper.rotate(90);
                }
            }
        );


        confirmar?.addEventListener(
            "click",
            confirmarCorte
        );
    }


    /* =====================================================
       FECHAR EDITOR
    ===================================================== */

    function fecharEditorFoto() {

        const modal =
            document.getElementById(
                "cropModal"
            );


        if (cropper) {

            cropper.destroy();

            cropper = null;
        }


        if (modal) {

            modal.classList.remove(
                "active"
            );

            modal.classList.add(
                "hidden"
            );
        }


        arquivoSelecionado =
            null;


        if (els.perfilFoto) {

            els.perfilFoto.value =
                "";
        }
    }


    /* =====================================================
       CONFIRMAR CORTE
    ===================================================== */

    async function confirmarCorte() {

        if (!cropper) {
            return;
        }


        const canvas =
            cropper.getCroppedCanvas({

                width:
                    MAX_AVATAR_WIDTH,

                height:
                    MAX_AVATAR_HEIGHT,

                imageSmoothingEnabled:
                    true,

                imageSmoothingQuality:
                    "high"

            });


        if (!canvas) {

            alert(
                "Não foi possível cortar a imagem."
            );

            return;
        }


        canvas.toBlob(
            async blob => {

                if (!blob) {

                    alert(
                        "Não foi possível processar a imagem."
                    );

                    return;
                }


                const arquivoCortado =
                    new File(
                        [blob],
                        "avatar.webp",
                        {
                            type:
                                "image/webp",

                            lastModified:
                                Date.now()
                        }
                    );


                fecharEditorFoto();


                await enviarAvatar(
                    arquivoCortado
                );

            },
            "image/webp",
            .90
        );
    }


    /* =====================================================
       UPLOAD DO AVATAR
    ===================================================== */

    async function enviarAvatar(file) {

        const sb =
            getSupabase();


        if (
            !sb ||
            !usuarioAtual ||
            !file
        ) {
            return;
        }


        try {

            if (
                els.alterarFotoBtn
            ) {

                els.alterarFotoBtn.disabled =
                    true;

                els.alterarFotoBtn.textContent =
                    "Enviando...";
            }


            /* =================================================
               CAMINHO DO ARQUIVO
            ================================================== */

            const caminho =
                `${usuarioAtual.id}/avatar.webp`;


            /* =================================================
               UPLOAD
            ================================================== */

            const {
                error: uploadError
            } = await sb
                .storage
                .from(
                    BUCKET_AVATARS
                )
                .upload(
                    caminho,
                    file,
                    {

                        cacheControl:
                            "3600",

                        contentType:
                            file.type,

                        upsert:
                            true

                    }
                );


            if (uploadError) {
                throw uploadError;
            }


            /* =================================================
               URL PÚBLICA
            ================================================== */

            const {
                data: publicData
            } = sb
                .storage
                .from(
                    BUCKET_AVATARS
                )
                .getPublicUrl(
                    caminho
                );


            if (
                !publicData?.publicUrl
            ) {

                throw new Error(
                    "Não foi possível gerar a URL da foto."
                );
            }


            /* =================================================
               CACHE BUSTER
            ================================================== */

            const publicUrl =
                `${publicData.publicUrl}?v=${Date.now()}`;


            /* =================================================
               SALVAR NO PROFILE
            ================================================== */

            const {
                data: perfil,
                error: perfilError
            } = await sb
                .from("profiles")
                .upsert(
                    {

                        id:
                            usuarioAtual.id,

                        nome:
                            perfilAtual?.nome ||
                            usuarioAtual.email
                                ?.split("@")[0] ||
                            "Usuário",

                        avatar_url:
                            publicUrl

                    },
                    {
                        onConflict:
                            "id"
                    }
                )
                .select()
                .single();


            if (perfilError) {
                throw perfilError;
            }


            perfilAtual =
                perfil;


            avatarUrlAtual =
                publicUrl;


            atualizarAvatarVisual();


            /* =================================================
               SUCESSO
            ================================================== */

            alert(
                "Foto de perfil atualizada com sucesso."
            );


        } catch (error) {

            console.error(
                "Erro ao enviar avatar:",
                error
            );


            alert(
                "Não foi possível enviar a foto.\n\n" +
                error.message
            );


        } finally {

            if (
                els.alterarFotoBtn
            ) {

                els.alterarFotoBtn.disabled =
                    false;

                els.alterarFotoBtn.textContent =
                    "📷 Alterar foto";
            }


            if (
                els.perfilFoto
            ) {

                els.perfilFoto.value =
                    "";
            }
        }
    }


    /* =====================================================
       REMOVER AVATAR
    ===================================================== */

    async function removerAvatar() {

        const sb =
            getSupabase();


        if (
            !sb ||
            !usuarioAtual
        ) {
            return;
        }


        if (!avatarUrlAtual) {

            return;
        }


        const confirmar =
            confirm(
                "Deseja remover sua foto de perfil?"
            );


        if (!confirmar) {
            return;
        }


        try {

            if (
                els.removerFotoBtn
            ) {

                els.removerFotoBtn.disabled =
                    true;

                els.removerFotoBtn.textContent =
                    "Removendo...";
            }


            const caminho =
                `${usuarioAtual.id}/avatar.webp`;


            /* =================================================
               REMOVER ARQUIVO
            ================================================== */

            const {
                error: removeError
            } = await sb
                .storage
                .from(
                    BUCKET_AVATARS
                )
                .remove([
                    caminho
                ]);


            if (removeError) {

                console.warn(
                    "Aviso ao remover arquivo:",
                    removeError
                );
            }


            /* =================================================
               LIMPAR PROFILE
            ================================================== */

            const {
                error: updateError
            } = await sb
                .from("profiles")
                .update({

                    avatar_url:
                        null

                })
                .eq(
                    "id",
                    usuarioAtual.id
                );


            if (updateError) {
                throw updateError;
            }


            avatarUrlAtual =
                null;


            if (perfilAtual) {

                perfilAtual.avatar_url =
                    null;
            }


            atualizarAvatarVisual();


            alert(
                "Foto de perfil removida."
            );


        } catch (error) {

            console.error(
                "Erro ao remover avatar:",
                error
            );


            alert(
                "Não foi possível remover a foto.\n\n" +
                error.message
            );


        } finally {

            if (
                els.removerFotoBtn
            ) {

                els.removerFotoBtn.disabled =
                    false;

                els.removerFotoBtn.textContent =
                    "Remover foto";
            }
        }
    }


    /* =====================================================
       SALVAR PERFIL
    ===================================================== */

    async function salvarPerfil(event) {

        event?.preventDefault();


        const sb =
            getSupabase();


        if (
            !sb ||
            !usuarioAtual
        ) {

            alert(
                "Sua sessão não foi encontrada."
            );

            return;
        }


        const nome =
            els.perfilNome?.value
                ?.trim() ||
            "Usuário";


        try {

            if (
                els.salvarPerfilBtn
            ) {

                els.salvarPerfilBtn.disabled =
                    true;

                els.salvarPerfilBtn.textContent =
                    "Salvando...";
            }


            const {
                data,
                error
            } = await sb
                .from("profiles")
                .upsert(
                    {

                        id:
                            usuarioAtual.id,

                        nome:
                            nome,

                        avatar_url:
                            avatarUrlAtual,

                        telefone:
                            els.perfilTelefone
                                ?.value
                                ?.trim() ||
                            null

                    },
                    {
                        onConflict:
                            "id"
                    }
                )
                .select()
                .single();


            if (error) {
                throw error;
            }


            perfilAtual =
                data;


            atualizarAvatarVisual();


            alert(
                "Perfil salvo com sucesso."
            );


        } catch (error) {

            console.error(
                "Erro ao salvar perfil:",
                error
            );


            alert(
                "Não foi possível salvar o perfil.\n\n" +
                error.message
            );


        } finally {

            if (
                els.salvarPerfilBtn
            ) {

                els.salvarPerfilBtn.disabled =
                    false;

                els.salvarPerfilBtn.textContent =
                    "💾 Salvar perfil";
            }
        }
    }


    /* =====================================================
       SALVAR EMPRESA
    ===================================================== */

    async function salvarEmpresa(event) {

        event?.preventDefault();


        const sb =
            getSupabase();


        if (
            !sb ||
            !usuarioAtual
        ) {

            alert(
                "Sua sessão não foi encontrada."
            );

            return;
        }


        try {

            if (
                els.salvarEmpresaBtn
            ) {

                els.salvarEmpresaBtn.disabled =
                    true;

                els.salvarEmpresaBtn.textContent =
                    "Salvando...";
            }


            const {
                data,
                error
            } = await sb
                .from("profiles")
                .upsert(
                    {

                        id:
                            usuarioAtual.id,

                        nome:
                            perfilAtual?.nome ||
                            els.perfilNome?.value?.trim() ||
                            "Usuário",

                        avatar_url:
                            avatarUrlAtual,

                        empresa:
                            els.empresaNome
                                ?.value
                                ?.trim() ||
                            null,

                        cnpj:
                            els.empresaCnpj
                                ?.value
                                ?.trim() ||
                            null,

                        email_empresa:
                            els.empresaEmail
                                ?.value
                                ?.trim() ||
                            null,

                        telefone_empresa:
                            els.empresaTelefone
                                ?.value
                                ?.trim() ||
                            null,

                        endereco_empresa:
                            els.empresaEndereco
                                ?.value
                                ?.trim() ||
                            null

                    },
                    {
                        onConflict:
                            "id"
                    }
                )
                .select()
                .single();


            if (error) {
                throw error;
            }


            perfilAtual =
                data;


            preencherCampos();


            alert(
                "Dados da empresa salvos com sucesso."
            );


        } catch (error) {

            console.error(
                "Erro ao salvar empresa:",
                error
            );


            alert(
                "Não foi possível salvar os dados da empresa.\n\n" +
                error.message
            );


        } finally {

            if (
                els.salvarEmpresaBtn
            ) {

                els.salvarEmpresaBtn.disabled =
                    false;

                els.salvarEmpresaBtn.textContent =
                    "💾 Salvar empresa";
            }
        }
    }


    /* =====================================================
       SALVAR PREFERÊNCIAS
    ===================================================== */

    function salvarPreferencias() {

        const preferencias = {

            notificacoes:
                els.notificacoesAtivas
                    ?.checked ??
                true,

            lembretesAgenda:
                els.lembretesAgenda
                    ?.checked ??
                true,

            atualizacaoAutomatica:
                els.atualizacaoAutomatica
                    ?.checked ??
                true

        };


        localStorage.setItem(
            "idigital_crm_preferencias",
            JSON.stringify(
                preferencias
            )
        );


        alert(
            "Preferências salvas com sucesso."
        );
    }


    /* =====================================================
       CARREGAR PREFERÊNCIAS
    ===================================================== */

    function carregarPreferencias() {

        try {

            const dados =
                localStorage.getItem(
                    "idigital_crm_preferencias"
                );


            if (!dados) {
                return;
            }


            const preferencias =
                JSON.parse(dados);


            if (
                els.notificacoesAtivas &&
                typeof preferencias.notificacoes ===
                    "boolean"
            ) {

                els.notificacoesAtivas.checked =
                    preferencias.notificacoes;
            }


            if (
                els.lembretesAgenda &&
                typeof preferencias.lembretesAgenda ===
                    "boolean"
            ) {

                els.lembretesAgenda.checked =
                    preferencias.lembretesAgenda;
            }


            if (
                els.atualizacaoAutomatica &&
                typeof preferencias.atualizacaoAutomatica ===
                    "boolean"
            ) {

                els.atualizacaoAutomatica.checked =
                    preferencias.atualizacaoAutomatica;
            }

        } catch (error) {

            console.warn(
                "Não foi possível carregar preferências:",
                error
            );
        }
    }


    /* =====================================================
       MÁSCARA CNPJ
    ===================================================== */

    function configurarCnpj() {

        if (!els.empresaCnpj) {
            return;
        }


        els.empresaCnpj.addEventListener(
            "input",
            () => {

                let valor =
                    els.empresaCnpj.value
                        .replace(/\D/g, "")
                        .slice(0, 14);


                if (valor.length > 2) {

                    valor =
                        valor.replace(
                            /^(\d{2})(\d)/,
                            "$1.$2"
                        );
                }


                if (valor.length > 6) {

                    valor =
                        valor.replace(
                            /^(\d{2})\.(\d{3})(\d)/,
                            "$1.$2.$3"
                        );
                }


                if (valor.length > 10) {

                    valor =
                        valor.replace(
                            /^(\d{2})\.(\d{3})\.(\d{3})(\d)/,
                            "$1.$2.$3/$4"
                        );
                }


                if (valor.length > 15) {

                    valor =
                        valor.replace(
                            /^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/,
                            "$1.$2.$3/$4-$5"
                        );
                }


                els.empresaCnpj.value =
                    valor;
            }
        );
    }


    /* =====================================================
       MÁSCARA TELEFONE
    ===================================================== */

    function configurarTelefone() {

        const campos = [
            els.perfilTelefone,
            els.empresaTelefone
        ];


        campos.forEach(campo => {

            if (!campo) {
                return;
            }


            campo.addEventListener(
                "input",
                () => {

                    let valor =
                        campo.value
                            .replace(/\D/g, "")
                            .slice(0, 11);


                    if (
                        valor.length <= 10
                    ) {

                        valor =
                            valor.replace(
                                /^(\d{2})(\d)/,
                                "($1) $2"
                            );

                        valor =
                            valor.replace(
                                /(\d{4})(\d)/,
                                "$1-$2"
                            );

                    } else {

                        valor =
                            valor.replace(
                                /^(\d{2})(\d)/,
                                "($1) $2"
                            );

                        valor =
                            valor.replace(
                                /(\d{5})(\d)/,
                                "$1-$2"
                            );
                    }


                    campo.value =
                        valor;
                }
            );
        });
    }


    /* =====================================================
       MODAL SENHA
    ===================================================== */

    function abrirModalSenha() {

        if (!els.senhaModal) {
            return;
        }


        els.senhaModal.classList.remove(
            "hidden"
        );


        els.senhaModal.classList.add(
            "active"
        );


        els.senhaModal.setAttribute(
            "aria-hidden",
            "false"
        );


        els.novaSenha?.focus();
    }


    function fecharModalSenha() {

        if (!els.senhaModal) {
            return;
        }


        els.senhaModal.classList.add(
            "hidden"
        );


        els.senhaModal.classList.remove(
            "active"
        );


        els.senhaModal.setAttribute(
            "aria-hidden",
            "true"
        );


        els.senhaForm?.reset();
    }


    /* =====================================================
       ATUALIZAR SENHA
    ===================================================== */

    async function atualizarSenha(event) {

        event?.preventDefault();


        const sb =
            getSupabase();


        if (!sb) {
            return;
        }


        const novaSenha =
            els.novaSenha?.value || "";


        const confirmarSenha =
            els.confirmarSenha?.value || "";


        if (
            novaSenha.length < 6
        ) {

            alert(
                "A senha deve ter pelo menos 6 caracteres."
            );

            return;
        }


        if (
            novaSenha !== confirmarSenha
        ) {

            alert(
                "As senhas não conferem."
            );

            return;
        }


        try {

            if (
                els.salvarSenhaBtn
            ) {

                els.salvarSenhaBtn.disabled =
                    true;

                els.salvarSenhaBtn.textContent =
                    "Atualizando...";
            }


            const {
                error
            } = await sb.auth.updateUser({

                password:
                    novaSenha

            });


            if (error) {
                throw error;
            }


            alert(
                "Senha atualizada com sucesso."
            );


            fecharModalSenha();


        } catch (error) {

            console.error(
                "Erro ao atualizar senha:",
                error
            );


            alert(
                "Não foi possível atualizar a senha.\n\n" +
                error.message
            );


        } finally {

            if (
                els.salvarSenhaBtn
            ) {

                els.salvarSenhaBtn.disabled =
                    false;

                els.salvarSenhaBtn.textContent =
                    "🔐 Atualizar senha";
            }
        }
    }


    /* =====================================================
       SAIR
    ===================================================== */

    async function sairConta() {

        const sb =
            getSupabase();


        if (!sb) {
            return;
        }


        const confirmar =
            confirm(
                "Deseja realmente sair da sua conta?"
            );


        if (!confirmar) {
            return;
        }


        const {
            error
        } = await sb.auth.signOut();


        if (error) {

            console.error(
                "Erro ao sair:",
                error
            );

            alert(
                "Não foi possível sair da conta."
            );

            return;
        }


        window.location.href =
            "login.html";
    }


    /* =====================================================
       EVENTOS
    ===================================================== */

    els.alterarFotoBtn?.addEventListener(
        "click",
        selecionarFoto
    );


    els.perfilFoto?.addEventListener(
        "change",
        event => {

            const file =
                event.target?.files?.[0];


            if (file) {

                processarFoto(file);
            }
        }
    );


    els.removerFotoBtn?.addEventListener(
        "click",
        removerAvatar
    );


    els.perfilForm?.addEventListener(
        "submit",
        salvarPerfil
    );


    els.empresaForm?.addEventListener(
        "submit",
        salvarEmpresa
    );


    els.salvarPreferenciasBtn?.addEventListener(
        "click",
        salvarPreferencias
    );


    els.alterarSenhaBtn?.addEventListener(
        "click",
        abrirModalSenha
    );


    els.fecharSenhaModal?.addEventListener(
        "click",
        fecharModalSenha
    );


    els.cancelarSenhaBtn?.addEventListener(
        "click",
        fecharModalSenha
    );


    els.senhaForm?.addEventListener(
        "submit",
        atualizarSenha
    );


    els.sairContaBtn?.addEventListener(
        "click",
        sairConta
    );


    els.logoutBtn?.addEventListener(
        "click",
        sairConta
    );


    /* Fechar modal clicando fora */

    els.senhaModal?.querySelector(
        ".modal-overlay"
    )?.addEventListener(
        "click",
        fecharModalSenha
    );


    configurarCnpj();

    configurarTelefone();

    carregarPreferencias();

    atualizarDataAtual();


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    async function inicializar() {

        const usuario =
            await carregarUsuario();


        if (!usuario) {

            window.location.href =
                "login.html";

            return;
        }


        await carregarPerfil();
    }


    inicializar();


    /* =====================================================
       API GLOBAL
    ===================================================== */

    window.crmPerfil = {

        carregar:
            carregarPerfil,

        enviarAvatar:
            enviarAvatar,

        removerAvatar:
            removerAvatar,

        atualizarAvatar:
            atualizarAvatarVisual,

        getUsuario:
            () => usuarioAtual,

        getPerfil:
            () => perfilAtual

    };

})();