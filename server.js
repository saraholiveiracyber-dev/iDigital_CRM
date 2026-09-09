const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* Arquivos do CRM */
app.use(express.static(__dirname));

/* Health */
app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        app: "iDigital CRM"
    });
});

/* Asaas */
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

/* Página inicial */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* Servidor */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`iDigital CRM rodando na porta ${PORT}`);
});