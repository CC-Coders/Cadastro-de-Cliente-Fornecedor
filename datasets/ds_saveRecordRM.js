
function createDataset(fields, constraints, sortFields) {
    try {
        var constraints = getConstraints(constraints);
        lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, ["pDataServerName", "pXML", "pCodcoligada"]);

        var pDataServerName = constraints.pDataServerName;
        var pXML            = constraints.pXML;
        var pCodcoligada    = constraints.pCodcoligada;
        var pUsuario  = "fluig";
        var pPassword = "flu!g@cc#2018";
        var context = "CODSISTEMA=T;CODCOLIGADA=" + pCodcoligada;

        log.info("[ds_saveRecordRM] DataServer=" + pDataServerName + " | Coligada=" + pCodcoligada);
        log.info("[ds_saveRecordRM] XML=" + pXML);


        var service        = ServiceManager.getService("wsDataServerRM");
        var serviceHelper  = service.getBean();
        var serviceLocator = service.instantiate("ws.WsDataServer");
        var wsObj          = serviceLocator.getRMIwsDataServer();
        var authService    = serviceHelper.getBasicAuthenticatedClient(wsObj, "ws.IwsDataServer", pUsuario, pPassword);

        var resultado = authService.saveRecord(pDataServerName, pXML, context);

        log.info("[ds_saveRecordRM] Resultado bruto: " + resultado);

        if (resultado != null && resultado.indexOf(";") >= 1) {
            var partes    = resultado.split(";");
            var codGerado = partes[partes.length - 1].trim() +'';
            log.info("[ds_saveRecordRM] Sucesso — codigo=" + codGerado);
            return returnDataset("SUCCESS", "Registro criado com sucesso.", JSON.stringify({ codigo: codGerado }));
        }

        log.error("[ds_saveRecordRM] RM retornou erro: " + resultado);
        return returnDataset("ERRO", _limparMensagemRM(String(resultado)), null);

    } catch (error) {
        var msg = "";
        if (error && error.javaException) {
            msg = error.javaException.getMessage();
        } else if (error && error.message) {
            msg = String(error.message);
        } else {
            msg = String(error);
        }
        log.error("[ds_saveRecordRM] Exceção: " + msg);
        return returnDataset("ERRO", _limparMensagemRM(msg), null);
    }
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
