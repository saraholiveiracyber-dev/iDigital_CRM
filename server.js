const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

/*
=========================================================
CONFIGURAÇÃO
=========================================================
*/

app.use(cors());

app.use(
    express.json({
        limit: "2mb"
    })
);

/*
=========================================================
HEALTH CHECK
=========================================================
*/

app.get("/api/health", (req, res) => {
    res.status(200).json({
        ok: true,
        app: "iDigital CRM",
        status: "online",
        timestamp: new Date().toISOString()
    });
});

/*
=========================================================
ASAAS
=========================================================
*/

app.post("/api/asaas/cobranca", async (req, res) => {

    try {

        if (!process.env.ASAAS_API_KEY) {

            return res.status(501).json({
                ok: false,
                error:
                    "ASAAS_API_KEY não configurada no servidor."
            });
        }

        /*
         * Endpoint reservado para integração Asaas.
         *
         * A chave nunca deve ser enviada para o frontend.
         */

        return res.status(501).json({
            ok: false,
            error:
                "Endpoint Asaas ainda não implementado."
        });

    } catch (error) {

        console.error(
            "[ASAAS] Erro:",
            error
        );

        return res.status(500).json({
            ok: false,
            error:
                "Erro interno no servidor."
        });
    }
});

/*
=========================================================
ARQUIVOS ESTÁTICOS
=========================================================
*/

const publicPath =
    path.join(__dirname, "public");

app.use(
    express.static(publicPath)
);

/*
=========================================================
PÁGINAS HTML
=========================================================
*/

const paginas = [
    "index.html",
    "login.html",
    "dashboard.html",
    "clientes.html",
    "leads.html",
    "agenda.html",
    "configuracoes.html",
    "orcamentos.html",
    "financeiro.html",
    "cobrancas.html"
];

paginas.forEach((pagina) => {

    app.get(
        `/${pagina}`,
        (req, res) => {

            res.sendFile(
                path.join(
                    publicPath,
                    pagina
                )
            );

        }
    );

});

/*
=========================================================
RAIZ
=========================================================
*/

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            publicPath,
            "index.html"
        )
    );

});

/*
=========================================================
ERRO 404
=========================================================
*/

app.use((req, res) => {

    /*
     * Para APIs, retorna JSON.
     */

    if (
        req.path.startsWith("/api/")
    ) {

        return res.status(404).json({
            ok: false,
            error: "API não encontrada.",
            path: req.path
        });

    }

    /*
     * Para páginas, retorna texto simples.
     */

    return res.status(404).send(
        "Página não encontrada."
    );
});

/*
=========================================================
TRATAMENTO GLOBAL DE ERROS
=========================================================
*/

app.use(
    (error, req, res, next) => {

        console.error(
            "[SERVER] Erro:",
            error
        );

        if (res.headersSent) {
            return next(error);
        }

        return res.status(500).json({
            ok: false,
            error:
                "Erro interno no servidor."
        });
    }
);

/*
=========================================================
EXPORTAÇÃO
=========================================================
*/

module.exports = app;

/*
=========================================================
SERVIDOR LOCAL
=========================================================
*/

if (require.main === module) {

    const PORT =
        process.env.PORT || 3000;

    app.listen(
        PORT,
        () => {

            console.log(
                "========================================"
            );

            console.log(
                "iDigital CRM"
            );

            console.log(
                `Servidor: http://localhost:${PORT}`
            );

            console.log(
                "API: /api/health"
            );

            console.log(
                "========================================"
            );

        }
    );

}