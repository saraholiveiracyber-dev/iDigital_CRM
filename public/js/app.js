window.crm = {
  money(v){ return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); },
  date(v){ if(!v) return "-"; const d=new Date(v+"T00:00:00"); return d.toLocaleDateString("pt-BR"); },
  esc(v){ return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); },
  badge(status){
    const s=String(status||"").toLowerCase();
    const cls=s.includes("pago")||s.includes("aprov")||s.includes("ativo")||s.includes("fechado")?"success":
      s.includes("pend")||s.includes("enviado")||s.includes("rascunho")?"warning":
      s.includes("recus")||s.includes("cancel")||s.includes("inativo")?"danger":"info";
    return `<span class="badge badge-${cls}">${this.esc(status||"-")}</span>`;
  },
  async uid(){ const {data:{user}}=await supabaseClient.auth.getUser(); return user?.id; },
  toast(msg){ alert(msg); }
};

document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>document.getElementById(b.dataset.open)?.classList.add("show")));
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>b.closest(".modal-backdrop")?.classList.remove("show")));
document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("show")}));
document.getElementById("menuBtn")?.addEventListener("click",()=>document.getElementById("sidebar")?.classList.toggle("open"));
document.getElementById("logoutBtn")?.addEventListener("click",async()=>{await supabaseClient.auth.signOut();location.replace("login.html")});
document.getElementById("todayText").textContent=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});

(async()=>{
 const {data:{user}}=await supabaseClient.auth.getUser();
 if(!user)return;
 document.getElementById("userEmail").textContent=user.email||"";
 const name=user.user_metadata?.nome||user.email?.split("@")[0]||"Usuário";
 document.getElementById("userName").textContent=name;
 document.getElementById("userAvatar").textContent=name.slice(0,1).toUpperCase();
})();

/* =========================================================
   iDIGITAL CRM
   AVATAR GLOBAL
========================================================= */

(() => {

    "use strict";


    async function carregarAvatarGlobal() {

        if (
            typeof supabaseClient === "undefined" ||
            !supabaseClient
        ) {

            return;

        }


        try {

            const {
                data,
                error
            } = await supabaseClient
                .auth
                .getUser();


            if (
                error ||
                !data?.user
            ) {

                return;

            }


            const user =
                data.user;


            const {
                data: perfil
            } = await supabaseClient
                .from("profiles")
                .select(
                    "nome, avatar_url"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


            const nome =
                perfil?.nome ||

                user.user_metadata?.nome ||

                user.user_metadata?.full_name ||

                user.email
                    ?.split("@")[0] ||

                "Usuário";


            const email =
                user.email || "";


            const avatar =
                perfil?.avatar_url ||
                null;


            const iniciais =
                obterIniciaisGlobal(
                    nome,
                    email
                );


            atualizarElementosGlobais(
                avatar,
                iniciais,
                nome,
                email
            );


        } catch (error) {

            console.warn(
                "Avatar global não carregado:",
                error
            );

        }

    }


    function obterIniciaisGlobal(
        nome,
        email
    ) {

        const texto =
            String(
                nome ||
                email ||
                "U"
            ).trim();


        const partes =
            texto
                .split(/\s+/)
                .filter(Boolean);


        if (
            partes.length >= 2
        ) {

            return (
                partes[0][0] +
                partes[partes.length - 1][0]
            ).toUpperCase();

        }


        return texto
            .substring(0, 2)
            .toUpperCase();

    }


    function atualizarElementosGlobais(
        avatar,
        iniciais,
        nome,
        email
    ) {

        document
            .querySelectorAll(
                "#userAvatar, [data-user-avatar]"
            )
            .forEach(
                elemento => {

                    if (avatar) {

                        elemento.innerHTML = `
                            <img
                                src="${escaparGlobal(avatar)}"
                                alt="Foto de ${escaparGlobal(nome)}"
                            >
                        `;

                    } else {

                        elemento.textContent =
                            iniciais;

                    }

                }
            );


        document
            .querySelectorAll(
                "#userName, [data-user-name]"
            )
            .forEach(
                elemento => {

                    elemento.textContent =
                        nome;

                }
            );


        document
            .querySelectorAll(
                "#userEmail, [data-user-email]"
            )
            .forEach(
                elemento => {

                    elemento.textContent =
                        email;

                }
            );

    }


    function escaparGlobal(
        valor
    ) {

        return String(
            valor ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    function iniciarAvatarGlobal() {

        carregarAvatarGlobal();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarAvatarGlobal
        );

    } else {

        iniciarAvatarGlobal();

    }


    window.carregarAvatarGlobal =
        carregarAvatarGlobal;

})();


