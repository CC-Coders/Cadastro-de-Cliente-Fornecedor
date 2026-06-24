
function createDataset(fields, constraints, sortFields) {
    try {
        var constraints = getConstraints(constraints);

        lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, ["TERMO"]);

        var termoBruto = String(constraints["TERMO"] || "").trim();
        if (!termoBruto) {
            return returnDataset("ERRO", "TERMO não informado", null);
        }

        var soDigitos = termoBruto.replace(/\D/g, "");
        var temLetras = /[A-Za-z]/.test(termoBruto);

        var queryInterna = "";
        queryInterna += "SELECT ";
        queryInterna += "    f.CODCFO, ";
        queryInterna += "    f.CODCOLIGADA, ";
        queryInterna += "    f.NOME, ";
        queryInterna += "    ISNULL(f.NOMEFANTASIA, '')                      AS NOMEFANTASIA, ";
        queryInterna += "    ISNULL(f.CGCCFO, '')                            AS CGCCFO, ";
        queryInterna += "    ISNULL(m.NOMEMUNICIPIO, '')                     AS CIDADE, ";
        queryInterna += "    ISNULL(m.CODETDMUNICIPIO, ISNULL(f.CI_UF, ''))  AS UF, ";
        queryInterna += "    ISNULL(f.ATIVO, 1)                              AS ATIVO, ";
        queryInterna += "    ROW_NUMBER() OVER (PARTITION BY f.CODCFO ORDER BY f.CODCOLIGADA) AS RN ";
        queryInterna += "FROM FCFO f ";
        queryInterna += "LEFT JOIN GMUNICIPIO m ON m.CODMUNICIPIO = f.CODMUNICIPIO ";

        var params = [];

        if (!temLetras && (soDigitos.length === 11 || soDigitos.length === 14)) {

            queryInterna += "WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(f.CGCCFO,'.',''),(char(47)),''),(char(45)),''),' ',''),',','') = ? ";
            params.push({ type: "string", value: soDigitos });

        } else if (!temLetras && soDigitos.length > 0) {

            queryInterna += "WHERE f.CODCFO = ? ";
            params.push({ type: "int", value: parseInt(soDigitos, 10) });

        } else {
            queryInterna += "WHERE f.NOME LIKE ? OR f.NOMEFANTASIA LIKE ? ";
            var like = "%" + termoBruto + "%";
            params.push({ type: "string", value: like });
            params.push({ type: "string", value: like });
        }

        var query = ""
            + "SELECT TOP 30 CODCFO, CODCOLIGADA, NOME, NOMEFANTASIA, CGCCFO, CIDADE, UF, ATIVO "
            + "FROM (" + queryInterna + ") t "
            + "WHERE t.RN = 1 "
            + "ORDER BY t.NOME ASC";

        var retorno = executaQuery(query, params, "/jdbc/RM");

        return returnDataset("SUCCESS", "", JSON.stringify(retorno));

    } catch (error) {
        if (typeof error == "object") {
            var mensagem = "";
            var keys = Object.keys(error);
            for (var i = 0; i < keys.length; i++) {
                mensagem += (keys[i] + ": " + error[keys[i]]) + " - ";
            }
            log.info("Erro ao executar Dataset:");
            log.dir(error);
            log.info(mensagem);

            return returnDataset("ERRO", mensagem, null);
        } else {
            return returnDataset("ERRO", error, null);
        }
    }
}


// Utils
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
        log.info(query);
        log.dir(constraints);

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
