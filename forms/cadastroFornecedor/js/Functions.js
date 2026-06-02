
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
function _controlarBotaoAdicionar(quantidade, limite, $botao) {
   const atingiu = quantidade >= limite;
   $botao.prop("disabled", atingiu).toggleClass("disabled", atingiu);
}

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

   if (possuiHistorico) {
      $("#nav-step-HistoricoDecisao").show(500);
      $("#divDivisaoHistorico").show(500);

      $(".stepper").removeClass("stepper-3").addClass("stepper-4");

      $("#divLinhasHistorico").empty();
      asyncMontaHistorico();
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
   $("#docRg").mask("00.000.000-0");
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
      let valor = $(this).val().replaceAll(/\D/g, "").slice(0, 6);
      if (valor.length > 1) valor = valor.replace(/(\d+)(\d)$/, "$1-$2");
      $(this).val(valor);
      sincronizarTabelaBancaria();
   });
}
function atualizarCamposBancariosRm() {
   $("#agenciaRm").val(($("#agencia").val() || "").replaceAll(/\D/g, ""));
   $("#contaRm").val(($("#conta").val() || "").replaceAll(/\D/g, ""));
}


// AUDITORIA DE EDIÇÃO NA VALIDAÇÃO
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
      // O select tem name="codIrrf" mas id="selectDescricaoIrrf".
      // domId aponta para o elemento DOM real; id é o nome do campo no card (para o servidor).
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
      // domId permite apontar para um elemento DOM com id diferente do nome do campo no card.
      // Exemplo: o select #selectDescricaoIrrf tem name="codIrrf" mas id≠"codIrrf".
      const selectorId = campo.domId || campo.id;

      if (campo.tipo === "checkbox") {
         snapshot[campo.id] = $("#" + selectorId).is(":checked") ? "Sim" : "Não";
         return;
      }

      snapshot[campo.id] = ($("#" + selectorId).val() || "").toString().trim();
   });

   $("#snapshotEdicaoValidacao").val(JSON.stringify(snapshot));
}
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
// Aplica o valor num campo que pode ser <select> (edição) ou <span> (VIEW).
// Em VIEW o Fluig converte <select> em <span>; as <option> injetadas pelo JS
// viram texto visível (lista bagunçada). Aqui, no span, limpamos tudo e exibimos
// apenas o texto da opção correspondente ao valor salvo.
function _aplicarValorCampo($el, valor) {
   if (!$el || !$el.length) return;

   if ($el.is("select")) {
      $el.val(valor);
      return;
   }

   // <span> (modo VIEW): localiza o texto da opção do valor e substitui o conteúdo
   var texto = "";
   $el.children("option").each(function () {
      if (String($(this).attr("value")) === String(valor)) {
         texto = $(this).text();
         return false;
      }
   });
   $el.empty().text(texto || "");
}

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

   // Em VIEW (span) select.val() é vazio — preserva o valorSalvo no hidden
   $("#codNaturezaRendimento").val(select.is("select") ? (select.val() || "") : valorSalvo);
   $("#idNatRendimento").val(
      select.find("option:selected").data("idnat") || ""
   );
}

let _cacheIrrf = null;

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

function _popularSelectIrrf(lista, pessoaTipo, valorSalvo) {
   let select = $("#selectDescricaoIrrf");
   select.find("option:not(:first)").remove();

   if (lista.length > 0) {
      console.log("[ds_irrfRM] primeiro item:", JSON.stringify(lista[0]));
   }

   for (const element of lista) {
      let item = element;

      let cod  = String(item.codreceita   || item.CODRECEITA    || "").trim();
      let desc = String(item.descricao    || item.DESCRICAO     || "").trim();
      let aliq = String(item.aliquota     || item.ALIQUOTA      || "0").trim();
      let tipo = String(item.PESSOAFISOUJUR || item.pessoafisoujur || item.tipo || item.PESSOAFIOUJUR || "").trim().toUpperCase();

      if (!cod) continue;

      if (pessoaTipo && tipo && tipo !== "A" && tipo !== pessoaTipo) continue;

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
   // Em VIEW (span) select.val() é vazio — preserva o valorSalvo no hidden
   $("#hiddenCodIrrf").val(select.is("select") ? (select.val() || "") : valorSalvo);
}

let _cacheListaPaises = null;


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

let _listaEstadosRM    = null;
let _cacheMunicipiosRM = {}; 

function _normalizarTexto(str) {
   return (str || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
}

function carregarEstadosRM() {
   if (_listaEstadosRM !== null) return _listaEstadosRM;
   try {
      console.log("[RM-ESTADO] Chamando dataset ds_estadoRM...");
      let itens = _parsearDataset(
         DatasetFactory.getDataset("ds_estadoRM", null, null, null),
         "ds_estadoRM"
      );
      let lista = [];
      for (let i = 0; i < itens.length; i++) {
         let row    = itens[i];
         let codetd = (row.CODETD || row.codetd || "").toString().trim();
         let nome   = (row.NOME   || row.nome   || "").toString().trim();
         console.log("[RM-ESTADO] row[" + i + "]:", JSON.stringify(row), "→ codetd:", codetd, "nome:", nome);
         if (codetd) lista.push({ codetd: codetd, nome: nome });
      }
      console.log("[RM-ESTADO] Total de estados carregados:", lista.length);
      if (lista.length > 0) console.log("[RM-ESTADO] Primeira linha:", lista[0]);
      _listaEstadosRM = lista;
   } catch (e) {
      console.error("[RM-ESTADO] ERRO ao carregar estados:", e);
      _listaEstadosRM = [];
   }
   return _listaEstadosRM;
}

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


function carregarMunicipiosPorUF(uf) {
   if (!uf) return [];
   if (_cacheMunicipiosRM[uf] !== undefined) {
      console.log("[RM-MUNICIPIO] Cache hit para UF=" + uf + " (" + _cacheMunicipiosRM[uf].length + " municípios)");
      return _cacheMunicipiosRM[uf];
   }
   try {
      console.log("[RM-MUNICIPIO] Chamando dataset ds_municipioRM para UF=" + uf + "...");
      let MUST = (typeof ConstraintType === "undefined") ? 1 : ConstraintType.MUST;
      console.log("[RM-MUNICIPIO] ConstraintType disponível?", typeof ConstraintType, "| MUST:", MUST);
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
      console.log("[RM-MUNICIPIO] Total municípios para UF=" + uf + ":", lista.length);
      if (lista.length > 0) console.log("[RM-MUNICIPIO] Primeiro município:", lista[0]);
      _cacheMunicipiosRM[uf] = lista;
   } catch (e) {
      console.error("[RM-MUNICIPIO] ERRO para UF=" + uf + ":", e);
      _cacheMunicipiosRM[uf] = [];
   }
   return _cacheMunicipiosRM[uf];
}

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

function preencherEnderecoRM(uf, nomeCidade) {
   console.log("[RM-ENDERECO] preencherEnderecoRM chamado — uf:", uf, "| cidade:", nomeCidade);

   let qtdEstados = $("#estado option").length;
   console.log("[RM-ENDERECO] Opções no select #estado:", qtdEstados);
   if (qtdEstados <= 1) {
      console.log("[RM-ENDERECO] Select vazio — chamando popularSelectEstado()");
      popularSelectEstado();
      console.log("[RM-ENDERECO] Após popular, opções no #estado:", $("#estado option").length);
   }

   if (uf) {
      $("#estado").val(uf);

      $("#hiddenEstadoValor").val(uf);
      let estadoSetado = $("#estado").val();
      console.log("[RM-ENDERECO] #estado.val() após setar '" + uf + "':", estadoSetado);
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

      console.log("[RM-ENDERECO] Buscando cidade '" + nomeCidade + "' (normalizado: '" + alvo + "') entre " + totalOpcoes + " opções...");

      // Tentativa exata
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

   console.log("[RM-ENDERECO] Resultado final — estado:", $("#estado").val(), "| cidade:", $("#cidade").val(), "| codMunicipio:", $("#codMunicipio").val());
}

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


// DADOS BANCÁRIOS
let LIMITE_CONTAS_BANCARIAS = 5;
let _listaBancosRM = null;

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

function _gerarOptionsBanco() {
   let bancos = carregarBancosRM();
   let html = '<option value="">Selecione o banco...</option>';
   bancos.forEach(function (b) {
      let nomeEsc = b.nome.replaceAll('"', "&quot;");
      html += '<option value="' + b.cod + '" data-nome="' + nomeEsc + '">' + b.nome + "</option>";
   });
   return html;
}

let _listaGruposMercadoria = null;

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

function popularSelectsGrupoMercadoria() {
   const optsHtml = _gerarOptionsGrupoMercadoria();

   $(".grupo-mercadoria").each(function () {
      let valorAtual = $(this).attr("value") || $(this).val();
      $(this).empty().append(optsHtml);
      if (valorAtual) $(this).val(valorAtual);
   });
}

function _gerarOptionsGrupoMercadoria(valorSalvo) {
   let grupos = carregarGruposMercadoria();
   let html = '<option value="">Selecione...</option>';
   grupos.forEach(function (g) {
      let sel = (valorSalvo && valorSalvo === g.desc) ? ' selected' : '';
      html += '<option value="' + g.desc + '"' + sel + '>' + g.desc + "</option>";
   });
   return html;
}

function _sufixoBancario(numero) {
   return numero === 1 ? "" : String(numero);
}
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
function removerContaBancaria(numero) {
   $("#bank-card-" + numero).remove();
   _reordenarCardsBancarios();
   sincronizarTabelaBancaria();
   controlarBotaoAdicionarConta();
}
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

      if (!validarCampoObrigatorio("observacaoValidacao", "Observações")) valido = false;
      if (!validarCampoObrigatorio("selectDecisao", "Ação")) valido = false;

      if (decisao && decisao != "enviarRm" && decisao != "Correcao") {
         exibirErroCampo("selectDecisao", "Selecione uma ação: Aprovar (Enviar ao RM) ou Reprovar (Correção).");
         valido = false;
      }

      _validarTodasEtapas();
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