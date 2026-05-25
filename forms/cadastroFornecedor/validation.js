// CONFIGURAÇÃO DE UPLOADS POR CATEGORIA
const UPLOADS_POR_CATEGORIA = {
   pf: [
      "fileRgCpf",
      "fileComprovanteEndereco",
      "fileLaudoMedicoPcd",
      "fileDeclaracaoDependentesIrrf"
   ],
   pj: [
      "fileCartaoCnpj",
      "fileContratoSocial",
      "fileCodigoConduta",
      "filePoliticaAnticorrupcao",
      "fileConflitoInteresses",
      "fileCienciaLgpd"
   ]
};
const UPLOADS_OBRIGATORIOS = {
   pf: ["fileRgCpf", "fileComprovanteEndereco"],
   pj: ["fileCartaoCnpj", "fileContratoSocial"]
};
const LABELS_UPLOAD = {
   "fileCartaoCnpj":                "Documento de Identificação Júridica",
   "fileContratoSocial":            "Contrato Social",
   "fileRgCpf":                     "Documento de Identificação",
   "fileComprovanteEndereco":       "Comprovante de Endereço",
   "fileComprovanteBanco":          "Comprovante Bancário",
   "fileLaudoMedicoPcd":            "Laudo Médico PCD",
   "fileDeclaracaoDependentesIrrf": "Declaração de Dependentes",
   "fileCodigoConduta":             "Código de Conduta",
   "filePoliticaAnticorrupcao":     "Política Anticorrupção",
   "fileConflitoInteresses":        "Conflito de Interesses",
   "fileCienciaLgpd":               "Ciência LGPD"
};


// INDICADORES VISUAIS
function aplicarAsteriscoObrigatorio() {
   $("label .req").remove();

   $(".form-control, input, select, textarea").each(function () {
      const $campo = $(this);
      const isRequired = $campo.prop("required");

      if (!isRequired) return;

      const $label = $campo.closest(".fg").find("label").first();

      if (!$label.length) return;

      $label.append(' <span class="req">*</span>');
   });
}


// EXIBIÇÃO E LIMPEZA DE ERROS INLINE
function exibirErroCampo(campoId, mensagem) {
   const $campo = $("#" + campoId);
   const $container = $campo.closest(".fg");
   const mensagemId = "erro-" + campoId;

   // remove qualquer erro antigo do mesmo campo
   $("#" + mensagemId).remove();
   $container.find(".erro-validacao").remove();

   $container.addClass("has-erro");
   $campo.attr("aria-invalid", "true");

   // Se o campo está dentro de um .input-btn-row, insere o erro APÓS a linha
   // (não entre o campo e o botão "Adicionar")
   const $inputBtnRow = $campo.closest(".input-btn-row");
   const $insertAfter = $inputBtnRow.length ? $inputBtnRow : $campo;

   $insertAfter.after(
      '<small class="help-block erro-validacao" id="' + mensagemId + '">' +
      mensagem +
      "</small>"
   );
}
function focusCampoComErro() {
   const $primeiroErro = $(".fg.has-erro:visible")
      .first()
      .find("input, select, textarea")
      .first();

   if ($primeiroErro.length) {
      $primeiroErro.focus();
   }
}
function validarCampoObrigatorio(campoId, label) {
   const $campo = $("#" + campoId);

   if (!$campo.length) return true;

   const valor = ($campo.val() || "").trim();

   if (!$campo.is(":visible") || $campo.prop("readonly")) {
      return true;
   }

   if (!valor) {
      exibirErroCampo(campoId, "Campo '" + label + "' é obrigatório.");
      return false;
   }

   return true;
}


// VALIDAÇÕES POR SEÇÃO
function validarDocumentosPorCategoria() {
   const categoria = ($("#categoria").val() || "").trim();
   const estrangeiro = $("#toggleEstrangeiro").is(":checked");

   if (categoria === "F") {
      return validarListaCampos([
         { id: "docCpf", label: "CPF" },
         { id: "docRg", label: "RG" }
      ]);
   }

   if (categoria === "J" && estrangeiro) {
      return validarListaCampos([
         { id: "docEstrangeiro", label: "Documento Estrangeiro" }
      ]);
   }

   if (categoria === "J") {
      return validarListaCampos([
         { id: "docCnpj", label: "CNPJ" }
      ]);
   }

   return true;
}
function limparUploadsCategoria(tipo) {
   const campos = UPLOADS_POR_CATEGORIA[tipo] || [];

   campos.forEach(function (campoId) {
      const $campo = $("#" + campoId);

      if (!$campo.length) {
         return;
      }

      const $area = $campo.closest(".fg").find(".upload-area").first();
      const areaId = $area.attr("id") || "";
      const sufixoCampo = campoId.replace("file", "");

      limparStatusUpload({
         inputId: campoId,
         areaId: areaId,
         sufixoCampo: sufixoCampo
      });

      limparErroCampo(campoId);
   });
}
function validarListaCampos(campos) {
   let valido = true;

   campos.forEach(campo => {
      if (typeof campo.skipWhen === "function" && campo.skipWhen()) {
         return; // pula campo condicional
      }
      if (!validarCampoObrigatorio(campo.id, campo.label)) {
         valido = false;
      }
   });

   return valido;
}
function validarPreCadastro(exibirToast) {
   limparErrosPreCadastro();

   const estrangeiro = $("#toggleEstrangeiro").is(":checked");
   const categoria   = ($("#categoria").val() || "").trim();
   const modoEstrangeiro = (categoria === "J" && estrangeiro);

   const camposCliente = [
      { id: "classificacao",          label: "Classificação"              },
      { id: "categoria",              label: "Categoria"                  },
      { id: "tipo",                   label: "Tipo"                       },
      { id: "classificacaoOperacional", label: "Classificação Operacional" }
   ];

   // Campos comuns a ambos os modos
   const camposEndereco = [
      { id: "razaoSocial",  label: "Razão Social" },
      { id: "nomeFantasia", label: "Nome Fantasia" },
      { id: "endereco",     label: "Endereço"      },
      { id: "numero",       label: "Número"        },
      { id: "bairro",       label: "Bairro"        },
      { id: "cidade",       label: "Cidade"        }
   ];

   if (modoEstrangeiro) {
      // Modo estrangeiro: valida select de país; CEP e Estado são opcionais
      camposEndereco.push({ id: "selectPaisEstrangeiro", label: "País" });
   } else {
      // Modo nacional: valida CEP, campo País (input readonly) e Estado
      camposEndereco.push({ id: "cep",    label: "CEP"    }, { id: "pais",   label: "País"   }, { id: "estado", label: "Estado" });
   }

   let valido = true;

   if (!validarListaCampos(camposCliente))   valido = false;
   if (!validarDocumentosPorCategoria())     valido = false;
   if (!validarListaCampos(camposEndereco))  valido = false;

   if (!valido && exibirToast) {
      FLUIGC.toast({
         title: "Atenção",
         message: "Preencha todos os campos obrigatórios para avançar.",
         type: "warning",
         timeout: 3000
      });
   }

   return valido;
}
function validarDadosCadastrais() {
   limparErrosDadosCadastrais();

   const camposFiscais = [{
         id: "icms",
         label: "Contribuinte ICMS"
      },
      {
         id: "selectDescricaoIrrf",
         label: "Código de Receita IRRF"
      },
      {
         id: "simplesNacional",
         label: "Simples Nacional"
      },
      {
         id: "naturezaRendimento",
         label: "Natureza de Rendimentos"
      },
      {
         id: "regimeFiscal",
         label: "Regime Fiscal"
      },
      {
         id: "tipoDocEmitido",
         label: "Tipo de Documento Emitido"
      }
   ];

   const camposComerciais = [
      {
         id: "grupoMercadoria1",
         label: "Grupo de Mercadoria",
         skipWhen: function () { return ($("#classificacao").val() || "") === "1"; }
      },
      {
         id: "cnaePrincipal",
         label: "CNAE Principal",
         skipWhen: function () {
            const cat = ($("#categoria").val() || "");
            const estrangeiro = $("#toggleEstrangeiro").is(":checked");
            const isCliente = ($("#classificacao").val() || "") === "1";
            return isCliente || cat === "F" || (cat === "J" && estrangeiro);
         }
      }
   ];

   const camposFinanceiros = [
      {
         id: "banco",
         label: "Banco"
      },
      {
         id: "agencia",
         label: "Agência"
      },
      {
         id: "conta",
         label: "Conta"
      }
   ];

   const camposContato = [
      {
         id: "telefone",
         label: "Telefone"
      },
      {
         id: "emailAdministrativo",
         label: "E-mail Administrativo"
      },
      {
         id: "emailComercial",
         label: "E-mail Comercial"
      }
   ];

   let valido = true;

   if (!validarListaCampos(camposFiscais)) valido = false;
   if (!validarListaCampos(camposComerciais)) valido = false;

   // Verifica o toggle via hidden field E via nativo (OR) — cobre tanto a situação
   // onde o Fluig restaura só o checkbox nativo quanto onde o JS já populou o hidden
   const retencaoAtiva = $("#hiddenToggleRetencao").val() === "on"
                      || $("#toggleRetencao").is(":checked");

   if (retencaoAtiva) {
      const PARES_IMPOSTO = [
         { hidden: "#hiddenIss",       nativo: "#iss"       },
         { hidden: "#hiddenInss",      nativo: "#inss"      },
         { hidden: "#hiddenInputIrrf", nativo: "#inputIrrf" },
         { hidden: "#hiddenCsll",      nativo: "#csll"      },
         { hidden: "#hiddenPis",       nativo: "#pis"       },
         { hidden: "#hiddenCofins",    nativo: "#cofins"    }
      ];
      const algumSelecionado = PARES_IMPOSTO.some(function (p) {
         return $(p.hidden).val() === "on" || $(p.nativo).is(":checked");
      });

      if (!algumSelecionado) {
         $("#erroMinimoImposto").show();
         $("#divRetencoesPanel").addClass("retencao-erro");
         valido = false;
      }
   }

   // Cliente não tem dados bancários — pula validação bancária
   const isCliente = ($("#classificacao").val() || "") === "1";
   if (!isCliente && !validarListaCampos(camposFinanceiros)) valido = false;

   if (!validarListaCampos(camposContato)) valido = false;

   return valido;
}
function validarPainelRetencaoVisual() {
   const ativo = $("#hiddenToggleRetencao").val() === "on"
              || $("#toggleRetencao").is(":checked");

   if (!ativo) {
      $("#divRetencoesPanel").removeClass("retencao-erro");
      $("#erroMinimoImposto").hide();
      return true;
   }

   const PARES_IMPOSTO = [
      { hidden: "#hiddenIss",       nativo: "#iss"       },
      { hidden: "#hiddenInss",      nativo: "#inss"      },
      { hidden: "#hiddenInputIrrf", nativo: "#inputIrrf" },
      { hidden: "#hiddenCsll",      nativo: "#csll"      },
      { hidden: "#hiddenPis",       nativo: "#pis"       },
      { hidden: "#hiddenCofins",    nativo: "#cofins"    }
   ];
   const algumSelecionado = PARES_IMPOSTO.some(function (p) {
      return $(p.hidden).val() === "on" || $(p.nativo).is(":checked");
   });

   $("#divRetencoesPanel").toggleClass("retencao-erro", !algumSelecionado);

   if (algumSelecionado) {
      $("#erroMinimoImposto").hide();
   }

   return algumSelecionado;
}
function validarEtapaAtual(exibirToast) {
   if (exibirToast === undefined) {
      exibirToast = true;
   }

   sincronizarCamposDinamicosHidden();

   const paginaAtual = getStepAtual();

   if (paginaAtual === 1) {
      return validarPreCadastro(exibirToast);
   }

   if (paginaAtual === 2) {
      return validarDadosCadastrais(exibirToast);
   }

   if (paginaAtual === 3) {
      // Cliente não tem step 3 — nunca deve chegar aqui, mas por segurança retorna true
      if (($("#classificacao").val() || "") === "1") return true;
      return validarDocumentacao(exibirToast);
   }

   if (paginaAtual === 4) {
      return validarHistoricoDecisao(exibirToast);
   }

   return true;
}
function controlarDocumentacaoPorCategoria() {
   const categoria = ($("#categoria").val() || "").trim();

   const $containerDocs = $("#divAnexosDocumentos .grid");
   const $containerConf = $("#divConformidadeEtica .grid");

   $(".doc-pf, .doc-pj, .conformidade-pf, .conformidade-pj").hide();

   if (categoria === "F") {
      $(".doc-pf, .conformidade-pf").show();
      $(".doc-pj:not(.doc-pf), .conformidade-pj:not(.conformidade-pf)").hide();

      $containerDocs.addClass("grid-pf");
      $containerConf.addClass("grid-pf");

      limparUploadsCategoria("pj");
      $("#divFileComprovanteBanco").show();

      return;
   }

   if (categoria === "J") {
      $(".doc-pj, .conformidade-pj").show();
      $(".doc-pf:not(.doc-pj), .conformidade-pf:not(.conformidade-pj)").hide();

      $containerDocs.removeClass("grid-pf");
      $containerConf.removeClass("grid-pf");

      limparUploadsCategoria("pf");
      $("#divFileComprovanteBanco").show();

      return;
   }

   $containerDocs.removeClass("grid-pf");
   $containerConf.removeClass("grid-pf");
}
function validarDocumentacao() {
   let valido = true;
   const categoria = ($("#categoria").val() || "").trim();

   if (!validarUploadObrigatorio("fileComprovanteBanco", LABELS_UPLOAD["fileComprovanteBanco"])) {
      valido = false;
   }

   const tipo = categoria === "F" ? "pf" : "pj";
   const campos = UPLOADS_OBRIGATORIOS[tipo] || [];

   campos.forEach(function (campoId) {
      const label = LABELS_UPLOAD[campoId] || campoId;
      if (!validarUploadObrigatorio(campoId, label)) {
         valido = false;
      }
   });

   return valido;
}
function limparErroCampo(campoId) {
   const $campo = $("#" + campoId);
   const $container = $campo.closest(".fg");

   $container.removeClass("has-erro");
   $campo.removeAttr("aria-invalid");

   $("#erro-" + campoId).remove();
   $container.find(".erro-validacao").remove();
}
function limparErrosPreCadastro() {
   const camposPreCadastro = [
      "classificacao",
      "categoria",
      "tipo",
      "classificacaoOperacional",
      "docCpf",
      "docCnpj",
      "docRg",
      "docInscricaoEstadual",
      "razaoSocial",
      "nomeFantasia",
      "cep",
      "endereco",
      "numero",
      "bairro",
      "cidade",
      "pais",
      "selectPaisEstrangeiro",
      "estado"
   ];

   camposPreCadastro.forEach(function (campoId) {
      limparErroCampo(campoId);
   });
}
function limparErrosDadosCadastrais() {
   const camposDadosCadastrais = [
      "icms",
      "selectDescricaoIrrf",
      "simplesNacional",
      "naturezaRendimento",
      "regimeFiscal",
      "tipoDocEmitido",

      "grupoMercadoria1",
      "cnaePrincipal",
      "banco",
      "agencia",
      "conta",
      "telefone",
      "telComercial",
      "celular",
      "emailAdministrativo",
      "emailComercial",
      "emailCr",
      "emailJuridico"
   ];
   camposDadosCadastrais.forEach(function (campoId) {
      limparErroCampo(campoId);
   });
}
function aplicarStatusCampo(campoId, valido) {
   const $campo = $("#" + campoId);
   const $container = $campo.closest(".fg");

   $container.removeClass("has-erro has-success");

   if (valido === true) {
      $container.addClass("has-success");
      limparErroCampo(campoId);
   }

   if (valido === false) {
      $container.addClass("has-erro");
   }
}


// ALGORITMOS DE VALIDAÇÃO DE DOCUMENTOS FISCAIS
function validarCPF(cpf) {
   cpf = cpf.replaceAll(/[^\d]+/g, '');

   if (cpf.length !== 11) return false;
   if (/^(\d)\1+$/.test(cpf)) return false;

   let soma = 0;
   let resto;

   for (let i = 1; i <= 9; i++) {
      soma += Number.parseInt(cpf.substring(i - 1, i)) * (11 - i);
   }

   resto = (soma * 10) % 11;
   if (resto == 10 || resto == 11) resto = 0;
   if (resto != Number.parseInt(cpf.substring(9, 10))) return false;

   soma = 0;

   for (let i = 1; i <= 10; i++) {
      soma += Number.parseInt(cpf.substring(i - 1, i)) * (12 - i);
   }

   resto = (soma * 10) % 11;
   if (resto == 10 || resto == 11) resto = 0;

   return resto == Number.parseInt(cpf.substring(10, 11));
}
function validarCNPJ(cnpj) {
   cnpj = cnpj.replaceAll(/[^\d]+/g, '');

   if (cnpj.length !== 14) return false;

   if (/^(\d)\1+$/.test(cnpj)) return false;

   let tamanho = cnpj.length - 2;
   let numeros = cnpj.substring(0, tamanho);
   let digitos = cnpj.substring(tamanho);

   let soma = 0;
   let pos = tamanho - 7;

   for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
   }

   let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
   if (resultado != digitos.charAt(0)) return false;

   tamanho = tamanho + 1;
   numeros = cnpj.substring(0, tamanho);

   soma = 0;
   pos = tamanho - 7;

   for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
   }

   resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

   return resultado == digitos.charAt(1);
}
function validarHistoricoDecisao(exibirToast) {
   const atividade = Number($("#atividade").val() || 0);

   if (atividade !== ATIVIDADES.VALIDACAO) {
      return true;
   }

   let valido = true;

   if (!validarCampoObrigatorio("observacaoValidacao", "Observações")) valido = false;
   if (!validarCampoObrigatorio("selectDecisao", "Ação")) valido = false;

   if (!valido && exibirToast) {
      FLUIGC.toast({
         title: "Atenção",
         message: "Preencha os campos obrigatórios antes de avançar.",
         type: "warning",
         timeout: 3000
      });
   }

   return valido;
}