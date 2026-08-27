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

// ADICIONA ASTERISCO EM CAMPOS OBRIGATÓRIOS
function aplicarAsteriscoObrigatorio() {
   $("label .req").remove();

   // O Selectize deixa dois campos obrigatórios dentro do mesmo .fg (o <select> nativo
   // escondido e o input de busca que ele gera), o que rendia dois asteriscos no rótulo.
   // O guard abaixo marca cada rótulo uma única vez, sem precisar excluir nenhum campo.
   $(".form-control, input, select, textarea").each(function () {
      const $campo = $(this);

      if (!$campo.prop("required")) return;

      const $label = $campo.closest(".fg").find("label").first();

      if (!$label.length || $label.find(".req").length) return;

      $label.append(' <span class="req">*</span>');
   });
}

// DEFINE DEPOIS DE QUAL ELEMENTO A MENSAGEM DE ERRO É INSERIDA.
// Num select com busca o <select> nativo fica escondido ANTES da UI do Selectize, dentro
// do mesmo .select-wrap: inserir logo após ele jogaria a mensagem entre o rótulo e o campo.
function $insertAfterErro($campo) {
   const $inputBtnRow = $campo.closest(".input-btn-row");
   if ($inputBtnRow.length) return $inputBtnRow;

   const $selectWrap = $campo.closest(".select-wrap");
   if ($selectWrap.length) return $selectWrap;

   const $selectize = $campo.siblings(".selectize-control");
   if ($selectize.length) return $selectize;

   return $campo;
}

// EXIBE ERRO INLINE EM UM CAMPO
function exibirErroCampo(campoId, mensagem) {
   const $campo = $("#" + campoId);
   const $container = $campo.closest(".fg");
   const mensagemId = "erro-" + campoId;

   $("#" + mensagemId).remove();
   $container.find(".erro-validacao").remove();

   $container.addClass("has-erro");
   $campo.attr("aria-invalid", "true");
   // Campos fora de um wrapper .fg (ex.: observacaoValidacao no Histórico) não têm
   // .has-erro pra se apoiar visualmente — usam .campo-erro no próprio campo,
   // padrão de Auxílio-Alimentação/Férias (ver #motivo em historico.css).
   $campo.addClass("campo-erro");

   $insertAfterErro($campo).after(
      '<small class="help-block erro-validacao" id="' + mensagemId + '">' +
      mensagem +
      "</small>"
   );
}

// DÁ FOCO AO PRIMEIRO CAMPO COM ERRO VISÍVEL.
function focusCampoComErro() {
   const $fgComErro = $(".fg.has-erro:visible").first();

   // Num select com busca o <select> nativo está escondido e não aceita foco:
   // quem recebe é o input gerado pelo Selectize.
   let $primeiroErro = $fgComErro.find(".selectize-input input").first();

   if (!$primeiroErro.length) {
      $primeiroErro = $fgComErro.find("input, select, textarea").first();
   }

   // Campos fora de .fg (ex.: observacaoValidacao) marcam erro com .campo-erro no próprio campo.
   if (!$primeiroErro.length) {
      $primeiroErro = $(".campo-erro:visible").first();
   }

   if ($primeiroErro.length) {
      $primeiroErro.focus();
   }
}

// INDICA SE O CAMPO ESTÁ VISÍVEL PARA O USUÁRIO.
// O Selectize esconde o <select> nativo e desenha a própria UI ao lado: nesse caso
// ":visible" no select é sempre falso, e quem responde pela visibilidade é o controle
// gerado. Sem isso todo select com busca escapava da validação de obrigatório.
function _campoVisivelParaUsuario($campo) {
   if ($campo.is(":visible")) return true;

   const $selectize = $campo.siblings(".selectize-control");
   return $selectize.length > 0 && $selectize.is(":visible");
}

// VALIDA UM CAMPO OBRIGATÓRIO
function validarCampoObrigatorio(campoId, label) {
   const $campo = $("#" + campoId);

   if (!$campo.length) return true;

   const valor = ($campo.val() || "").trim();

   if (!_campoVisivelParaUsuario($campo) || $campo.prop("readonly")) {
      return true;
   }

   if (!valor) {
      exibirErroCampo(campoId, "Campo '" + label + "' é obrigatório.");
      return false;
   }

   return true;
}

// VALIDA OS DOCUMENTOS OBRIGATÓRIOS POR CATEGORIA (PF/PJ) E POR ESTRANGEIRO.
function validarDocumentosPorCategoria() {
   const categoria = ($("#categoria").val() || "").trim();
   const estrangeiro = $("#toggleEstrangeiro").is(":checked");

   if (categoria === "F") {
      let valido = validarListaCampos([
         { id: "docCpf",        label: "CPF"                  },
         { id: "docRg",         label: "RG"                   },
         { id: "dtNascimento",  label: "Data de Nascimento"   },
         { id: "estadoCivil",   label: "Estado Civil"         },
         { id: "docRgOrgao",    label: "Órgão Emissor do RG"  },
         { id: "docRgUf",       label: "UF Emissora do RG"    }
      ]);

      // Data de nascimento não pode ser futura (bloqueia o envio).
      const dtNasc = $("#dtNascimento").val();
      const hoje   = new Date().toISOString().split("T")[0];
      if (dtNasc && dtNasc > hoje) {
         exibirErroCampo("dtNascimento", "A data de nascimento não pode ser futura.");
         valido = false;
      }

      return valido;
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

// LIMPAR OS UPLOADS DE UMA CATEGORIA AO TROCAR DE CATEGORIA
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

// VALIDA UMA LISTA DE CAMPOS (id + label) E RETORNA TRUE SE TODOS ESTIVEREM PREENCHIDOS.
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

// VALIDA A DESCRIÇÃO DOS ENDEREÇOS ADICIONAIS — é ela que nomeia o endereço no RM,
// então um card preenchido sem descrição não pode passar. Card ainda vazio é ignorado.
function validarDescricaoEnderecosExtras() {
   let valido = true;

   $("#enderecos-cards .endereco-extra").each(function (index) {
      const numero = index + 2;
      const sufixo = String(numero);

      const cep = ($("#cep" + sufixo).val() || "").trim();
      const rua = ($("#endereco" + sufixo).val() || "").trim();
      if (!cep && !rua) return;

      const rotulo = (typeof _rotuloEndereco === "function")
         ? _rotuloEndereco(numero)
         : ("Endereço " + numero);

      if (!validarCampoObrigatorio("descricaoEndereco" + sufixo, "Descrição do " + rotulo)) {
         valido = false;
      }
   });

   return valido;
}

// VALIDA A ETAPA 1
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

   const camposEndereco = [
      { id: "razaoSocial",       label: "Razão Social"           },
      { id: "nomeFantasia",      label: "Nome Fantasia"          },
      { id: "endereco",          label: "Endereço"               },
      { id: "numero",            label: "Número"                 },
      { id: "bairro",            label: "Bairro"                 },
      { id: "cidade",            label: "Cidade"                 }
   ];

   if (!modoEstrangeiro) {
      camposEndereco.push({ id: "cep",    label: "CEP"    }, { id: "pais",   label: "País"   }, { id: "estado", label: "Estado" });
   }

   let valido = true;

   if (!validarListaCampos(camposCliente))   valido = false;
   if (!validarDocumentosPorCategoria())     valido = false;
   if (!validarListaCampos(camposEndereco))  valido = false;
   if (!validarDescricaoEnderecosExtras())   valido = false;

   if (!valido && exibirToast) _toastCamposObrigatorios();

   return valido;
}

const PARES_IMPOSTO = [
   { hidden: "#hiddenInss",      nativo: "#inss"      },
   { hidden: "#hiddenCsll",      nativo: "#csll"      },
   { hidden: "#hiddenPis",       nativo: "#pis"       },
   { hidden: "#hiddenCofins",    nativo: "#cofins"    }
];

// INDICA SE O TOGGLE DE RETENÇÃO ESTÁ ATIVO (ON) OU NÃO (OFF)
function _retencaoAtiva() {
   return $("#hiddenToggleRetencao").val() === "on" || $("#toggleRetencao").is(":checked");
}

// ATALHO PARA MOSTRAR O BANNER DE ALERTA DE CAMPOS OBRIGATÓRIOS (substitui o toast estreito do Fluig)
function _toastCamposObrigatorios() {
   mostrarBannerAlerta("Preencha todos os campos obrigatórios para avançar.");
}

// BANNER DE ALERTA NO TOPO DO FORMULÁRIO 
function mostrarBannerAlerta(msg) {
   var $b = $("#bannerAlerta");
   if (!$b.length) {
      FLUIGC.toast({ title: "Atenção", message: msg, type: "warning", timeout: 3000 });
      return;
   }
   $("#bannerAlertaMsg").text(msg || "Preencha todos os campos obrigatórios para avançar.");
   $b.show();
   try { $b[0].scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) { }
}

// ESCONDE O BANNER DE ALERTA 
function esconderBannerAlerta() {
   $("#bannerAlerta").hide();
}

// VALIDA OS DADOS BANCÁRIOS (etapa 2) — cada card de conta bancária deve ter Banco, Agência e Conta preenchidos
function validarDadosBancarios() {

   if (!$("#divDadosBancarios").is(":visible")) return true;

   // Cliente: dados bancários são opcionais — só valida o card se algo nele foi preenchido.
   const isCliente = ($("#classificacao").val() || "").trim() === "1";
   let valido = true;

   $("#dados-bancarios-cards .bank-card").each(function (index) {
      const numero = index + 1;
      const sufixo = numero === 1 ? "" : String(numero);

      if (isCliente) {
         const banco   = ($("#selectBancoNome" + sufixo).val() || "").trim();
         const agencia = ($("#agencia"         + sufixo).val() || "").trim();
         const conta   = ($("#conta"           + sufixo).val() || "").trim();
         if (!banco && !agencia && !conta) return;
      }

      if (!validarCampoObrigatorio("selectBancoNome" + sufixo, "Nome do Banco (Conta " + numero + ")")) valido = false;
      if (!validarCampoObrigatorio("agencia"          + sufixo, "Agência (Conta " + numero + ")"))       valido = false;
      if (!validarCampoObrigatorio("conta"            + sufixo, "Conta (Conta " + numero + ")"))         valido = false;
   });

   return valido;
}

// VALIDA A ETAPA 2 (DADOS CADASTRAIS) — fiscais, comerciais, contatos e contas bancárias
function validarDadosCadastrais(exibirToast) {
   limparErrosDadosCadastrais();

   const camposFiscais = [{
         id: "icms",
         label: "Contribuinte ICMS",
         // PF não tem Contribuinte ICMS.
         skipWhen: function () { return ($("#categoria").val() || "") === "F"; }
      },
      {
         id: "selectDescricaoIrrf",
         label: "Código de Receita IRRF"
      },

      {
         id: "naturezaRendimento",
         label: "Natureza de Rendimentos",

         // A Natureza é preenchida pelo Suprimentos na Validação, e nunca para RDO.
         skipWhen: function () { return ehTipoRDO() || !ehEtapaValidacao(); }
      },
      {
         id: "regimeFiscal",
         label: "Regime Fiscal",
         // PF não tem Regime Fiscal.
         skipWhen: function () { return ($("#categoria").val() || "") === "F"; }
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

   if (_retencaoAtiva()) {
      const algumSelecionado = PARES_IMPOSTO.some(function (p) {
         return $(p.hidden).val() === "on" || $(p.nativo).is(":checked");
      });

      if (!algumSelecionado) {
         $("#erroMinimoImposto").show();
         $("#divRetencoesPanel").addClass("retencao-erro");
         valido = false;
      }
   }

   if (!validarDadosBancarios()) valido = false;

   if (!validarListaCampos(camposContato)) valido = false;

   if (!valido && exibirToast) _toastCamposObrigatorios();

   return valido;
}

// ATUALIZA O ESTADO VISUAL DO PAINEL DE RETENÇÕES (erro se ativo e nenhum imposto selecionado)
function validarPainelRetencaoVisual() {
   if (!_retencaoAtiva()) {
      $("#divRetencoesPanel").removeClass("retencao-erro");
      $("#erroMinimoImposto").hide();
      return true;
   }

   const algumSelecionado = PARES_IMPOSTO.some(function (p) {
      return $(p.hidden).val() === "on" || $(p.nativo).is(":checked");
   });

   $("#divRetencoesPanel").toggleClass("retencao-erro", !algumSelecionado);

   if (algumSelecionado) {
      $("#erroMinimoImposto").hide();
   }

   return algumSelecionado;
}

// DIRECCIONA A VALIDAÇÃO PARA A ETAPA ATUAL (1, 2, 3 ou 4) E EXIBE TOAST DE ALERTA SE HOUVER ERROS
function validarEtapaAtual(exibirToast) {
   if (exibirToast === undefined) {
      exibirToast = true;
   }

   if (exibirToast) {
      esconderBannerAlerta();
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

      if (($("#classificacao").val() || "") === "1") return true;
      return validarDocumentacao(exibirToast);
   }

   if (paginaAtual === 4) {
      return validarHistoricoDecisao(exibirToast);
   }

   return true;
}

// ALTERA A VISIBILIDADE DOS DOCUMENTOS E CONFORMIDADES DE ACORDO COM A CATEGORIA (PF/PJ)
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

// VALIDA A ETAPA 3 (DOCUMENTAÇÃO) — exige todos os uploads obrigatórios por categoria (PF/PJ) e o comprovante bancário
function validarDocumentacao(exibirToast) {
   // Na edição não há etapa de Documentação (o CFO já existe no RM com os anexos).
   if (typeof ehModoEdicao === "function" && ehModoEdicao()) {
      return true;
   }

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

   if (!valido && exibirToast) {
      FLUIGC.toast({
         title: "Atenção",
         message: "Anexe todos os documentos obrigatórios para avançar.",
         type: "warning",
         timeout: 3000
      });
   }

   return valido;
}

// REMOVE O ESTADO DE ERRO DE UM CAMPO (inline) — remove a classe has-erro, o aria-invalid e a mensagem de erro
function limparErroCampo(campoId) {
   const $campo = $("#" + campoId);
   const $container = $campo.closest(".fg");

   $container.removeClass("has-erro");
   $campo.removeAttr("aria-invalid");
   $campo.removeClass("campo-erro");

   $("#erro-" + campoId).remove();
   $container.find(".erro-validacao").remove();
}

// LIMPA OS ERROS INLINE DA ETAPA 1 (pré-cadastro: classificação, categoria, tipo, documentos e endereço)
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

   $("#enderecos-cards .endereco-extra").each(function (index) {
      limparErroCampo("descricaoEndereco" + (index + 2));
   });
}

// LIMPA OS ERROS INLINE DA ETAPA 2
function limparErrosDadosCadastrais() {
   const camposDadosCadastrais = [
      "icms",
      "selectDescricaoIrrf",
      "naturezaRendimento",
      "regimeFiscal",
      "tipoDocEmitido",

      "grupoMercadoria1",
      "cnaePrincipal",
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

   $("#dados-bancarios-cards .bank-card").each(function (index) {
      const numero = index + 1;
      const sufixo = numero === 1 ? "" : String(numero);
      limparErroCampo("selectBancoNome" + sufixo);
      limparErroCampo("agencia" + sufixo);
      limparErroCampo("conta" + sufixo);
   });
}

// DEFINE O ESTADO VISUAL DE UM CAMPO
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

// VALIDA O CPF PELOS 2 DÍGITOS VERIFICADORES (rejeita sequências repetidas)
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

// VALIDA O CNPJ PELOS 2 DÍGITOS VERIFICADORES (rejeita sequências repetidas)
function validarCNPJ(cnpj) {

   cnpj = cnpj.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
   if (cnpj.length !== 14) return false;
   if (/[A-Z]/.test(cnpj)) return true;
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
// BEFORE SEND VALIDATE — chamado pelo Fluig antes de enviar o processo para a próxima etapa
globalThis.beforeSendValidate = function (numState, nextState) {
   sincronizarTipoSelecionado();
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

      // Observação obrigatória só na reprovação: é ela que justifica a correção.
      if (decisao === "Correcao") {
         if (!validarCampoObrigatorio("observacaoValidacao", "Observações")) { valido = false; erroDecisao = true; }
      } else {
         limparErroCampo("observacaoValidacao");
      }

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

// VALIDA A ETAPA 4 (HISTÓRICO E DECISÃO)
function validarHistoricoDecisao(exibirToast) {
   if (!ehEtapaValidacao()) return true;

   let valido = true;

   const decisao = ($("#selectDecisao").val() || "").trim();

   // A observação justifica a reprovação, então só é exigida nela — aprovar não precisa.
   if (decisao === "Correcao") {
      if (!validarCampoObrigatorio("observacaoValidacao", "Observações")) valido = false;
   } else {
      limparErroCampo("observacaoValidacao");
   }

   if (!validarCampoObrigatorio("selectDecisao", "Ação")) valido = false;

   // Natureza de Rendimentos: o Suprimentos deve preenchê-la antes de "Enviar ao RM" (exceto RDO).
   const enviandoAoRM = decisao === "enviarRm";
   if (enviandoAoRM && !ehTipoRDO() &&
       !validarCampoObrigatorio("naturezaRendimento", "Natureza de Rendimentos")) {
      valido = false;
   }

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