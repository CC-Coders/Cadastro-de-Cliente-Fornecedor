function inicializarUploadsFluig() {
  $(".upload-area").each(function () {
    const $area = $(this);
    const inputId = $area.data("upload-id");
    const $input = $("#" + inputId);

    if (!$input.length) {
      return;
    }

    $area.off("click").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if ($area.hasClass("disabled-upload")) {
        return;
      }

      uploadAtualFluig = {
        inputId: inputId,
        areaId: $area.attr("id"),
        sufixoCampo: obterSufixoUpload(inputId, $area)
      };

      abrirAnexoNativoFluig();
    });
  });

  monitorarInputNativoFluig();
}
function abrirAnexoNativoFluig() {
  const $inputFluig = parent.$("#ecm-navigation-inputFile-clone");

  if (!$inputFluig.length) {
    FLUIGC.toast({
      title: "Atenção",
      message: "Input nativo de anexos do Fluig não encontrado.",
      type: "warning"
    });
    return;
  }

  $inputFluig.val("");
  $inputFluig.click();
}
function monitorarInputNativoFluig() {
  const $inputFluig = parent.$("#ecm-navigation-inputFile-clone");

  if (!$inputFluig.length) {
    return;
  }

  $inputFluig.off("change.uploadCustomForm").on("change.uploadCustomForm", function () {
    if (!uploadAtualFluig) {
      return;
    }

   const arquivo = this.files && this.files.length ? this.files[0] : null;

if (!arquivo) {
  return;
}

if (!validarArquivoPermitido(arquivo)) {
  const nomeArquivoInvalido = arquivo.name;

  this.value = "";

  setTimeout(function () {
    removerAnexoFluig({
      nomeArquivo: nomeArquivoInvalido,
      documentId: ""
    });
  }, 700);

  uploadAtualFluig = null;
  return;
}

finalizarUploadVisualFluig(uploadAtualFluig, arquivo.name);

    uploadAtualFluig = null;
  });
}
function finalizarUploadVisualFluig(config, nomeArquivo) {
  const $area = $("#" + config.areaId);

  const hiddenNome = getHiddenAnexoId(config.sufixoCampo);
  const hiddenId = hiddenNome + "Id";

  $("#" + hiddenNome).val(nomeArquivo);

  const docId = buscarIdAnexoPorNome(nomeArquivo);

  if (docId) {
    $("#" + hiddenId).val(docId);
  }

  $area.addClass("uploaded").removeClass("upload-error");

  montarStatusAnexo(config.sufixoCampo, nomeArquivo);
}
function buscarIdAnexoPorNome(nomeArquivo) {
  const $p = parent.$;

  const $linha = $p("#attachmentsTable tbody tr").filter(function () {
    return $p(this).text().indexOf(nomeArquivo) !== -1;
  }).first();

  if (!$linha.length) return null;

  return $linha.find("td:eq(1)").text().trim(); 
}
function montarStatusAnexo(sufixoCampo, nomeArquivo) {
  const $status = $("#statusFile" + sufixoCampo);

  if (!$status.length) return;

  $status
    .html(
      '<div class="file-name">' +
        '<span id="nomeFile' + sufixoCampo + '">' + nomeArquivo + '</span>' +
      '</div>' +
      '<div class="file-actions">' +
        '<span class="upload-file-remove" ' +
          'data-input-id="file' + sufixoCampo + '" ' +
          'data-area-id="upload' + sufixoCampo + '" ' +
          'data-sufixo="' + sufixoCampo + '">' +
          '<i class="flaticon flaticon-trash icon-sm"></i> Remover' +
        '</span>' +
      '</div>'
    )
    .show();
  adicionarBotaoVisualizarAnexo(sufixoCampo, nomeArquivo);
}
function restaurarUploadsSalvos() {
  $(".upload-area").each(function () {
    const $area = $(this);
    const inputId = $area.data("upload-id");
    const sufixoCampo = obterSufixoUpload(inputId, $area);
    const hiddenId = getHiddenAnexoId(sufixoCampo);
    const nomeArquivo = hiddenId ? ($("#" + hiddenId).val() || "").trim() : "";

    if (!nomeArquivo || nomeArquivo === "✓" || nomeArquivo === "undefined") {
      $area.removeClass("uploaded upload-error");
      $("#statusFile" + sufixoCampo).hide().empty();
      return;
    }

    $area.addClass("uploaded").removeClass("upload-error");
    montarStatusAnexo(sufixoCampo, nomeArquivo);
  });
}
function getHiddenAnexoId(sufixoCampo) {
  return MAPA_HIDDEN_ANEXOS[sufixoCampo] || "";
}
function garantirCampoNomeAnexo(sufixoCampo) {
  const hiddenId = "hiddenNomeFile" + sufixoCampo;

  if (!$("#" + hiddenId).length) {
    $("#divDocumentacao").append(
      '<input type="hidden" id="' + hiddenId + '" name="' + hiddenId + '">'
    );
  }
}
function adicionarBotaoVisualizarAnexo(sufixoCampo, nomeArquivo) {
  const statusId = "#statusFile" + sufixoCampo;

  if (!$(statusId).length) {
    console.warn("Container não encontrado:", statusId);
    return;
  }

  const atividade = Number($("#atividade").val() || 0);

  const isDownload =
    atividade === ATIVIDADES.INICIO_0 ||
    atividade === ATIVIDADES.INICIO;

  const $status = $(statusId);
  const nomeSeguro = (nomeArquivo || "").replaceAll("'", "\\'");

  const $removeBtn = $status.find(".upload-file-remove").first();

  if (!$removeBtn.length) {
    console.warn("Botão remover não encontrado em:", statusId);
    return;
  }

  const removeHtml = $removeBtn[0].outerHTML;

  $status.find(".file-actions").remove();
  $removeBtn.remove();

  const html =
    '<div class="file-actions">' +
      removeHtml +
      '<button type="button" ' +
        'class="btn-visualizar-anexo" ' +
        'title="' + (isDownload ? 'Baixar anexo' : 'Visualizar anexo') + '" ' +
        'onclick="visualizarAnexoFluig(\'' + nomeSeguro + '\')">' +
        '<i class="fluigicon ' + (isDownload ? 'fluigicon-download' : 'fluigicon-eye-open') + '" style="font-size:13px;"></i>' +
        '<span>' + (isDownload ? 'Baixar' : 'Visualizar') + '</span>' +
      '</button>' +
    '</div>';

  $status.append(html);
}
function visualizarAnexoFluig(nomeArquivo) {
  const $p = parent.$;

  abrirAbaAnexosFluig();

  const $linha = $p("#attachmentsTable tbody tr").filter(function () {
    return $p(this).text().replace(/\s+/g, " ").trim().indexOf(nomeArquivo) !== -1;
  }).first();

  if (!$linha.length) {
    FLUIGC.toast({
      title: "Atenção",
      message: "Anexo não encontrado: " + nomeArquivo,
      type: "warning"
    });
    return;
  }

  const $linkNome = $linha.find("a").filter(function () {
    return $p(this).text().trim().indexOf(nomeArquivo) !== -1;
  }).first();

  if ($linkNome.length) {
    $linkNome[0].click();
    return;
  }

  const $primeiroLink = $linha.find("a").first();

  if ($primeiroLink.length) {
    $primeiroLink[0].click();
    return;
  }

  $linha.trigger("dblclick");
}

let uploadAtualFluig = null;
const MAPA_HIDDEN_ANEXOS = {
  CartaoCnpj: "anxCartaoCnpj",
  ComprovanteBanco: "anxCompBanco",
  ContratoSocial: "anxContrato",
  RgCpf: "anxRgCpf",
  ComprovanteEndereco: "anxCompEndereco",
  LaudoMedicoPcd: "anxLaudoPcd",
  DeclaracaoDependentesIrrf: "anxDependentes",
  CodigoConduta: "anxCodConduta",
  PoliticaAnticorrupcao: "anxAntiCorrupcao",
  ConflitoInteresses: "anxConflito",
  CienciaLgpd: "anxLgpd"
};

function abrirAbaAnexosFluig() {
  parent.$("#tab-attachments, #attachments-tab, a[href='#attachments']").first().click();
}
function obterSufixoUpload(inputId, $area) {
  const areaId = $area.attr("id") || "";

  if (areaId.indexOf("upload") === 0) {
    return areaId.replace("upload", "");
  }

  if (inputId.indexOf("file") === 0) {
    return inputId.replace("file", "");
  }

  return "";
}
function limparStatusUpload(config) {
  const sufixoCampo = config?.sufixoCampo || "";
  const areaId = config?.areaId || "";

  if (!sufixoCampo) {
    return;
  }

  const hiddenNome = getHiddenAnexoId(sufixoCampo);
  const hiddenDocId = hiddenNome ? hiddenNome + "Id" : "";

  const nomeArquivo = hiddenNome ? ($("#" + hiddenNome).val() || "").trim() : "";
  const documentId = hiddenDocId ? ($("#" + hiddenDocId).val() || "").trim() : "";

  removerAnexoFluig({
    nomeArquivo: nomeArquivo,
    documentId: documentId
  });

  if (areaId) {
    $("#" + areaId).removeClass("uploaded upload-error");
  }

  $("#statusFile" + sufixoCampo).hide().empty();

  if (hiddenNome) {
    $("#" + hiddenNome).val("");
  }

  if (hiddenDocId) {
    $("#" + hiddenDocId).val("");
  }
}
function removerAnexoFluig(config) {
  const nomeArquivo = config?.nomeArquivo || "";
  const documentId = config?.documentId || "";
  const $p = parent.$;

  let $linha = $();

  if (documentId) {
    $linha = $p("#attachmentsTable tbody tr").filter(function () {
      return $p(this).text().indexOf(documentId) !== -1;
    }).first();
  }

  if (!$linha.length && nomeArquivo) {
    $linha = $p("#attachmentsTable tbody tr").filter(function () {
      return $p(this).text().replace(/\s+/g, " ").trim().indexOf(nomeArquivo) !== -1;
    }).first();
  }

  if (!$linha.length) {
    console.warn("Anexo não encontrado na tabela do Fluig:", nomeArquivo, documentId);
    return;
  }

  const $btnRemover = $linha.find(
    ".fluigicon-trash, .flaticon-trash, .ecm-attachment-remove, [title*='Remover'], [title*='Excluir'], [data-remove]"
  ).first();

  if ($btnRemover.length) {
    $btnRemover.click();
    return;
  }

  const $checkbox = $linha.find("input[type='checkbox']").first();

  if ($checkbox.length) {
    $checkbox.prop("checked", true).trigger("change");

    $p("#ecm-navigation-delete, #ecm-navigation-remove, .ecm-navigation-delete, [title*='Excluir']")
      .first()
      .click();

    return;
  }

  if (parent.ECM && parent.ECM.attachmentTable && typeof parent.ECM.attachmentTable.removeRow === "function") {
    parent.ECM.attachmentTable.removeRow($linha);
    return;
  }

  console.warn("Não foi possível remover o anexo automaticamente:", nomeArquivo);
}
function validarUploadObrigatorio(campoId, label) {
  const sufixo = campoId.replace("file", "");
  const hiddenId = MAPA_HIDDEN_ANEXOS[sufixo];

  if (!hiddenId) {
    console.warn("Hidden não mapeado para:", campoId);
    return true;
  }

  const valor = ($("#" + hiddenId).val() || "").trim();

  if (!valor) {
    marcarUploadErro(campoId, "Anexo '" + label + "' é obrigatório.");
    return false;
  }

  marcarUploadSucesso(campoId);
  return true;
}
function marcarUploadErro(campoId, mensagem) {
  const $campo = $("#" + campoId);
  const $container = $campo.closest(".fg");
  const $area = $container.find(".upload-area").first();
  const mensagemId = "erro-" + campoId;

  limparErroCampo(campoId);

  $container.addClass("has-error");
  $area.addClass("upload-error").removeClass("uploaded");

  $area.after(
    '<small class="help-block erro-validacao" id="' + mensagemId + '">' +
      mensagem +
    "</small>"
  );
}
function marcarUploadSucesso(campoId) {
  const $campo = $("#" + campoId);
  const $container = $campo.closest(".fg");
  const $area = $container.find(".upload-area").first();

  limparErroCampo(campoId);

  $container.removeClass("has-error");
  $area.removeClass("upload-error").addClass("uploaded");
}

function validarArquivoPermitido(file) {
  const extensoesPermitidas = [".pdf", ".png", ".jpg", ".jpeg"];
  const nomeArquivo = (file.name || "").toLowerCase();

  const extensaoValida = extensoesPermitidas.some(function (ext) {
    return nomeArquivo.endsWith(ext);
  });

  if (!extensaoValida) {
    FLUIGC.toast({
      title: "Arquivo inválido",
      message: "Somente arquivos PDF, PNG, JPG ou JPEG são permitidos.",
      type: "danger",
      timeout: 5000
    });

    return false;
  }

  return true;
}