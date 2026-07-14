// INTEGRAÇÃO COM RM: CRIA/ATUALIZA CFO (CLIENTE/FORNECEDOR) E CONTATOS
function servicetask16(attempt, message) {

    var COLIGADA = "1";
    var COLIGADAS_BANCO = ["1", "2", "5", "6", "12", "13"];

    // Lê um campo do card como string (trim); "" se nulo.
    function clienteForncedor(nome) {
        return String(hAPI.getCardValue(nome) || "").trim();
    }

    var categoria     = clienteForncedor("categoria");   
    var classificacao = clienteForncedor("classificacao");   
    var tipo          = clienteForncedor("tipo");            

    var razaoSocial   = clienteForncedor("razaoSocial");
    var nomeFantasia  = clienteForncedor("nomeFantasia");
    var nomeRM        = razaoSocial;

    var cnpj          = clienteForncedor("docCnpj").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    var cpf           = clienteForncedor("docCpf").replace(/\D/g, "");
    var cgc           = (categoria === "J") ? cnpj : cpf;

    var rg            = clienteForncedor("docRg");
    var rgOrgao       = clienteForncedor("docRgOrgao");
    var rgUf          = clienteForncedor("docRgUf");
    var dtNascimento  = clienteForncedor("dtNascimento");
    var estadoCivil   = clienteForncedor("estadoCivil");
    var numDependentes= clienteForncedor("numDependentes") || "0";

    var inscEstadual  = clienteForncedor("docInscricaoEstadual");
    var inscMunicipal = clienteForncedor("docInscricaoMunicipal");

    var endereco      = clienteForncedor("endereco");
    var numero        = clienteForncedor("numero");
    var complemento   = clienteForncedor("complemento").substring(0, 40);
    var bairro        = clienteForncedor("bairro");
    var cidade        = clienteForncedor("cidade");
    var estado        = clienteForncedor("estado");
    var cep           = clienteForncedor("cep");
    var codMunicipio  = clienteForncedor("codMunicipio");

    var telefone      = clienteForncedor("telefone");
    var celular       = clienteForncedor("celular");
    var emailCr       = clienteForncedor("emailCr") || clienteForncedor("emailAdministrativo") || clienteForncedor("emailComercial");


    var estrangeiro       = clienteForncedor("hiddenToggleEstrangeiro") === "on";
    var docEstrangeiro    = clienteForncedor("docEstrangeiro");
    var nacionalidade     = estrangeiro ? "1" : "0";

    var contribuinte  = clienteForncedor("icms")           || "0";
    var simplesNac    = clienteForncedor("simplesNacional") || "0";
    var retencaoIss   = "0";
    var codReceita    = clienteForncedor("hiddenCodIrrf") || clienteForncedor("codIrrf") || "";
    var natRendimento = clienteForncedor("idNatRendimento") || "";

    var mapPagrec = { "1": "2", "2": "1", "3": "3" };
    var pagrec = mapPagrec[classificacao] || "1";

    var dtNascimentoRM = "";
    if (dtNascimento) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dtNascimento)) {
            dtNascimentoRM = dtNascimento + "T00:00:00";
        } else {
            var partesDt = dtNascimento.split("/");
            if (partesDt.length === 3) {
                dtNascimentoRM = partesDt[2] + "-" + partesDt[1] + "-" + partesDt[0] + "T00:00:00";
            }
        }
    }


    if (categoria === "F" && !rg) {
        throw new Error("[ST16] Pessoa Física: campo 'RG (Cédula de Identidade)' está vazio no formulário. Preencha o campo RG e reenvie.");
    }
    if (categoria === "F" && !dtNascimentoRM) {
        throw new Error("[ST16] Pessoa Física: campo 'Data de Nascimento' está vazio ou em formato inválido (esperado DD/MM/AAAA). Preencha e reenvie.");
    }
    if (categoria === "F" && !estadoCivil) {
        throw new Error("[ST16] Pessoa Física: campo 'Estado Civil' está vazio. Preencha e reenvie.");
    }


    // Envia o XML ao DataServer do RM via dataset ds_saveRecordRM.
    // coligadaOverride: usa a coligada informada (default COLIGADA).
    // Retorna o código gerado (ex.: CODCFO) ou ""; lança Error se STATUS != SUCCESS.
    function chamarRM(dataServerName, xml, coligadaOverride) {
        var col = coligadaOverride || COLIGADA;
        log.info("[ST16] Chamando ds_saveRecordRM ? " + dataServerName + " | coligada=" + col);

        var c = [
            DatasetFactory.createConstraint("pDataServerName", dataServerName, dataServerName, ConstraintType.MUST),
            DatasetFactory.createConstraint("pXML",            xml,            xml,            ConstraintType.MUST),
            DatasetFactory.createConstraint("pCodcoligada",    col,            col,            ConstraintType.MUST)
        ];

        var ds = DatasetFactory.getDataset("ds_saveRecordRM", null, c, null);

        if (!ds || !ds.values || !ds.values.length) {
            throw new Error("[ST16] ds_saveRecordRM não retornou dados. DataServer=" + dataServerName);
        }

        var row    = ds.values[0];
   
        var status = String(row[0] || "").trim();
        var msg    = String(row[1] || "").trim();
        var result = String(row[2] || "").trim();

        log.info("[ST16] ds_saveRecordRM STATUS=" + status + " | MENSAGEM=" + msg);

        if (status !== "SUCCESS") {
            throw new Error("[ST16][RM] " + msg);
        }


        if (result && result !== "null") {
            var obj = JSON.parse(result);
            return String(obj.codigo || "").trim();
        }

        return "";
    }
    var xmlCfoPF = "";
    if (categoria === "F") {
        xmlCfoPF =
            "<CIDENTIDADE>"   + x(rg)             + "</CIDENTIDADE>" +
            "<DTNASCIMENTO>"  + x(dtNascimentoRM) + "</DTNASCIMENTO>" +
            "<ESTADOCIVIL>"   + x(estadoCivil)    + "</ESTADOCIVIL>" +
            "<CI_ORGAO>"      + x(rgOrgao)        + "</CI_ORGAO>" +
            "<CI_UF>"         + x(rgUf)           + "</CI_UF>" +
            "<NUMDEPENDENTES>"+ x(numDependentes) + "</NUMDEPENDENTES>";
    }

    // Edição: havendo CODCFO de edição, o RM ATUALIZA o registro (não cria).
    var codcfoEdicao   = clienteForncedor("codcfoEdicao");
    var coligadaEdicao = clienteForncedor("coligadaEdicao");
    var idcfoEdicao    = clienteForncedor("idcfoEdicao");
    var ehEdicao = (codcfoEdicao && codcfoEdicao !== "-1" && codcfoEdicao !== "0");

    var codcfoXml   = ehEdicao ? codcfoEdicao   : "-1";
    var coligadaXml = ehEdicao ? coligadaEdicao : "0";
    var idcfoXml    = ehEdicao ? idcfoEdicao    : "0";

    log.info("[ST16] Modo " + (ehEdicao ? ("EDIÇÃO/UPDATE CODCFO=" + codcfoEdicao) : "CRIAÇÃO de novo CFO"));

    // Contatos do Cli/For (FCFOCONTATO) são gravados via JDBC DEPOIS do CFO
    // (o FinCFODataBR ignora a coleção filha por XML). Ver salvarContatosRM().
    var emailComercial      = clienteForncedor("emailComercial");
    var emailAdministrativo = clienteForncedor("emailAdministrativo");

    var xmlCfo =
        "<FinCFOBR>" +
            "<FCFO>" +
                "<CODCOLIGADA>" + coligadaXml + "</CODCOLIGADA>" +
                "<CODCFO>" + codcfoXml + "</CODCFO>" +
                "<NOME>"           + x(nomeFantasia) + "</NOME>" +
                "<NOMEFANTASIA>"   + x(razaoSocial)  + "</NOMEFANTASIA>" +
                "<CGCCFO>"         + x(cgc)           + "</CGCCFO>" +
                "<INSCRESTADUAL>"  + x(inscEstadual)  + "</INSCRESTADUAL>" +
                "<INSCRMUNICIPAL>" + x(inscMunicipal) + "</INSCRMUNICIPAL>" +
                "<PAGREC>"         + pagrec            + "</PAGREC>" +
                "<RUA>"            + x(endereco)      + "</RUA>" +
                "<NUMERO>"         + x(numero)        + "</NUMERO>" +
                "<COMPLEMENTO>"    + x(complemento)   + "</COMPLEMENTO>" +
                "<BAIRRO>"         + x(bairro)        + "</BAIRRO>" +
                "<CIDADE>"         + x(cidade)        + "</CIDADE>" +
                "<CODETD>"         + x(estado)        + "</CODETD>" +
                "<CEP>"            + x(cep)           + "</CEP>" +
                "<CODMUNICIPIO>"   + x(codMunicipio)  + "</CODMUNICIPIO>" +
                "<TELEFONE>"       + x(telefone)      + "</TELEFONE>" +
                "<TELEX>"          + x(celular)       + "</TELEX>" +
                "<EMAIL>"          + x(emailCr)       + "</EMAIL>" +
                "<CODTCF>"         + x(tipo)          + "</CODTCF>" +
                "<ATIVO>1</ATIVO>" +
                "<CODCOLTCF>0</CODCOLTCF>" +
                "<PESSOAFISOUJUR>" + x(categoria)     + "</PESSOAFISOUJUR>" +
                "<PAIS>Brasil</PAIS>" +
                "<CONTRIBUINTE>"       + contribuinte  + "</CONTRIBUINTE>" +
                "<CONTRIBUINTEISS>"    + retencaoIss   + "</CONTRIBUINTEISS>" +
                "<IDCFO>" + idcfoXml + "</IDCFO>" +
                "<OPTANTEPELOSIMPLES>" + simplesNac    + "</OPTANTEPELOSIMPLES>" +
                "<TIPORUA>1</TIPORUA>" +
                "<TIPOBAIRRO>1</TIPOBAIRRO>" +
                "<REGIMEISS>N</REGIMEISS>" +
                "<RETENCAOISS>"        + retencaoIss   + "</RETENCAOISS>" +
                "<IDPAIS>1</IDPAIS>" +
                "<NACIONALIDADE>"      + nacionalidade + "</NACIONALIDADE>" +
                (estrangeiro ? "<DOCUMENTOESTRANGEIRO>" + x(docEstrangeiro) + "</DOCUMENTOESTRANGEIRO>" : "") +
                (codReceita    ? "<CODRECEITA>"      + x(codReceita)    + "</CODRECEITA>"      : "") +
                (natRendimento ? "<IDNATRENDIMENTO>" + x(natRendimento) + "</IDNATRENDIMENTO>" : "") +
                "<TIPORENDIMENTO>000</TIPORENDIMENTO>" +
                xmlCfoPF +
            "</FCFO>" +
        "</FinCFOBR>";

    var codCfo = chamarRM("FinCFODataBR", xmlCfo);

    if (!codCfo && ehEdicao) {
        codCfo = codcfoEdicao; // na edição o RM pode não devolver o código; reaproveita o informado
    }

    if (!codCfo) {
        throw new Error("[ST16] CODCFO não retornado pelo RM após criação do CFO.");
    }

    log.info("[ST16] CFO criado com sucesso. CODCFO=" + codCfo);
    hAPI.setCardValue("codCfoRm", codCfo);

    try {
        salvarUrlFluigRM(codCfo);
    } catch (eUrl) {
        log.error("[ST16] Erro ao gravar URL Fluig em FCFOCOMPL (não interrompe): " + eUrl);
    }

    try {
        salvarContatosRM(codCfo, "0", emailComercial, emailAdministrativo, celular);
    } catch (eCont) {
        log.error("[ST16] Erro ao salvar contatos FCFOCONTATO (não interrompe): " + eCont);
    }


    var bancosEdicaoJson = clienteForncedor("bancosEdicaoJson");
    var ehEdicaoBancos = ehEdicao && bancosEdicaoJson && bancosEdicaoJson !== "[]";

    if (ehEdicaoBancos) {
        
        var contasEd = [];
        try { contasEd = JSON.parse(bancosEdicaoJson); } catch (eJsonEd) {
            log.error("[ST16] bancosEdicaoJson inválido: " + eJsonEd);
        }

        var idpgtoBoletoEd = parseInt(clienteForncedor("idpgtoBoletoEdicao"), 10) || 0;

        var maxIdEd = idpgtoBoletoEd;
        for (var mi = 0; mi < contasEd.length; mi++) {
            var idn = parseInt(contasEd[mi].idpgto, 10) || 0;
            if (idn > maxIdEd) { maxIdEd = idn; }
        }
        var proxIdEd = maxIdEd + 1;

        for (var ie = 0; ie < contasEd.length; ie++) {
            var ct = contasEd[ie] || {};
            var ctBanco = String(ct.banco || "");
            var ctAg    = String(ct.agencia || "");
            var ctCt    = String(ct.conta || "");
            var ctDesc  = String(ct.desc || "");
            if (!ctBanco && !ctAg && !ctCt) { continue; }

            var ctIdp = (String(ct.novo) !== "1" && (parseInt(ct.idpgto, 10) || 0) > 0)
                        ? parseInt(ct.idpgto, 10) : (proxIdEd++);
            var ctAtivo = (String(ct.ativo) === "0") ? "0" : "1";

            var ctAgNum = ctAg.length > 1 ? ctAg.slice(0, -1) : ctAg;
            var ctAgDig = ctAg.length > 1 ? ctAg.slice(-1)    : "0";
            var ctCtNum = ctCt.length > 1 ? ctCt.slice(0, -1) : ctCt;
            var ctCtDig = ctCt.length > 1 ? ctCt.slice(-1)    : "0";

            for (var ced = 0; ced < COLIGADAS_BANCO.length; ced++) {
                var colEd = COLIGADAS_BANCO[ced];
                var xmlEd =
                    "<FDadosPgto>" +
                        "<CODCOLIGADA>" + colEd + "</CODCOLIGADA>" +
                        "<CODCOLCFO>0</CODCOLCFO>" +
                        "<CODCFO>" + x(codCfo) + "</CODCFO>" +
                        "<IDPGTO>" + ctIdp + "</IDPGTO>" +
                        "<DESCRICAO>" + x("Conta " + ctIdp + (ctDesc ? " - " + ctDesc : "")) + "</DESCRICAO>" +
                        "<FORMAPAGAMENTO>T</FORMAPAGAMENTO>" +
                        "<FAVORECIDO>" + x(nomeRM) + "</FAVORECIDO>" +
                        "<CGCFAVORECIDO>" + x(cgc) + "</CGCFAVORECIDO>" +
                        "<ATIVO>" + ctAtivo + "</ATIVO>" +
                        "<NUMEROBANCO>" + x(ctBanco) + "</NUMEROBANCO>" +
                        "<CODIGOAGENCIA>" + x(ctAgNum) + "</CODIGOAGENCIA>" +
                        "<DIGITOAGENCIA>" + x(ctAgDig) + "</DIGITOAGENCIA>" +
                        "<NOMEAGENCIA>" + x(ctDesc) + "</NOMEAGENCIA>" +
                        "<CONTACORRENTE>" + x(ctCtNum) + "</CONTACORRENTE>" +
                        "<DIGITOCONTA>" + x(ctCtDig) + "</DIGITOCONTA>" +
                        "<TIPOCONTA>1</TIPOCONTA>" +
                    "</FDadosPgto>";
                try {
                    chamarRM("FinDadosPgtoDataBR", xmlEd, colEd);
                    log.info("[ST16] (edição) Conta IDPGTO=" + ctIdp + " ativo=" + ctAtivo + " / Coligada " + colEd + " OK.");
                } catch (eEd) {
                    log.warn("[ST16] (edição) Falha IDPGTO=" + ctIdp + " / Coligada " + colEd + ": " + eEd);
                }
            }
        }

    
        var idpBoletoEd = (idpgtoBoletoEd > 0) ? idpgtoBoletoEd : (proxIdEd++);
        for (var cbe = 0; cbe < COLIGADAS_BANCO.length; cbe++) {
            var colBolEd = COLIGADAS_BANCO[cbe];
            var xmlBolEd =
                "<FDadosPgto>" +
                    "<CODCOLIGADA>" + colBolEd + "</CODCOLIGADA>" +
                    "<CODCOLCFO>0</CODCOLCFO>" +
                    "<CODCFO>" + x(codCfo) + "</CODCFO>" +
                    "<IDPGTO>" + idpBoletoEd + "</IDPGTO>" +
                    "<DESCRICAO>Boleto com Código de Barras</DESCRICAO>" +
                    "<FORMAPAGAMENTO>I</FORMAPAGAMENTO>" +
                    "<FAVORECIDO>" + x(nomeRM) + "</FAVORECIDO>" +
                    "<CGCFAVORECIDO>" + x(cgc) + "</CGCFAVORECIDO>" +
                    "<ATIVO>1</ATIVO>" +
                "</FDadosPgto>";
            try {
                chamarRM("FinDadosPgtoDataBR", xmlBolEd, colBolEd);
                log.info("[ST16] (edição) Boleto IDPGTO=" + idpBoletoEd + " / Coligada " + colBolEd + " OK.");
            } catch (eBolEd) {
                log.warn("[ST16] (edição) Falha boleto IDPGTO=" + idpBoletoEd + " / Coligada " + colBolEd + ": " + eBolEd);
            }
        }

    } else {

    var idPgto = 0;

    for (var i = 1; i <= 5; i++) {
        var bancoCod  = clienteForncedor("hiddenBanco" + i + "Cod");
        var bancoDesc = clienteForncedor("hiddenBanco" + i + "Desc");
        var agencia   = clienteForncedor("hiddenBanco" + i + "Agencia");
        var conta     = clienteForncedor("hiddenBanco" + i + "Conta");

        log.info("[ST16] Banco " + i + " — cod=" + bancoCod + " | agencia=" + agencia + " | conta=" + conta + " | desc=" + bancoDesc);

        if (!bancoCod && !agencia && !conta) {
            log.info("[ST16] Banco " + i + " sem dados — ignorando.");
            continue;
        }

        idPgto++;

        var agNum = agencia.length > 1 ? agencia.slice(0, -1) : agencia;
        var agDig = agencia.length > 1 ? agencia.slice(-1)    : "0";
        var ctNum = conta.length   > 1 ? conta.slice(0, -1)   : conta;
        var ctDig = conta.length   > 1 ? conta.slice(-1)      : "0";

        var ativo = (idPgto === 1) ? "1" : "0";

        for (var ci = 0; ci < COLIGADAS_BANCO.length; ci++) {
            var colAtual = COLIGADAS_BANCO[ci];

            var xmlBanco =
                "<FDadosPgto>" +
                    "<CODCOLIGADA>"  + colAtual                                                          + "</CODCOLIGADA>" +
                    "<CODCOLCFO>0</CODCOLCFO>" +
                    "<CODCFO>"       + x(codCfo)                                                         + "</CODCFO>" +
                    "<IDPGTO>" + idPgto + "</IDPGTO>" +
                    "<DESCRICAO>"    + x("Conta " + idPgto + (bancoDesc ? " - " + bancoDesc : ""))       + "</DESCRICAO>" +
                    "<FORMAPAGAMENTO>T</FORMAPAGAMENTO>" +
                    "<FAVORECIDO>"   + x(nomeRM)                                                         + "</FAVORECIDO>" +
                    "<CGCFAVORECIDO>"+ x(cgc)                                                            + "</CGCFAVORECIDO>" +
                    "<ATIVO>" + ativo + "</ATIVO>" +
                    "<NUMEROBANCO>"  + x(bancoCod)                                                       + "</NUMEROBANCO>" +
                    "<CODIGOAGENCIA>"+ x(agNum)                                                          + "</CODIGOAGENCIA>" +
                    "<DIGITOAGENCIA>"+ x(agDig)                                                          + "</DIGITOAGENCIA>" +
                    "<NOMEAGENCIA>"  + x(bancoDesc)                                                      + "</NOMEAGENCIA>" +
                    "<CONTACORRENTE>"+ x(ctNum)                                                          + "</CONTACORRENTE>" +
                    "<DIGITOCONTA>"  + x(ctDig)                                                          + "</DIGITOCONTA>" +
                    "<TIPOCONTA>1</TIPOCONTA>" +
                "</FDadosPgto>";

            try {
                chamarRM("FinDadosPgtoDataBR", xmlBanco, colAtual);
                log.info("[ST16] Conta " + i + " / Coligada " + colAtual + " salva com sucesso.");
            } catch (eBanco) {
                log.warn("[ST16] Falha conta " + i + " / Coligada " + colAtual + ": " + eBanco);
            }
        }
    }

    // BOLETO 
    idPgto++;
    for (var cb = 0; cb < COLIGADAS_BANCO.length; cb++) {
        var colBoleto = COLIGADAS_BANCO[cb];

        var xmlBoleto =
            "<FDadosPgto>" +
                "<CODCOLIGADA>"   + colBoleto + "</CODCOLIGADA>" +
                "<CODCOLCFO>0</CODCOLCFO>" +
                "<CODCFO>"        + x(codCfo) + "</CODCFO>" +
                "<IDPGTO>" + idPgto + "</IDPGTO>" +
                "<DESCRICAO>Boleto com Código de Barras</DESCRICAO>" +
                "<FORMAPAGAMENTO>I</FORMAPAGAMENTO>" +
                "<FAVORECIDO>"    + x(nomeRM) + "</FAVORECIDO>" +
                "<CGCFAVORECIDO>" + x(cgc)    + "</CGCFAVORECIDO>" +
                "<ATIVO>1</ATIVO>" +
            "</FDadosPgto>";

        try {
            chamarRM("FinDadosPgtoDataBR", xmlBoleto, colBoleto);
            log.info("[ST16] Boleto / Coligada " + colBoleto + " salvo com sucesso.");
        } catch (eBoleto) {
            log.warn("[ST16] Falha boleto / Coligada " + colBoleto + ": " + eBoleto);
        }
    }

    } 

   
    try {
        salvarFcfoAuxiliar(codCfo, COLIGADA);
    } catch (eAux) {
        log.error("[ST16] Erro nas tabelas auxiliares (não interrompe): " + eAux);
    }

}

// EVITA CARACTERES ESPECIAIS NO ENVIO AO RM
function x(s) {
    return (s || "").toString()
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;");
}

// GRAVA DADOS AUXILIARES DO CFO
function salvarFcfoAuxiliar(codCfo, coligada) {

    // Lê um campo do card como string (trim); "" se nulo.
    function fv(nome) {
        return String(hAPI.getCardValue(nome) || "").trim();
    }

    var codCfoInt   = parseInt(codCfo,   10);
    var coligadaInt = parseInt(coligada, 10);
    var numProces   = parseInt(getValue("WKNumProces") || "0", 10);
    var tsAbertura  = new java.sql.Timestamp(new java.util.Date().getTime());

    var retInss   = fv("hiddenInss")   === "on" ? "S" : null;
    var retCsll   = fv("hiddenCsll")   === "on" ? "S" : null;
    var retPis    = fv("hiddenPis")    === "on" ? "S" : null;
    var retCofins = fv("hiddenCofins") === "on" ? "S" : null;

    var pkParams = [
        { t: "int", v: codCfoInt   },
        { t: "int", v: coligadaInt }
    ];
    try { _execSql("DELETE FROM FCFO_AUXILIAR_CNAE             WHERE CODCFO=? AND CODCOLIGADA=?", pkParams); } catch (_) {}
    try { _execSql("DELETE FROM FCFO_AUXILIAR_GRUPO_MERCADORIA WHERE CODCFO=? AND CODCOLIGADA=?", pkParams); } catch (_) {}
    try { _execSql("DELETE FROM FCFO_AUXILIAR                  WHERE CODCFO=? AND CODCOLIGADA=?", pkParams); } catch (_) {}

    // FCFO_AUXILIAR 
    try {
        _execSql(
            "INSERT INTO FCFO_AUXILIAR (" +
            "  CODCFO, CODCOLIGADA, NUMERO_SOLICITACAO, DATA_ABERTURA, SOLICITANTE," +
            "  REGIME_FISCAL, RETENCAO_INSS, RETENCAO_CSLL, RETENCAO_PIS, RETENCAO_COFINS," +
            "  EMAIL_COMERCIAL, EMAIL_FINANCEIRO, WEBSITE," +
            "  COD_ANEXO_CARTAO_CNPJ,  COD_ANEXO_COMP_BANCO,    COD_ANEXO_CONTRATO," +
            "  COD_ANEXO_RG_CPF,       COD_ANEXO_COMP_ENDERECO, COD_ANEXO_LAUDO_PCD," +
            "  COD_ANEXO_DEPENDENTES,  COD_ANEXO_COD_CONDUTA,   COD_ANEXO_ANTI_CORRUPCAO," +
            "  COD_ANEXO_CONFLITO,     COD_ANEXO_LGPD" +
            ") VALUES (?,?,?,?,?, ?,?,?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?)",
            [
                { t: "int", v: codCfoInt   },
                { t: "int", v: coligadaInt },
                { t: "int", v: numProces   },
                { t: "ts",  v: tsAbertura  }, 
                { t: "str", v: fv("solicitante") || "sistema" },
                { t: "str", v: fv("regimeFiscal") || fv("regimeFiscalHidden") },
                { t: "str", v: retInss    },
                { t: "str", v: retCsll    },
                { t: "str", v: retPis     },
                { t: "str", v: retCofins  },
                { t: "str", v: fv("emailComercial")     },
                { t: "str", v: fv("emailCr")            },  
                { t: "str", v: fv("site")               },
                { t: "str", v: fv("anxCartaoCnpjId")    },
                { t: "str", v: fv("anxCompBancoId")     },
                { t: "str", v: fv("anxContratoId")      },
                { t: "str", v: fv("anxRgCpfId")         },
                { t: "str", v: fv("anxCompEnderecoId")  },
                { t: "str", v: fv("anxLaudoPcdId")      },
                { t: "str", v: fv("anxDependentesId")   },
                { t: "str", v: fv("anxCodCondutaId")    },
                { t: "str", v: fv("anxAntiCorrupcaoId") },
                { t: "str", v: fv("anxConflitoId")      },
                { t: "str", v: fv("anxLgpdId")          }
            ]
        );
        log.info("[ST16-AUX] FCFO_AUXILIAR OK. CODCFO=" + codCfo);
    } catch (eFcfo) {
        log.error("[ST16-AUX] Falha ao inserir FCFO_AUXILIAR (CODCFO=" + codCfo + "): " + eFcfo);
    }

    //FCFO_AUXILIAR_CNAE
    var sqlCnae =
        "INSERT INTO FCFO_AUXILIAR_CNAE (CODCFO, CODCOLIGADA, CODIGO, DESCRICAO, PRINCIPAL)" +
        " VALUES (?,?,?,?,?)";

    var cnaePrincVal = fv("cnaePrincipal");
    if (cnaePrincVal) {
        try {
            var cp = _parseCnae(cnaePrincVal);
            _execSql(sqlCnae, [
                { t: "int", v: codCfoInt                 },
                { t: "int", v: coligadaInt               },
                { t: "str", v: cp.codigo                 },
                { t: "str", v: cp.descricao || cp.codigo },   
                { t: "int", v: 1                         }
            ]);
            log.info("[ST16-AUX] CNAE principal OK: " + cp.codigo);
        } catch (eCnaeP) {
            log.warn("[ST16-AUX] CNAE principal falhou: " + eCnaeP);
        }
    }

    for (var ci = 1; ci <= 5; ci++) {
        var csVal = fv("hiddenCnaeSecundario" + ci);
        if (!csVal) continue;
        try {
            var cs = _parseCnae(csVal);
            _execSql(sqlCnae, [
                { t: "int", v: codCfoInt                 },
                { t: "int", v: coligadaInt               },
                { t: "str", v: cs.codigo                 },
                { t: "str", v: cs.descricao || cs.codigo },
                { t: "int", v: 0                         }
            ]);
            log.info("[ST16-AUX] CNAE secundário " + ci + " OK: " + cs.codigo);
        } catch (eCnae) {
            log.warn("[ST16-AUX] CNAE secundário " + ci + " falhou: " + eCnae);
        }
    }

    // FCFO_AUXILIAR_GRUPO_MERCADORIA
    var sqlGM =
        "INSERT INTO FCFO_AUXILIAR_GRUPO_MERCADORIA" +
        " (CODCFO, CODCOLIGADA, CODTB2FAT, DESCRICAO, PRINCIPAL) VALUES (?,?,?,?,?)";

    var gruposInseridos = {}; 
    for (var gi = 1; gi <= 9; gi++) {
        var gmDesc = fv("hiddenGrupoMercadoria" + gi);
        if (!gmDesc) continue;

        var codTb2 = _buscarCodTb2Fat(gmDesc);
        if (codTb2 === null) {
            log.warn("[ST16-AUX] CODTB2FAT não encontrado para '" + gmDesc + "' — grupo ignorado.");
            continue;
        }
        if (gruposInseridos[codTb2]) {
            log.info("[ST16-AUX] Grupo CODTB2=" + codTb2 + " repetido — ignorando duplicata.");
            continue;
        }

        try {
            _execSql(sqlGM, [
                { t: "int", v: codCfoInt          },
                { t: "int", v: coligadaInt        },
                { t: "int", v: codTb2             },
                { t: "str", v: gmDesc             },
                { t: "int", v: (gi === 1 ? 1 : 0) }
            ]);
            gruposInseridos[codTb2] = true;
            log.info("[ST16-AUX] Grupo Mercadoria " + gi + " OK: CODTB2=" + codTb2 + " | " + gmDesc);
        } catch (eGM) {
            log.warn("[ST16-AUX] Grupo Mercadoria " + gi + " falhou: " + eGM);
        }
    }

    log.info("[ST16-AUX] Processamento das tabelas auxiliares concluído. CODCFO=" + codCfo);
}

// SEPARA O CÓDIGO E DESCRIÇÃO DO CNAE
function _parseCnae(valor) {
    var v   = String(valor || "").trim();
    var sep = " — "; // " — "
    var idx = v.indexOf(sep);
    if (idx > 0) {
        return { codigo: v.substring(0, idx).trim(), descricao: v.substring(idx + sep.length).trim() };
    }
    idx = v.indexOf(" - ");
    if (idx > 0) {
        return { codigo: v.substring(0, idx).trim(), descricao: v.substring(idx + 3).trim() };
    }
    return { codigo: v, descricao: "" };
}

// BUSCA O CODTB2FAT DE UM GRUPO DE MERCADORIA EXISTENTE PELO NOME
function _buscarCodTb2Fat(descricao) {
    var conn = null;
    var stmt = null;
    try {
        var ic = new javax.naming.InitialContext();
     
        var ds = ic.lookup("/jdbc/RM");
        conn = ds.getConnection();
        stmt = conn.prepareStatement(
            "SELECT TOP 1 CODTB2FAT FROM TTB2 WHERE CODCOLIGADA=1 AND DESCRICAO=?"
        );
        stmt.setString(1, descricao);
        var rs = stmt.executeQuery();
        if (rs.next()) {
            return rs.getInt(1);
        }
        return null;
    } catch (e) {
        log.warn("[ST16-AUX] Erro ao buscar CODTB2FAT para '" + descricao + "': " + e);
        return null;
    } finally {
        if (stmt != null) try { stmt.close(); } catch (_) {}
        if (conn != null) try { conn.close(); } catch (_) {}
    }
}

// BUSCA O IDCONTATO DE UM CONTATO EXISTENTE PELO FCFOCONTATO
function _buscarIdContato(codcfo, coligada, nome) {
    var conn = null;
    var stmt = null;
    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("/jdbc/RM");
        conn = ds.getConnection();
        stmt = conn.prepareStatement(
            "SELECT TOP 1 IDCONTATO FROM FCFOCONTATO WHERE CODCFO=? AND CODCOLIGADA=? AND NOME=?"
        );
        stmt.setString(1, String(codcfo));
        stmt.setInt(2, parseInt(coligada, 10));
        stmt.setString(3, nome);
        var rs = stmt.executeQuery();
        if (rs.next()) {
            return rs.getInt(1);
        }
        return null;
    } catch (e) {
        log.warn("[ST16] Erro ao buscar contato '" + nome + "': " + e);
        return null;
    } finally {
        if (stmt != null) try { stmt.close(); } catch (_) {}
        if (conn != null) try { conn.close(); } catch (_) {}
    }
}

// INSERE OU ATUALIZA OS CONTATOS DO CFO (FCFOCONTATO) NO RM, APÓS A CRIAÇÃO DO CFO
function salvarContatosRM(codCfo, coligada, emailComercial, emailAdministrativo, celular) {
    var codcfoStr   = String(codCfo);          // CODCFO é varchar no RM
    var coligadaInt = parseInt(coligada, 10);

    var lista = [
        { nome: "E-mail Comercial",     email: emailComercial,      tel: celular },
        { nome: "E-mail Administrativo", email: emailAdministrativo, tel: celular }
    ];

    for (var i = 0; i < lista.length; i++) {
        var c = lista[i];
        if (!c.email && !c.tel) { continue; }

        try {
            var idEx = _buscarIdContato(codcfoStr, coligadaInt, c.nome);
            if (idEx) {
                _execSql(
                    "UPDATE FCFOCONTATO SET EMAIL=?, TELEFONE=?, ATIVO=1 " +
                    "WHERE CODCOLIGADA=? AND CODCFO=? AND IDCONTATO=?",
                    [
                        { t: "str", v: c.email },
                        { t: "str", v: c.tel   },
                        { t: "int", v: coligadaInt },
                        { t: "str", v: codcfoStr   },
                        { t: "int", v: idEx        }
                    ],
                    "/jdbc/RM"
                );
                log.info("[ST16] Contato atualizado: " + c.nome + " (IDCONTATO=" + idEx + ")");
            } else {
                var proxId = _proximoIdContato(codcfoStr, coligadaInt);
                _execSql(
                    "INSERT INTO FCFOCONTATO (CODCOLIGADA, CODCFO, IDCONTATO, NOME, EMAIL, TELEFONE, ATIVO, " +
                    "RECCREATEDBY, RECCREATEDON, RECMODIFIEDBY, RECMODIFIEDON) " +
                    "VALUES (?, ?, ?, ?, ?, ?, 1, 'fluig', GETDATE(), 'fluig', GETDATE())",
                    [
                        { t: "int", v: coligadaInt },
                        { t: "str", v: codcfoStr   },
                        { t: "int", v: proxId      },
                        { t: "str", v: c.nome      },
                        { t: "str", v: c.email     },
                        { t: "str", v: c.tel       }
                    ],
                    "/jdbc/RM"
                );
                log.info("[ST16] Contato inserido: " + c.nome + " (IDCONTATO=" + proxId + ")");
            }
        } catch (e) {
            log.warn("[ST16] Falha ao gravar contato '" + c.nome + "': " + e);
        }
    }
}

// GERA O PRÓXIMO IDCONTATO PARA UM CFO/CONTATO NO RM (FCFOCONTATO)
function _proximoIdContato(codcfo, coligada) {
    var conn = null;
    var stmt = null;
    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("/jdbc/RM");
        conn = ds.getConnection();
        stmt = conn.prepareStatement(
            "SELECT ISNULL(MAX(IDCONTATO),0)+1 FROM FCFOCONTATO WHERE CODCOLIGADA=? AND CODCFO=?"
        );
        stmt.setInt(1, parseInt(coligada, 10));
        stmt.setString(2, String(codcfo));
        var rs = stmt.executeQuery();
        if (rs.next()) { return rs.getInt(1); }
        return 1;
    } catch (e) {
        log.warn("[ST16] Erro ao obter próximo IDCONTATO: " + e);
        return 1;
    } finally {
        if (stmt != null) try { stmt.close(); } catch (_) {}
        if (conn != null) try { conn.close(); } catch (_) {}
    }
}

// EXECUTA UM SQL (INSERT/UPDATE/DELETE) NO RM OU OUTRO DATASOURCE, COM PARÂMETROS
function _execSql(sql, params, dataSource) {
    var conn = null;
    var stmt = null;
    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup(dataSource || "/jdbc/CastilhoCustom");
        conn = ds.getConnection();
        stmt = conn.prepareStatement(sql);

        for (var i = 0; i < params.length; i++) {
            var p   = params[i];
            var pos = i + 1;
            if (p.t === "int") {
                stmt.setInt(pos, p.v);
            } else if (p.t === "float") {
                stmt.setFloat(pos, p.v);
            } else if (p.t === "ts") {
                stmt.setTimestamp(pos, p.v);
            } else {
                if (p.v === null || p.v === undefined) {
                    stmt.setString(pos, null);
                } else {
                    stmt.setString(pos, String(p.v));
                }
            }
        }

        return stmt.executeUpdate();
    } finally {
        if (stmt != null) try { stmt.close(); } catch (_) {}
        if (conn != null) try { conn.close(); } catch (_) {}
    }
}

//  URL DO FLUIG PARA GRAVAR NO RM
var _urlFluigCache = null;
function obterUrlFluig() {
    if (_urlFluigCache) { return _urlFluigCache; }
    var url = "http://fluig.castilho.com.br:1010";
    try {
        var ds = DatasetFactory.getDataset("dsGetServerURL", null, null, null);
        if (ds != null && ds.rowsCount > 0) {
            var achou = "";
            var candidatos = ["url", "URL", "serverURL", "SERVER_URL", "server_url"];
            for (var c = 0; c < candidatos.length && !achou; c++) {
                try {
                    var v = ds.getValue(0, candidatos[c]);
                    if (v && /^https?:\/\//i.test(String(v))) { achou = String(v).trim(); }
                } catch (eC) {}
            }
            if (!achou) { 
                try {
                    var cols = ds.getColumnsName();
                    for (var i = 0; i < cols.size() && !achou; i++) {
                        var val = ds.getValue(0, cols.get(i));
                        if (val && /^https?:\/\//i.test(String(val))) { achou = String(val).trim(); }
                    }
                } catch (eCols) {}
            }
            if (achou) { url = achou; }
        }
    } catch (e) {
        log.warn("[URL] Falha ao consultar dsGetServerURL, usando fallback: " + e);
    }
    _urlFluigCache = url;
    return url;
}

// GRAVA A URL DO FLUIG NO RM (FCFOCOMPL.FLUIG) PARA O CFO CRIADO
function salvarUrlFluigRM(codCfo) {

    var numProces = getValue("WKNumProces");
    var link = obterUrlFluig() + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + numProces;

    var codCfoInt = parseInt(codCfo, 10);

    var afetadas = _execSql(
        "UPDATE FCFOCOMPL SET FLUIG = ? WHERE CODCFO = ?",
        [ { t: "str", v: link }, { t: "int", v: codCfoInt } ],
        "/jdbc/RM"
    );

    if (afetadas > 0) {
        log.info("[ST16] URL Fluig gravada em FCFOCOMPL.FLUIG (CODCFO=" + codCfo + "): " + link);
        return;
    }

    log.warn("[ST16] FCFOCOMPL sem linha para CODCFO=" + codCfo + " — tentando INSERT.");
    _execSql(
        "INSERT INTO FCFOCOMPL (CODCOLIGADA, CODCFO, FLUIG) VALUES (?, ?, ?)",
        [ { t: "int", v: 0 }, { t: "int", v: codCfoInt }, { t: "str", v: link } ],
        "/jdbc/RM"
    );
    log.info("[ST16] URL Fluig inserida em FCFOCOMPL.FLUIG (CODCFO=" + codCfo + "): " + link);
}
