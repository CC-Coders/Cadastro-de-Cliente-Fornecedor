
// A busca dos selects é feita pelo Selectize (js/selectBusca.js).

// VISIBILIDADE CONDICIONAL DE CAMPOS
function controlarCamposClassificacao() {
   const classificacao = ($("#classificacao").val() || "").trim();
   const isCliente = classificacao === "1";

   // Dados Bancários ficam visíveis também para Cliente, como conta opcional (validado em validarDadosBancarios).
   $("#divDadosBancarios").show();
   // Pessoa Física continua disponível como Cliente (venda em balcão).

   if (isCliente) {
      $(".cnae-box").hide().prev(".divider").hide();
      $(".cnae-box").next(".divider").hide();
      $("#cnaePrincipal").prop("required", false).val("");
      $("#cnae-secundarios-wrap").empty();
   }

   if (isCliente) {
      $("#divMoedaGrupoMercadoria, #grupo-mercadoria-wrap").hide();
      $("#grupoMercadoria1").prop("required", false).val("");
      $("#grupo-mercadoria-wrap").empty();
   } else {

      $("#divMoedaGrupoMercadoria, #grupo-mercadoria-wrap").show();
      $("#grupoMercadoria1").prop("required", true);
   }

   if (isCliente) {
      $("#nav-step-Documentacao, #divDivisaoDocumentacao").hide();
      if (typeof getStepAtual === "function" && getStepAtual() === 3) {
         goToStep(2, false);
      }
   } else {
      $("#nav-step-Documentacao, #divDivisaoDocumentacao").show();
   }

   atualizarSetas();
   aplicarAsteriscoObrigatorio();
}
function controlarCamposCategoria() {
   const categoria = $("#categoria").val();
   const estrangeiro = $("#toggleEstrangeiro").is(":checked");
   const modoEstrangeiro = (categoria === "J" && estrangeiro);

   controlarEnderecoEstrangeiro(modoEstrangeiro);

   $("#divCpf, #divCnpj, #divRg, #divInscricaoEstadual, #divInscricaoMunicipal, #divDocEstrangeiro").hide();

   $("#docCpf, #docCnpj, #docRg, #docInscricaoEstadual, #docInscricaoMunicipal, #docEstrangeiro")
      .prop("required", false);

   $("#divToggleEstrangeiro").hide();

   if (categoria === "F") {
      // PF exibe Inscrição Estadual (opcional) — clientes que pedem a IE na nota fiscal.
      $("#divCpf, #divNomeFantasia, #divRg, #divInscricaoEstadual").show();
      $("#docCpf, #docRg, #nomeFantasia").prop("required", true);

      $("#divDadosPF").show();
      $("#dtNascimento, #estadoCivil, #docRgOrgao, #docRgUf").prop("required", true);

      $("#divDependentesBox").show();

      $(".cnae-box").hide().prev(".divider").hide();
      $(".cnae-box").next(".divider").hide();
      $("#cnaePrincipal").prop("required", false).val("");
      $("#cnae-secundarios-wrap").empty();

      // PF não tem Contribuinte ICMS nem Regime Fiscal — oculta e não exige.
      $("#divIcms, #divRegimeFiscal").hide();
      $("#icms, #regimeFiscal").prop("required", false).val("");
      limparErroCampo("icms");
      limparErroCampo("regimeFiscal");

      aplicarAsteriscoObrigatorio();
      return;
   }

   $("#divDadosPF").hide();
   $("#dtNascimento, #estadoCivil, #docRgOrgao, #docRgUf").prop("required", false);

   // Não-PF (PJ): Contribuinte ICMS e Regime Fiscal voltam a valer.
   $("#divIcms, #divRegimeFiscal").show();
   $("#icms, #regimeFiscal").prop("required", true);


   $("#divDependentesBox").hide();
   $("#toggleDependentes").prop("checked", false);
   $("#hiddenToggleDependentes").val("");
   $("#divNumDependentesInput").addClass("field-hidden").hide();
   $("#numDependentes").val("0");

   if (categoria === "J") {
      $("#divToggleEstrangeiro").show();

      if (estrangeiro) {
         $(".cnae-box").hide().prev(".divider").hide();
         $(".cnae-box").next(".divider").hide();
         $("#cnaePrincipal").prop("required", false).val("");
         $("#cnae-secundarios-wrap").empty();

         $("#divDocEstrangeiro").show();
         $("#docEstrangeiro").prop("required", true);

         $("#docCnpj, #docInscricaoEstadual, #docInscricaoMunicipal").val("");
         limparErroCampo("docCnpj");
         limparErroCampo("docInscricaoEstadual");
         limparErroCampo("docInscricaoMunicipal");
      } else {
         $(".cnae-box").show().prev(".divider").show();
         $(".cnae-box").next(".divider").show();
         $("#cnaePrincipal").prop("required", true);
         $("#divCnpj, #divNomeFantasia, #divInscricaoEstadual, #divInscricaoMunicipal").show();
         $("#docCnpj, #nomeFantasia").prop("required", true);

         $("#docEstrangeiro").val("");
         limparErroCampo("docEstrangeiro");
      }
   }

   controlarCamposClassificacao();
}
function controlarCamposDependentes() {
   const $painel = $("#divNumDependentesInput");
   const ativo = $("#toggleDependentes").is(":checked");
   if (ativo) {
      $painel.removeClass("field-hidden").show();
      if ((Number.parseInt($("#numDependentes").val(), 10) || 0) < 1) {
         $("#numDependentes").val("1");
      }
   } else {
      $painel.addClass("field-hidden").hide();
      $("#numDependentes").val("0");
   }
}

let _cidadeSelectOriginalHtml = null;
// CONTROLA OS CAMPOS DE ENDEREÇO PARA O CASO DE ENDEREÇO ESTRANGEIRO (CNPJ PJ)
function controlarEnderecoEstrangeiro(ativo) {
   const $estadoWrap = $("#divEstado .select-wrap");

   if (ativo) {
      $("#divCep").hide();
      $("#cep").prop("required", false);

      $("#endereco, #bairro").prop("readonly", false);
      $("#divPais").hide();
      $("#pais").prop("required", false);
      $("#divSelectPaisEstrangeiro").hide();
      $("#selectPaisEstrangeiro").prop("required", false);

      popularSelectEstado(true);
      definirValorSelect("#estado", "EX");
      $("#estado").prop("required", false);
      $estadoWrap.hide();
      if ($("#estadoExteriorDisplay").length) {
         $("#estadoExteriorDisplay").val("EX");
      } else {
         $estadoWrap.after(
            '<input type="text" id="estadoExteriorDisplay" class="form-control"' +
            ' value="EX" readonly tabindex="-1">'
         );
      }
      $("#estadoExteriorDisplay").show();
      $("#divEstado label").text("End. Exterior");


      // No exterior a cidade é digitada livremente: o select do RM vira um input de texto.
      let $cidadeWrap = $("#divCidade .select-wrap");
      if ($("#cidade").is("select")) {
         removerBuscaSelect("#cidade");
         _cidadeSelectOriginalHtml = $cidadeWrap[0].outerHTML;
         $cidadeWrap.replaceWith(
            '<input type="text" id="cidade" name="cidade" class="form-control"' +
            ' placeholder="Cidade / Localidade" required>'
         );
      }
      let nomeSalvo = ($("#nomeCidadeSalva").val() || "").trim();
      if (nomeSalvo) $("#cidade").val(nomeSalvo);
      $("#cidade").prop("readonly", false);

   } else {

      $("#divCep").show();
      $("#cep").prop("required", true);

      $("#endereco, #bairro").prop("readonly", false);
      $("#divPais").show();
      $("#divSelectPaisEstrangeiro").hide();
      $("#selectPaisEstrangeiro").prop("required", false);
      $("#pais").show().prop("required", true);
      if (!($("#pais").val() || "").trim()) {
         $("#pais").val("Brasil");
      }


      $("#divEstado label").text("Estado");
      $estadoWrap.show();
      $("#estadoExteriorDisplay").hide();
      popularSelectEstado(false);
      definirValorSelect("#estado", "");
      $("#estado").prop("required", true);

      if (_cidadeSelectOriginalHtml) {
         let $cidadeInput = $("#cidade");
         if ($cidadeInput.is("input")) {
            $cidadeInput.replaceWith(_cidadeSelectOriginalHtml);
            _cidadeSelectOriginalHtml = null;
            aplicarBuscaSelect("#cidade");
         }
      }
      limparSelect("#cidade", "Selecione a cidade...");
      $("#codMunicipio").val("");
      if (!globalThis._formRestaurando) {
         $("#nomeCidadeSalva").val("");
      }
   }

   // Sem CEP e sem País a linha fica com colunas sobrando: o grid usa outras larguras.
   $("#docEndereco").toggleClass("modo-exterior", ativo);

   // Os endereços adicionais seguem a mesma regra do endereço principal.
   if (typeof aplicarModoEstrangeiroNosEnderecos === "function") {
      aplicarModoEstrangeiroNosEnderecos(ativo);
   }
}

// CONTROLA A VISIBILIDADE DO ALERTA DE CNPJ INVÁLIDO (CATEGORIA PJ, NÃO ESTRANGEIRO)
function controlarAlertaCnpj() {
   const categoria = $("#categoria").val();
   const estrangeiro = $("#toggleEstrangeiro").is(":checked");
   const cnpj = ($("#docCnpj").val() || "").replace(/[^A-Za-z0-9]/g, "");


   if (categoria === "J" && !estrangeiro && cnpj.length < 14) {
      $("#alertCnpj").show();
   } else {
      $("#alertCnpj").hide();
   }

   if (categoria === "F") {
      $("#alertCPF").show();
   } else {
      $("#alertCPF").hide();
   }
}

// CONTROLA A VISIBILIDADE DO CAMPO NATUREZA DE RENDIMENTO.
// Ela só é preenchida pelo Suprimentos na Validação, e nunca para RDO.
function controlarNaturezaPorTipo() {
   if (ehModoView()) {
      $("#divNaturezaRendimento").show();
      return;
   }

   const exibir = ehEtapaValidacao() && !ehTipoRDO();

   $("#divNaturezaRendimento").toggle(exibir);
   $("#naturezaRendimento").prop("required", exibir);

   if (exibir) return;

   limparErroCampo("naturezaRendimento");
   if (ehTipoRDO()) {
      definirValorSelect("#naturezaRendimento", "");
      sincronizarNaturezaRendimento();
   }
}

// CONTROLA A VISIBILIDADE DO PAINEL DE RETENÇÕES 
function controlarPainelRetencoes() {
   const $painel = $("#divRetencoesPanel");

   if ($("#toggleRetencao").is(":checked")) {
      $painel.removeClass("field-hidden").show();
      return;
   }

   $painel.addClass("field-hidden").hide().removeClass("retencao-erro");

   $("#erroMinimoImposto").hide();
   $(".retencao-item input").prop("checked", false);
   $(".retencao-item").removeClass("ativo");
}

// VERIFICA SE O FORMULÁRIO ESTÁ EM MODO DE EDIÇÃO
function ehModoEdicao() {
   if (globalThis._modoEdicao === true) {
      return true;
   }
   var cod = ($("#codcfoEdicao").val() || "").toString().trim();
   return cod !== "" && cod !== "-1" && cod !== "0";
}

// CONTROLA A VISIBILIDADE DA SEÇÃO DE DOCUMENTAÇÃO 
function aplicarVisibilidadeDocumentacao() {
   var mostrar = !ehModoEdicao();
   $("#nav-step-Documentacao, #divDivisaoDocumentacao").toggle(mostrar);
}

// EXIBE A SEÇÃO DE DADOS FISCAIS, QUE SÓ É PREENCHIDA NA VALIDAÇÃO.
function aplicarVisibilidadeDadosFiscais() {
   const $fiscais = $("#divDadosFiscais");
   const $contatos = $("#divContatos");

   // Dados Fiscais é a última seção da etapa 2: garante a posição após Contatos
   // independentemente da ordem em que o Fluig monta o HTML.
   if ($fiscais.length && $contatos.length && !$contatos.next().is("#divDadosFiscais")) {
      $fiscais.insertAfter($contatos);
   }

   // Vale a atividade, não o modo: em visualização a seção também fica oculta no Início/Correção.
   $fiscais.toggle(ETAPAS_PREENCHIMENTO.indexOf(atividadeAtual()) === -1);
}

// LIBERA TODA A SEÇÃO DE DADOS FISCAIS PARA EDIÇÃO NA VALIDAÇÃO, INDEPENDENTEMENTE DA AÇÃO "EDITAR CAMPOS"
function liberarSecaoDadosFiscais() {
   var $sec = $("#divDadosFiscais");

   $sec.find("input:not([type='hidden']), select, textarea")
      .prop("disabled", false)
      .prop("readonly", false)
      .removeClass("campo-readonly");

   liberarCampo($sec.find("input, select, textarea, .switch, .switch-button, .retencao-box, .retencao-item, .cnae-box, .select-wrap"));
   $sec.find(".select-wrap").removeClass("disabled-upload");

   $sec.find("button")
      .removeClass("btn-bloqueado")
      .removeAttr("tabindex");

   // Alíquota IRRF é calculada a partir do Código de Receita -> mantém só leitura.
   $sec.find("#irrf").prop("readonly", true);
}

// LIBERA OS ANEXOS PARA EDIÇÃO NA VALIDAÇÃO, INDEPENDENTEMENTE DA AÇÃO "EDITAR CAMPOS"
function liberarSecaoDocumentacao() {
   $("#divDocumentacao .upload-area")
      .removeClass("disabled-upload campo-bloqueado");

   $("#divDocumentacao .upload-file-remove")
      .removeClass("btn-bloqueado")
      .removeAttr("tabindex");

   // bloquearTudoInicio() faz .off("click") na .upload-area — precisa religar o clique.
   if (typeof inicializarUploadsFluig === "function") {
      inicializarUploadsFluig();
   }
}

// CONTROLA A NAVEGAÇÃO DIRETA PELO STEPPER, VALIDANDO AS ETAPAS AO AVANÇAR E LIBERANDO O RETORNO OU A NAVEGAÇÃO NO MODO VISUALIZAÇÃO.
// getStepAtual, getStepsVisiveis e goToStep vêm do motor compartilhado (castilhoFooter.js).
function navegarParaStep(destino) {
   if (typeof ehModoView === "function" && ehModoView()) {
      goToStep(destino);
      return;
   }

   var atual = getStepAtual();

   // Voltar (ou permanecer na mesma) é permitido sem validar.
   if (destino <= atual) {
      goToStep(destino);
      return;
   }

   var steps = getStepsVisiveis();
   var idxAtual = steps.indexOf(atual);
   var idxDest = steps.indexOf(destino);

   if (idxAtual < 0 || idxDest < 0) {
      goToStep(destino);
      return;
   }

   // Avança uma etapa por vez: torna cada etapa visível e valida antes de sair.
   // Para na primeira etapa incompleta (com o toast e os campos em erro à mostra).
   for (var i = idxAtual; i < idxDest; i++) {
      goToStep(steps[i], false);
      if (!validarEtapaAtual(true)) {
         return;
      }
   }

   goToStep(destino);
}

// BLOQUEIA TODOS OS CAMPOS DE TODAS AS ETAPAS (EXCETO BOTÕES DE NAVEGAÇÃO) PARA O MODO VIEW
const SELETOR_ETAPAS = "#divPreCadastro, #divDadosCadastrais, #divDocumentacao";
function bloquearTudoInicio() {
   var $etapas = $(SELETOR_ETAPAS);


   $etapas.find("input:not([type='hidden']), textarea")
      .prop("readonly", true)
      .addClass("campo-readonly");


   $etapas.find("select, input[type='checkbox'], input[type='radio']").prop("disabled", false);

   bloquearCampo($etapas.find(
      "select, input[type='checkbox'], input[type='radio']," +
      ".switch, .switch-button, .retencao-box, .retencao-item, .cnae-box, .select-wrap"
   ));


   $etapas.find(".upload-area")
      .addClass("disabled-upload campo-bloqueado")
      .off("click");

   $etapas.find("button:not(.section-head):not(.btn-visualizar-anexo)")
      .addClass("btn-bloqueado")
      .attr("tabindex", "-1");


   $etapas.find(".upload-file-remove")
      .addClass("btn-bloqueado")
      .attr("tabindex", "-1");
}

// DESBLOQUEIA TODOS OS CAMPOS DE TODAS AS ETAPAS PARA EDIÇÃO (EXCETO BOTÕES DE NAVEGAÇÃO)     
function habilitarTudoInicio() {
   var $etapas = $(SELETOR_ETAPAS);

   $etapas.find("input:not([type='hidden']), select, textarea")
      .prop("disabled", false)
      .prop("readonly", false)
      .removeClass("campo-readonly");

   liberarCampo($etapas.find(
      "input, select, textarea," +
      ".switch, .switch-button, .retencao-box, .retencao-item, .cnae-box, .select-wrap, .upload-area"
   ));
   $etapas.find(".upload-area").removeClass("disabled-upload");

   $etapas.find("button, .upload-file-remove")
      .removeClass("btn-bloqueado")
      .removeAttr("tabindex");

   inicializarUploadsFluig();
}

// MODO VIEW 
function configurarModoView() {

   document.documentElement.setAttribute("data-device", "desktop");
   $("body").removeClass("fluig-mobile");
   $("body").removeClass("menu-open-mobile");


   $("#btnEditarCamposInicio").hide();
   $("#btnAprovar").hide();
   $("#btnReprovar").hide();
   $("#divDecisaoBotoes").hide();


   $(".castilho-footer").css("display", "");
   $("#btnTabAnt").css("display", "");
   $("#btnTabNext").css("display", "");


   $("#observacaoValidacao").prop("readonly", true).addClass("campo-readonly");

   ajustarCamposView();
   setTimeout(ajustarCamposView, 400);
   setTimeout(ajustarCamposView, 1000);
   setTimeout(ajustarCamposView, 2000);
   setTimeout(ajustarCamposView, 3000);
}

// AJUSTA OS CAMPOS PARA O MODO VIEW (READONLY)
function ajustarCamposView() {


   if (typeof controlarDocumentacaoPorCategoria === "function") {
      controlarDocumentacaoPorCategoria();
   }
   if (typeof restaurarUploadsSalvos === "function") {
      restaurarUploadsSalvos();
   }

   resolverSpansView();


   expandirTudoView();


   bloquearTudoInicio();

   
   normalizarSelectsView();

   $("#preCadastro span.form-control").addClass("campo-readonly");
}

// EXPANDE TODAS AS SEÇÕES PARA O MODO VIEW (READONLY)
function expandirTudoView() {


   $(".section-body").show();


   $("#divDadosComerciais").show();
   $("#divEndereco").show();
   $("#divMoedaGrupoMercadoria").show();
   $("#grupo-mercadoria-wrap").show();
   $("#divDadosBancarios").show();
   $(".cnae-box").show();
   $(".cnae-box").prev(".divider").show();
   $(".cnae-box").next(".divider").show();


   $("#preCadastro").find("input:not([type='hidden']), span.form-control, textarea").each(function () {
      var $campo = $(this);
      var valor;

      if ($campo.is("span")) {
         valor = $campo.text().trim();
      } else {
         valor = ($campo.val() || "").trim();
      }

      if (valor !== "" && valor !== "Selecione...") {
         $campo.closest(".fg, .cnae-box, .retencao-box, .bank-card").show();
      }
   });


   $("#preCadastro .upload-area.uploaded").closest(".fg").show();
}

// NORMALIZA OS SELECTS PARA O MODO VIEW (READONLY)
function normalizarSelectsView() {
   $("#formSolicitacao select").each(function () {
      var $select = $(this);


      $select.removeAttr("size");
      $select.removeAttr("multiple");
      $select.prop("size", 0);
      this.style.setProperty("display", "none", "important");

      var texto = "";
      var $opcao = $select.find("option:selected");
      if ($opcao.val()) {
         texto = $opcao.text().trim();
      }


      var $input = $select.data("viewInput");
      if (!$input || $input.length === 0) {
         $input = $('<input type="text" class="form-control campo-readonly" readonly tabindex="-1">');
         $select.after($input);
         $select.data("viewInput", $input);
      }
      $input.val(texto);
   });
}

// RESOLVE OS SPANS PARA O MODO VIEW (READONLY)
function resolverSpansView() {
   mostrarTextoDoSpan("tipo",                $("#tipoSelecionado").val());
   mostrarTextoDoSpan("naturezaRendimento",  $("#codNaturezaRendimento").val());
   mostrarTextoDoSpan("selectDescricaoIrrf", $("#hiddenCodIrrf").val());
   mostrarTextoDoSpan("estado",              $("#hiddenEstadoValor").val());
   mostrarTextoDoSpan("cidade",              $("#nomeCidadeSalva").val());


   var i;
   for (i = 1; i <= 9; i++) {
      mostrarTextoDoSpan("grupoMercadoria" + i, $("#hiddenGrupoMercadoria" + i).val());
   }
}

// MOSTRA O TEXTO DO OPTION SELECIONADO DENTRO DE UM SPAN (MODO VIEW)
function mostrarTextoDoSpan(idCampo, valorSalvo) {
   var $span = $("#" + idCampo);


   if ($span.length === 0) return;
   if (!$span.is("span")) return;

   var $options = $span.children("option");
   if ($options.length === 0) return;

   valorSalvo = (valorSalvo || "").trim();

   var texto = "";
   $options.each(function () {
      if (String($(this).attr("value")) === String(valorSalvo)) {
         texto = $(this).text();
         return false;
      }
   });

   $span.empty().text(texto);
}

// APLICA AS REGRAS DE CADASTRO ASSERTIVO: LIMITA OS TIPOS DISPONÍVEIS E OS PREENCHIMENTOS AUTOMÁTICOS.
function aplicarRegrasCadastroAssertivo() {
   try {
      if (ehEtapaPreenchimento()) {
         // A lista de tipos depende da classificação e da categoria escolhidas.
         carregarTiposClienteFornecedor();
         liberarCampo("#tipo");
      }

      forcarNaturezaAluguel();
      aplicarRegrasPfRdo();
   } catch (e) {
      console.warn("[regras] cadastro assertivo:", e);
   }
}

// PESSOA FÍSICA + RDO: fixa Contribuinte ICMS em "0" e Código de Receita IRRF em "0588", travados.
const IRRF_PESSOA_FISICA_RDO = "0588";

function aplicarRegrasPfRdo() {
   if (ehModoView()) return;

   const fixar = ($("#categoria").val() || "").trim() === "F" && ehTipoRDO();

   if (!fixar) {
      liberarCampo("#icms, #selectDescricaoIrrf");
      return;
   }

   definirValorSelect("#icms", "0", true);
   bloquearCampo("#icms");

   definirValorSelect("#selectDescricaoIrrf", IRRF_PESSOA_FISICA_RDO, true);
   bloquearCampo("#selectDescricaoIrrf");
}

// NATUREZA DE RENDIMENTO USADA QUANDO O FORNECEDOR É DE ALUGUEL.
const NATUREZA_ALUGUEL = "13002";

// FIXA A NATUREZA DE RENDIMENTO EM ALUGUEL QUANDO ALGUM GRUPO DE MERCADORIA FOR DE ALUGUEL.
function forcarNaturezaAluguel() {
   const temAluguel = $(".grupo-mercadoria").toArray()
      .some(function (campo) { return /alugu/i.test($(campo).val() || ""); });

   if (!temAluguel) {
      liberarCampo("#naturezaRendimento");
      return;
   }

   if (!itemDaLista(listaNaturezaRendimento(), NATUREZA_ALUGUEL)) return;

   definirValorSelect("#naturezaRendimento", NATUREZA_ALUGUEL);
   sincronizarNaturezaRendimento();
   bloquearCampo("#naturezaRendimento");
}

// ETAPAS EM QUE O FORMULÁRIO INTEIRO FICA EDITÁVEL, SEM PRECISAR DE "EDITAR INFORMAÇÕES".
// ERRO_INTEGRACAO entra aqui para o solicitante ajustar e reenviar o processo.
const ETAPAS_EDICAO_LIVRE = ETAPAS_PREENCHIMENTO.concat(ATIVIDADES.INTEGRACAO, ATIVIDADES.ERRO_INTEGRACAO);

// CONTROLA A EDIÇÃO DE CAMPOS NO INÍCIO, CORREÇÃO OU VALIDAÇÃO
function controlarEdicaoInicioValidacao() {
   const atividade = atividadeAtual();

   // Dados Fiscais só aparecem na Validação (escondido no Início/Correção).
   aplicarVisibilidadeDadosFiscais();

   if (ehModoView()) {
      configurarModoView();
      return;
   }

   if (ETAPAS_EDICAO_LIVRE.indexOf(atividade) !== -1) {
      $("#btnEditarCamposInicio").hide();
      return;
   }

   bloquearTudoInicio();


   if (atividade === ATIVIDADES.VALIDACAO) {
      // Natureza de Rendimentos é preenchida pelo Suprimentos -> sempre editável nesta etapa,
      // mesmo sem clicar em "Editar campos".
      $("#naturezaRendimento").prop("disabled", false);
      liberarCampo("#naturezaRendimento");
      // Toda a seção Dados Fiscais é preenchida nesta etapa -> liberada aqui.
      liberarSecaoDadosFiscais();
      // Anexos ficam liberados na Validação sem precisar de "Editar informações".
      liberarSecaoDocumentacao();
      $("#btnEditarCamposInicio").show();
      $("#btnEditarCamposInicio").off("click").on("click", function () {
         habilitarTudoInicio();
         $(this)
            .prop("disabled", true)
            .removeClass("btn-warning")
            .addClass("btn-success")
            .text("Edição liberada");
      });
      return;
   }
   $("#btnEditarCamposInicio").hide();
   $("#btnAprovar, #btnReprovar, #divDecisaoBotoes").hide();
   $("#observacaoValidacao").prop("readonly", true).addClass("campo-readonly");
}