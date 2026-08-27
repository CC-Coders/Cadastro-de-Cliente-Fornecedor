function createDataset(fields, constraints, sortFields) {
    try {
        var constraints = getConstraints(constraints);

        var query = "";
        query += "SELECT CODRECEITA, DESCRICAO, ALIQUOTA, PESSOAFISOUJUR ";
        query += "FROM FIRRF ";
        query += "ORDER BY DESCRICAO";

        var retorno = executaQuery(query, [], "/jdbc/RM");

        return returnDataset("SUCCESS", "", JSON.stringify(retorno));

    } catch (error) {
        var mensagem = extraiMensagemErro(error);
        log.error("Erro ao executar Dataset ds_irrfRM: " + mensagem);
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
