
function createDataset(fields, constraints, sortFields) {
    try {
        var constraints = getConstraints(constraints);

        lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, ["CODCFO", "CODCOLIGADA"]);

        var codCfo    = parseInt(String(constraints["CODCFO"]).replace(/\D/g, ""), 10);
        var coligada  = parseInt(String(constraints["CODCOLIGADA"]).replace(/\D/g, ""), 10);

        if (!codCfo) {
            return returnDataset("ERRO", "CODCFO inválido", null);
        }

        var qCadastro = "";
        qCadastro += "SELECT TOP 1 ";
        qCadastro += "    f.CODCFO, f.CODCOLIGADA, ISNULL(f.IDCFO, 0) AS IDCFO, ";
        qCadastro += "    f.NOME, ISNULL(f.NOMEFANTASIA,'')                         AS NOMEFANTASIA, ";
        qCadastro += "    ISNULL(f.CGCCFO,'')                                       AS CGCCFO, ";
        qCadastro += "    ISNULL(f.INSCRESTADUAL,'')                                AS INSCRESTADUAL, ";
        qCadastro += "    ISNULL(f.INSCRMUNICIPAL,'')                               AS INSCRMUNICIPAL, ";
        qCadastro += "    ISNULL(NULLIF(f.RUA,''), ISNULL(f.ENDCOBC,''))            AS LOGRADOURO, ";
        qCadastro += "    ISNULL(f.NUMERO,'')                                       AS NUMERO, ";
        qCadastro += "    ISNULL(f.COMPLEMENTO,'')                                  AS COMPLEMENTO, ";
        qCadastro += "    ISNULL(f.BAIRRO,'')                                       AS BAIRRO, ";
        qCadastro += "    ISNULL(f.CEP,'')                                          AS CEP, ";
        qCadastro += "    ISNULL(CONVERT(VARCHAR(20), f.CODMUNICIPIO),'')           AS CODMUNICIPIO, ";
        qCadastro += "    ISNULL(m.NOMEMUNICIPIO,'')                                AS CIDADE, ";
        qCadastro += "    ISNULL(m.CODETDMUNICIPIO, ISNULL(f.CODETD, ISNULL(f.CI_UF,''))) AS UF, ";
        qCadastro += "    ISNULL(f.TELEFONE,'')                                     AS TELEFONE, ";
        qCadastro += "    ISNULL(f.TELEX,'')                                        AS CELULAR, ";
        qCadastro += "    ISNULL(f.EMAIL,'')                                        AS EMAIL, ";
        qCadastro += "    ISNULL(f.PESSOAFISOUJUR,'')                               AS CATEGORIA, ";
        qCadastro += "    ISNULL(CONVERT(VARCHAR(20), f.CODTCF),'')                 AS CODTCF, ";
        qCadastro += "    ISNULL(CONVERT(VARCHAR(5), f.PAGREC),'')                  AS PAGREC, ";
        qCadastro += "    ISNULL(CONVERT(VARCHAR(5), f.CONTRIBUINTE),'0')           AS CONTRIBUINTE, ";
        qCadastro += "    ISNULL(CONVERT(VARCHAR(5), f.OPTANTEPELOSIMPLES),'0')     AS OPTANTEPELOSIMPLES, ";
        qCadastro += "    ISNULL(CONVERT(VARCHAR(5), f.RETENCAOISS),'0')            AS RETENCAOISS, ";
        qCadastro += "    ISNULL(f.CODRECEITA,'')                                   AS CODRECEITA, ";
        qCadastro += "    ISNULL(CONVERT(VARCHAR(20), f.IDNATRENDIMENTO),'')        AS IDNATRENDIMENTO, ";
        qCadastro += "    ISNULL(CONVERT(VARCHAR(5), f.NACIONALIDADE),'0')          AS NACIONALIDADE, ";
        qCadastro += "    ISNULL(f.DOCUMENTOESTRANGEIRO,'')                         AS DOCUMENTOESTRANGEIRO, ";
        qCadastro += "    ISNULL(f.CIDENTIDADE,'')                                  AS RG, ";
        qCadastro += "    ISNULL(CONVERT(VARCHAR(10), f.DTNASCIMENTO, 120),'')      AS DTNASCIMENTO, ";
        qCadastro += "    ISNULL(f.ESTADOCIVIL,'')                                  AS ESTADOCIVIL, ";
        qCadastro += "    ISNULL(f.CI_ORGAO,'')                                     AS CI_ORGAO, ";
        qCadastro += "    ISNULL(f.CI_UF,'')                                        AS CI_UF, ";
        qCadastro += "    ISNULL(CONVERT(VARCHAR(5), f.NUMDEPENDENTES),'0')         AS NUMDEPENDENTES ";
        qCadastro += "FROM FCFO f ";
        qCadastro += "LEFT JOIN GMUNICIPIO m ON m.CODMUNICIPIO = f.CODMUNICIPIO ";
        qCadastro += "WHERE f.CODCFO = ? ";
        qCadastro += "ORDER BY f.CODCOLIGADA ASC";

        var cadastroArr = executaQuery(qCadastro, [{ type: "int", value: codCfo }], "/jdbc/RM");
        var cadastro = (cadastroArr.length > 0) ? cadastroArr[0] : {};


        var qBancos = "";
        qBancos += "SELECT NUMEROBANCO, CODIGOAGENCIA, DIGITOAGENCIA, CONTACORRENTE, DIGITOCONTA, NOMEAGENCIA, ATIVO, IDPGTO ";
        qBancos += "FROM ( ";
        qBancos += "  SELECT ISNULL(NUMEROBANCO,'')   AS NUMEROBANCO, ";
        qBancos += "         ISNULL(CODIGOAGENCIA,'') AS CODIGOAGENCIA, ";
        qBancos += "         ISNULL(DIGITOAGENCIA,'') AS DIGITOAGENCIA, ";
        qBancos += "         ISNULL(CONTACORRENTE,'') AS CONTACORRENTE, ";
        qBancos += "         ISNULL(DIGITOCONTA,'')   AS DIGITOCONTA, ";
        qBancos += "         ISNULL(NOMEAGENCIA,'')   AS NOMEAGENCIA, ";
        qBancos += "         ISNULL(CONVERT(VARCHAR(5), ATIVO),'1') AS ATIVO, ";
        qBancos += "         ISNULL(CONVERT(VARCHAR(20), IDPGTO),'') AS IDPGTO, ";
        qBancos += "         ROW_NUMBER() OVER (PARTITION BY IDPGTO ORDER BY CODCOLIGADA) AS RN ";
        qBancos += "  FROM FDADOSPGTO ";
        qBancos += "  WHERE CODCFO = ? AND FORMAPAGAMENTO = 'T' ";
        qBancos += "    AND (NUMEROBANCO IS NOT NULL OR CONTACORRENTE IS NOT NULL) ";
        qBancos += ") t WHERE t.RN = 1 ORDER BY IDPGTO";

        var bancos = executaQuery(qBancos, [{ type: "int", value: codCfo }], "/jdbc/RM");

        var qBoleto = "SELECT TOP 1 ISNULL(CONVERT(VARCHAR(20), IDPGTO),'') AS IDPGTO FROM FDADOSPGTO WHERE CODCFO = ? AND FORMAPAGAMENTO = 'I' ORDER BY IDPGTO";
        var boletoArr = executaQuery(qBoleto, [{ type: "int", value: codCfo }], "/jdbc/RM");
        var boletoIdpgto = (boletoArr.length > 0) ? (boletoArr[0].IDPGTO || "") : "";

        var auxiliar = {};
        var cnaes = [];
        var grupos = [];
        try {

            var coligadaAux = 1;

            var qAux = "SELECT TOP 1 " +
                "ISNULL(REGIME_FISCAL,'')    AS REGIME_FISCAL, " +
                "ISNULL(RETENCAO_INSS,'')    AS RETENCAO_INSS, " +
                "ISNULL(RETENCAO_CSLL,'')    AS RETENCAO_CSLL, " +
                "ISNULL(RETENCAO_PIS,'')     AS RETENCAO_PIS, " +
                "ISNULL(RETENCAO_COFINS,'')  AS RETENCAO_COFINS, " +
                "ISNULL(EMAIL_COMERCIAL,'')  AS EMAIL_COMERCIAL, " +
                "ISNULL(WEBSITE,'')          AS WEBSITE " +
                "FROM FCFO_AUXILIAR WHERE CODCFO = ? AND CODCOLIGADA = ?";
            var auxArr = executaQuery(qAux, [{ type: "int", value: codCfo }, { type: "int", value: coligadaAux }], "/jdbc/CastilhoCustom");
            if (auxArr.length > 0) { auxiliar = auxArr[0]; }

            var qCnae = "SELECT CODIGO, DESCRICAO, PRINCIPAL FROM FCFO_AUXILIAR_CNAE WHERE CODCFO = ? AND CODCOLIGADA = ?";
            cnaes = executaQuery(qCnae, [{ type: "int", value: codCfo }, { type: "int", value: coligadaAux }], "/jdbc/CastilhoCustom");

            var qGrupo = "SELECT CODTB2FAT, DESCRICAO, PRINCIPAL FROM FCFO_AUXILIAR_GRUPO_MERCADORIA WHERE CODCFO = ? AND CODCOLIGADA = ?";
            grupos = executaQuery(qGrupo, [{ type: "int", value: codCfo }, { type: "int", value: coligadaAux }], "/jdbc/CastilhoCustom");
        } catch (eAux) {
            log.warn("[ds_detalhesCfoRM] Falha ao ler tabelas auxiliares (não interrompe): " + eAux);
        }

        var resultado = {
            cadastro: cadastro,
            bancos: bancos,
            boletoIdpgto: boletoIdpgto,
            auxiliar: auxiliar,
            cnaes: cnaes,
            grupos: grupos
        };

        return returnDataset("SUCCESS", "", JSON.stringify(resultado));

    } catch (error) {
        var mensagem = extraiMensagemErro(error);
        log.error("Erro ao executar Dataset ds_detalhesCfoRM: " + mensagem);
        return returnDataset("ERRO", mensagem, null);
    }
}


// Utils
function extraiMensagemErro(error) {
    if (error == null) return "Erro desconhecido";
    if (typeof error == "string") return error;
    try {
        if (error.javaException != null) {
            return String(error.javaException.getMessage() != null
                ? error.javaException.getMessage() : error.javaException.toString());
        }
        if (error.rhinoException != null && error.rhinoException.getMessage() != null) {
            return String(error.rhinoException.getMessage());
        }
        if (error.message != null && error.message != "") return String(error.message);
        return String(error);
    } catch (erroInterno) {
        return "Erro desconhecido (falha ao extrair mensagem do erro original)";
    }
}
function getConstraints(constraints) {
    var retorno = {};
    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            var constraint = constraints[i];
            retorno[constraint.fieldName] = constraint.initialValue;
        }
    }
    return retorno;
}
function returnDataset(STATUS, MENSAGEM, RESULT) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("STATUS");
    dataset.addColumn("MENSAGEM");
    dataset.addColumn("RESULT");
    dataset.addRow([STATUS, MENSAGEM, RESULT]);
    return dataset;
}
function lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, listConstrainstObrigatorias) {
    try {
        var retornoErro = [];
        for (var i = 0; i < listConstrainstObrigatorias.length; i++) {
            if (constraints[listConstrainstObrigatorias[i]] == null || constraints[listConstrainstObrigatorias[i]] == "" || constraints[listConstrainstObrigatorias[i]] == undefined) {
                retornoErro.push(listConstrainstObrigatorias[i]);
            }
        }

        if (retornoErro.length > 0) {
            throw "Constraints obrigatorias nao informadas (" + retornoErro.join(", ") + ")";
        }
    } catch (error) {
        throw error;
    }
}
function executaQuery(query, constraints, dataSorce) {
    try {
        var dataSource = dataSorce;
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup(dataSource);

        var conn = ds.getConnection();
        var stmt = conn.prepareStatement(query);

        var counter = 1;
        for (var i = 0; i < constraints.length; i++) {
            var val = constraints[i];
            if (val.type == "int") {
                stmt.setInt(counter, val.value);
            } else if (val.type == "float") {
                stmt.setFloat(counter, val.value);
            } else if (val.type == "date") {
                stmt.setString(counter, val.value);
            } else if (val.type == "datetime") {
                stmt.setString(counter, val.value);
            } else {
                stmt.setString(counter, val.value);
            }
            counter++;
        }

        var rs = stmt.executeQuery();
        var columnCount = rs.getMetaData().getColumnCount();
        var retorno = [];

        while (rs.next()) {
            var linha = {};
            for (var j = 1; j < columnCount + 1; j++) {
                linha[rs.getMetaData().getColumnName(j)] = rs.getObject(rs.getMetaData().getColumnName(j)) + "";
            }
            retorno.push(linha);
        }

        return retorno;

    } catch (error) {
        var msg = "";
        if (error && error.javaException) {
            msg = error.javaException.getMessage();
        } else if (error && error.message) {
            if (!error.message.Error) {
                msg = error.message;
            }
        } else {
            msg = String(error);
        }

        log.error("ERRO==============> " + msg);
        log.error("Type of error: " + typeof error);
        log.error("Type of msg: " + typeof msg);

        throw "Erro ao executar Dataset: " + msg;
    } finally {
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }
}
