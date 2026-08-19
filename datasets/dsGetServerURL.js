// Retorna a URL do servidor Fluig do ambiente atual (usada para montar links das solicitações).
function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("STATUS");
    dataset.addColumn("URL");

    try {
        var URL = fluigAPI.getPageService().getServerURL();
        dataset.addRow(["200", URL]);
    } catch (error) {
        var mensagem = extraiMensagemErro(error);
        log.error("Erro ao executar Dataset dsGetServerURL: " + mensagem);
        dataset.addRow(["500", ""]);
    }

    return dataset;
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
