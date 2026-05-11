// GRUPO DE MERCADORIA 
function obterOpcoesGrupoMercadoria() {
   const opcoesHtml = OPCOES_GRUPO_MERCADORIA.map(function (opcao) {
      return `<option value="${opcao}">${opcao}</option>`;
   }).join("");

   return `<option value="">Selecione...</option>${opcoesHtml}`;
}
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

   sincronizarCamposDinamicosHidden();
   controlarBotaoAdicionarGrupoMercadoria();
}
function reordenarGruposMercadoria() {
   // index + 2 porque o item fixo do HTML é o "Grupo de Mercadoria 1"
   $("#grupo-mercadoria-wrap .grupo-mercadoria-item").each(function (index) {
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
   sincronizarCamposDinamicosHidden();
}
function reordenarCnaesSecundarios() {
   $("#cnae-secundarios-wrap .cnae-secundario-item").each(function (index) {
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

   let linhasHistorico = getLinhasHistorico();
   linhasHistorico = linhasHistorico.reverse();

   for (const linha of linhasHistorico) {
      const html = geraHtmlHistorico(linha);

      $("#divLinhasHistorico").append(html);

      try {
         $(".divImageUser:last").append(await promiseBuscaImagemUsuario(linha.USUARIO));
      } catch (error) {
         console.warn("Não foi possível carregar imagem do usuário:", linha.USUARIO, error);
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
   $("#docCnpj").mask("AA.AAA.AAA/AAAA-00");
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
      id: "irrf",
      label: "Alíquota IRRF"
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
   },

   {
      id: "moeda",
      label: "Moeda do Pedido"
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
      id: "hiddenGrupoMercadoria10",
      label: "Grupo de Mercadoria 10"
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
      id: "iss",
      label: "Retenção ISS",
      tipo: "checkbox"
   },
   {
      id: "inss",
      label: "Retenção INSS",
      tipo: "checkbox"
   },
   {
      id: "inputIrrf",
      label: "Retenção IRRF",
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

   {
      id: "condicaoPagamento",
      label: "Condição de Pagamento"
   },
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
   },

   {
      id: "telefone",
      label: "Telefone"
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
      label: "Anexo Cartão CNPJ"
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
function sincronizarCamposDinamicosHidden() {
   for (let i = 2; i <= LIMITE_GRUPO_MERCADORIA; i++) {
      const $select = $("#grupoMercadoria" + i);
      const $hidden = $("#hiddenGrupoMercadoria" + i);

      if (!$hidden.length) continue;

      // Só atualiza se o campo existir na tela
      if ($select.length) {
         $hidden.val(($select.val() || "").trim());
      }
   }

   for (let i = 1; i <= window.LIMITE_CNAE_SECUNDARIO; i++) {
      const $campo = $("#cnaeSecundario" + i);
      const $hidden = $("#hiddenCnaeSecundario" + i);

      if (!$hidden.length) continue;

      // Só atualiza se o campo existir na tela
      if ($campo.length) {
         $hidden.val(($campo.val() || "").trim());
      }
   }
}


function carregarTiposClienteFornecedor() {

   var select = $("#tipo");

   var valorSalvo = (
      $("#tipoSelecionado").val() ||
      select.val() ||
      select.attr("value") ||
      ""
   ).toString().trim();

   select.empty();
   select.append('<option value="">Selecione...</option>');

   var ds = DatasetFactory.getDataset(
      "ds_tipoClienteFornecedorRM",
      null,
      null,
      null
   );

   if (!ds || !ds.values || !ds.values.length) {
      console.warn("Dataset ds_tipoClienteFornecedorRM vazio.");
      return;
   }

   ds.values.forEach(function (item) {
      var codigo = (item.CODTCF || "").toString().trim();
      var descricao = (item.DESCRICAO || "").toString().trim();

      select.append(
         '<option value="' + codigo + '">' +
            codigo + " - " + descricao +
         '</option>'
      );
   });

   if (valorSalvo) {
      select.val(valorSalvo);

      if (select.val()) {
         select.trigger("change");
      } else {
         console.warn("Tipo salvo não encontrado nas options:", valorSalvo);
      }
   }
}


// BEFORE SEND VALIDATE
var beforeSendValidate = function (numState, nextState) {

   $("#tipoSelecionado").val($("#tipo").val() || "");
   $("#tipoDescricao").val($("#tipo option:selected").text() || "");

   sincronizarCamposDinamicosHidden();
sincronizarCamposDinamicosHidden();
   let acao = "";

   if (numState == 0 || numState == 4) acao = "inicio";
   else if (numState == 11) acao = "validacao";
   else if (numState == 27) acao = "correcao";
   else if (numState == 16) acao = "integracao";
   else if (numState == 22) acao = "fim";

   function valor(campo) {
      const el = document.getElementsByName(campo)[0] || document.getElementById(campo);
      return el ? String(el.value || "").trim() : "";
   }

   function isChecked(v) {
      const s = String(v || "").toLowerCase().trim();
      return ["on", "true", "1", "checked", "yes", "sim", "s"].includes(s);
   }
   function marcarErro(campo, mensagem) {
      const $campo = $("#" + campo);
      const $container = $campo.closest(".fg");
      const mensagemId = "error-" + campo;

      $("#" + mensagemId).remove();

      $container.addClass("has-error");
      $campo.attr("aria-invalid", "true");

      $campo.after(
         '<small class="help-block error-validacao" id="' + mensagemId + '">' +
         mensagem +
         "</small>"
      );
   }
   function obrigatorio(campo, label) {
      const v = valor(campo);

      if (!v || v == "null" || v == "undefined") {
         marcarErro(campo, "Campo '" + label + "' é obrigatório.");
         return false;
      }

      return true;
   }
   function obrigatorioAnexo(campo, label) {
      const v = valor(campo);

      if (!v || v == "null" || v == "undefined" || v == "✓") {

         const mapa = {
            anxCartaoCnpj: "uploadCartaoCnpj",
            anxCompBanco: "uploadComprovanteBanco",
            anxContrato: "uploadContratoSocial",
            // anxCodConduta: "uploadCodigoConduta",
            // anxAntiCorrupcao: "uploadPoliticaAnticorrupcao",
            // anxConflito: "uploadConflitoInteresses",
            // anxLgpd: "uploadCienciaLgpd",
            anxRgCpf: "uploadRgCpf",
            anxCompEndereco: "uploadComprovanteEndereco"
         };

         const uploadId = mapa[campo];
         const $area = $("#" + uploadId);

         if (!$area.length) return false;

         const mensagemId = "error-" + campo;

         $("#" + mensagemId).remove();

         $area.addClass("upload-error");

         $area.after(
            '<small class="help-block error-validacao" id="' + mensagemId + '">' +
            "Anexo '" + label + "' é obrigatório." +
            "</small>"
         );

         return false;
      }

      return true;
   }
   function validarPreCadastro() {
      let valido = true;

      if (!obrigatorio("classificacao", "Classificação")) valido = false;
      if (!obrigatorio("categoria", "Categoria")) valido = false;
      if (!obrigatorio("tipo", "Tipo")) valido = false;
      if (!obrigatorio("classificacaoOperacional", "Classificação Operacional")) valido = false;

      const categoria = valor("categoria");

      if (categoria == "F") {
         if (!obrigatorio("docCpf", "CPF")) valido = false;
         if (!obrigatorio("docRg", "RG")) valido = false;
      }

      if (categoria == "J") {
         if (!obrigatorio("docCnpj", "CNPJ")) valido = false;
      }

      if (!obrigatorio("razaoSocial", "Razão Social")) valido = false;
      if (!obrigatorio("cep", "CEP")) valido = false;
      if (!obrigatorio("endereco", "Endereço")) valido = false;
      if (!obrigatorio("numero", "Número")) valido = false;
      if (!obrigatorio("bairro", "Bairro")) valido = false;
      if (!obrigatorio("cidade", "Cidade")) valido = false;
      if (!obrigatorio("pais", "País")) valido = false;
      if (!obrigatorio("estado", "Estado")) valido = false;

      return valido;
   }
   function validarDadosCadastrais() {
      let valido = true;

      if (!obrigatorio("icms", "ICMS")) valido = false;
      if (!obrigatorio("irrf", "IRRF")) valido = false;
      if (!obrigatorio("simplesNacional", "Simples Nacional")) valido = false;
      // VALIDAÇÃO DE RETENÇÃO
      if (isChecked(valor("toggleRetencao"))) {

         const algumMarcado =
            isChecked(valor("iss")) ||
            isChecked(valor("inss")) ||
            isChecked(valor("inputIrrf")) ||
            isChecked(valor("csll")) ||
            isChecked(valor("pis")) ||
            isChecked(valor("cofins"));

         if (!algumMarcado) {
            marcarErro("iss", "Selecione pelo menos um imposto.");
            $("#divRetencoesPanel").addClass("retencao-error");
            valido = false;
         }
      }

      if (!obrigatorio("naturezaRendimento", "Natureza de Rendimentos")) valido = false;
      if (!obrigatorio("regimeFiscal", "Regime Fiscal")) valido = false;
      if (!obrigatorio("tipoDocEmitido", "Tipo de Documento Emitido")) valido = false;

      if (!obrigatorio("moeda", "Moeda")) valido = false;
      if (!obrigatorio("grupoMercadoria1", "Grupo Mercadoria")) valido = false;
      if (!obrigatorio("cnaePrincipal", "CNAE")) valido = false;

      if (!obrigatorio("condicaoPagamento", "Condição Pagamento")) valido = false;
      if (!obrigatorio("banco", "Banco")) valido = false;
      if (!obrigatorio("agencia", "Agência")) valido = false;
      if (!obrigatorio("conta", "Conta")) valido = false;

      if (!obrigatorio("telefone", "Telefone")) valido = false;
      if (!obrigatorio("emailAdministrativo", "Email")) valido = false;
      if (!obrigatorio("emailComercial", "Email Comercial")) valido = false;

      return valido;
   }
   function validarDocumentacao() {
      let valido = true;
      const categoria = valor("categoria");

      if (categoria == "F") {
         if (!obrigatorioAnexo("anxRgCpf", "RG/CPF")) valido = false;
         if (!obrigatorioAnexo("anxCompEndereco", "Comprovante de Endereço")) valido = false;
      }

      if (categoria == "J") {
         if (!obrigatorioAnexo("anxCartaoCnpj", "CNPJ")) valido = false;
         if (!obrigatorioAnexo("anxCompBanco", "Comprovante Bancário")) valido = false;
         if (!obrigatorioAnexo("anxContrato", "Contrato Social")) valido = false;
         // if (!obrigatorioAnexo("anxCodConduta", "Código de Conduta")) valido = false;
         // if (!obrigatorioAnexo("anxAntiCorrupcao", "Política Anticorrupção")) valido = false;
         // if (!obrigatorioAnexo("anxConflito", "Conflito de Interesses")) valido = false;
         // if (!obrigatorioAnexo("anxLgpd", "LGPD")) valido = false;
      }

      return valido;
   }

   let valido = true;

   if (acao == "inicio" || acao == "correcao") {
      if (!validarPreCadastro()) valido = false;
      if (!validarDadosCadastrais()) valido = false;
      if (!validarDocumentacao()) valido = false;
   }

   if (acao == "validacao") {

      const decisao = valor("selectDecisao");

      if (!obrigatorio("observacaoValidacao", "Observações")) valido = false;
      if (!obrigatorio("selectDecisao", "Ação")) valido = false;

      if (decisao != "enviarRm" && decisao != "Correcao") {
         marcarErro("selectDecisao", "Escolha Aproconst ou Reproconst.");
         valido = false;
      }

      if (!validarPreCadastro()) valido = false;
      if (!validarDadosCadastrais()) valido = false;
      if (!validarDocumentacao()) valido = false;
   }

   if (!valido) {
      focusCampoComErro();
      return false;
   }

   return true;
};