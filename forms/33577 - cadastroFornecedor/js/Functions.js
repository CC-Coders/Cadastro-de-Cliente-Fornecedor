
// GRUPO DE MERCADORIA 
function obterOpcoesGrupoMercadoria() {
    const opcoesHtml = OPCOES_GRUPO_MERCADORIA.map(function(opcao) {
        return `<option value="${opcao}">${opcao}</option>`;
    }).join("");

    return `<option value="">Selecione...</option>${opcoesHtml}`;
}
function adicionarGrupoMercadoria() {
    const $wrap = $("#grupo-mercadoria-wrap");
    const quantidadeTotal = 1 + $wrap.find(".grupo-mercadoria-item").length;

    if (quantidadeTotal >= LIMITE_GRUPO_MERCADORIA) {
        FLUIGC.toast({
            title: "Atenção",
            message: "Você pode adicionar no máximo 5 grupos de mercadoria.",
            type: "warning"
        });
        return;
    }
    const numero = quantidadeTotal + 1;
    const html = `
    <div class="grid g3 grupo-mercadoria-item" id="grupo-mercadoria-item-${numero}">
      <div class="fg span2">
        <label for="grupoMercadoria${numero}">Grupo de Mercadoria ${numero}</label>
        <div class="select-wrap">
          <select
            id="grupoMercadoria${numero}"
            name="grupoMercadoria${numero}"
            class="form-control grupo-mercadoria"
          >
            ${obterOpcoesGrupoMercadoria()}
          </select>
        </div>
      </div>

      <div class="fg" style="align-self:flex-end;">
        <button type="button" class="btn btn-danger btn-remove-grupo-mercadoria">
          Remover
        </button>
      </div>
    </div>
  `;
    $wrap.append(html);
    controlarBotaoAdicionarGrupoMercadoria();
}
function reordenarGruposMercadoria() {
    // index + 2 porque o item fixo do HTML é o "Grupo de Mercadoria 1"
    $("#grupo-mercadoria-wrap .grupo-mercadoria-item").each(function(index) {
        const numero = index + 2;

        $(this).attr("id", "grupo-mercadoria-item-" + numero);

        $(this).find("label")
            .attr("for", "grupoMercadoria" + numero)
            .text("Grupo de Mercadoria " + numero);

        $(this).find("select")
            .attr("id", "grupoMercadoria" + numero)
            .attr("name", "grupoMercadoria" + numero);
    });
}
function controlarBotaoAdicionarGrupoMercadoria() {
    const quantidadeTotal = 1 + $("#grupo-mercadoria-wrap .grupo-mercadoria-item").length;
    const $botao = $("#btn-add-grupo-mercadoria");

    if (quantidadeTotal >= LIMITE_GRUPO_MERCADORIA) {
        $botao.prop("disabled", true).addClass("disabled");
    } else {
        $botao.prop("disabled", false).removeClass("disabled");
    }
}


// CNAE 
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
    <div class="grid g3 cnae-secundario-item" id="cnae-secundario-${numero}" style="margin-bottom:12px;">
      <div class="fg span2">
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
}
function reordenarCnaesSecundarios() {
    $("#cnae-secundarios-wrap .cnae-secundario-item").each(function(index) {
        const numero = index + 1;

        $(this).attr("id", "cnae-secundario-" + numero);
        $(this).find("label")
            .attr("for", "cnaeSecundario" + numero)
            .text("CNAE Secundário " + numero);
        $(this).find("input")
            .attr("id", "cnaeSecundario" + numero)
            .attr("name", "cnaeSecundario" + numero);
    });
}
function controlarBotaoAdicionarCnae() {
    const quantidadeAtual = $("#cnae-secundarios-wrap .cnae-secundario-item").length;
    const $botao = $("#btn-add-cnae");

    if (quantidadeAtual >= LIMITE_CNAE_SECUNDARIO) {
        $botao.prop("disabled", true).addClass("disabled");
    } else {
        $botao.prop("disabled", false).removeClass("disabled");
    }
}


// HISTORICO E DECISÃO
async function asyncMontaHistorico() {
    $("#divLinhasHistorico").empty();

    var linhasHistorico = getLinhasHistorico();
    linhasHistorico = linhasHistorico.reverse();

    for (const linha of linhasHistorico) {
        var html = geraHtmlHistorico(linha);

        $("#divLinhasHistorico").append(html);

        try {
            $(".divImageUser:last").append(await promiseBuscaImagemUsuario(linha.USUARIO));
        } catch (erro) {
            console.warn("Não foi possível carregar imagem do usuário:", linha.USUARIO, erro);
        }
    }
}
function getLinhasHistorico() {
    var retorno = [];
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
    var DATA = linha.DATA ? linha.DATA.split(" ") : ["", ""];
    const textoObs = (linha.OBSERVACAO || "")
  .replace(/^(<br\s*\/?>|\s)*/gi, "")
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

  if (possuiHistorico) {
    $("#nav-step-HistoricoDecisao").show();
    $("#divDivisaoHistorico").show();

    $(".stepper").removeClass("stepper-3").addClass("stepper-4");

    $("#divLinhasHistorico").empty();
    asyncMontaHistorico();
  } else {
    $("#nav-step-HistoricoDecisao").hide();
    $("#divDivisaoHistorico").hide();

    $(".stepper").removeClass("stepper-4").addClass("stepper-3");
  }

  atualizarSetas();
}


// MASCARAS
function inicializarMascaras() {
    $("#docCpf").mask("000.000.000-00");
    $("#docCnpj").mask("00.000.000/0000-00");
    $("#docRg").mask("00.000.000-0");
    $("#docInscricaoEstadual").mask("00000000000000");
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
  $("#agencia").on("input", function () {
    let valor = $(this).val().replaceAll(/\D/g, "").slice(0, 5);

    if (valor.length > 4) {
      valor = valor.replace(/^(\d{4})(\d)$/, "$1-$2");
    }

    $(this).val(valor);
    atualizarCamposBancariosRm();
  });

  $("#conta").on("input", function () {
    let valor = $(this).val().replaceAll(/\D/g, "").slice(0, 6);

    if (valor.length > 1) {
      valor = valor.replace(/(\d+)(\d)$/, "$1-$2");
    }

    $(this).val(valor);
    atualizarCamposBancariosRm();
  });
}
function atualizarCamposBancariosRm() {
  $("#agenciaRm").val(($("#agencia").val() || "").replaceAll(/\D/g, ""));
  $("#contaRm").val(($("#conta").val() || "").replaceAll(/\D/g, ""));
}


// EDIÇÃO NA VALIDAÇÃO
const CAMPOS_AUDITORIA_EDICAO = [
  { id: "classificacao", label: "Classificação" },
  { id: "categoria", label: "Categoria" },
  { id: "tipo", label: "Tipo" },
  { id: "classificacaoOperacional", label: "Classificação Operacional" },
  { id: "toggleEstrangeiro", label: "Fornecedor estrangeiro?", tipo: "checkbox" },

  { id: "docCpf", label: "CPF" },
  { id: "docCnpj", label: "CNPJ" },
  { id: "docRg", label: "RG" },
  { id: "docInscricaoEstadual", label: "Inscrição Estadual" },

  { id: "razaoSocial", label: "Razão Social / Nome" },
  { id: "cep", label: "CEP" },
  { id: "endereco", label: "Endereço" },
  { id: "numero", label: "Número" },
  { id: "complemento", label: "Complemento" },
  { id: "bairro", label: "Bairro" },
  { id: "cidade", label: "Cidade" },
  { id: "pais", label: "País" },
  { id: "estado", label: "Estado" },

  { id: "icms", label: "Contribuinte ICMS" },
  { id: "irrf", label: "Alíquota IRRF" },
  { id: "simplesNacional", label: "Simples Nacional" },
  { id: "naturezaRendimento", label: "Natureza de Rendimentos" },
  { id: "regimeFiscal", label: "Regime Fiscal" },
  { id: "tipoDocEmitido", label: "Tipo de Documento Emitido" },

  { id: "moeda", label: "Moeda do Pedido" },
  { id: "grupoMercadoria1", label: "Grupo de Mercadoria 1" },
  { id: "grupoMercadoria2", label: "Grupo de Mercadoria 2" },
  { id: "grupoMercadoria3", label: "Grupo de Mercadoria 3" },
  { id: "grupoMercadoria4", label: "Grupo de Mercadoria 4" },

  { id: "cnaePrincipal", label: "CNAE Principal" },
  { id: "cnaeSecundario1", label: "CNAE Secundário 1" },
  { id: "cnaeSecundario2", label: "CNAE Secundário 2" },
  { id: "cnaeSecundario3", label: "CNAE Secundário 3" },
  { id: "cnaeSecundario4", label: "CNAE Secundário 4" },

  { id: "toggleRetencao", label: "Haverá retenção?", tipo: "checkbox" },
  { id: "iss", label: "Retenção ISS", tipo: "checkbox" },
  { id: "inss", label: "Retenção INSS", tipo: "checkbox" },
  { id: "inputIrrf", label: "Retenção IRRF", tipo: "checkbox" },
  { id: "csll", label: "Retenção CSLL", tipo: "checkbox" },
  { id: "pis", label: "Retenção PIS", tipo: "checkbox" },
  { id: "cofins", label: "Retenção COFINS", tipo: "checkbox" },

  { id: "condicaoPagamento", label: "Condição de Pagamento" },
  { id: "banco", label: "Banco" },
  { id: "agencia", label: "Agência" },
  { id: "conta", label: "Conta" },

  { id: "telefone", label: "Telefone Financeiro" },
  { id: "telComercial", label: "Telefone Comercial" },
  { id: "celular", label: "Celular" },
  { id: "emailAdministrativo", label: "E-mail Administrativo" },
  { id: "emailComercial", label: "E-mail Comercial" },
  { id: "emailCr", label: "E-mail Financeiro / Contabilidade" },
  { id: "site", label: "Site" },

  { id: "anxCartaoCnpj", label: "Anexo Cartão CNPJ" },
  { id: "anxCompBanco", label: "Anexo Comprovante Bancário" },
  { id: "anxContrato", label: "Anexo Contrato Social" },
  { id: "anxRgCpf", label: "Anexo RG / CPF" },
  { id: "anxCompEndereco", label: "Anexo Comprovante de Endereço" },
  { id: "anxLaudoPcd", label: "Anexo Laudo Médico PCD" },
  { id: "anxDependentes", label: "Anexo Dependentes IRRF" },
  { id: "anxCodConduta", label: "Anexo Código de Conduta" },
  { id: "anxAntiCorrupcao", label: "Anexo Política Anticorrupção" },
  { id: "anxConflito", label: "Anexo Conflito de Interesses" },
  { id: "anxLgpd", label: "Anexo Ciência LGPD" }
];

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

    if (campo.tipo === "checkbox") {
      snapshot[campo.id] = $("#" + campo.id).is(":checked") ? "Sim" : "Não";
      return;
    }

    snapshot[campo.id] = ($("#" + campo.id).val() || "").toString().trim();
  });

  $("#snapshotEdicaoValidacao").val(JSON.stringify(snapshot));
}

