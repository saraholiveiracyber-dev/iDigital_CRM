const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/health",(req,res)=>res.json({ok:true,app:"iDigital CRM "}));

/*
  Integração ASAAS:
  - Guarde ASAAS_API_KEY apenas no .env do servidor.
  - Nunca coloque a chave secreta no JS do navegador.
*/
app.post("/api/asaas/cobranca", async (req,res)=>{
  if(!process.env.ASAAS_API_KEY) return res.status(501).json({error:"ASAAS_API_KEY não configurada no servidor."});
  return res.status(501).json({error:"Endpoint-base preparado. Implemente conforme sua conta e ambiente Asaas."});
});

app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`iDigital CRM rodando em http://localhost:${PORT}`));



