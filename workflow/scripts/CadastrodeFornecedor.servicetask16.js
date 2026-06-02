function servicetask16(attempt, message) {

    var COLIGADA = "1";
    var COLIGADAS_BANCO = ["1", "2", "5", "6", "12", "13"];

    function f(nome) {
        return String(hAPI.getCardValue(nome) || "").trim();
    }

    var categoria     = f("categoria");   
    var classificacao = f("classificacao");   
    var tipo          = f("tipo");            

    var nome          = f("nome");
    var razaoSocial   = f("razaoSocial");
    var nomeFantasia  = f("nomeFantasia");
    var nomeRM        = (categoria === "J") ? razaoSocial : nome;

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
    var retencaoIss   = f("hiddenIss") === "on" ? "1" : "0";

    // Código de Receita IRRF ? FCFO.CODRECEITA
    // hiddenCodIrrf é a âncora confiável; fallback para o próprio codIrrf
    var codReceita    = f("hiddenCodIrrf") || f("codIrrf") || "";

    // Natureza de Rendimentos ? FCFO.IDNATRENDIMENTO
    // idNatRendimento guarda o PK numérico (IDNATRENDIMENTO) vindo do select via data-idnat
    // codNaturezaRendimento guarda o CODNATRENDIMENTO alfanumérico — NÃO usar aqui (causaria FK violation)
    var natRendimento = f("idNatRendimento") || "";

    var mapPagrec = { "1": "2", "2": "1", "3": "3" };
    var pagrec = mapPagrec[classificacao] || "1";

    // Converte data para o formato AAAA-MM-DDTHH:mm:ss 
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

    log.info("[ST16] Iniciando — categoria=" + categoria + " | nomeRM=" + nomeRM + " | cgc=" + cgc + " | rg=" + rg);
    log.info("[ST16] PF — dtNascimento=" + dtNascimento + " | dtNascimentoRM=" + dtNascimentoRM + " | estadoCivil=" + estadoCivil + " | rgOrgao=" + rgOrgao + " | rgUf=" + rgUf + " | numDependentes=" + numDependentes);
    log.info("[ST16] Endereço — rua=" + endereco + " | num=" + numero + " | bairro=" + bairro + " | cidade=" + cidade + " | estado=" + estado + " | cep=" + cep + " | codMunicipio=" + codMunicipio);


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

    log.info("[ST16] Concluído. CODCFO=" + codCfo);
}



function x(s) {
    return (s || "").toString()
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;");
}
