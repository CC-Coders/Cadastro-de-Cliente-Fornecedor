
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
  if (atividade !== ATIVIDADES.VALIDACAO) {
    return;
  }
  
  var modo = ($("#formMode").val() || "").toUpperCase();
  if (modo === "VIEW") {
    $("#btnEditarCamposInicio, #btnAprovar, #btnReprovar, #btnEnviarSolicitacao, #labelAcaoValidacao").hide();
    try { window.parent.$("#btnEditarNaBarra").remove(); } catch (e) {}
    return;
  }
  
  try {
    $("#btnAprovar, #btnReprovar, #labelAcaoValidacao").show();
    $("#btnEnviarSolicitacao").hide();
    $("#sectionNameDecisao").text("Decisão da Validação");
    posicionarBotaoEditarNaBarra();
  } catch (e) {
    console.warn("[Validacao] prepararAcoesValidacao:", e);
  }
}

// POSICIONA O BOTÃO DE EDITAR NA BARRA DE AÇÕES DO FLUIG E OCULTA O BOTÃO ALTERNATIVO
function posicionarBotaoEditarNaBarra() {
  try {
    var p = window.parent;
    var pdoc = p.document;
    var barra = pdoc.getElementById("workflowActions");

    // Barra ainda não pronta: mantém o amarelo como fallback e tenta de novo no retry.
    if (!barra) {
      return;
    }

    // Barra existe: o botão de editar canônico é o PRETO na barra, então escondemos
    // o amarelo SEMPRE — inclusive quando o preto já existe (senão os dois aparecem).
    $("#btnEditarCamposInicio").hide();

    if (pdoc.getElementById("btnEditarNaBarra")) {
      return;
    }
    if (!$("#btnEditarCamposInicio").length) {
      return;
    }

    var enviar = pdoc.getElementById("send-process-button");
    var b = pdoc.createElement("button");
    b.id = "btnEditarNaBarra";
    b.type = "button";
    b.className = "btn btn-primary";
    b.innerHTML = '<span class="flaticon flaticon-edit icon-sm"></span> Editar informações';
    b.onclick = function () {
      $("#btnEditarCamposInicio").trigger("click");
    };
    
    if (enviar) {
      barra.insertBefore(b, enviar);
    } else {
      barra.appendChild(b);
    }
  } catch (e) {
    console.warn("[Validacao] posicionarBotaoEditarNaBarra:", e);
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
  
  if (!ehEnvioSolicitante) {
    return;
  }
  
  $("#btnEnviarSolicitacao").show();
  $("#btnAprovar, #btnReprovar, #labelAcaoValidacao, #btnEditarCamposInicio").hide();
  $("#sectionNameDecisao").text("Observações e Envio");
}

// ADICIONA UM NOVO CAMPO DE GRUPO DE MERCADORIA, RESPEITANDO O LIMITE MÁXIMO E ATUALIZANDO OS CONTROLES DA SEÇÃO
function adicionarGrupoMercadoria() {
  const $wrap = $("#grupo-mercadoria-wrap");
  const quantidadeAtual = $wrap.find(".grupo-mercadoria-item").length;
  const quantidadeTotalDepoisDeAdicionar = quantidadeAtual + 2;
  
  if (quantidadeTotalDepoisDeAdicionar > LIMITE_GRUPO_MERCADORIA) {
    FLUIGC.toast({
      title: "Atenção",
      message: "Você pode adicionar no máximo " + LIMITE_GRUPO_MERCADORIA + " grupos de mercadoria.",
      type: "warning"
    });
    return;
  }
  
  const numero = quantidadeAtual + 2;
  
  const html = `
      <div class="grid g2 grupo-mercadoria-item" id="grupo-mercadoria-item-${numero}">
         <div class="fg">
            <label for="grupoMercadoria${numero}">Grupo de Mercadoria ${numero}</label>
            <div class="select-wrap">
               <select
                  id="grupoMercadoria${numero}"
                  name="grupoMercadoria${numero}"
                  class="form-control grupo-mercadoria">
                  ${_gerarOptionsGrupoMercadoria()}
               </select>
            </div>
         </div>

         <div class="fg grupo-mercadoria-acao" style="align-self:flex-end; display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn btn-danger btn-remove-grupo-mercadoria">
               Remover
            </button>
         </div>
      </div>
   `;

   $wrap.append(html);

   sincronizarCamposDinamicosHidden();
   reposicionarBotaoAdicionarGrupo();
   controlarBotaoAdicionarGrupoMercadoria();
}

// REPOSICIONA O BOTÃO DE ADICIONAR GRUPO DE MERCADORIA JUNTO AO ÚLTIMO GRUPO EXIBIDO
function reposicionarBotaoAdicionarGrupo() {
   const $btn = $("#btn-add-grupo-mercadoria");
   if (!$btn.length) return;

   const $itens = $("#grupo-mercadoria-wrap .grupo-mercadoria-item");

   if ($itens.length) {
      $itens.last().find(".grupo-mercadoria-acao").first().append($btn);
   } else {
      $("#acaoGrupoMercadoria1").append($btn);
   }
}

// REORDENA OS ITENS DINÂMICOS DA LISTA, ATUALIZANDO SEUS IDS, NOMES E RÓTULOS SEQUENCIALMENTE
function _reordenarItens(seletorLista, prefixoItem, prefixoCampo, textoLabel, seletorCampo, offset) {
   offset = offset || 1;
   $(seletorLista).each(function (index) {
      const numero = index + offset;
      const $item = $(this);
      $item.attr("id", prefixoItem + numero);
      $item.find("label")
         .attr("for", prefixoCampo + numero)
         .text(textoLabel + " " + numero);
      $item.find(seletorCampo)
         .attr("id",   prefixoCampo + numero)
         .attr("name", prefixoCampo + numero);
   });
}

// REORDENA OS GRUPOS DE MERCADORIA, ATUALIZANDO SUA NUMERAÇÃO SEQUENCIAL A PARTIR DO SEGUNDO GRUPO
function reordenarGruposMercadoria() {
   _reordenarItens(
      "#grupo-mercadoria-wrap .grupo-mercadoria-item",
      "grupo-mercadoria-item-",
      "grupoMercadoria",
      "Grupo de Mercadoria",
      "select",
      2
   );
}

// HABILITA OU DESABILITA O BOTÃO DE ADICIONAR CONFORME A QUANTIDADE ATUAL E O LIMITE DEFINIDO
function _controlarBotaoAdicionar(quantidade, limite, $botao) {
   const atingiu = quantidade >= limite;
   $botao.prop("disabled", atingiu).toggleClass("disabled", atingiu);
}

// CONTROLA A DISPONIBILIDADE DO BOTÃO DE ADICIONAR GRUPO DE MERCADORIA
function controlarBotaoAdicionarGrupoMercadoria() {
   const total = 1 + $("#grupo-mercadoria-wrap .grupo-mercadoria-item").length;
   _controlarBotaoAdicionar(total, LIMITE_GRUPO_MERCADORIA, $("#btn-add-grupo-mercadoria"));
}

// CNAE SECUNDÁRIO
function adicionarCnae() {
   const $wrap = $("#cnae-secundarios-wrap");
   const quantidadeAtual = $wrap.find(".cnae-secundario-item").length;

   if (quantidadeAtual >= LIMITE_CNAE_SECUNDARIO) {
      FLUIGC.toast({
         title: "Atenção",
         message: "Você pode adicionar no máximo 5 CNAEs secundários.",
         type: "warning"
      });
      return;
   }

  const numero = quantidadeAtual + 1;
  const html = `
  <div class="grid g2 cnae-secundario-item" id="cnae-secundario-${numero}" style="margin-bottom:12px;">
    <div class="fg">
      <label for="cnaeSecundario${numero}">CNAE Secundário ${numero}</label>
      <input type="text" id="cnaeSecundario${numero}" name="cnaeSecundario${numero}" placeholder="0000-0/00" maxlength="9" class="cnae-secundario form-control">
    </div>
    <div class="fg" style="align-self:flex-end;">
      <button type="button" class="btn btn-danger btn-remove-cnae">
        Remover
      </button>
    </div>
  </div>
  `;
   $wrap.append(html);
   controlarBotaoAdicionarCnae();
   sincronizarCamposDinamicosHidden();
}
function reordenarCnaesSecundarios() {
   _reordenarItens(
      "#cnae-secundarios-wrap .cnae-secundario-item",
      "cnae-secundario-",
      "cnaeSecundario",
      "CNAE Secundário",
      "input",
      1
   );
}
function controlarBotaoAdicionarCnae() {
   const total = $("#cnae-secundarios-wrap .cnae-secundario-item").length;
   _controlarBotaoAdicionar(total, LIMITE_CNAE_SECUNDARIO, $("#btn-add-cnae"));
}

// HISTÓRICO DE DECISÃO — TIMELINE
async function asyncMontaHistorico() {
   const $hist = $("#divLinhasHistorico");
   $hist.empty();
   let linhasHistorico = getLinhasHistorico().reverse();
   for (const linha of linhasHistorico) {
      $hist.append(geraHtmlHistorico(linha));
      try {
         $(".divImageUser:last").append(await promiseBuscaImagemUsuario(linha.USUARIO));
      } catch (error_) {
         console.warn("Não foi possível carregar imagem do usuário:", linha.USUARIO, error_);
      }
   }
}
function getLinhasHistorico() {
   const retorno = [];
   $("#tableHistorico tbody tr").each(function () {
      const usuario = $(this).find(".tableHistoricoUsuario").val();
      // ignora linha vazia
      if (!usuario) return;

      retorno.push({
         USUARIO: usuario,
         DATA: $(this).find(".tableHistoricoData").val(),
         OBSERVACAO: $(this).find(".tableHistoricoObservacao").val(),
         ACAO: $(this).find(".tableHistoricoAcao").val(),
         ATIVIDADE: $(this).find(".tableHistoricoAtividade").val()
      });
   });
   return retorno;
}
function geraHtmlHistorico(linha) {
   let DATA = linha.DATA ? linha.DATA.split(" ") : ["", ""];
   const textoObs = (linha.OBSERVACAO || "")
      .replaceAll(/^(<br\s*\/?>|\s)*/gi, "")
      .trim();

   if (DATA[0]) {
      DATA = DATA[0].split("-").reverse().join("/") + " " + (DATA[1] || "");
   } else {
      DATA = "";
   }

   const nomeUsuario = linha.USUARIO || "Usuário não identificado";
   const atividade = linha.ATIVIDADE || "";
   const observacao = textoObs || linha.ACAO || "Sem observação.";

  return `
  <div class="card-historico">
    <div class="divImageUser"></div>
    
    <div class="historico-info">
      <div class="historico-topo">
        <div>
          <div class="historico-usuario">${nomeUsuario}</div>
          <div class="historico-atividade">${atividade}</div>
        </div>
        
        <div class="historico-data">${DATA}</div>
      </div>
      
      <div class="historico-observacao">${observacao}</div>
    </div>
  </div>
  `;
}
function controlarStepperHistorico() {
   const possuiHistorico = getLinhasHistorico().length > 0;

   var atividade = Number($("#atividade").val() || 0);
   var modo = ($("#formMode").val() || "").toUpperCase();
   var ehEnvioSolicitante = (atividade === ATIVIDADES.INICIO_0 ||
                             atividade === ATIVIDADES.INICIO ||
                             atividade === ATIVIDADES.CORRECAO ||
                             atividade === ATIVIDADES.ERRO_INTEGRACAO) && modo !== "VIEW";

   if (possuiHistorico || ehEnvioSolicitante) {
      $("#nav-step-HistoricoDecisao").show(500);
      $("#divDivisaoHistorico").show(500);

      $(".stepper").removeClass("stepper-3").addClass("stepper-4");

      if (possuiHistorico) {
         $("#divHistoricoProcesso").show();
         $("#divLinhasHistorico").empty();
         asyncMontaHistorico();
      } else {
         $("#divHistoricoProcesso").hide();
      }
   } else {
      $("#nav-step-HistoricoDecisao").hide(500);
      $("#divDivisaoHistorico").hide(500);

      $(".stepper").removeClass("stepper-4").addClass("stepper-3");
   }

   atualizarSetas();
}

// MÁSCARAS DE INPUT
function inicializarMascaras() {
   $("#docCpf").mask("000.000.000-00");
   $("#docCnpj").mask("AA.AAA.AAA/AAAA-00");
   // RG sem máscara: aceita qualquer formato (varia por estado).
   $("#docInscricaoEstadual").mask("000.000.000.000");
   $("#docInscricaoMunicipal").mask("000.000.000.000");
   $("#cep").mask("00000-000");
   $("#numero").mask("000000");
   $("#telefone, #telComercial, #celular").on("input", function () {
      const valor = $(this).val().replaceAll(/\D/g, "");

      if (valor.length <= 11) {
         $(this).mask("(00) 00000-0000");
      }
   });
   $("#cnaePrincipal").on("input", function () {
      aplicarMascaraCnae($(this));
   });

   var hoje = new Date().toISOString().split("T")[0];
   $("#dtNascimento").attr("max", hoje);

   inicializarMascarasBancarias();
}
function aplicarMascaraCnae($campo) {
   let valor = $campo.val().replaceAll(/\D/g, "");

   if (valor.length > 7) {
      valor = valor.substring(0, 7);
   }

   if (valor.length > 5) {
      valor = valor.replace(/^(\d{4})(\d)(\d{0,2})$/, "$1-$2/$3");
   } else if (valor.length > 4) {
      valor = valor.replace(/^(\d{4})(\d?)$/, "$1-$2");
   }

   $campo.val(valor);
}
function inicializarMascarasBancarias() {
   $(document).on("input", ".banco-agencia", function () {
      let valor = $(this).val().replaceAll(/\D/g, "").slice(0, 5);
      if (valor.length > 4) valor = valor.replace(/^(\d{4})(\d)$/, "$1-$2");
      $(this).val(valor);
      sincronizarTabelaBancaria();
   });

   $(document).on("input", ".banco-conta", function () {
      // Conta limitada a 16 dígitos. O último dígito vira verificador.
      let valor = $(this).val().replaceAll(/\D/g, "").slice(0, 16);
      if (valor.length > 1) valor = valor.replace(/(\d+)(\d)$/, "$1-$2");
      $(this).val(valor);
      sincronizarTabelaBancaria();
   });
}
function atualizarCamposBancariosRm() {
   $("#agenciaRm").val(($("#agencia").val() || "").replaceAll(/\D/g, ""));
   $("#contaRm").val(($("#conta").val() || "").replaceAll(/\D/g, ""));
}


// DEFINE OS CAMPOS UTILIZADOS NA AUDITORIA DE ALTERAÇÕES REALIZADAS DURANTE A ETAPA DE VALIDAÇÃO DO PROCESSO
const CAMPOS_AUDITORIA_EDICAO = [{
      id: "classificacao",
      label: "Classificação"
   },
   {
      id: "categoria",
      label: "Categoria"
   },
   {
      id: "tipo",
      label: "Tipo"
   },
   {
      id: "classificacaoOperacional",
      label: "Classificação Operacional"
   },
   {
      id: "docCpf",
      label: "CPF"
   },
   {
      id: "docCnpj",
      label: "CNPJ"
   },
   {
      id: "docRg",
      label: "RG"
   },
   {
      id: "docInscricaoEstadual",
      label: "Inscrição Estadual"
   },
   {
      id: "razaoSocial",
      label: "Razão Social"
   },
      {
      id: "nomeFantasia",
      label: "Nome Fantasia"
   },
   {
      id: "cep",
      label: "CEP"
   },
   {
      id: "endereco",
      label: "Endereço"
   },
   {
      id: "numero",
      label: "Número"
   },
   {
      id: "complemento",
      label: "Complemento"
   },
   {
      id: "bairro",
      label: "Bairro"
   },
   {
      id: "cidade",
      label: "Cidade"
   },
   {
      id: "pais",
      label: "País"
   },
   {
      id: "estado",
      label: "Estado"
   },

   {
      id: "icms",
      label: "Contribuinte ICMS"
   },
   {
      id: "codIrrf",
      label: "Código de Receita IRRF",
      domId: "selectDescricaoIrrf"
   },
   {
      id: "irrf",
      label: "Alíquota IRRF"
   },
   {
      id: "simplesNacional",
      label: "Simples Nacional"
   },
   {
      id: "codNaturezaRendimento",
      label: "Natureza de Rendimentos"
   },
   {
      id: "regimeFiscal",
      label: "Regime Fiscal"
   },
   {
      id: "tipoDocEmitido",
      label: "Tipo de Documento Emitido"
   },

   {
      id: "grupoMercadoria1",
      label: "Grupo de Mercadoria 1"
   },
   {
      id: "hiddenGrupoMercadoria2",
      label: "Grupo de Mercadoria 2"
   },
   {
      id: "hiddenGrupoMercadoria3",
      label: "Grupo de Mercadoria 3"
   },
   {
      id: "hiddenGrupoMercadoria4",
      label: "Grupo de Mercadoria 4"
   },
   {
      id: "hiddenGrupoMercadoria5",
      label: "Grupo de Mercadoria 5"
   },
   {
      id: "hiddenGrupoMercadoria6",
      label: "Grupo de Mercadoria 6"
   },
   {
      id: "hiddenGrupoMercadoria7",
      label: "Grupo de Mercadoria 7"
   },
      {
      id: "hiddenGrupoMercadoria8",
      label: "Grupo de Mercadoria 8"
   },
   {
      id: "hiddenGrupoMercadoria9",
      label: "Grupo de Mercadoria 9"
   },
   {
      id: "cnaePrincipal",
      label: "CNAE Principal"
   },
   {
      id: "hiddenCnaeSecundario1",
      label: "CNAE Secundário 1"
   },
   {
      id: "hiddenCnaeSecundario2",
      label: "CNAE Secundário 2"
   },
   {
      id: "hiddenCnaeSecundario3",
      label: "CNAE Secundário 3"
   },
   {
      id: "hiddenCnaeSecundario4",
      label: "CNAE Secundário 4"
   },
   {
      id: "hiddenCnaeSecundario5",
      label: "CNAE Secundário 5"
   },
   {
      id: "toggleRetencao",
      label: "Haverá retenção?",
      tipo: "checkbox"
   },
   {
      id: "inss",
      label: "Retenção INSS",
      tipo: "checkbox"
   },
   {
      id: "csll",
      label: "Retenção CSLL",
      tipo: "checkbox"
   },
   {
      id: "pis",
      label: "Retenção PIS",
      tipo: "checkbox"
   },
   {
      id: "cofins",
      label: "Retenção COFINS",
      tipo: "checkbox"
   },

   { id: "hiddenBanco1Cod",     label: "Banco (Conta 1)"   },
   { id: "hiddenBanco1Agencia", label: "Agência (Conta 1)" },
   { id: "hiddenBanco1Conta",   label: "Conta (Conta 1)"   },

   { id: "hiddenBanco2Cod",      label: "Banco (Conta 2)"   },
   { id: "hiddenBanco2Agencia",  label: "Agência (Conta 2)" },
   { id: "hiddenBanco2Conta",    label: "Conta (Conta 2)"   },

   { id: "hiddenBanco3Cod",      label: "Banco (Conta 3)"   },
   { id: "hiddenBanco3Agencia",  label: "Agência (Conta 3)" },
   { id: "hiddenBanco3Conta",    label: "Conta (Conta 3)"   },

   { id: "hiddenBanco4Cod",      label: "Banco (Conta 4)"   },
   { id: "hiddenBanco4Agencia",  label: "Agência (Conta 4)" },
   { id: "hiddenBanco4Conta",    label: "Conta (Conta 4)"   },

   { id: "hiddenBanco5Cod",      label: "Banco (Conta 5)"   },
   { id: "hiddenBanco5Agencia",  label: "Agência (Conta 5)" },
   { id: "hiddenBanco5Conta",    label: "Conta (Conta 5)"   },

   {
      id: "telefone",
      label: "Telefone"
   },
   {
      id: "telComercial",
      label: "Telefone Comercial"
   },
   {
      id: "celular",
      label: "Celular"
   },
   {
      id: "emailAdministrativo",
      label: "E-mail Administrativo"
   },
   {
      id: "emailComercial",
      label: "E-mail Comercial"
   },
   {
      id: "emailCr",
      label: "E-mail Financeiro / Contabilidade"
   },
   {
      id: "site",
      label: "Site"
   },

   {
      id: "anxCartaoCnpj",
      label: "Anexo Documento de Identificação Júridica"
   },
   {
      id: "anxCompBanco",
      label: "Anexo Comprovante Bancário"
   },
   {
      id: "anxContrato",
      label: "Anexo Contrato Social"
   },
   {
      id: "anxRgCpf",
      label: "Anexo RG / CPF"
   },
   {
      id: "anxCompEndereco",
      label: "Anexo Comprovante de Endereço"
   },
   {
      id: "anxLaudoPcd",
      label: "Anexo Laudo Médico PCD"
   },
   {
      id: "anxDependentes",
      label: "Anexo Dependentes IRRF"
   },
   {
      id: "anxCodConduta",
      label: "Anexo Código de Conduta"
   },
   {
      id: "anxAntiCorrupcao",
      label: "Anexo Política Anticorrupção"
   },
   {
      id: "anxConflito",
      label: "Anexo Conflito de Interesses"
   },
   {
      id: "anxLgpd",
      label: "Anexo Ciência LGPD"
   }
];

// CRIA UM SNAPSHOT INICIAL DOS CAMPOS DA VALIDAÇÃO PARA COMPARAR ALTERAÇÕES REALIZADAS DURANTE A EDIÇÃO
function inicializarSnapshotEdicaoValidacao() {
   const atividade = Number($("#atividade").val() || 0);

   if (atividade !== ATIVIDADES.VALIDACAO) {
      return;
   }

   if ($("#snapshotEdicaoValidacao").val()) {
      return;
   }

   const snapshot = {};

   CAMPOS_AUDITORIA_EDICAO.forEach(function (campo) {
      const selectorId = campo.domId || campo.id;

      if (campo.tipo === "checkbox") {
         snapshot[campo.id] = $("#" + selectorId).is(":checked") ? "Sim" : "Não";
         return;
      }

      snapshot[campo.id] = ($("#" + selectorId).val() || "").toString().trim();
   });

   $("#snapshotEdicaoValidacao").val(JSON.stringify(snapshot));
}

// SINCRONIZA OS CAMPOS DINÂMICOS DO FORMULÁRIO COM OS CAMPOS HIDDEN UTILIZADOS NA INTEGRAÇÃO E PERSISTÊNCIA DOS DADOS
function sincronizarCamposDinamicosHidden() {

   let ufAtual = ($("#estado").val() || "").trim();
   if (ufAtual) {
      $("#hiddenEstadoValor").val(ufAtual);
   }

   let cidadeAtual = ($("#cidade").val() || "").trim();
   if (cidadeAtual) {
      $("#nomeCidadeSalva").val(cidadeAtual);
   }

   for (let i = 1; i <= LIMITE_GRUPO_MERCADORIA; i++) {
      const $select = $("#grupoMercadoria" + i);
      const $hidden = $("#hiddenGrupoMercadoria" + i);

      if (!$hidden.length) continue;

      if ($select.length) {
         const grpVal = ($select.val() || "").trim();

         if (grpVal || !globalThis._formRestaurando) {
            $hidden.val(grpVal);
         }
      }
   }

   for (let i = 1; i <= globalThis.LIMITE_CNAE_SECUNDARIO; i++) {
      const $campo = $("#cnaeSecundario" + i);
      const $hidden = $("#hiddenCnaeSecundario" + i);

      if (!$hidden.length) continue;

      if ($campo.length) {
         $hidden.val(($campo.val() || "").trim());
      }
   }
}

// INTERPRETA O RETORNO PADRÃO DOS DATASETS, VALIDANDO ERROS, CONVERTENDO O JSON E RETORNANDO OS DADOS EM ARRAY
function _parsearDataset(ds, nomeDataset) {
   if (!ds?.values?.length) {
      console.warn("[Dataset] " + (nomeDataset || "?") + " vazio ou indisponível.");
      return [];
   }
   let row      = ds.values[0];
   let status   = (row.STATUS   || "").toString().trim();
   let mensagem = (row.MENSAGEM || "").toString().trim();
   let result   = (row.RESULT   || "").toString().trim();
   if (status === "ERRO") {
      console.error("[Dataset] " + (nomeDataset || "?") + " retornou ERRO: " + mensagem);
      return [];
   }
   if (!result || result === "null") {
      console.warn("[Dataset] " + (nomeDataset || "?") + " RESULT vazio.");
      return [];
   }
   try {
      let  parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : [];
   } catch (e) {
      console.error("[Dataset] " + (nomeDataset || "?") + " erro ao parsear RESULT:", e);
      return [];
   }
}

// CARREGA OS TIPOS DE CLIENTE OU FORNECEDOR DO RM, POPULANDO O CAMPO SELECT E RESTAURANDO VALORES SALVOS
function carregarTiposClienteFornecedor() {

   let select = $("#tipo");

   let valorSalvo = (
      $("#tipoSelecionado").val() ||
      select.val() ||
      select.attr("value") ||
      ""
   ).toString().trim();

   select.empty();
   select.append('<option value="">Selecione...</option>');

   let itens = _parsearDataset(
      DatasetFactory.getDataset("ds_tipoClienteFornecedorRM", null, null, null),
      "ds_tipoClienteFornecedorRM"
   );

   if (!itens.length) return;

   itens.forEach(function (item) {
      let codigo = (item.CODTCF || "").toString().trim();
      let descricao = (item.DESCRICAO || "").toString().trim();

      select.append(
         '<option value="' + codigo + '">' +
            codigo + " - " + descricao +
         '</option>'
      );
   });

   if (valorSalvo) {
      _aplicarValorCampo(select, valorSalvo);

      if (select.is("select") && select.val()) {
         select.trigger("change");
      }
   }
}

// APLICA UM VALOR EM UM CAMPO DO FORMULÁRIO, TRATANDO DIFERENÇAS ENTRE SELECTS E CAMPOS DE TEXTO
function _aplicarValorCampo($el, valor) {
   if (!$el || !$el.length) return;

   if ($el.is("select")) {
      $el.val(valor);
      return;
   }

   var texto = "";
   $el.children("option").each(function () {
      if (String($(this).attr("value")) === String(valor)) {
         texto = $(this).text();
         return false;
      }
   });
   $el.empty().text(texto || "");
}

// APLICA REGRAS ESPECÍFICAS DO CADASTRO ASSERTIVO, CONTROLANDO TIPOS, RESTRIÇÕES E PREENCHIMENTOS AUTOMÁTICOS
function aplicarRegrasCadastroAssertivo() {
   try {
      var atividade = Number($("#atividade").val() || 0);
      var modo = ($("#formMode").val() || "").toUpperCase();
      var ehPreenchimento = (atividade === ATIVIDADES.INICIO_0 ||
                             atividade === ATIVIDADES.INICIO ||
                             atividade === ATIVIDADES.CORRECAO) && modo !== "VIEW";

      var $tipo = $("#tipo");
      if (ehPreenchimento && $tipo.length) {
         var isCliente = ($("#classificacao").val() || "").trim() === "1";
         var ehFisica = ($("#categoria").val() || "").trim() === "F";

         _restringirOpcaoTipo($tipo, "005", isCliente); // CLIENTE
         _restringirOpcaoTipo($tipo, "020", ehFisica);  // RDO

         // Tipo fica livre para escolha em qualquer classificação, sem valor forçado.
         $tipo.removeClass("campo-bloqueado").removeAttr("data-bloqueado");
      }

      _forcarNaturezaAluguel();
      aplicarRegrasPfRdo();
   } catch (e) {
      console.warn("[regras] cadastro assertivo:", e);
   }
}

// PESSOA FÍSICA + RDO: fixa Contribuinte ICMS em "0" e Código de Receita IRRF em "0588", travados.
function aplicarRegrasPfRdo() {
   if (typeof ehModoView === "function" && ehModoView()) { return; }

   var ehFisica = ($("#categoria").val() || "").trim() === "F";
   var ehRDO = (typeof _ehTipoRDO === "function") && _ehTipoRDO();
   var $icms = $("#icms");
   var $irrf = $("#selectDescricaoIrrf");

   if (ehFisica && ehRDO) {
      // Contribuinte ICMS fixo em "0 - Não Contribuinte"
      if ($icms.length) {
         if (($icms.val() || "") !== "0") { $icms.val("0").trigger("change"); }
         $icms.addClass("campo-bloqueado").attr("data-bloqueado", "1");
      }
      // Código de Receita IRRF fixo em "0588 - PGTO PESSOA FÍSICA" (garante a opção caso o dataset não traga)
      if ($irrf.length) {
         if (!$irrf.find('option[value="0588"]').length) {
            $irrf.append('<option value="0588" data-aliquota="0">0588 — PGTO. PESSOA FÍSICA</option>');
         }
         if (($irrf.val() || "") !== "0588") { $irrf.val("0588").trigger("change"); }
         $irrf.addClass("campo-bloqueado").attr("data-bloqueado", "1");
         $("#hiddenCodIrrf").val("0588");
      }
   } else {
      $icms.removeClass("campo-bloqueado").removeAttr("data-bloqueado");
      $irrf.removeClass("campo-bloqueado").removeAttr("data-bloqueado");
   }
}

// CONTROLA A DISPONIBILIDADE DE OPÇÕES DO TIPO DE CADASTRO, ADICIONANDO OU REMOVENDO VALORES CONFORME AS REGRAS DO PROCESSO
function _restringirOpcaoTipo($tipo, cod, presente) {
   var $opt = $tipo.find('option[value="' + cod + '"]');
   var guard = $tipo.data("optTipo" + cod);

   if (presente) {
      if (!$opt.length && guard) {
         $tipo.append(guard);
         $tipo.removeData("optTipo" + cod);
      }
   } else if ($opt.length) {
      $tipo.data("optTipo" + cod, $opt.detach());
      if (($tipo.val() || "") === cod) {
         $tipo.val("").trigger("change");
      }
   }
}

// DEFINE AUTOMATICAMENTE A NATUREZA DE RENDIMENTO DE ALUGUEL QUANDO EXISTIR GRUPO DE MERCADORIA RELACIONADO
function _forcarNaturezaAluguel() {
   var $nat = $("#naturezaRendimento");
   if (!$nat.length) return;

   var temAluguel = false;
   $(".grupo-mercadoria").each(function () {
      if (/alugu/i.test($(this).val() || "")) temAluguel = true;
   });

   if (temAluguel && $nat.find('option[value="13002"]').length) {
      $nat.val("13002").addClass("campo-bloqueado").attr("data-bloqueado", "1");
      $("#codNaturezaRendimento").val("13002");
      $("#idNatRendimento").val($nat.find('option[value="13002"]').data("idnat") || "");
   } else if (!temAluguel) {
      $nat.removeClass("campo-bloqueado").removeAttr("data-bloqueado");
   }
}

// CARREGA AS NATUREZAS DE RENDIMENTO DO RM, POPULANDO O SELECT E SINCRONIZANDO OS CÓDIGOS AUXILIARES
function carregarNaturezaRendimento() {
   let select = $("#naturezaRendimento");
   let valorSalvo = (
      $("#codNaturezaRendimento").val() ||
      select.attr("value") ||
      select.val() ||
      ""
   ).toString().trim();

   select.find("option:not(:first)").remove();

   let itens = _parsearDataset(
      DatasetFactory.getDataset("naturezaRendimento", null, null, null),
      "naturezaRendimento"
   );

   if (!itens.length) return;

   itens.forEach(function (item) {
      let idNat = (item.IDNATRENDIMENTO    || "").toString().trim();
      let cod   = (item.CODNATRENDIMENTO   || "").toString().trim();
      let desc  = (item.DESCRICAORENDIMENTO|| "").toString().trim();
      if (cod) {
         select.append(
            '<option value="' + cod + '" data-idnat="' + idNat + '">' +
            cod + " — " + desc +
            "</option>"
         );
      }
   });

   if (valorSalvo) {
      _aplicarValorCampo(select, valorSalvo);
   }

   $("#codNaturezaRendimento").val(select.is("select") ? (select.val() || "") : valorSalvo);
   $("#idNatRendimento").val(
      select.find("option:selected").data("idnat") || ""
   );
}

// ARMAZENA EM CACHE A LISTA DE OPÇÕES DE IRRF PARA EVITAR CONSULTAS REPETIDAS AO DATASET
let _cacheIrrf = null;

// CARREGA AS OPÇÕES DE IRRF DO RM, FILTRANDO OS CÓDIGOS CONFORME O TIPO DE PESSOA CADASTRADA
function carregarOpcoesIrrf(preservarValor) {
   let pessoaTipo = ($("#categoria").val() || "").trim().toUpperCase();
   let select     = $("#selectDescricaoIrrf");

   let valorSalvo = preservarValor
      ? ($("#hiddenCodIrrf").val() || select.attr("value") || select.val() || "").trim()
      : "";

   if (!preservarValor) {
      select.val("");
      $("#irrf").val("");
   }

   if (_cacheIrrf !== null) {
      _popularSelectIrrf(_cacheIrrf, pessoaTipo, valorSalvo);
      return;
   }

   let itens = _parsearDataset(
      DatasetFactory.getDataset("ds_irrfRM", null, null, null),
      "ds_irrfRM"
   );

   if (!itens.length) return;

   _cacheIrrf = itens;
   _popularSelectIrrf(itens, pessoaTipo, valorSalvo);
}

// POPULA O SELECT DE IRRF COM AS OPÇÕES PERMITIDAS E ATUALIZA A ALÍQUOTA RELACIONADA AO CÓDIGO SELECIONADO
function _popularSelectIrrf(lista, pessoaTipo, valorSalvo) {
   let select = $("#selectDescricaoIrrf");
   select.find("option:not(:first)").remove();

   let codigosPermitidos = [];
   if (pessoaTipo === "F") {
      codigosPermitidos = ["0588", "3208", "0001"]; // 0588 = PGTO PESSOA FÍSICA (usado no RDO)
   } else if (pessoaTipo === "J") {
      codigosPermitidos = ["1708", "17081", "0001"];
   }

   for (const element of lista) {
      let item = element;

      let cod  = String(item.codreceita   || item.CODRECEITA    || "").trim();
      let desc = String(item.descricao    || item.DESCRICAO     || "").trim();
      let aliq = String(item.aliquota     || item.ALIQUOTA      || "0").trim();

      if (!cod) continue;

      if (codigosPermitidos.length && codigosPermitidos.indexOf(cod) === -1) continue;

      let opt = $("<option></option>")
         .val(cod)
         .text(cod + " — " + desc)
         .attr("data-aliquota", aliq);
      select.append(opt);
   }

   if (valorSalvo) {
      _aplicarValorCampo(select, valorSalvo);
      let selecionado = select.find("option:selected");
      if (selecionado.length && selecionado.val()) {
         $("#irrf").val(selecionado.attr("data-aliquota") || "");
      }
   }

   $("#hiddenCodIrrf").val(select.is("select") ? (select.val() || "") : valorSalvo);
}

// ARMAZENA EM CACHE A LISTA DE PAÍSES CARREGADOS DO RM PARA REUTILIZAÇÃO SEM NOVAS CONSULTAS
let _cacheListaPaises = null;

// CARREGA OS PAÍSES ESTRANGEIROS DO RM, UTILIZANDO CACHE QUANDO OS DADOS JÁ ESTIVEREM DISPONÍVEIS
function carregarPaisesEstrangeiros() {
   if (_cacheListaPaises !== null) {
      _popularSelectPaises(_cacheListaPaises);
      return;
   }

   let itens = _parsearDataset(
      DatasetFactory.getDataset("ds_paisRM", null, null, null),
      "ds_paisRM"
   );

   if (!itens.length) return;

   _cacheListaPaises = itens;
   _popularSelectPaises(itens);
}

// POPULA O SELECT DE PAÍSES ESTRANGEIROS COM OS DADOS RETORNADOS PELO DATASET
function _popularSelectPaises(paises) {
   let select = $("#selectPaisEstrangeiro");
   let valorSalvo = ($("#pais").val() || "").trim();

   select.empty().append('<option value="">Selecione o país...</option>');

   paises.forEach(function (item) {
      let nome = (item.NOMEPAI || "").toString().trim();
      if (!nome) return;
      select.append('<option value="' + nome + '">' + nome + "</option>");
   });

   if (valorSalvo && valorSalvo !== "Brasil") {
      select.val(valorSalvo);
   }
}

// ARMAZENA A LISTA DE ESTADOS DO RM EM CACHE PARA EVITAR CONSULTAS REPETIDAS AO DATASET
let _listaEstadosRM    = null;

// ARMAZENA OS MUNICÍPIOS CONSULTADOS POR UF, EVITANDO NOVAS BUSCAS PARA OS MESMOS DADOS
let _cacheMunicipiosRM = {}; 

// NORMALIZA TEXTOS PARA COMPARAÇÃO, REMOVENDO ACENTOS E DIFERENÇAS DE FORMATAÇÃO
function _normalizarTexto(str) {
   return (str || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
}

// CARREGA OS ESTADOS DO RM, TRANSFORMANDO O RETORNO DO DATASET EM UMA LISTA UTILIZÁVEL PELO FORMULÁRIO
function carregarEstadosRM() {
   if (_listaEstadosRM !== null) return _listaEstadosRM;
   try {

      let itens = _parsearDataset(
         DatasetFactory.getDataset("ds_estadoRM", null, null, null),
         "ds_estadoRM"
      );
      let lista = [];
      for (let i = 0; i < itens.length; i++) {
         let row    = itens[i];
         let codetd = (row.CODETD || row.codetd || "").toString().trim();
         let nome   = (row.NOME   || row.nome   || "").toString().trim();
         if (codetd) lista.push({ codetd: codetd, nome: nome });
      }

      if (lista.length > 0) 
         console.log("[RM-ESTADO] Primeira linha:", lista[0]);
      _listaEstadosRM = lista;
      } catch (e) {
         console.error("[RM-ESTADO] ERRO ao carregar estados:", e);
         _listaEstadosRM = [];
      }
      return _listaEstadosRM;
}

// POPULA O CAMPO DE ESTADO COM OS DADOS RETORNADOS DO RM, RESTAURANDO VALORES JÁ SALVOS QUANDO EXISTIREM
function popularSelectEstado() {
   let lista = carregarEstadosRM();
   let $sel  = $("#estado");
   let salvo = $sel.attr("value") || $sel.val();

   $sel.empty().append('<option value="">Selecione o estado...</option>');
   lista.forEach(function (item) {
      $('<option></option>')
         .val(item.codetd)
         .text(item.nome + " (" + item.codetd + ")")
         .appendTo($sel);
   });

   if (salvo) {
      $sel.val(salvo);
      if (!$sel.val()) {
         console.warn("[Estado] Valor salvo '" + salvo + "' não encontrado nas opções.");
      }
   }
}

// CARREGA OS MUNICÍPIOS DO RM CONFORME A UF INFORMADA, UTILIZANDO CACHE PARA OTIMIZAR AS CONSULTAS
function carregarMunicipiosPorUF(uf) {
   if (!uf) return [];
   if (_cacheMunicipiosRM[uf] !== undefined) {
      return _cacheMunicipiosRM[uf];
   }
   try {
    
      let MUST = (typeof ConstraintType === "undefined") ? 1 : ConstraintType.MUST;
      let constraints = [
         DatasetFactory.createConstraint("CODETDMUNICIPIO", uf, uf, MUST)
      ];
      let itens = _parsearDataset(
         DatasetFactory.getDataset("ds_municipioRM", null, constraints, null),
         "ds_municipioRM"
      );
      let lista = [];
      for (let i = 0; i < itens.length; i++) {
         let row  = itens[i];
         let cod  = (row.CODMUNICIPIO    || row.codmunicipio    || "").toString().trim();
         let ufR  = (row.CODETDMUNICIPIO || row.codetdmunicipio || "").toString().trim();
         let nome = (row.NOMEMUNICIPIO   || row.nomemunicipio   || "").toString().trim();
         if (i === 0) console.log("[RM-MUNICIPIO] row[0]:", JSON.stringify(row), "→ cod:", cod, "nome:", nome);
         if (cod || nome) lista.push({ cod: cod, uf: ufR, nome: nome });
      }

      if (lista.length > 0) console.log("[RM-MUNICIPIO] Primeiro município:", lista[0]);
      _cacheMunicipiosRM[uf] = lista;
   } catch (e) {
      console.error("[RM-MUNICIPIO] ERRO para UF=" + uf + ":", e);
      _cacheMunicipiosRM[uf] = [];
   }
   return _cacheMunicipiosRM[uf];
}

// POPULA O CAMPO DE CIDADE CONFORME O ESTADO SELECIONADO, ASSOCIANDO O CÓDIGO DO MUNICÍPIO AO CAMPO AUXILIAR
function popularSelectMunicipio(uf) {
   let $sel  = $("#cidade");
   let salvo = $sel.attr("value") || $sel.val();

   $sel.empty().append('<option value="">Selecione a cidade...</option>');
   $("#codMunicipio").val("");

   if (!uf) return;

   let lista = carregarMunicipiosPorUF(uf);
   lista.forEach(function (item) {
      $('<option></option>')
         .val(item.nome)
         .data("cod", item.cod)
         .text(item.nome)
         .appendTo($sel);
   });

   if (salvo) {
      $sel.val(salvo);
      let $opt = $sel.find("option:selected");
      if ($opt.val()) $("#codMunicipio").val($opt.data("cod") || "");
   }
}

// PREENCHE O ENDEREÇO PELOS DADOS DO RM, LOCALIZANDO ESTADO E MUNICÍPIO E ATUALIZANDO OS CAMPOS RELACIONADOS
function preencherEnderecoRM(uf, nomeCidade) {
   console.log("[RM-ENDERECO] preencherEnderecoRM chamado — uf:", uf, "| cidade:", nomeCidade);

   let qtdEstados = $("#estado option").length;
   if (qtdEstados <= 1) {
      popularSelectEstado();
   }

   if (uf) {
      $("#estado").val(uf);

      $("#hiddenEstadoValor").val(uf);
      let estadoSetado = $("#estado").val();
     
      if (!estadoSetado) {
         console.warn("[RM-ENDERECO] ATENÇÃO: valor '" + uf + "' não encontrado nas opções do select #estado.");
         console.log("[RM-ENDERECO] Opções disponíveis:", $("#estado option").map(function(){ return $(this).val(); }).get());
      }
      popularSelectMunicipio(uf);
      limparErroCampo("estado");
   }

   if (nomeCidade) {
      let $selCidade  = $("#cidade");
      let alvo        = _normalizarTexto(nomeCidade);
      let nomeAchado  = "";
      let codAchado   = "";
      let totalOpcoes = $selCidade.find("option").length;

      $selCidade.find("option").each(function () {
         if (_normalizarTexto($(this).text()) === alvo) {
            nomeAchado = $(this).val();
            codAchado  = $(this).data("cod") || "";
            return false;
         }
      });

      if (!nomeAchado) {
         console.log("[RM-ENDERECO] Match exato não encontrado — tentando match parcial...");
         $selCidade.find("option").each(function () {
            let t = _normalizarTexto($(this).text());
            if (t.includes(alvo) || alvo.includes(t)) {
               nomeAchado = $(this).val();
               codAchado  = $(this).data("cod") || "";
               return false;
            }
         });
      }

      if (nomeAchado) {
         console.log("[RM-ENDERECO] Cidade encontrada:", nomeAchado, "| CODMUNICIPIO:", codAchado);
      } else {
         console.warn("[RM-ENDERECO] CIDADE NÃO ENCONTRADA para '" + nomeCidade + "'. Primeiras 5 opções do select:",
            $selCidade.find("option").slice(0, 5).map(function(){ return $(this).text(); }).get()
         );
      }

      $selCidade.val(nomeAchado);
      if (nomeAchado) {
         $("#codMunicipio").val(codAchado);
         $("#nomeCidadeSalva").val(nomeAchado);
         limparErroCampo("cidade");
      }

   }

}

// RESTAURA OS DADOS DE ENDEREÇO SALVOS NOS CAMPOS AUXILIARES APÓS O CARREGAMENTO DO FORMULÁRIO
function restaurarEnderecoRM() {

   let uf = (
      $("#hiddenEstadoValor").val() ||
      $("#estado").val()            ||
      ""
   ).trim();

   let nomeSalvo = ($("#nomeCidadeSalva").val() || "").trim();

   if (!uf) return; 

   if (!$("#estado").val()) {
      $("#estado").val(uf);
   }

   popularSelectMunicipio(uf);

   if (nomeSalvo) {
      $("#cidade").val(nomeSalvo);
      let $opt = $("#cidade").find("option:selected");
      if ($opt.val()) {
         $("#codMunicipio").val($opt.data("cod") || "");
      }
   }
}

// CONTROLA O LIMITE MÁXIMO DE CONTAS BANCÁRIAS PERMITIDAS NO FORMULÁRIO
let LIMITE_CONTAS_BANCARIAS = 5;

// ARMAZENA A LISTA DE BANCOS DO RM EM CACHE PARA REUTILIZAÇÃO DOS DADOS
let _listaBancosRM = null;

// CARREGA A LISTA DE BANCOS DO RM, CONVERTENDO OS DADOS DO DATASET PARA O FORMATO UTILIZADO PELO FORMULÁRIO
function carregarBancosRM() {
   if (_listaBancosRM !== null) return _listaBancosRM;
   _listaBancosRM = [];
   try {
      let itens = _parsearDataset(
         DatasetFactory.getDataset("ds_bancoRM", null, null, null),
         "ds_bancoRM"
      );
      itens.forEach(function (item) {
         let cod  = (item.NUMBANCO || "").toString().trim();
         let nome = (item.NOME    || "").toString().trim();
         if (cod || nome) {
            _listaBancosRM.push({ cod: cod, nome: nome });
         }
      });
   } catch (e) {
      console.warn("Erro ao carregar ds_bancoRM:", e);
   }
   return _listaBancosRM;
}

// GERA AS OPÇÕES HTML DO SELECT DE BANCOS UTILIZANDO OS DADOS CARREGADOS DO RM
function _gerarOptionsBanco() {
   let bancos = carregarBancosRM();
   let html = '<option value="">Selecione o banco...</option>';
   bancos.forEach(function (b) {
      let nomeEsc = b.nome.replaceAll('"', "&quot;");
      html += '<option value="' + b.cod + '" data-nome="' + nomeEsc + '">' + b.nome + "</option>";
   });
   return html;
}

// ARMAZENA OS GRUPOS DE MERCADORIA DO RM EM CACHE PARA EVITAR CONSULTAS DESNECESSÁRIAS
let _listaGruposMercadoria = null;

// CARREGA OS GRUPOS DE MERCADORIA DO RM, PREPARANDO OS DADOS PARA UTILIZAÇÃO NOS CAMPOS SELECT
function carregarGruposMercadoria() {
   if (_listaGruposMercadoria !== null) return _listaGruposMercadoria;
   _listaGruposMercadoria = [];
   try {
      let itens = _parsearDataset(
         DatasetFactory.getDataset("ds_grupoMercadoriaRM", null, null, null),
         "ds_grupoMercadoriaRM"
      );
      itens.forEach(function (item) {
         let desc = (item.DESCRICAO || "").toString().trim();
         if (desc) {
            _listaGruposMercadoria.push({ desc: desc });
         }
      });
   } catch (e) {
      console.warn("Erro ao carregar ds_grupoMercadoriaRM:", e);
   }
   return _listaGruposMercadoria;
}

// ATUALIZA OS SELECTS DE GRUPO DE MERCADORIA COM AS OPÇÕES DISPONÍVEIS NO RM, MANTENDO VALORES JÁ SELECIONADOS
function popularSelectsGrupoMercadoria() {
   const optsHtml = _gerarOptionsGrupoMercadoria();

   $(".grupo-mercadoria").each(function () {
      let valorAtual = $(this).attr("value") || $(this).val();
      $(this).empty().append(optsHtml);
      if (valorAtual) $(this).val(valorAtual);
   });
}

// GERA AS OPÇÕES HTML DOS GRUPOS DE MERCADORIA PARA OS CAMPOS DINÂMICOS DO FORMULÁRIO
function _gerarOptionsGrupoMercadoria(valorSalvo) {
   let grupos = carregarGruposMercadoria();
   let html = '<option value="">Selecione...</option>';
   grupos.forEach(function (g) {
      let sel = (valorSalvo && valorSalvo === g.desc) ? ' selected' : '';
      html += '<option value="' + g.desc + '"' + sel + '>' + g.desc + "</option>";
   });
   return html;
}

// RETORNA O SUFIXO UTILIZADO NOS CAMPOS DE CONTAS BANCÁRIAS CONFORME A NUMERAÇÃO DO CARD
function _sufixoBancario(numero) {
   return numero === 1 ? "" : String(numero);
}

// GERA O HTML DO CARD DE CONTA BANCÁRIA, CRIANDO OS CAMPOS NECESSÁRIOS CONFORME A POSIÇÃO DA CONTA
function _gerarHtmlCardBancario(numero) {
   let s = _sufixoBancario(numero);
   let btnRemover = numero === 1
      ? ""
      : '<button type="button" class="btn-remove-bank" data-numero="' + numero + '">Remover</button>';

   let optsBanco = _gerarOptionsBanco();

   return (
      '<div class="bank-card" id="bank-card-' + numero + '">' +
      '<div class="bank-card-head">' +
      '<span class="bank-card-title">Conta Bancária ' + numero + '</span>' +
      btnRemover +
      '</div>' +
      '<div class="grid g3">' +

      // NOME DO BANCO
      '<div class="fg span2"><label for="selectBancoNome' + s + '">Nome do Banco</label>' +
      '<div class="select-wrap">' +
      '<select id="selectBancoNome' + s + '" class="form-control banco-select">' + optsBanco + '</select>' +
      '</div>' +
  
      '<input type="hidden" id="banco' + s + '" name="banco' + s + '" class="banco-cod">' +
      '<input type="hidden" id="bancoDescricao' + s + '" name="bancoDescricao' + s + '" class="banco-descricao">' +
      '</div>' +

      // CÓDIGO DO BANCO 
      '<div class="fg"><label>Código do Banco</label>' +
      '<input type="text" id="bancoCodExibicao' + s + '" class="form-control" placeholder="000" readonly></div>' +

      // AGÊNCIA
      '<div class="fg"><label for="agencia' + s + '">Agência</label>' +
      '<input type="text" id="agencia' + s + '" name="agencia' + s + '" class="form-control banco-agencia" placeholder="0000-0"></div>' +

      // CONTA
      '<div class="fg"><label for="conta' + s + '">Conta</label>' +
      '<input type="text" id="conta' + s + '" name="conta' + s + '" class="form-control banco-conta" placeholder="00000-0"></div>' +

      '</div></div>'
   );
}

// INICIALIZA OS CARDS DE CONTAS BANCÁRIAS, RESTAURANDO DADOS SALVOS E PREPARANDO OS CONTROLES DA SEÇÃO
function inicializarDadosBancarios() {
   let $wrap = $("#dados-bancarios-cards");
   let dadosSalvos = [];
   for (let i = 1; i <= LIMITE_CONTAS_BANCARIAS; i++) {
      let cod     = ($("#hiddenBanco" + i + "Cod"     ).val() || "").trim();
      let agencia = ($("#hiddenBanco" + i + "Agencia" ).val() || "").trim();
      let conta   = ($("#hiddenBanco" + i + "Conta"   ).val() || "").trim();

      if (cod || agencia || conta) {
         dadosSalvos.push({
            cod:      cod,
            desc:     ($("#hiddenBanco" + i + "Desc"    ).val() || "").trim(),
            agencia:  agencia,
            conta:    conta
         });
      }
   }
   
   if (!dadosSalvos.length) {
      $("#tableDadosBancarios tbody tr").each(function () {
         let cod     = ($(this).find(".dbBanco"  ).val() || "").trim();
         let agencia = ($(this).find(".dbAgencia").val() || "").trim();
         let conta   = ($(this).find(".dbConta"  ).val() || "").trim();
         if (cod || agencia || conta) {
            dadosSalvos.push({
               cod:      cod,
               desc:     ($(this).find(".dbBancoDescricao"   ).val() || "").trim(),
               agencia:  agencia,
               conta:    conta
            });
         }
      });
   }

   $wrap.empty();

   if (dadosSalvos.length) {
      dadosSalvos.forEach(function (d, index) {
         let numero = index + 1;
         $wrap.append(_gerarHtmlCardBancario(numero));
         let s = _sufixoBancario(numero);
         let $selectBanco = $("#selectBancoNome" + s);
         if (d.cod) {
            $selectBanco.val(d.cod);
         }
         if (!$selectBanco.val() && d.desc) {
            $selectBanco.find("option").each(function () {
               let texto = $(this).text();
               if (texto.includes(d.desc)) {
                  $selectBanco.val($(this).val());
                  return false;
               }
            });
         }
         let codRestaurado  = $selectBanco.val() || d.cod;
         let descRestaurado = $selectBanco.find("option:selected").data("nome") || d.desc;
         $("#banco"          + s).val(codRestaurado);
         $("#bancoDescricao" + s).val(descRestaurado);
         $("#bancoCodExibicao" + s).val(codRestaurado);

         let agencia = d.agencia;
         let conta   = d.conta;
         if (/^\d{5}$/.test(agencia)) agencia = agencia.slice(0, 4) + "-" + agencia[4];
         if (/^\d{2,}$/.test(conta))  conta   = conta.slice(0, -1)  + "-" + conta.slice(-1);

         $("#agencia" + s).val(agencia);
         $("#conta"   + s).val(conta);
      });
   } else {
      $wrap.append(_gerarHtmlCardBancario(1));
   }

   controlarBotaoAdicionarConta();
   atualizarCamposBancariosRm();
}

// ADICIONA UMA NOVA CONTA BANCÁRIA, VALIDANDO O LIMITE PERMITIDO E ATUALIZANDO OS CAMPOS AUXILIARES
function adicionarContaBancaria() {
   let $wrap = $("#dados-bancarios-cards");
   let quantidade = $wrap.find(".bank-card").length;

   if (quantidade >= LIMITE_CONTAS_BANCARIAS) {
      FLUIGC.toast({
         title: "Atenção",
         message: "Máximo de " + LIMITE_CONTAS_BANCARIAS + " contas bancárias.",
         type: "warning"
      });
      return;
   }

   $wrap.append(_gerarHtmlCardBancario(quantidade + 1));

   sincronizarTabelaBancaria();
   controlarBotaoAdicionarConta();
}

// REMOVE UMA CONTA BANCÁRIA PELO ÍNDICE INFORMADO, REORDENANDO OS CARDS E SINCRONIZANDO OS DADOS
function removerContaBancaria(numero) {
   $("#bank-card-" + numero).remove();
   _reordenarCardsBancarios();
   sincronizarTabelaBancaria();
   controlarBotaoAdicionarConta();
}

// REORDENA OS CARDS DE CONTAS BANCÁRIAS, ATUALIZANDO IDS, NAMES E IDENTIFICAÇÕES DOS CAMPOS DINÂMICOS
function _reordenarCardsBancarios() {
   $("#dados-bancarios-cards .bank-card").each(function (index) {
      let numero = index + 1;
      let s = _sufixoBancario(numero);

      $(this).attr("id", "bank-card-" + numero);
      $(this).find(".bank-card-title").text("Conta Bancária " + numero);
      $(this).find(".btn-remove-bank").data("numero", numero).attr("data-numero", numero);

      $(this).find(".banco-cod")      .attr("id", "banco"             + s).attr("name", "banco"             + s);
      $(this).find(".banco-descricao").attr("id", "bancoDescricao"    + s).attr("name", "bancoDescricao"    + s);
      $(this).find(".banco-agencia")  .attr("id", "agencia"           + s).attr("name", "agencia"           + s);
      $(this).find(".banco-conta")    .attr("id", "conta"             + s).attr("name", "conta"             + s);

      if (numero === 1) {
         $(this).find(".btn-remove-bank").remove();
      }
   });
}

// SINCRONIZA OS DADOS DOS CARDS BANCÁRIOS COM A TABELA AUXILIAR E OS CAMPOS HIDDEN DO FLUIG
function sincronizarTabelaBancaria() {
   let $tbody = $("#tableDadosBancarios tbody");

   $tbody.find("tr").remove();

   $("#dados-bancarios-cards .bank-card").each(function (index) {
      let numero = index + 1;
      let s = _sufixoBancario(numero);

      let banco     = ($("#banco"             + s).val() || "").trim();
      let bancoDesc = ($("#bancoDescricao"    + s).val() || "").trim();
      let agencia   = ($("#agencia"           + s).val() || "").replace(/\D/g, "");
      let conta     = ($("#conta"             + s).val() || "").replace(/\D/g, "");

      $tbody.append(
         "<tr>" +
         '<td><input type="hidden" name="dbBanco"             class="dbBanco"             value="' + banco     + '"></td>' +
         '<td><input type="hidden" name="dbBancoDescricao"    class="dbBancoDescricao"    value="' + bancoDesc + '"></td>' +
         '<td><input type="hidden" name="dbAgencia"           class="dbAgencia"           value="' + agencia   + '"></td>' +
         '<td><input type="hidden" name="dbConta"             class="dbConta"             value="' + conta     + '"></td>' +
         "</tr>"
      );

      if (numero <= LIMITE_CONTAS_BANCARIAS) {
         $("#hiddenBanco" + numero + "Cod"     ).val(banco);
         $("#hiddenBanco" + numero + "Desc"    ).val(bancoDesc);
         $("#hiddenBanco" + numero + "Agencia" ).val(agencia);
         $("#hiddenBanco" + numero + "Conta"   ).val(conta);
      }
   });

   let usados = $("#dados-bancarios-cards .bank-card").length;
   for (let i = usados + 1; i <= LIMITE_CONTAS_BANCARIAS; i++) {
      $("#hiddenBanco" + i + "Cod"     ).val("");
      $("#hiddenBanco" + i + "Desc"    ).val("");
      $("#hiddenBanco" + i + "Agencia" ).val("");
      $("#hiddenBanco" + i + "Conta"   ).val("");
   }

   atualizarCamposBancariosRm();
}

// SINCRONIZA OS DADOS DE CNAES E GRUPOS DE MERCADORIA COM AS TABELAS UTILIZADAS NOS RELATÓRIOS DO PROCESSO
function sincronizarTabelasRelatorio() {
   
   let $cnaeTbody    = $("#tbRelCnaes tbody");
   let $cnaeTemplate = $cnaeTbody.find("tr:first").clone();
   $cnaeTbody.empty();

   let cnaePrincipalVal = ($("#cnaePrincipal").val() || "").trim();
   if (cnaePrincipalVal) {
      let $rowP = $cnaeTemplate.clone();
      $rowP.find(".relCnaeTipo").val("P");
      $rowP.find(".relCnaeCodigo").val(cnaePrincipalVal.split(" ")[0] || cnaePrincipalVal);
      $rowP.find(".relCnaeDescricao").val(cnaePrincipalVal);
      $cnaeTbody.append($rowP);
   }

   for (let ci = 1; ci <= 5; ci++) {
      let cnaeSecVal = ($("#hiddenCnaeSecundario" + ci).val() || "").trim();
      if (cnaeSecVal) {
         let $rowS = $cnaeTemplate.clone();
         $rowS.find(".relCnaeTipo").val("S");
         $rowS.find(".relCnaeCodigo").val(cnaeSecVal.split(" ")[0] || cnaeSecVal);
         $rowS.find(".relCnaeDescricao").val(cnaeSecVal);
         $cnaeTbody.append($rowS);
      }
   }

   if ($cnaeTbody.find("tr").length === 0) {
      $cnaeTbody.append($cnaeTemplate);
   }

   let $gmTbody    = $("#tbRelGrupos tbody");
   let $gmTemplate = $gmTbody.find("tr:first").clone();
   $gmTbody.empty();

   for (let gi = 1; gi <= 10; gi++) {
      let gmVal = ($("#hiddenGrupoMercadoria" + gi).val() || "").trim();
      if (gmVal) {
         let $rowG = $gmTemplate.clone();
         $rowG.find(".relGmSeq").val(gi);
         $rowG.find(".relGmDescricao").val(gmVal);
         $gmTbody.append($rowG);
      }
   }

   if ($gmTbody.find("tr").length === 0) {
      $gmTbody.append($gmTemplate);
   }
}

// CONTROLA A DISPONIBILIDADE DO BOTÃO DE ADICIONAR CONTA BANCÁRIA CONFORME A QUANTIDADE ATUAL E O LIMITE DEFINIDO
function controlarBotaoAdicionarConta() {
   const total = $("#dados-bancarios-cards .bank-card").length;
   _controlarBotaoAdicionar(total, LIMITE_CONTAS_BANCARIAS, $("#btn-add-conta-bancaria"));
}


// BEFORE SEND VALIDATE
globalThis.beforeSendValidate = function (numState, nextState) {
   $("#tipoSelecionado").val($("#tipo").val() || "");
   $("#tipoDescricao").val($("#tipo option:selected").text() || "");

   sincronizarCamposDinamicosHidden();
   sincronizarTabelaBancaria();
   sincronizarTabelasRelatorio();

   let acao = "";

   if (numState == 0 || numState == 4) acao = "inicio";
   else if (numState == 11) acao = "validacao";
   else if (numState == 27) acao = "correcao";
   else if (numState == 16) acao = "integracao";

   function valor(campo) {
      const el = document.getElementsByName(campo)[0] || document.getElementById(campo);
      return el ? String(el.value || "").trim() : "";
   }

   let valido = true;
   let primeiroStepComErro = null;
   const isCliente = valor("classificacao") === "1";

   function _validarTodasEtapas() {
      goToStep(1, false);
      abrirDadosComerciais();
      if (!validarPreCadastro()) {
         valido = false;
         if (primeiroStepComErro === null) primeiroStepComErro = 1;
      }
      goToStep(2, false);
      if (!validarDadosCadastrais()) {
         valido = false;
         if (primeiroStepComErro === null) primeiroStepComErro = 2;
      }
      if (!isCliente) {
         goToStep(3, false);
         if (!validarDocumentacao()) {
            valido = false;
            if (primeiroStepComErro === null) primeiroStepComErro = 3;
         }
      }
   }

   if (acao == "inicio" || acao == "correcao") {
      _validarTodasEtapas();
   }

   if (acao == "validacao") {

      const decisao = valor("selectDecisao");
      var erroDecisao = false;

      if (!validarCampoObrigatorio("observacaoValidacao", "Observações")) { valido = false; erroDecisao = true; }
      if (!validarCampoObrigatorio("selectDecisao", "Ação")) { valido = false; erroDecisao = true; }

      if (decisao && decisao != "enviarRm" && decisao != "Correcao") {
         exibirErroCampo("selectDecisao", "Selecione uma ação: Aprovar (Enviar ao RM) ou Reprovar (Correção).");
         valido = false;
         erroDecisao = true;
      }

      if (decisao === "enviarRm") {
         _validarTodasEtapas();
      }

      if (erroDecisao && primeiroStepComErro === null) {
         primeiroStepComErro = 4;
      }
   }

   if (!valido) {

      if (primeiroStepComErro !== null) {
         goToStep(primeiroStepComErro, false);
      }
      focusCampoComErro();
      return false;
   }

   goToStep(1, false);
   return true;
};