function createDataset(fields, constraints, sortFields) {
    try {
        var constraints = getConstraints(constraints);

        lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, ["CGCFOR"]);

        // Normaliza: remove pontuação (aceita CNPJ com ou sem formatação)
        var cgc = String(constraints["CGCFOR"] || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();

        if (!cgc) {
            return returnDataset("ERRO", "CGCFOR não informado", null);
        }

        var query = "";
        query += "SELECT TOP 1 ";
        query += "    f.CODCFO, ";
        query += "    f.CODCOLIGADA, ";
        query += "    f.NOME, ";
        query += "    ISNULL(f.NOMEFANTASIA, '')                       AS NOMEFANTASIA, ";
        query += "    f.CGCCFO, ";
        query += "    ISNULL(f.ENDCOBC, '')                            AS LOGRADOURO, ";
        query += "    ISNULL(f.NUMERO, '')                             AS NUMERO, ";
        query += "    ISNULL(f.COMPLEMENTO, '')                        AS COMPLEMENTO, ";
        query += "    ISNULL(f.BAIRRO, '')                             AS BAIRRO, ";
        query += "    ISNULL(f.CEP, '')                                AS CEP, ";
        query += "    ISNULL(m.CODETDMUNICIPIO, ISNULL(f.CI_UF, ''))  AS CODUF, ";
        query += "    ISNULL(m.NOMEMUNICIPIO, '')                      AS NOMEMUNICIPIO, ";
        query += "    ISNULL(f.EMAIL, '')                              AS EMAIL, ";
        query += "    ISNULL(f.TELEFONE, '')                           AS TELEFONE, ";
        query += "    ISNULL(f.INSCRESTADUAL, '')                      AS INSCESTADUAL, ";
        query += "    ISNULL(f.INSCRMUNICIPAL, '')                     AS INSCMUNICIPAL ";
        query += "FROM FCFO f ";
        query += "LEFT JOIN GMUNICIPIO m ON m.CODMUNICIPIO = f.CODMUNICIPIO ";
        query += "WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(f.CGCCFO,'.',''),(char(47)),''),(char(45)),''),' ',''),',','') = '" + cgc + "' ";
        query += "ORDER BY ";
        query += "    CASE WHEN f.BAIRRO IS NOT NULL AND f.BAIRRO <> '' THEN 0 ELSE 1 END ASC, ";
        query += "    f.CODCOLIGADA ASC";

        var retorno = executaQuery(query, [], "/jdbc/RM");

        return returnDataset("SUCCESS", "", JSON.stringify(retorno));

    } catch (error) {
        var mensagem = extraiMensagemErro(error);
        log.error("Erro ao executar Dataset ds_verificarCnpjRM: " + mensagem);
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
