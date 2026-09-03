
function createDataset(fields, constraints, sortFields) {
    try {
        var filtros = getConstraints(constraints);

        lancaErroSeConstraintsObrigatoriasNaoInformadas(filtros, ["TERMO"]);

        var termoBruto = String(filtros["TERMO"] || "").trim();
        if (!termoBruto) {
            return returnDataset("ERRO", "TERMO não informado", null);
        }

        var soDigitos = termoBruto.replace(/\D/g, "");
        var temLetras = /[A-Za-z]/.test(termoBruto);

        var queryInterna = "";
        queryInterna += "SELECT f.CODCFO, f.CODCOLIGADA, f.NOME, f.NOMEFANTASIA, f.CGCCFO, ";
        queryInterna += "  m.NOMEMUNICIPIO AS CIDADE, ";
        queryInterna += "  COALESCE(m.CODETDMUNICIPIO, f.CI_UF) AS UF, ";
        queryInterna += "  ISNULL(f.ATIVO, 1) AS ATIVO, ";
        queryInterna += "  ROW_NUMBER() OVER (PARTITION BY f.CODCFO ORDER BY f.CODCOLIGADA) AS RN ";
        // OUTER APPLY em vez de LEFT JOIN direto: evita que CODMUNICIPIO colidindo em
        // mais de uma UF multiplique a linha do cadastro antes do ROW_NUMBER dedupar.
        // O ORDER BY sozinho pegava a primeira UF colidente em ordem alfabetica, e nao
        // a UF real do cadastro (mesmo bug corrigido em ds_detalhesCfoRM) — por isso a
        // lista de busca mostrava cidade/UF diferente do que o formulario de edicao traz.
        queryInterna += "FROM FCFO f ";
        queryInterna += "OUTER APPLY (SELECT TOP 1 NOMEMUNICIPIO, CODETDMUNICIPIO FROM GMUNICIPIO ";
        queryInterna += "  WHERE CODMUNICIPIO = f.CODMUNICIPIO ";
        queryInterna += "  ORDER BY CASE WHEN CODETDMUNICIPIO = COALESCE(NULLIF(f.CODETD,''), f.CI_UF) THEN 0 ELSE 1 END";
        queryInterna += ") m ";

        var parametros = [];

        if (!temLetras && (soDigitos.length === 11 || soDigitos.length === 14)) {

            queryInterna += "WHERE f.CODCOLIGADA = 0 AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(f.CGCCFO,'.',''),'/',''),'-',''),' ',''),',','') = ? ";
            parametros.push({ type: "string", value: soDigitos });

        } else if (!temLetras && soDigitos.length > 0) {

            // CODCFO é varchar no RM e guarda zero a esquerda ("040644"). Comparar como
            // int faz o SQL Server converter a coluna e a busca casar independente de o
            // usuario digitar o zero ou nao; comparando como string exata, buscar "40644"
            // nao encontraria "040644".
            queryInterna += "WHERE f.CODCOLIGADA = 0 AND f.CODCFO = ? ";
            parametros.push({ type: "int", value: parseInt(soDigitos, 10) });

        } else {
            queryInterna += "WHERE f.CODCOLIGADA = 0 AND (f.NOME LIKE ? OR f.NOMEFANTASIA LIKE ?) ";
            var like = "%" + termoBruto + "%";
            parametros.push({ type: "string", value: like });
            parametros.push({ type: "string", value: like });
        }

        var query = ""
            + "SELECT TOP 30 CODCFO, CODCOLIGADA, NOME, NOMEFANTASIA, CGCCFO, CIDADE, UF, ATIVO "
            + "FROM (" + queryInterna + ") t "
            + "WHERE t.RN = 1 "
            + "ORDER BY t.NOME ASC";

        var retorno = executaQuery(query, parametros, "/jdbc/RM");

        log.info("ds_buscarCfoRM - TERMO: " + termoBruto + " | Retornados: " + retorno.length);

        return returnDataset("SUCCESS", "", JSON.stringify(retorno));

    } catch (error) {
        var mensagem = extraiMensagemErro(error);
        log.error("Erro ao executar Dataset ds_buscarCfoRM: " + mensagem);
        return returnDataset("ERRO", mensagem, null);
    }
}


// Utils
function abrirConexao(dataSource) {
    return new javax.naming.InitialContext().lookup(dataSource).getConnection();
}

function fecharConexao(conexao) {
    if (conexao != null) {
        try { conexao.close(); } catch (erro) { /* conexão já encerrada */ }
    }
}

function executaQuery(query, parametros, dataSource, conexaoExistente) {
    var conexao = conexaoExistente || null;
    var conexaoPropria = !conexaoExistente;
    var statement = null;

    try {
        if (!conexao) conexao = abrirConexao(dataSource);
        statement = conexao.prepareStatement(query);

        for (var indice = 0; indice < parametros.length; indice++) {
            var parametro = parametros[indice];
            if (parametro.type == "int")        statement.setInt(indice + 1, parametro.value);
            else if (parametro.type == "float") statement.setFloat(indice + 1, parametro.value);
            else                                statement.setString(indice + 1, parametro.value);
        }

        var resultSet = statement.executeQuery();

        // Nomes de coluna não mudam entre linhas: lidos uma vez, e não a cada célula.
        var metadados = resultSet.getMetaData();
        var colunas = [];
        for (var posicao = 1; posicao <= metadados.getColumnCount(); posicao++) {
            colunas.push(metadados.getColumnName(posicao));
        }

        var retorno = [];
        while (resultSet.next()) {
            var linha = {};
            for (var indiceColuna = 0; indiceColuna < colunas.length; indiceColuna++) {
                var nomeColuna = colunas[indiceColuna];
                var valor = resultSet.getObject(nomeColuna);
                linha[nomeColuna] = (valor == null) ? "" : valor + "";
            }
            retorno.push(linha);
        }
        return retorno;

    } catch (error) {
        var mensagem = extraiMensagemErro(error);
        log.error("Erro ao executar query: " + mensagem);
        throw "Erro ao executar Dataset: " + mensagem;
    } finally {
        if (statement != null) {
            try { statement.close(); } catch (erro) { /* statement já encerrado */ }
        }
        if (conexaoPropria) fecharConexao(conexao);
    }
}

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
        for (var indice = 0; indice < constraints.length; indice++) {
            retorno[constraints[indice].fieldName] = constraints[indice].initialValue;
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

function lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, obrigatorias) {
    var faltando = [];

    for (var indice = 0; indice < obrigatorias.length; indice++) {
        var nome = obrigatorias[indice];
        var valor = constraints[nome];
        if (valor == null || valor === "") faltando.push(nome);
    }

    if (faltando.length > 0) {
        throw "Constraints obrigatorias nao informadas (" + faltando.join(", ") + ")";
    }
}
