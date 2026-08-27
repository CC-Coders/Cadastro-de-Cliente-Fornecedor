// OCULTA O BOTÃO ENVIAR NATIVO DO FLUIG
function ocultarEnviarNativoFluig() {
    try {
        var $ = window.parent.$;

        $("#send-process-button").hide();

        $("#optionList li").filter(function () {
            return /enviar/i.test($(this).text());
        }).hide();

    } catch (erro) {
        console.warn("[envio] Erro ao ocultar envio nativo:", erro);
    }
}

// CONFIGURA AS AÇÕES E OS BOTÕES DISPONÍVEIS NA ETAPA DE VALIDAÇÃO CONFORME O MODO DO FORMULÁRIO
function prepararAcoesValidacao() {
    if (Number($("#atividade").val() || 0) !== ATIVIDADES.VALIDACAO) {
        return;
    }

    var modoView = ($("#formMode").val() || "").toUpperCase() === "VIEW";

    if (modoView) {
        ocultarAcoesValidacao();
        return;
    }

    mostrarAcoesValidacao();
}

function ocultarAcoesValidacao() {
    $("#btnEditarCamposInicio, #btnAprovar, #btnReprovar, #btnEnviarSolicitacao, #labelAcaoValidacao").hide();

    try {
        window.parent.$("#btnEditarNaBarra").remove();
    } catch (erro) {
        console.warn("[Validacao] Erro ao remover botão editar:", erro);
    }
}

function mostrarAcoesValidacao() {
    try {
        $("#btnAprovar, #btnReprovar, #labelAcaoValidacao").show();
        $("#btnEnviarSolicitacao").hide();

        posicionarBotaoEditarNaBarra();
    } catch (erro) {
        console.warn("[Validacao] Erro ao preparar ações:", erro);
    }
}

// ACIONA O ENVIO DO PROCESSO PELO BOTÃO NATIVO DO FLUIG
function acionarEnvioFluig() {
    try {
        var btn = window.parent.document.getElementById("send-process-button");

        if (!btn) {
            console.warn("[envio] Botão nativo não encontrado");
            return;
        }

        btn.style.display = "";
        btn.style.visibility = "visible";
        btn.style.pointerEvents = "auto";
        btn.removeAttribute("disabled");
        btn.click();
    } catch (erro) {
        console.error("[envio] Erro ao acionar envio:", erro);
    }
}

// CONFIGURA A INTERFACE DE ENVIO PARA O SOLICITANTE NAS ETAPAS APLICÁVEIS
function prepararEnvioInicio() {
  var atividade = Number($("#atividade").val() || 0);
  var modo = ($("#formMode").val() || "").toUpperCase();

  var ehEnvioSolicitante = (atividade === ATIVIDADES.INICIO_0 ||
    atividade === ATIVIDADES.INICIO ||
    atividade === ATIVIDADES.CORRECAO ||
    atividade === ATIVIDADES.ERRO_INTEGRACAO) && modo !== "VIEW";

  if (!ehEnvioSolicitante) return;

  $("#btnEnviarSolicitacao").show();
  $("#btnAprovar, #btnReprovar, #labelAcaoValidacao, #btnEditarCamposInicio").hide();
}

// POSICIONA O BOTÃO DE EDITAR NA BARRA DE AÇÕES DO FLUIG, COM A CARA NATIVA DO FLUIG (Bootstrap), E OCULTA O BOTÃO ALTERNATIVO
function posicionarBotaoEditarNaBarra() {
    try {
        var parent = window.parent;
        var doc = parent.document;
        var btnEnviar = doc.getElementById("send-process-button");
        var btnEditar = $("#btnEditarCamposInicio");

        if (!btnEnviar || !btnEnviar.parentNode || !btnEditar.length) {
            return;
        }

        btnEditar.hide();

        if (doc.getElementById("btnEditarNaBarra")) {
            return;
        }

        var btn = doc.createElement("button");

        btn.id = "btnEditarNaBarra";
        btn.type = "button";
        btn.className = btnEnviar.className;
        btn.textContent = "Editar informações";

        $(btn).on("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            btnEditar.trigger("click");
        });

        btnEnviar.parentNode.insertBefore(btn, btnEnviar);

    } catch (erro) {
        console.warn("[Validacao] Erro ao posicionar botão editar:", erro);
        $("#btnEditarCamposInicio").show();
    }
}