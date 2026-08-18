
// AO CARREGAR A PÁGINA, SE HOUVER CNPJ, BUSCA OS DADOS E POPULA O FORMULÁRIO.
$(globalThis).on("load", function () {
   setTimeout(function () {
      const cnpj = ($("#docCnpj").val() || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const hiddenExiste = $("#hiddenCnaeSecundario1").length > 0;
      const temValor = $("#hiddenCnaeSecundario1").val();

      if (hiddenExiste && temValor) {
         restaurarCnaesSecundariosSalvos();
         return;
      }
      if (cnpj.length === 14) {
         buscarCnpj(cnpj);
      }

   }, 300);
});

// GUARDA A CATEGORIA ANTERIOR PARA COMPARAÇÃO AO TROCAR DE CATEGORIA (PJ->PF COM ANEXOS).
let categoriaAnterior = "";

// REGISTRA TODOS OS HANDLERS DE EVENTOS DO FORMULÁRIO 
function bindEventos() {
   bindEventosCamposBasicos();
   bindEventosDocumentos();
   bindEventosEndereco();             
   bindEventosRetencao();              
   bindEventosDependentes();         
   bindEventosSimplesNacional();       
   bindEventosCnaeSecundario();        
   bindEventosGrupoMercadoria();
   bindEventosCamposDinamicos();  
   bindEventosUpload();                
   bindEventoTrocaCategoriaComAnexos();
   bindEventosDecisao();               
   bindEventosDadosBancarios();        
}

// HANDLERS DE DADOS BANCÁRIOS
function bindEventosDadosBancarios() {
   $(document).on("click", "#btn-add-conta-bancaria", adicionarContaBancaria);

   $(document).on("click", ".btn-remove-bank", function () {
      removerContaBancaria(Number($(this).data("numero")));
   });

   $(document).on("change", ".banco-select", function () {
      let selectId = this.id; 
      let s = selectId.replace("selectBancoNome", ""); 
      let cpodigo = $(this).val() || "";
      let nome    = $(this).find("option:selected").data("nome") || $(this).find("option:selected").text() || "";

      if (!$(this).find("option:selected").data("nome")) nome = "";

      $("#banco"           + s).val(cpodigo);
      $("#bancoDescricao"  + s).val(nome);
      $("#bancoCodExibicao"+ s).val(cpodigo);

      sincronizarTabelaBancaria();
      if (cpodigo && selectId) limparErroCampo(selectId);
   });

   $(document).on("change", ".banco-agencia, .banco-conta", sincronizarTabelaBancaria);

   $(document).on("input change", ".banco-agencia, .banco-conta", function () {
      if (($(this).val() || "").trim() && this.id) {
         limparErroCampo(this.id);
      }
   });
}

// HANDLERS DE DECISÃO
function bindEventosDecisao() {
   $("#btnAprovar").on("click", function () {
      $("#selectDecisao").val("enviarRm").trigger("change");
      destacarBotao(this);
   });

   $("#btnReprovar").on("click", function () {
      $("#selectDecisao").val("Correcao").trigger("change");
      destacarBotao(this);
   });
}

// AO TROCAR DE CATEGORIA, SE HOUVER ANEXOS, CONFIRMA A EXCLUSÃO E LIMPA OS ANEXOS
function bindEventoTrocaCategoriaComAnexos() {
   categoriaAnterior = ($("#categoria").val() || "").trim();
   $("#categoria")
      .off("focus.categoriaAnexos")
      .on("focus.categoriaAnexos", function () {
         categoriaAnterior = ($(this).val() || "").trim();
      });
   $("#categoria")
      .off("change.categoriaAnexos")
      .on("change.categoriaAnexos", function () {
         let novaCategoria = ($(this).val() || "").trim();
         if (
            categoriaAnterior === "J" &&
            novaCategoria === "F" &&
            existeAnexoIncluido()
         ) {
            FLUIGC.message.confirm({
               title: "Atenção",
               message: "Essa ação resultará na exclusão de todos os anexos já inclusos no processo.",
               labelYes: "Sim, excluir",
               labelNo: "Cancelar"
            }, function (confirmou) {
               if (!confirmou) {
                  $("#categoria").val(categoriaAnterior);
                  return;
               }

               excluirTodosAnexosDoProcesso();
               controlarCamposCategoria();
               controlarAlertaCnpj();
               controlarDocumentacaoPorCategoria();
               aplicarAsteriscoObrigatorio();
               carregarOpcoesIrrf(false);

               categoriaAnterior = novaCategoria;
            });

            return;
         }

         controlarCamposCategoria();
         controlarAlertaCnpj();
         controlarDocumentacaoPorCategoria();
         aplicarAsteriscoObrigatorio();
         carregarOpcoesIrrf(false);

         categoriaAnterior = novaCategoria;
      });
}

// SINCRONIZA OS CAMPOS DINÂMICOS (CNAE SECUNDÁRIO E GRUPO DE MERCADORIA) PARA OS HIDDEN CORRESPONDENTES
function bindEventosCamposDinamicos() {
   $(document).on(
      "change input",
      "select[name^='grupoMercadoria'], input[name^='cnaeSecundario']",
      sincronizarCamposDinamicosHidden
   );
   sincronizarCamposDinamicosHidden();
}

// HANDLERS DE CAMPOS BÁSICOS
function bindEventosCamposBasicos() {
   $(document).on("input change", ".form-control[required]", function () {
      limparErroCampoObrigatorioPreenchido(this);
   });

   $(document).on("input", "#observacaoValidacao", function () {
      if (($(this).val() || "").trim()) {
         limparErroCampo("observacaoValidacao");
      }
   });
   $(document).on("change", "#selectDecisao", function () {
      if ($(this).val()) {
         limparErroCampo("selectDecisao");
      }
   });

   $("#naturezaRendimento").on("change", function () {
      $("#codNaturezaRendimento").val($(this).val() || "");
      $("#idNatRendimento").val(
         $(this).find("option:selected").data("idnat") || ""
      );
   });
   $("#tipo").on("change", controlarRetencaoPorTipo);
   $("#classificacao").on("change", controlarCamposClassificacao);
}

// HANDLERS DE DOCUMENTOS
function bindEventosDocumentos() {
   $("#docCnpj").on("input", function () {
      validarDocumentoDigitado({
         campoId: "docCnpj",
         tamanhoMinimo: 14,
         mensagemErro: "CNPJ inválido.",
         validador: validarCNPJ
      });
   });
   $("#docCpf").on("input", function () {
      validarDocumentoDigitado({
         campoId: "docCpf",
         tamanhoMinimo: 11,
         mensagemErro: "CPF inválido.",
         validador: validarCPF
      });
   });

   // RG sem validação de máscara: aceita qualquer formato (segue obrigatório para PF).

   $("#dtNascimento").on("change input blur", function () {
      const valor = $(this).val();
      const hoje  = new Date().toISOString().split("T")[0];

      if (valor && valor > hoje) {
         exibirErroCampo("dtNascimento", "A data de nascimento não pode ser futura.");
         aplicarStatusCampo("dtNascimento", false);
      } else {
         limparErroCampo("dtNascimento");
         aplicarStatusCampo("dtNascimento", valor ? true : null);
      }
   });
   $("#toggleEstrangeiro")
      .off("change.estrangeiro")
      .on("change.estrangeiro", function () {

         $("#hiddenToggleEstrangeiro").val(this.checked ? "on" : "");
         limpaCamposEndereco();
         $("#cep").val("");
         limparErroCampo("cep");
         $("#selectPaisEstrangeiro").val("");

         controlarCamposCategoria();
         controlarAlertaCnpj();
         aplicarAsteriscoObrigatorio();
      });

   $(document).on("change", "#selectPaisEstrangeiro", function () {
      let paisSelecionado = $(this).val() || "";
      $("#pais").val(paisSelecionado);
      if (paisSelecionado) {
         limparErroCampo("selectPaisEstrangeiro");
      }
   });

   $(document).on("change", "#selectDescricaoIrrf", function () {
      let selecionado = $(this).find("option:selected");
      let aliq = selecionado.length ? (selecionado.attr("data-aliquota") || "") : "";
      $("#irrf").val(aliq);
      $("#hiddenCodIrrf").val($(this).val() || "");
      if ($(this).val()) {
         limparErroCampo("selectDescricaoIrrf");
      }
   });

   $("#docCnpj").on("blur keyup", controlarAlertaCnpj);
}

// HANDLERS DE ENDEREÇO
function bindEventosEndereco() {
   $("#cep").on("blur", function () {
      const cep = ($(this).val() || "").replaceAll(/\D/g, "");

      if (cep.length !== 8) {
         limpaCamposEndereco();
         return;
      }
      buscarCep(cep);
   });

   $(document).on("change", "#estado", function () {
      let uf = $(this).val();
      $("#hiddenEstadoValor").val(uf || "");
      popularSelectMunicipio(uf);
      if (globalThis._formRestaurando) {

         let nomeSalvo = ($("#nomeCidadeSalva").val() || "").trim();
         if (nomeSalvo && !$("#cidade").val()) {
            $("#cidade").val(nomeSalvo);
            let $optRest = $("#cidade").find("option:selected");
            if ($optRest.val()) {
               $("#codMunicipio").val($optRest.data("cod") || "");
            }
         }
      } else {

         $("#cidade").val("");
         $("#codMunicipio").val("");

      }
      if (uf) limparErroCampo("estado");
   });

   $(document).on("change", "#cidade", function () {
      let cod, nome;
      if ($(this).is("select")) {
         let $opt = $(this).find("option:selected");
         cod  = $opt.data("cod") || "";
         nome = $opt.val()       || "";
      } else {

         cod  = "";
         nome = ($(this).val() || "").trim();
      }
      $("#codMunicipio").val(cod);
      $("#nomeCidadeSalva").val(nome);
      if (nome) limparErroCampo("cidade");
   });
}

// HANDLERS DE RETENÇÃO
function bindEventosRetencao() {

   $("#toggleRetencao").on("change", function () {
      $("#hiddenToggleRetencao").val(this.checked ? "on" : "");
      controlarPainelRetencoes();
   });

   const MAP_HIDDEN_IMPOSTO = {
      inss:      "#hiddenInss",
      csll:      "#hiddenCsll",
      pis:       "#hiddenPis",
      cofins:    "#hiddenCofins"
   };

   $(".retencao-item input").on("change", function () {
      $(this)
         .closest(".retencao-item")
         .toggleClass("ativo", this.checked);

      const hiddenId = MAP_HIDDEN_IMPOSTO[this.id];
      if (hiddenId) {
         $(hiddenId).val(this.checked ? "on" : "");
      }

      validarPainelRetencaoVisual();
   });
}

// HANDLERS DE DEPENDENTES
function bindEventosDependentes() {
   $("#toggleDependentes")
      .off("change.dependentes")
      .on("change.dependentes", function () {
         $("#hiddenToggleDependentes").val(this.checked ? "on" : "");
         controlarCamposDependentes();
      });
}

// HANDLERS DE SIMPLES NACIONAL
function bindEventosSimplesNacional() {
   $("#toggleSimplesNacional")
      .off("change.simplesNacional")
      .on("change.simplesNacional", function () {
         const ativo = this.checked;
         $("#hiddenToggleSimplesNacional").val(ativo ? "on" : "");
         $("#simplesNacional").val(ativo ? "1" : "0");
      });
}

// HANDLERS DE CNAE SECUNDÁRIO
function bindEventosCnaeSecundario() {

   $("#btn-add-cnae").off("click.cnae").on("click.cnae", adicionarCnae);
   $(document).on("click", ".btn-remove-cnae", function () {
      $(this).closest(".cnae-secundario-item").remove();

      reordenarCnaesSecundarios();
      controlarBotaoAdicionarCnae();
   });
   $(document).on("input", ".cnae-secundario", function () {
      if (!$(this).hasClass("campo-readonly")) {
         aplicarMascaraCnae($(this));
      }
   });
}

// HANDLERS DE GRUPO DE MERCADORIA
function bindEventosGrupoMercadoria() {
   $("#btn-add-grupo-mercadoria").off("click.grupo").on("click.grupo", function () {
      adicionarGrupoMercadoria();
   });

   $(document).on("change", ".grupo-mercadoria", function () {
      sincronizarCamposDinamicosHidden();
   });

   $(document).on("click", ".btn-remove-grupo-mercadoria", function () {
      $("#acaoGrupoMercadoria1").append($("#btn-add-grupo-mercadoria"));

      $(this).closest(".grupo-mercadoria-item").remove();

      reordenarGruposMercadoria();
      sincronizarCamposDinamicosHidden();
      reposicionarBotaoAdicionarGrupo();
      controlarBotaoAdicionarGrupoMercadoria();
   });
}

// HANDLERS DE UPLOAD
function bindEventosUpload() {

   $(document).off("click", ".upload-file-remove");

   $(document).on("click", ".upload-file-remove", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const sufixoCampo = $(this).data("sufixo");
      const hiddenNome = getHiddenAnexoId(sufixoCampo);
      const hiddenId = hiddenNome + "Id";

      const nomeArquivo = ($("#" + hiddenNome).val() || "").trim();
      let docId = ($("#" + hiddenId).val() || "").trim();

      if (docId === "0") {
         docId = "";
      }

      if (!docId && nomeArquivo) {
         docId = buscarIdAnexoPorNome(nomeArquivo);
      }

      if (!docId && !nomeArquivo) {
         console.warn("Não foi possível identificar o anexo para remover:", sufixoCampo);
         return;
      }

      removerAnexoFluig({
         documentId: docId,
         nomeArquivo: nomeArquivo
      });

      aguardarRemocaoConfirmada({
         sufixoCampo: sufixoCampo,
         docId: docId,
         nomeArquivo: nomeArquivo
      });
   });
}

// DIZ SE EXISTE ANEXO INCLUÍDO (CARTÃO CNPJ, COMPROVANTE BANCÁRIO, CONTRATO, RG/CPF OU COMPROVANTE DE ENDEREÇO)
function existeAnexoIncluido() {
   let anexos = [
      "anxCartaoCnpj",
      "anxCompBanco",
      "anxContrato",
      "anxRgCpf",
      "anxCompEndereco",

   ];

   return anexos.some(function (id) {
      return ($("#" + id).val() || "").trim() !== "";
   });
}

// REMOVE OS TOASTS DE REMOÇÃO DE ANEXOS (QUE FICAM VISÍVEIS POR 5 SEGUNDOS) PARA NÃO ATRAPALHAR A VISUALIZAÇÃO DO FORMULÁRIO
function ocultarToastsRemocaoAnexos() {
   const $p = parent.$;

   $p(".toast, .alert, .fluig-toast, .notification")
      .filter(function () {
         const texto = $p(this).text().toLowerCase();
         return texto.includes("anexo foi removido") ||
            texto.includes("anexo removido");
      })
      .remove();
}

// LIMPA TODOS OS UPLOADS VISUAIS (REMOVE CLASSES DE STATUS E LIMPA OS HIDDENS)
function limparTodosUploadsVisuais() {
   $(".upload-area").removeClass("uploaded upload-error");
   $(".upload-file-status").hide().empty();

   Object.values(MAPA_HIDDEN_ANEXOS).forEach(function (hiddenId) {
      $("#" + hiddenId).val("");
      $("#" + hiddenId + "Id").val("");
   });
}

// LIMPA O ERRO DE UM CAMPO OBRIGATÓRIO SE ELE ESTIVER PREENCHIDO (EXCETO CPF/CNPJ)
function limparErroCampoObrigatorioPreenchido(campo) {
   const id = campo.id;
   if (["docCpf", "docCnpj"].includes(id)) {
      return;
   }
   const valor = ($(campo).val() || "").toString().trim();
   if (valor) {
      limparErroCampo(id);
   }
}

// VALIDA DOCUMENTO
function validarDocumentoDigitado(config) {
   const valor = $("#" + config.campoId).val() || "";
   const numeros = valor.replaceAll(/\D/g, "");

   if (!valor || numeros.length < config.tamanhoMinimo) {
      limparErroCampo(config.campoId);
      aplicarStatusCampo(config.campoId, null);
      return;
   }
   if (config.validador(valor)) {
      limparErroCampo(config.campoId);
      aplicarStatusCampo(config.campoId, true);
      return;
   }
   exibirErroCampo(config.campoId, config.mensagemErro);
   aplicarStatusCampo(config.campoId, false);
}

// FAZ POLLING PARA REMOÇÃO DE ANEXO
function aguardarRemocaoConfirmada(config) {
   let tentativas = 0;
   const maxTentativas = 30;

   const intervalo = setInterval(function () {
      tentativas++;

      const aindaExiste = anexoAindaExisteNoFluig(config.docId, config.nomeArquivo);

      if (!aindaExiste) {
         clearInterval(intervalo);
         limparCardVisualAnexo(config.sufixoCampo);
         atualizarContadorAnexosFluig();
         sincronizarCamposDinamicosHidden();
         return;
      }

      if (tentativas >= maxTentativas) {
         clearInterval(intervalo);
         console.warn("Remoção cancelada ou não concluída:", config.sufixoCampo);
      }
   }, 300);
}

// CONFIRMA AUTOMATICAMENTE AS EXCLUSÕES EM LOTE E OCULTA OS TOASTS DE REMOÇÃO
function confirmarModaisRemocaoEmLote() {
   const $p = parent.$;
   let tentativas = 0;

   const intervalo = setInterval(function () {
      tentativas++;

      const $modal = $p(".modal:visible, .fluig-modal:visible").last();

      if ($modal.length) {
         $modal
            .find("button:contains('Sim'), .btn-primary, button:contains('Confirmar')")
            .filter(":visible")
            .first()
            .click();
      }

      ocultarToastsRemocaoAnexos();

      if (tentativas >= 20) {
         clearInterval(intervalo);
      }
   }, 250);
}

// REMOVE OS ANEXOS INDIVIDUALMENTE COMO ALTERNATIVA, SEM EXIBIR CONFIRMAÇÃO
function removerTodosAnexosUmPorUmSemPerguntar() {
   const $p = parent.$;

   const $linhas = $p("#attachmentsTable tbody tr").filter(function () {
      return !$p(this).is("[data-empty-message]");
   });

   $linhas.each(function () {
      const $btn = $p(this)
         .find(".fluigicon-trash, .flaticon-trash, [title*='Excluir'], [title*='Remover'], [data-remove]")
         .first();

      if ($btn.length) {
         $btn.click();
      }
   });
}

// EXCLUI TODOS OS ANEXOS DO PROCESSO E LIMPA O ESTADO VISUAL
function excluirTodosAnexosDoProcesso() {
   const $p = parent.$;

   parent.__remocaoEmLoteAnexos = true;

   const $linhas = $p("#attachmentsTable tbody tr").filter(function () {
      return !$p(this).is("[data-empty-message]");
   });

   $linhas.each(function () {
      const $checkbox = $p(this).find("input[type='checkbox']").first();

      if ($checkbox.length) {
         $checkbox.prop("checked", true).trigger("click").trigger("change");
      }
   });

   const $btnExcluir = $p(
      "#ecm-navigation-delete, #ecm-navigation-remove, .ecm-navigation-delete, [title*='Excluir'], [title*='Remover']"
   ).filter(":visible").first();

   if ($btnExcluir.length) {
      $btnExcluir.click();
   } else {
      removerTodosAnexosUmPorUmSemPerguntar();
   }

   confirmarModaisRemocaoEmLote();

   setTimeout(function () {
      limparTodosUploadsVisuais();
      ocultarToastsRemocaoAnexos();
      parent.__remocaoEmLoteAnexos = false;
   }, 2500);
}
