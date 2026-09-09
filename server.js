const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/*
=========================================================
HEALTH CHECK
=========================================================
*/

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        app: "iDigital CRM"
    });
});

/*
=========================================================
ASAAS
=========================================================
*/

app.post("/api/asaas/cobranca", async (req, res) => {

    if (!process.env.ASAAS_API_KEY) {
        return res.status(501).json({
            error: "ASAAS_API_KEY não configurada no servidor."
        });
    }

    return res.status(501).json({
        error: "Endpoint Asaas ainda não implementado."
    });
});

/*
=========================================================
ARQUIVOS ESTÁTICOS
=========================================================
*/

const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));

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

    app.get(`/${pagina}`, (req, res) => {

        res.sendFile(
            path.join(publicPath, pagina)
        );

    });

});

/*
=========================================================
RAIZ
=========================================================
*/

app.get("/", (req, res) => {

    res.sendFile(
        path.join(publicPath, "index.html")
    );

});

/*
=========================================================
ERRO 404
=========================================================
*/

app.use((req, res) => {

    res.status(404).send("Página não encontrada.");

});

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

    app.listen(PORT, () => {

        console.log(
            `iDigital CRM rodando em http://localhost:${PORT}`
        );

    });

}