$(window).on("load", function () {

   setTimeout(function () {

      const cnpj = ($("#docCnpj").val() || "").replace(/[^a-zA-Z0-9]/g, "")
.toUpperCase();
      const hiddenExiste = $("#hiddenCnaeSecundario1").length > 0;
      const temValor = $("#hiddenCnaeSecundario1").val();

      // 1. Se existe e tem valor → restaura
      if (hiddenExiste && temValor) {
         restaurarCnaesSecundariosSalvos();
         return;
      }

      // 2. fallback → busca API
      if (cnpj.length === 14) {
         buscarCnpj(cnpj);
      }

   }, 300);

});

let categoriaAnterior = "";

function bindEventos() {
   bindEventosCamposBasicos();
   bindEventosDocumentos();
   bindEventosEndereco();
   bindEventosRetencao();
   bindEventosCnaeSecundario();
   bindEventosGrupoMercadoria();
   bindEventosCamposDinamicos();
   bindEventosUpload();
   bindEventoTrocaCategoriaComAnexos();
}

function existeAnexoIncluido() {
   let anexos = [
      "anxCartaoCnpj",
      "anxCompBanco",
      "anxContrato",
      "anxRgCpf",
      "anxCompEndereco",
      // "anxLaudoPcd",
      // "anxDependentes",
      // "anxCodConduta",
      // "anxAntiCorrupcao",
      // "anxConflito",
      // "anxLgpd"
   ];

   return anexos.some(function (id) {
      return ($("#" + id).val() || "").trim() !== "";
   });
}

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

               categoriaAnterior = novaCategoria;
            });

            return;
         }

         controlarCamposCategoria();
         controlarAlertaCnpj();
         controlarDocumentacaoPorCategoria();
         aplicarAsteriscoObrigatorio();

         categoriaAnterior = novaCategoria;
      });
}

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

function limparTodosUploadsVisuais() {
   $(".upload-area").removeClass("uploaded upload-error");
   $(".upload-file-status").hide().empty();

   Object.values(MAPA_HIDDEN_ANEXOS).forEach(function (hiddenId) {
      $("#" + hiddenId).val("");
      $("#" + hiddenId + "Id").val("");
   });
}

function bindEventosCamposBasicos() {
   $(document).on("input change", ".form-control[required]", function () {
      limparErroCampoObrigatorioPreenchido(this);
   });
   $("#tipo").on("change", controlarRetencaoPorTipo);
}

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
   $("#docCnpj").on("blur keyup", controlarAlertaCnpj);
}

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

function bindEventosEndereco() {
   $("#cep").on("blur", function () {
      const cep = ($(this).val() || "").replaceAll(/\D/g, "");

      if (cep.length !== 8) {
         limpaCamposEndereco();
         return;
      }
      buscarCep(cep);
   });
}

function bindEventosRetencao() {
   $("#toggleRetencao").on("change", function () {
      controlarPainelRetencoes();
      validarPainelRetencaoVisual();
   });

   $(".retencao-item input").on("change", function () {
      $(this)
         .closest(".retencao-item")
         .toggleClass("ativo", this.checked);

      validarPainelRetencaoVisual();
   });
}

function bindEventosCnaeSecundario() {
   $(document).on("click", "#btn-add-cnae", adicionarCnae);
   $(document).on("change", "input[name^='cnaeSecundario']", function () {});
   $(document).on("click", ".btn-remove-cnae", function () {
      $(this).closest(".cnae-secundario-item").remove();

      reordenarCnaesSecundarios();
      controlarBotaoAdicionarCnae();
   });
   $(document).on("input", ".cnae-secundario", function () {

      // só aplica máscara se não estiver bloqueado (validação)
      if (!$(this).hasClass("campo-readonly")) {
         aplicarMascaraCnae($(this));
      }

   });
}

function bindEventosGrupoMercadoria() {
   $(document).on("click", "#btn-add-grupo-mercadoria", function () {
      adicionarGrupoMercadoria();
      sincronizarCamposDinamicosHidden();
   });

   $(document).on("change", ".grupo-mercadoria", function () {
      sincronizarCamposDinamicosHidden();
   });

   $(document).on("click", ".btn-remove-grupo-mercadoria", function () {
      $(this).closest(".grupo-mercadoria-item").remove();

      reordenarGruposMercadoria();
      sincronizarCamposDinamicosHidden();
      controlarBotaoAdicionarGrupoMercadoria();
   });
}
function bindEventosUpload() {

  $(document).off("click", ".upload-file-remove");

  $(document).on("click", ".upload-file-remove", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const sufixoCampo = $(this).data("sufixo");
    const hiddenNome = getHiddenAnexoId(sufixoCampo);
    const docId = $("#" + hiddenNome + "Id").val();

    FLUIGC.message.confirm({
      message: "Deseja remover?",
      title: "Remover"
    }, function (result) {

      if (result) {

        // 🔥 REMOVE DO PROCESSO
        removerAnexoFluigPorId(docId);

        // 🔥 LIMPA VISUAL
        limparCardVisualAnexo(sufixoCampo);

        console.log("Anexo removido:", sufixoCampo, docId);
      }
    });
  });
}

function bindEventosCamposDinamicos() {
   $(document).on(
      "change input",
      "select[name^='grupoMercadoria'], input[name^='cnaeSecundario']",
      sincronizarCamposDinamicosHidden
   );
   sincronizarCamposDinamicosHidden();
}