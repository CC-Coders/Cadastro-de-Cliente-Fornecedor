
function createDataset(fields, constraints, sortFields) {
    try {
        var filtros = getConstraints(constraints);
        lancaErroSeConstraintsObrigatoriasNaoInformadas(filtros, ["CODCFO", "CODCOLIGADA"]);

        var codCfo = parseInt(String(filtros["CODCFO"]).replace(/\D/g, ""), 10);
        if (!codCfo) return returnDataset("ERRO", "CODCFO inválido", null);

        var parametros = [{ type: "int", value: codCfo }];
        var resultado;

        var conexao = abrirConexao("/jdbc/RM");
        try {
            resultado = {
                cadastro:     _cadastro(conexao, parametros),
                bancos:       _bancos(conexao, parametros),
                boletoIdpgto: _boletoIdpgto(conexao, parametros),
                enderecos:    _enderecos(conexao, parametros),
                emails:       _emails(conexao, parametros)
            };
        } finally {
            fecharConexao(conexao);
        }

        var auxiliares = _auxiliares(codCfo);
        resultado.auxiliar = auxiliares.auxiliar;
        resultado.cnaes    = auxiliares.cnaes;
        resultado.grupos   = auxiliares.grupos;

        return returnDataset("SUCCESS", "", JSON.stringify(resultado));

    } catch (error) {
        var mensagem = extraiMensagemErro(error);
        log.error("Erro ao executar Dataset ds_detalhesCfoRM: " + mensagem);
        return returnDataset("ERRO", mensagem, null);
    }
}

function _cadastro(conexao, parametros) {
    var query = "";
    query += "SELECT TOP 1 f.CODCFO, f.CODCOLIGADA, ISNULL(f.IDCFO,0) AS IDCFO, f.NOME, ";
    query += "  f.NOMEFANTASIA, f.CGCCFO, f.INSCRESTADUAL, f.INSCRMUNICIPAL, ";
    query += "  COALESCE(NULLIF(f.RUA,''), f.ENDCOBC) AS LOGRADOURO, ";
    query += "  f.NUMERO, f.COMPLEMENTO, f.BAIRRO, f.CEP, f.CODMUNICIPIO, ";
    query += "  m.NOMEMUNICIPIO AS CIDADE, COALESCE(m.CODETDMUNICIPIO, f.CODETD, f.CI_UF) AS UF, ";
    query += "  f.TELEFONE, f.TELEX AS CELULAR, f.EMAIL, f.PESSOAFISOUJUR AS CATEGORIA, ";
    query += "  f.CODTCF, f.PAGREC, f.CODRECEITA, f.IDNATRENDIMENTO, f.DOCUMENTOESTRANGEIRO, ";
    query += "  f.CIDENTIDADE AS RG, f.ESTADOCIVIL, f.CI_ORGAO, f.CI_UF, ";
    query += "  ISNULL(f.CONTRIBUINTE,0) AS CONTRIBUINTE, ";
    query += "  ISNULL(f.OPTANTEPELOSIMPLES,0) AS OPTANTEPELOSIMPLES, ";
    query += "  ISNULL(f.RETENCAOISS,0) AS RETENCAOISS, ISNULL(f.NACIONALIDADE,0) AS NACIONALIDADE, ";
    query += "  ISNULL(f.NUMDEPENDENTES,0) AS NUMDEPENDENTES, ";
    query += "  CONVERT(VARCHAR(10), f.DTNASCIMENTO, 120) AS DTNASCIMENTO ";
    query += "FROM FCFO f ";
    query += "OUTER APPLY (SELECT TOP 1 NOMEMUNICIPIO, CODETDMUNICIPIO FROM GMUNICIPIO ";
    query += "  WHERE CODMUNICIPIO = f.CODMUNICIPIO ";
    query += "  ORDER BY CASE WHEN CODETDMUNICIPIO = COALESCE(NULLIF(f.CODETD,''), f.CI_UF) THEN 0 ELSE 1 END";
    query += ") m ";
    query += "WHERE f.CODCFO = ? ORDER BY f.CODCOLIGADA";

    var linhas = executaQuery(query, parametros, null, conexao);
    return linhas.length ? linhas[0] : {};
}

function _bancos(conexao, parametros) {
    var query = "";
    query += "SELECT NUMEROBANCO, CODIGOAGENCIA, DIGITOAGENCIA, CONTACORRENTE, DIGITOCONTA, ";
    query += "  NOMEAGENCIA, ATIVO, IDPGTO FROM ( ";
    query += "  SELECT NUMEROBANCO, CODIGOAGENCIA, DIGITOAGENCIA, CONTACORRENTE, DIGITOCONTA, ";
    query += "    NOMEAGENCIA, ISNULL(ATIVO,1) AS ATIVO, IDPGTO, ";
    query += "    ROW_NUMBER() OVER (PARTITION BY IDPGTO ORDER BY CODCOLIGADA) AS RN ";
    query += "  FROM FDADOSPGTO WHERE CODCFO = ? AND FORMAPAGAMENTO = 'T' ";
    query += "    AND (NUMEROBANCO IS NOT NULL OR CONTACORRENTE IS NOT NULL) ";
    query += ") t WHERE t.RN = 1 ORDER BY IDPGTO";

    return executaQuery(query, parametros, null, conexao);
}

// IDPGTO DO BOLETO (forma I) — o servicetask16 reaproveita esse id.
function _boletoIdpgto(conexao, parametros) {
    var query = "SELECT TOP 1 IDPGTO FROM FDADOSPGTO " +
                "WHERE CODCFO = ? AND FORMAPAGAMENTO = 'I' ORDER BY IDPGTO";

    var linhas = executaQuery(query, parametros, null, conexao);
    return linhas.length ? linhas[0].IDPGTO : "";
}

function _enderecos(conexao, parametros) {
    var query = "";
    query += "SELECT c.IDCONTATO, c.NOME AS DESCRICAO, c.RUA, c.NUMERO, c.COMPLEMENTO, ";
    query += "  c.BAIRRO, c.CEP, c.CODMUNICIPIO, ";
    query += "  COALESCE(m.NOMEMUNICIPIO, c.CIDADE) AS CIDADE, ";
    query += "  COALESCE(m.CODETDMUNICIPIO, c.CODETD) AS UF ";
    query += "FROM FCFOCONTATO c ";
    query += "OUTER APPLY (SELECT TOP 1 NOMEMUNICIPIO, CODETDMUNICIPIO FROM GMUNICIPIO ";
    query += "  WHERE CODMUNICIPIO = c.CODMUNICIPIO ";
    query += "  ORDER BY CASE WHEN CODETDMUNICIPIO = c.CODETD THEN 0 ELSE 1 END";
    query += ") m ";
    query += "WHERE c.CODCFO = ? AND ISNULL(c.RUA,'') <> '' ORDER BY c.IDCONTATO";

    try {
        return executaQuery(query, parametros, null, conexao);
    } catch (erro) {
        log.warn("[ds_detalhesCfoRM] Falha ao ler endereços adicionais (não interrompe): " + erro);
        return [];
    }
}

// E-MAILS DE CONTATO (FCFOCONTATO) — o e-mail administrativo so e gravado aqui pelo
// servicetask16 (salvarContatosRM), nunca na FCFO_AUXILIAR. O comercial existe nas
// duas tabelas (aux cobre o comercial); sem isto o administrativo ficava em branco
// ao reabrir o cadastro para edicao.
function _emails(conexao, parametros) {
    var query = "SELECT NOME, EMAIL FROM FCFOCONTATO " +
                "WHERE CODCFO = ? AND NOME IN ('E-mail Comercial', 'E-mail Administrativo')";

    try {
        var linhas = executaQuery(query, parametros, null, conexao);
        var porNome = {};
        for (var indice = 0; indice < linhas.length; indice++) {
            porNome[linhas[indice].NOME] = linhas[indice].EMAIL;
        }
        return {
            comercial: porNome["E-mail Comercial"] || "",
            administrativo: porNome["E-mail Administrativo"] || ""
        };
    } catch (erro) {
        log.warn("[ds_detalhesCfoRM] Falha ao ler e-mails de contato (nao interrompe): " + erro);
        return { comercial: "", administrativo: "" };
    }
}

function _auxiliares(codCfo) {
    var conexao = null;

    try {
        conexao = abrirConexao("/jdbc/CastilhoCustom");
        var parametros = [{ type: "int", value: codCfo }, { type: "int", value: 1 }];

        var auxiliar = executaQuery(
            "SELECT TOP 1 REGIME_FISCAL, RETENCAO_INSS, RETENCAO_CSLL, RETENCAO_PIS, " +
            "RETENCAO_COFINS, EMAIL_COMERCIAL, WEBSITE " +
            "FROM FCFO_AUXILIAR WHERE CODCFO = ? AND CODCOLIGADA = ?",
            parametros, null, conexao);

        return {
            auxiliar: auxiliar.length ? auxiliar[0] : {},
            cnaes: executaQuery(
                "SELECT CODIGO, DESCRICAO, PRINCIPAL FROM FCFO_AUXILIAR_CNAE " +
                "WHERE CODCFO = ? AND CODCOLIGADA = ?", parametros, null, conexao),
            grupos: executaQuery(
                "SELECT CODTB2FAT, DESCRICAO, PRINCIPAL FROM FCFO_AUXILIAR_GRUPO_MERCADORIA " +
                "WHERE CODCFO = ? AND CODCOLIGADA = ?", parametros, null, conexao)
        };
    } catch (erro) {
        log.warn("[ds_detalhesCfoRM] Falha ao ler tabelas auxiliares (não interrompe): " + erro);
        return { auxiliar: {}, cnaes: [], grupos: [] };
    } finally {
        fecharConexao(conexao);
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
        log.error("[ds_detalhesCfoRM] Erro ao executar query: " + mensagem);
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
