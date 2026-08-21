// OCULTA O BOTÃO ENVIAR NATIVO DO FLUIG
function ocultarEnviarNativoFluig() {
  try {
    var p = window.parent;
    
    p.$("#send-process-button").css({
      position: "absolute",
      left: "-9999px",
      top: "0",
      opacity: "0",
      "pointer-events": "none"
    });
    
    p.$("#optionList li").filter(function () {
      return /enviar/i.test(p.$(this).text());
    }).hide();
  } catch (e) {
    console.warn("[envio] ocultar Enviar nativo:", e);
  }
}

// CONFIGURA AS AÇÕES E OS BOTÕES DISPONÍVEIS NA ETAPA DE VALIDAÇÃO CONFORME O MODO DO FORMULÁRIO
function prepararAcoesValidacao() {
  var atividade = Number($("#atividade").val() || 0);
  if (atividade !== ATIVIDADES.VALIDACAO) return;

  var modo = ($("#formMode").val() || "").toUpperCase();
  if (modo === "VIEW") {
    $("#btnEditarCamposInicio, #btnAprovar, #btnReprovar, #btnEnviarSolicitacao, #labelAcaoValidacao").hide();
    try { window.parent.$("#btnEditarNaBarra").remove(); } catch (e) {}
    return;
  }

  try {
    $("#btnAprovar, #btnReprovar, #labelAcaoValidacao").show();
    $("#btnEnviarSolicitacao").hide();
    posicionarBotaoEditarNaBarra();
  } catch (e) {
    console.warn("[Validacao] prepararAcoesValidacao:", e);
  }
}

// ACIONA O ENVIO DO PROCESSO PELO BOTÃO NATIVO DO FLUIG
function acionarEnvioFluig() {
  try {
    var btn = window.parent.document.getElementById("send-process-button");
    if (!btn) {
      console.warn("[envio] send-process-button nao encontrado");
      return;
    }
    btn.style.display = "";
    btn.style.visibility = "visible";
    btn.style.pointerEvents = "auto";
    btn.removeAttribute("disabled");
    btn.click();
  } catch (e) {
    console.error("[envio]", e);
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
    var p = window.parent;
    var pdoc = p.document;
    var enviar = pdoc.getElementById("send-process-button");

    // Sem o botão nativo de Enviar não há onde ancorar: mantém o amarelo do formulário
    // como fallback e tenta de novo no retry.
    if (!enviar || !enviar.parentNode) {
      return;
    }

    // O botão de editar canônico é o da barra, então escondemos o amarelo SEMPRE —
    // inclusive quando ele já existe (senão os dois aparecem).
    $("#btnEditarCamposInicio").hide();

    if (pdoc.getElementById("btnEditarNaBarra")) {
      return;
    }
    if (!$("#btnEditarCamposInicio").length) {
      return;
    }

    // Botão NOVO (nunca um clone do Enviar: o clone carregaria class/type/data-* que o Fluig
    // usa para disparar o envio). Só o className é copiado, para o visual ficar idêntico.
    var b = pdoc.createElement("button");
    b.id = "btnEditarNaBarra";
    b.type = "button";
    b.className = enviar.className;
    b.textContent = "Editar informações";
    b.onclick = function (ev) {
      // Corta a propagação para que nenhum handler delegado do Fluig (ligado por classe)
      // seja acionado por este clique — ele serve exclusivamente para liberar a edição.
      ev.preventDefault();
      ev.stopPropagation();
      $("#btnEditarCamposInicio").trigger("click");
    };

    enviar.parentNode.insertBefore(b, enviar);
  } catch (e) {
    console.warn("[Validacao] posicionarBotaoEditarNaBarra:", e);
    // Falhou ao criar o botão na barra: reexibe o amarelo para não deixar o usuário sem opção nenhuma.
    $("#btnEditarCamposInicio").show();
  }
}