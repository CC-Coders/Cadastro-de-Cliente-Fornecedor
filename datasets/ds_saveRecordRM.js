
function createDataset(fields, constraints, sortFields) {
    try {
        var constraints = getConstraints(constraints);
        lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, ["pDataServerName", "pXML", "pCodcoligada"]);

        var pDataServerName = constraints.pDataServerName;
        var pXML            = constraints.pXML;
        var pCodcoligada    = constraints.pCodcoligada;
        var context = "CODSISTEMA=T;CODCOLIGADA=" + pCodcoligada;

        log.info("[ds_saveRecordRM] DataServer=" + pDataServerName + " | Coligada=" + pCodcoligada);
        log.info("[ds_saveRecordRM] XML=" + pXML);

        var resultado = _salvarNoDataServerRM(pDataServerName, pXML, context);

        log.info("[ds_saveRecordRM] Resultado bruto: " + resultado);

        if (resultado != null && resultado.indexOf(";") >= 1) {
            // O RM retorna "status;codigo" — o código gerado é o último pedaço.
            var partes    = resultado.split(";");
            var codGerado = partes[partes.length - 1].trim() + '';
            log.info("[ds_saveRecordRM] Sucesso — codigo=" + codGerado);
            return returnDataset("SUCCESS", "Registro criado com sucesso.", JSON.stringify({ codigo: codGerado }));
        }

        log.error("[ds_saveRecordRM] RM retornou erro: " + resultado);
        return returnDataset("ERRO", _limparMensagemRM(String(resultado)), null);

    } catch (error) {
        var mensagem = _limparMensagemRM(extraiMensagemErro(error));
        log.error("[ds_saveRecordRM] Exceção: " + mensagem);
        return returnDataset("ERRO", mensagem, null);
    }
}

// Chama o DataServer do RM (SOAP) já autenticado com as credenciais de dsParametrizacaoRM.
function _salvarNoDataServerRM(dataServerName, xml, context) {
    var credenciais = buscarCredenciaisRM();

    var service        = ServiceManager.getService("wsDataServerRM");
    var serviceHelper  = service.getBean();
    var serviceLocator = service.instantiate("ws.WsDataServer");
    var wsObj          = serviceLocator.getRMIwsDataServer();
    var authService    = serviceHelper.getBasicAuthenticatedClient(
        wsObj, "ws.IwsDataServer", credenciais.usuario, credenciais.senha
    );

    return authService.saveRecord(dataServerName, xml, context);
}


function _limparMensagemRM(texto) {
    var msg = String(texto || "").trim();

    msg = msg.replace(/^Error:\s*/i, "");


    var idx = msg.indexOf("===");
    if (idx > 0) msg = msg.substring(0, idx).trim();

    idx = msg.indexOf(" em RM.");
    if (idx > 0) msg = msg.substring(0, idx).trim();

    idx = msg.search(/\n\s*(at|em)\s+/);
    if (idx > 0) msg = msg.substring(0, idx).trim();

    return msg || String(texto || "Erro desconhecido no RM.");
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
function buscarCredenciaisRM() {
    var dataset = DatasetFactory.getDataset("dsParametrizacaoRM", null, null, null);
    if (dataset == null || dataset.values == null || dataset.values.length === 0) {
        throw "Nao foi possivel obter as credenciais do RM (dsParametrizacaoRM vazio)";
    }
    return {
        usuario: String(dataset.getValue(0, "USUARIO")),
        senha: String(dataset.getValue(0, "SENHA"))
    };
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
