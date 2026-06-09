function servicetask16(attempt, message) {

    var COLIGADA = "1";
    var COLIGADAS_BANCO = ["1", "2", "5", "6", "12", "13"];

    function f(nome) {
        return String(hAPI.getCardValue(nome) || "").trim();
    }

    var categoria     = f("categoria");   
    var classificacao = f("classificacao");   
    var tipo          = f("tipo");            

    var razaoSocial   = f("razaoSocial");
    var nomeFantasia  = f("nomeFantasia");
    var nomeRM        = razaoSocial;

    var cnpj          = f("docCnpj").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    var cpf           = f("docCpf").replace(/\D/g, "");
    var cgc           = (categoria === "J") ? cnpj : cpf;

    var rg            = f("docRg");
    var rgOrgao       = f("docRgOrgao");
    var rgUf          = f("docRgUf");
    var dtNascimento  = f("dtNascimento");
    var estadoCivil   = f("estadoCivil");
    var numDependentes= f("numDependentes") || "0";

    var inscEstadual  = f("docInscricaoEstadual");
    var inscMunicipal = f("docInscricaoMunicipal");

    var endereco      = f("endereco");
    var numero        = f("numero");
    var complemento   = f("complemento").substring(0, 40);
    var bairro        = f("bairro");
    var cidade        = f("cidade");
    var estado        = f("estado");
    var cep           = f("cep");
    var codMunicipio  = f("codMunicipio");

    var telefone      = f("telefone");
    var celular       = f("celular");
    var emailCr       = f("emailCr") || f("emailAdministrativo") || f("emailComercial");


    var estrangeiro       = f("hiddenToggleEstrangeiro") === "on";
    var docEstrangeiro    = f("docEstrangeiro");
    var nacionalidade     = estrangeiro ? "1" : "0";

    var contribuinte  = f("icms")           || "0";
    var simplesNac    = f("simplesNacional") || "0";
    var retencaoIss   = "0";
    var codReceita    = f("hiddenCodIrrf") || f("codIrrf") || "";
    var natRendimento = f("idNatRendimento") || "";

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

    var xmlCfo =
        "<FinCFOBR>" +
            "<FCFO>" +
                "<CODCOLIGADA>0</CODCOLIGADA>" +
                "<CODCFO>-1</CODCFO>" +
                "<NOME>"           + x(nomeRM)       + "</NOME>" +
                "<NOMEFANTASIA>"   + x(nomeFantasia)  + "</NOMEFANTASIA>" +
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
                "<IDCFO>0</IDCFO>" +
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

    if (!codCfo) {
        throw new Error("[ST16] CODCFO não retornado pelo RM após criação do CFO.");
    }

    log.info("[ST16] CFO criado com sucesso. CODCFO=" + codCfo);
    hAPI.setCardValue("codCfoRm", codCfo);


    for (var i = 1; i <= 5; i++) {
        var bancoCod  = f("hiddenBanco" + i + "Cod");
        var bancoDesc = f("hiddenBanco" + i + "Desc");
        var agencia   = f("hiddenBanco" + i + "Agencia");
        var conta     = f("hiddenBanco" + i + "Conta");

        log.info("[ST16] Banco " + i + " — cod=" + bancoCod + " | agencia=" + agencia + " | conta=" + conta + " | desc=" + bancoDesc);

        if (!bancoCod && !agencia && !conta) {
            log.info("[ST16] Banco " + i + " sem dados — ignorando.");
            continue;
        }

        var agNum = agencia.length > 1 ? agencia.slice(0, -1) : agencia;
        var agDig = agencia.length > 1 ? agencia.slice(-1)    : "0";
        var ctNum = conta.length   > 1 ? conta.slice(0, -1)   : conta;
        var ctDig = conta.length   > 1 ? conta.slice(-1)      : "0";

        var ativo = (i === 1) ? "1" : "0";

        for (var ci = 0; ci < COLIGADAS_BANCO.length; ci++) {
            var colAtual = COLIGADAS_BANCO[ci];

            var xmlBanco =
                "<FDadosPgto>" +
                    "<CODCOLIGADA>"  + colAtual                                                          + "</CODCOLIGADA>" +
                    "<CODCOLCFO>0</CODCOLCFO>" +
                    "<CODCFO>"       + x(codCfo)                                                         + "</CODCFO>" +
                    "<IDPGTO>" + i + "</IDPGTO>" +
                    "<DESCRICAO>"    + x("Conta " + i + (bancoDesc ? " - " + bancoDesc : ""))            + "</DESCRICAO>" +
                    "<FORMAPAGAMENTO>I</FORMAPAGAMENTO>" +
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

    // ── TABELAS AUXILIARES ────────────────────────────────────────────────────
    // Popula FCFO_AUXILIAR, FCFO_AUXILIAR_CNAE e FCFO_AUXILIAR_GRUPO_MERCADORIA
    // com dados extras do formulário que não têm campos nativos no RM.
    // Erros aqui NÃO interrompem o fluxo — o CFO já foi criado com sucesso.
    try {
        salvarFcfoAuxiliar(codCfo, COLIGADA);
    } catch (eAux) {
        log.error("[ST16] Erro nas tabelas auxiliares (não interrompe): " + eAux);
    }

}



function x(s) {
    return (s || "").toString()
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;");
}


// ═══════════════════════════════════════════════════════════════════════════════
// TABELAS AUXILIARES — FCFO_AUXILIAR / FCFO_AUXILIAR_CNAE / FCFO_AUXILIAR_GRUPO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Popula as três tabelas auxiliares com os dados extras do formulário.
 * Operação idempotente: faz DELETE + INSERT para suportar retentativas.
 *
 * @param {string} codCfo    - CODCFO gerado pelo RM (string numérica)
 * @param {string} coligada  - Código da coligada (ex: "1")
 */
function salvarFcfoAuxiliar(codCfo, coligada) {

    function fv(nome) {
        return String(hAPI.getCardValue(nome) || "").trim();
    }

    var codCfoInt   = parseInt(codCfo,   10);
    var coligadaInt = parseInt(coligada, 10);
    var numProces   = parseInt(getValue("WKNumProces") || "0", 10);
    var tsAbertura  = new java.sql.Timestamp(new java.util.Date().getTime());

    // Retenções — "S" se o hidden estiver "on", null (SQL NULL) caso contrário.
    // CHAR(1) NULL: precisa de NULL real, não "" (que viraria espaço em branco).
    var retInss   = fv("hiddenInss")   === "on" ? "S" : null;
    var retCsll   = fv("hiddenCsll")   === "on" ? "S" : null;
    var retPis    = fv("hiddenPis")    === "on" ? "S" : null;
    var retCofins = fv("hiddenCofins") === "on" ? "S" : null;

    // ── Limpeza para retry seguro (as 3 tabelas são independentes no banco) ────
    var pkParams = [
        { t: "int", v: codCfoInt   },
        { t: "int", v: coligadaInt }
    ];
    try { _execSql("DELETE FROM FCFO_AUXILIAR_CNAE             WHERE CODCFO=? AND CODCOLIGADA=?", pkParams); } catch (_) {}
    try { _execSql("DELETE FROM FCFO_AUXILIAR_GRUPO_MERCADORIA WHERE CODCFO=? AND CODCOLIGADA=?", pkParams); } catch (_) {}
    try { _execSql("DELETE FROM FCFO_AUXILIAR                  WHERE CODCFO=? AND CODCOLIGADA=?", pkParams); } catch (_) {}

    // ── 1) FCFO_AUXILIAR ──────────────────────────────────────────────────────
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
                { t: "ts",  v: tsAbertura  },                 // DATA_ABERTURA DATETIME NOT NULL
                { t: "str", v: fv("solicitante") || "sistema" },
                { t: "str", v: fv("regimeFiscal")             },  // código "01".."07" (NOT NULL)
                { t: "str", v: retInss    },
                { t: "str", v: retCsll    },
                { t: "str", v: retPis     },
                { t: "str", v: retCofins  },
                { t: "str", v: fv("emailComercial")     },
                { t: "str", v: fv("emailCr")            },  // "E-mail Financeiro / Contabilidade"
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

    // ── 2) FCFO_AUXILIAR_CNAE (principal + secundários) ───────────────────────
    // Coluna "PRICIPAL" (sic) — grafia exatamente conforme o DDL da tabela
    // (mesmo typo da FCFO_AUXILIAR_GRUPO_MERCADORIA). Usar "PRINCIPAL" aqui
    // causa "Invalid column name" e a tabela fica vazia.
    var sqlCnae =
        "INSERT INTO FCFO_AUXILIAR_CNAE (CODCFO, CODCOLIGADA, CODIGO, DESCRICAO, PRICIPAL)" +
        " VALUES (?,?,?,?,?)";

    var cnaePrincVal = fv("cnaePrincipal");
    if (cnaePrincVal) {
        try {
            var cp = _parseCnae(cnaePrincVal);
            _execSql(sqlCnae, [
                { t: "int", v: codCfoInt                 },
                { t: "int", v: coligadaInt               },
                { t: "str", v: cp.codigo                 },   // CODIGO NOT NULL
                { t: "str", v: cp.descricao || cp.codigo },   // DESCRICAO NOT NULL
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

    // ── 3) FCFO_AUXILIAR_GRUPO_MERCADORIA ─────────────────────────────────────
    // Coluna "PRICIPAL" (sic) — grafia exatamente conforme o DDL da tabela.
    var sqlGM =
        "INSERT INTO FCFO_AUXILIAR_GRUPO_MERCADORIA" +
        " (CODCFO, CODCOLIGADA, CODTB2FAT, DESCRICAO, PRICIPAL) VALUES (?,?,?,?,?)";

    var gruposInseridos = {};   // evita violar a PK (CODCFO,CODCOLIGADA,CODTB2FAT)
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


/**
 * Separa "XXXX-X/XX — Descrição" em { codigo, descricao }.
 * Suporta "—" (em dash U+2014) e "-" (hífen simples).
 * Se não houver separador, o valor inteiro é o código.
 */
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


/**
 * Retorna o CODTB2FAT da tabela TTB2 do RM pela descrição do grupo de mercadoria.
 * Retorna null se não encontrar.
 */
function _buscarCodTb2Fat(descricao) {
    var conn = null;
    var stmt = null;
    try {
        var ic = new javax.naming.InitialContext();
        // TTB2 é tabela NATIVA do RM -> /jdbc/RM (correto, não trocar).
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


/**
 * Executa um INSERT/UPDATE/DELETE via JDBC na base do RM.
 *
 * params: array de objetos { t: "str" | "int" | "float" | "ts", v: value }
 *  - "int"   → setInt
 *  - "float" → setFloat
 *  - "ts"    → setTimestamp (java.sql.Timestamp)
 *  - "str"   → setString. Apenas null/undefined viram SQL NULL; "" é preservado
 *              como string vazia para não violar colunas NOT NULL (ex: REGIME_FISCAL).
 *              Para gravar NULL, passe v: null explicitamente (ex: retenções).
 */
function _execSql(sql, params) {
    var conn = null;
    var stmt = null;
    try {
        var ic = new javax.naming.InitialContext();
        // As tabelas FCFO_AUXILIAR* ficam no banco CUSTOM da Castilho
        // (Castilho_Custom / castilho_custom_homol), acessado por /jdbc/CastilhoCustom.
        // NÃO usar /jdbc/RM aqui: nesse datasource as tabelas não existem
        // e o INSERT falharia com "Invalid object name 'FCFO_AUXILIAR'".
        var ds = ic.lookup("/jdbc/CastilhoCustom");
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
                // "str" — só null/undefined → SQL NULL; "" é mantido como ""
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
