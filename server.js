const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/*
=========================================================
ARQUIVOS ESTÁTICOS
=========================================================
*/
app.use(express.static(path.join(__dirname)));

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
FALLBACK
=========================================================
*/
app.get("/{*splat}", (req, res) => {

    const arquivo = path.join(
        __dirname,
        req.path
    );

    res.sendFile(arquivo, (erro) => {

        if (erro) {

            res.sendFile(
                path.join(__dirname, "index.html")
            );

        }

    });

});

/*
=========================================================
SERVIDOR
=========================================================
*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `iDigital CRM rodando em http://localhost:${PORT}`
    );

});