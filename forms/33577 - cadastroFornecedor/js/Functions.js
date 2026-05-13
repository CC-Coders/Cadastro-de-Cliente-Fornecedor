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
      <div class="grid g2 grupo-mercadoria-item" id="grupo-mercadoria-item-${numero}">
         <div class="fg">
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


// HISTÓRICO DE DECISÃO — TIMELINE
async function asyncMontaHistorico() {
   $("#divLinhasHistorico").empty();

   let linhasHistorico = getLinhasHistorico();
   linhasHistorico = linhasHistorico.reverse();

   for (const linha of linhasHistorico) {
      const html = geraHtmlHistorico(linha);

      $("#divLinhasHistorico").append(html);

      try {
         $(".divImageUser:last").append(await promiseBuscaImagemUsuario(linha.USUARIO));
      } catch (erro) {
         console.warn("Não foi possível carregar imagem do usuário:", linha.USUARIO, erro);
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
      label: "Código de Receita IRRF"
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


// DATASETS — CARREGAMENTO VIA DatasetFactory
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
function carregarNaturezaRendimento() {
   var select = $("#naturezaRendimento");
   var valorSalvo = (
      $("#codNaturezaRendimento").val() ||
      select.attr("value") ||
      select.val() ||
      ""
   ).toString().trim();

   select.find("option:not(:first)").remove();

   var ds = DatasetFactory.getDataset("naturezaRendimento", null, null, null);

   if (!ds || !ds.values || !ds.values.length) {
      console.warn("Dataset naturezaRendimento vazio.");
      return;
   }

   ds.values.forEach(function (item) {
      var cod  = (item.CODNATRENDIMENTO    || "").toString().trim();
      var desc = (item.DESCRICAORENDIMENTO || "").toString().trim();
      if (cod) {
         select.append('<option value="' + cod + '">' + cod + " — " + desc + "</option>");
      }
   });

   if (valorSalvo) {
      select.val(valorSalvo);
   }

   // mantém hidden sincronizado
   $("#codNaturezaRendimento").val(select.val() || "");
}


// DATASET IRRF (FIRRF / RM)
// Cache único com todos os registros; filtragem feita no cliente.
// Evita dependência de ConstraintType e múltiplas chamadas ao servidor.
var _cacheIrrf = null;

// Carrega as opções do select #selectDescricaoIrrf.
// Busca todos os registros uma única vez e filtra pelo tipo de pessoa da categoria.
//   preservarValor = true  → restaura o CODRECEITA salvo (carregamento inicial do form)
//   preservarValor = false → limpa seleção (ao trocar categoria)
function carregarOpcoesIrrf(preservarValor) {
   var pessoaTipo = ($("#categoria").val() || "").trim().toUpperCase();
   var select     = $("#selectDescricaoIrrf");
   var valorSalvo = preservarValor
      ? (select.attr("value") || select.val() || "").trim()
      : "";

   if (!preservarValor) {
      select.val("");
      $("#irrf").val("");
   }

   if (_cacheIrrf !== null) {
      _popularSelectIrrf(_cacheIrrf, pessoaTipo, valorSalvo);
      return;
   }

   var ds = DatasetFactory.getDataset("ds_irrfRM", null, null, null);

   // Aceita tanto array JS (.length) quanto coleção Java (.size())
   var tamanho = ds && ds.values
      ? (ds.values.length !== undefined ? ds.values.length : (ds.values.size ? ds.values.size() : 0))
      : 0;

   if (!ds || !ds.values || tamanho === 0) {
      console.warn("[ds_irrfRM] Dataset vazio ou indisponível.", ds);
      return;
   }

   _cacheIrrf = ds.values;
   _popularSelectIrrf(ds.values, pessoaTipo, valorSalvo);
}

// Popula o select filtrando pelo pessoaTipo no cliente.
// Exibe "CODRECEITA — DESCRICAO"; value = CODRECEITA; data-aliquota = ALIQUOTA.
// O dataset retorna colunas com alias lowercase (codreceita, descricao, aliquota, tipo).
function _popularSelectIrrf(lista, pessoaTipo, valorSalvo) {
   var select = $("#selectDescricaoIrrf");
   select.find("option:not(:first)").remove();

   // Log do primeiro item para diagnosticar os nomes de propriedade reais
   if (lista.length > 0) {
      console.log("[ds_irrfRM] primeiro item:", JSON.stringify(lista[0]));
   }

   for (var i = 0; i < lista.length; i++) {
      var item = lista[i];

      // Tenta uppercase e lowercase para compatibilidade com qualquer versão deployada do dataset
      var cod  = String(item.codreceita   || item.CODRECEITA    || "").trim();
      var desc = String(item.descricao    || item.DESCRICAO     || "").trim();
      var aliq = String(item.aliquota     || item.ALIQUOTA      || "0").trim();
      var tipo = String(item.PESSOAFISOUJUR || item.pessoafisoujur || item.tipo || item.PESSOAFIOUJUR || "").trim().toUpperCase();

      if (!cod) continue;

      // Filtra por tipo de pessoa:
      //   "A" (Ambos) → sempre inclui
      //   pessoaTipo vazio → inclui tudo (sem categoria definida)
      //   caso contrário → inclui apenas o tipo correspondente + Ambos
      if (pessoaTipo && tipo && tipo !== "A" && tipo !== pessoaTipo) continue;

      var opt = $("<option></option>")
         .val(cod)
         .text(cod + " — " + desc)
         .attr("data-aliquota", aliq);
      select.append(opt);
   }

   if (valorSalvo) {
      select.val(valorSalvo);
      var selecionado = select.find("option:selected");
      if (selecionado.length && selecionado.val()) {
         $("#irrf").val(selecionado.attr("data-aliquota") || "");
      }
   }
}


// DATASET DE PAÍSES (GPAIS / RM)
// Cache evita múltiplas chamadas ao servidor após a primeira carga
var _cacheListaPaises = null;

// Carrega a lista de países do dataset ds_paisRM e popula o select de países estrangeiros.
// Na primeira chamada, executa a query e armazena em cache.
// Nas chamadas seguintes, usa o cache direto.
function carregarPaisesEstrangeiros() {
   if (_cacheListaPaises !== null) {
      _popularSelectPaises(_cacheListaPaises);
      return;
   }

   var ds = DatasetFactory.getDataset("ds_paisRM", null, null, null);

   if (!ds || !ds.values || !ds.values.length) {
      console.warn("Dataset ds_paisRM vazio ou indisponível.");
      return;
   }

   _cacheListaPaises = ds.values;
   _popularSelectPaises(ds.values);
}

// Popula o select #selectPaisEstrangeiro com a lista recebida.
// Restaura o valor salvo em #pais quando diferente de Brasil.
function _popularSelectPaises(paises) {
   var select = $("#selectPaisEstrangeiro");
   var valorSalvo = ($("#pais").val() || "").trim();

   select.empty().append('<option value="">Selecione o país...</option>');

   paises.forEach(function (item) {
      var nome = (item.NOMEPAI || "").toString().trim();
      if (!nome) return;
      select.append('<option value="' + nome + '">' + nome + "</option>");
   });

   // Restaura país salvo (quando form é reaberto já com estrangeiro marcado)
   if (valorSalvo && valorSalvo !== "Brasil") {
      select.val(valorSalvo);
   }
}


// DADOS BANCÁRIOS
var LIMITE_CONTAS_BANCARIAS = 5;
function _opcoesCondicaoPagamento() {
   var opts = [
      "À Vista", "7 dias", "14 dias", "15 dias", "21 dias",
      "28 dias", "30 dias", "45 dias", "60 dias", "90 dias",
      "30/60 dias", "30/60/90 dias", "30/60/90/120 dias",
      "Depósito Bancário", "Transferência Bancária", "PIX", "Boleto Bancário"
   ];
   return '<option value="">Selecione...</option>' +
      opts.map(function (o) { return '<option value="' + o + '">' + o + "</option>"; }).join("");
}
function _sufixoBancario(numero) {
   return numero === 1 ? "" : String(numero);
}
function _gerarHtmlCardBancario(numero) {
   var s = _sufixoBancario(numero);
   var btnRemover = numero === 1
      ? ""
      : '<button type="button" class="btn-remove-bank" data-numero="' + numero + '">Remover</button>';

   return (
      '<div class="bank-card" id="bank-card-' + numero + '">' +
      '<div class="bank-card-head">' +
      '<span class="bank-card-title">Conta Bancária ' + numero + '</span>' +
      btnRemover +
      '</div>' +
      '<div class="grid g3">' +
      '<div class="fg"><label for="banco' + s + '">Código do Banco</label>' +
      '<input type="text" id="banco' + s + '" name="banco' + s + '" class="form-control banco-cod" placeholder="Ex: 001"></div>' +
      '<div class="fg"><label for="bancoDescricao' + s + '">Nome do Banco</label>' +
      '<input type="text" id="bancoDescricao' + s + '" name="bancoDescricao' + s + '" class="form-control banco-descricao" placeholder="Ex: Banco do Brasil"></div>' +
      '<div class="fg"><label for="agencia' + s + '">Agência</label>' +
      '<input type="text" id="agencia' + s + '" name="agencia' + s + '" class="form-control banco-agencia" placeholder="0000-0"></div>' +
      '<div class="fg"><label for="conta' + s + '">Conta</label>' +
      '<input type="text" id="conta' + s + '" name="conta' + s + '" class="form-control banco-conta" placeholder="00000-0"></div>' +
      '</div></div>'
   );
}
function inicializarDadosBancarios() {
   var $wrap = $("#dados-bancarios-cards");

   // Lê dos hidden fields individuais (persistência confiável entre atividades)
   var dadosSalvos = [];
   for (var i = 1; i <= LIMITE_CONTAS_BANCARIAS; i++) {
      var cod     = ($("#hiddenBanco" + i + "Cod"     ).val() || "").trim();
      var agencia = ($("#hiddenBanco" + i + "Agencia" ).val() || "").trim();
      var conta   = ($("#hiddenBanco" + i + "Conta"   ).val() || "").trim();

      if (cod || agencia || conta) {
         dadosSalvos.push({
            cod:      cod,
            desc:     ($("#hiddenBanco" + i + "Desc"    ).val() || "").trim(),
            agencia:  agencia,
            conta:    conta
         });
      }
   }

   // Fallback: tenta ler do child table se os hidden fields estiverem vazios
   if (!dadosSalvos.length) {
      $("#tableDadosBancarios tbody tr").each(function () {
         var cod     = ($(this).find(".dbBanco"  ).val() || "").trim();
         var agencia = ($(this).find(".dbAgencia").val() || "").trim();
         var conta   = ($(this).find(".dbConta"  ).val() || "").trim();
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
         var numero = index + 1;
         $wrap.append(_gerarHtmlCardBancario(numero));
         var s = _sufixoBancario(numero);

         $("#banco"             + s).val(d.cod);
         $("#bancoDescricao"    + s).val(d.desc);

         var agencia = d.agencia;
         var conta   = d.conta;
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
   var $wrap = $("#dados-bancarios-cards");
   var quantidade = $wrap.find(".bank-card").length;

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
      var numero = index + 1;
      var s = _sufixoBancario(numero);

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
   var $tbody = $("#tableDadosBancarios tbody");

   $tbody.find("tr").remove();

   $("#dados-bancarios-cards .bank-card").each(function (index) {
      var numero = index + 1;
      var s = _sufixoBancario(numero);

      var banco     = ($("#banco"             + s).val() || "").trim();
      var bancoDesc = ($("#bancoDescricao"    + s).val() || "").trim();
      var agencia   = ($("#agencia"           + s).val() || "").replace(/\D/g, "");
      var conta     = ($("#conta"             + s).val() || "").replace(/\D/g, "");

      // child table (RM integration)
      $tbody.append(
         "<tr>" +
         '<td><input type="hidden" name="dbBanco"             class="dbBanco"             value="' + banco     + '"></td>' +
         '<td><input type="hidden" name="dbBancoDescricao"    class="dbBancoDescricao"    value="' + bancoDesc + '"></td>' +
         '<td><input type="hidden" name="dbAgencia"           class="dbAgencia"           value="' + agencia   + '"></td>' +
         '<td><input type="hidden" name="dbConta"             class="dbConta"             value="' + conta     + '"></td>' +
         "</tr>"
      );

      // hidden fields individuais (persistência confiável entre atividades)
      if (numero <= LIMITE_CONTAS_BANCARIAS) {
         $("#hiddenBanco" + numero + "Cod"     ).val(banco);
         $("#hiddenBanco" + numero + "Desc"    ).val(bancoDesc);
         $("#hiddenBanco" + numero + "Agencia" ).val(agencia);
         $("#hiddenBanco" + numero + "Conta"   ).val(conta);
      }
   });

   // limpa os hidden dos slots não utilizados
   var usados = $("#dados-bancarios-cards .bank-card").length;
   for (var i = usados + 1; i <= LIMITE_CONTAS_BANCARIAS; i++) {
      $("#hiddenBanco" + i + "Cod"     ).val("");
      $("#hiddenBanco" + i + "Desc"    ).val("");
      $("#hiddenBanco" + i + "Agencia" ).val("");
      $("#hiddenBanco" + i + "Conta"   ).val("");
   }

   atualizarCamposBancariosRm();
}
function controlarBotaoAdicionarConta() {
   var quantidade = $("#dados-bancarios-cards .bank-card").length;
   var $botao = $("#btn-add-conta-bancaria");

   if (quantidade >= LIMITE_CONTAS_BANCARIAS) {
      $botao.prop("disabled", true).addClass("disabled");
   } else {
      $botao.prop("disabled", false).removeClass("disabled");
   }
}


// BEFORE SEND VALIDATE
var beforeSendValidate = function (numState, nextState) {

   $("#tipoSelecionado").val($("#tipo").val() || "");
   $("#tipoDescricao").val($("#tipo option:selected").text() || "");

   sincronizarCamposDinamicosHidden();
   sincronizarTabelaBancaria();

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

   function marcarErro(campo, mensagem) {
      const $campo = $("#" + campo);
      const $container = $campo.closest(".fg");
      const mensagemId = "erro-" + campo;

      $("#" + mensagemId).remove();

      $container.addClass("has-erro");
      $campo.attr("aria-invalid", "true");

      $campo.after(
         '<small class="help-block erro-validacao" id="' + mensagemId + '">' +
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
         marcarErro("selectDecisao", "Selecione uma ação: Aprovar (Enviar ao RM) ou Reprovar (Correção).");
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