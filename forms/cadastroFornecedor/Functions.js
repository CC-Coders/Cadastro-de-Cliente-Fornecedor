// GRUPO DE MERCADORIA
function obterOpcoesGrupoMercadoria(valorSalvo) {
   // Tenta usar o dataset do RM; fallback para o array estático se não disponível
   var grupos = (typeof carregarGruposMercadoria === "function") ? carregarGruposMercadoria() : [];

   if (grupos.length) {
      var html = '<option value="">Selecione...</option>';
      grupos.forEach(function (g) {
         var sel = (valorSalvo && valorSalvo === g.desc) ? ' selected' : '';
         html += '<option value="' + g.desc + '"' + sel + '>' + g.desc + "</option>";
      });
      return html;
   }

   // Fallback estático (quando dataset ainda não carregou)
   var opcoesHtml = (typeof OPCOES_GRUPO_MERCADORIA !== "undefined" ? OPCOES_GRUPO_MERCADORIA : []).map(function (opcao) {
      return '<option value="' + opcao + '">' + opcao + "</option>";
   }).join("");
   return '<option value="">Selecione...</option>' + opcoesHtml;
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

   // Aplica Selectize no novo select recém-adicionado
   if (typeof inicializarSelectize === "function") {
      inicializarSelectize("#grupoMercadoria" + numero);
   }

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
   for (let i = 2; i <= LIMITE_GRUPO_MERCADORIA; i++) {
      const $select = $("#grupoMercadoria" + i);
      const $hidden = $("#hiddenGrupoMercadoria" + i);

      if (!$hidden.length) continue;

      // Só atualiza se o campo existir na tela
      if ($select.length) {
         $hidden.val(($select.val() || "").trim());
      }
   }

   for (let i = 1; i <= globalThis.LIMITE_CNAE_SECUNDARIO; i++) {
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

   let select = $("#tipo");

   let valorSalvo = (
      $("#tipoSelecionado").val() ||
      select.val() ||
      select.attr("value") ||
      ""
   ).toString().trim();

   select.empty();
   select.append('<option value="">Selecione...</option>');

   let ds = DatasetFactory.getDataset(
      "ds_tipoClienteFornecedorRM",
      null,
      null,
      null
   );

   if (!ds?.values?.length) {
      console.warn("Dataset ds_tipoClienteFornecedorRM vazio.");
      return;
   }

   ds.values.forEach(function (item) {
      let codigo = (item.CODTCF || "").toString().trim();
      let descricao = (item.DESCRICAO || "").toString().trim();

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
   let select = $("#naturezaRendimento");
   let valorSalvo = (
      $("#codNaturezaRendimento").val() ||
      select.attr("value") ||
      select.val() ||
      ""
   ).toString().trim();

   select.find("option:not(:first)").remove();

   let ds = DatasetFactory.getDataset("naturezaRendimento", null, null, null);

   if (!ds?.values?.length) {
      console.warn("Dataset naturezaRendimento vazio.");
      return;
   }

   ds.values.forEach(function (item) {
      let cod  = (item.CODNATRENDIMENTO    || "").toString().trim();
      let desc = (item.DESCRICAORENDIMENTO || "").toString().trim();
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
let _cacheIrrf = null;

// Carrega as opções do select #selectDescricaoIrrf.
// Busca todos os registros uma única vez e filtra pelo tipo de pessoa da categoria.
//   preservarValor = true  → restaura o CODRECEITA salvo (carregamento inicial do form)
//   preservarValor = false → limpa seleção (ao trocar categoria)
function carregarOpcoesIrrf(preservarValor) {
   let pessoaTipo = ($("#categoria").val() || "").trim().toUpperCase();
   let select     = $("#selectDescricaoIrrf");
   // hiddenCodIrrf é a âncora confiável: Fluig restaura inputs hidden corretamente,
   // enquanto selects dinâmicos perdem o valor se as opções ainda não existem no DOM.
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

   let ds = DatasetFactory.getDataset("ds_irrfRM", null, null, null);

   // Aceita tanto array JS (.length) quanto coleção Java (.size())
   let tamanho = ds?.values
      ? (ds.values.length !== undefined ? ds.values.length : (ds.values.size ? ds.values.size() : 0))
      : 0;

   if (!ds?.values || tamanho === 0) {
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
   let select = $("#selectDescricaoIrrf");
   select.find("option:not(:first)").remove();

   // Log do primeiro item para diagnosticar os nomes de propriedade reais
   if (lista.length > 0) {
      console.log("[ds_irrfRM] primeiro item:", JSON.stringify(lista[0]));
   }

   for (const element of lista) {
      let item = element;

      // Tenta uppercase e lowercase para compatibilidade com qualquer versão deployada do dataset
      let cod  = String(item.codreceita   || item.CODRECEITA    || "").trim();
      let desc = String(item.descricao    || item.DESCRICAO     || "").trim();
      let aliq = String(item.aliquota     || item.ALIQUOTA      || "0").trim();
      let tipo = String(item.PESSOAFISOUJUR || item.pessoafisoujur || item.tipo || item.PESSOAFIOUJUR || "").trim().toUpperCase();

      if (!cod) continue;

      // Filtra por tipo de pessoa:
      //   "A" (Ambos) → sempre inclui
      //   pessoaTipo vazio → inclui tudo (sem categoria definida)
      //   caso contrário → inclui apenas o tipo correspondente + Ambos
      if (pessoaTipo && tipo && tipo !== "A" && tipo !== pessoaTipo) continue;

      let opt = $("<option></option>")
         .val(cod)
         .text(cod + " — " + desc)
         .attr("data-aliquota", aliq);
      select.append(opt);
   }

   if (valorSalvo) {
      select.val(valorSalvo);
      let selecionado = select.find("option:selected");
      if (selecionado.length && selecionado.val()) {
         $("#irrf").val(selecionado.attr("data-aliquota") || "");
      }
   }

   // mantém hidden sincronizado (idêntico ao padrão de codNaturezaRendimento)
   $("#hiddenCodIrrf").val(select.val() || "");
}


// DATASET DE PAÍSES (GPAIS / RM)
// Cache evita múltiplas chamadas ao servidor após a primeira carga
let _cacheListaPaises = null;

// Carrega a lista de países do dataset ds_paisRM e popula o select de países estrangeiros.
// Na primeira chamada, executa a query e armazena em cache.
// Nas chamadas seguintes, usa o cache direto.
function carregarPaisesEstrangeiros() {
   if (_cacheListaPaises !== null) {
      _popularSelectPaises(_cacheListaPaises);
      return;
   }

   let ds = DatasetFactory.getDataset("ds_paisRM", null, null, null);

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
   let select = $("#selectPaisEstrangeiro");
   let valorSalvo = ($("#pais").val() || "").trim();

   select.empty().append('<option value="">Selecione o país...</option>');

   paises.forEach(function (item) {
      let nome = (item.NOMEPAI || "").toString().trim();
      if (!nome) return;
      select.append('<option value="' + nome + '">' + nome + "</option>");
   });

   // Restaura país salvo (quando form é reaberto já com estrangeiro marcado)
   if (valorSalvo && valorSalvo !== "Brasil") {
      select.val(valorSalvo);
   }

   // Aplica Selectize no select de país
   if (typeof inicializarSelectize === "function") {
      inicializarSelectize("#selectPaisEstrangeiro");
   }
}


// DADOS BANCÁRIOS
let LIMITE_CONTAS_BANCARIAS = 5;

// Cache global de bancos do RM (ds_bancoRM)
var _listaBancosRM = null;

function carregarBancosRM() {
   if (_listaBancosRM !== null) return _listaBancosRM;
   _listaBancosRM = [];
   try {
      var ds = DatasetFactory.getDataset("ds_bancoRM", null, null, null);
      if (ds && ds.values && ds.values.length) {
         ds.values.forEach(function (item) {
            var cod  = (item.NUMBANCO || "").toString().trim();
            var nome = (item.NOME    || "").toString().trim();
            if (cod || nome) {
               _listaBancosRM.push({ cod: cod, nome: nome });
            }
         });
      }
   } catch (e) {
      console.warn("Erro ao carregar ds_bancoRM:", e);
   }
   return _listaBancosRM;
}

function _gerarOptionsBanco() {
   var bancos = carregarBancosRM();
   var html = '<option value="">Selecione o banco...</option>';
   bancos.forEach(function (b) {
      var nomeEsc = b.nome.replace(/"/g, "&quot;");
      html += '<option value="' + b.cod + '" data-nome="' + nomeEsc + '">' + b.cod + " — " + b.nome + "</option>";
   });
   return html;
}

// Cache e carregamento dos grupos de mercadoria (TTB2)
var _listaGruposMercadoria = null;

function carregarGruposMercadoria() {
   if (_listaGruposMercadoria !== null) return _listaGruposMercadoria;
   _listaGruposMercadoria = [];
   try {
      var ds = DatasetFactory.getDataset("ds_grupoMercadoriaRM", null, null, null);
      if (ds && ds.values && ds.values.length) {
         ds.values.forEach(function (item) {
            var desc = (item.DESCRICAO || "").toString().trim();
            if (desc) {
               _listaGruposMercadoria.push({ desc: desc });
            }
         });
      }
   } catch (e) {
      console.warn("Erro ao carregar ds_grupoMercadoriaRM:", e);
   }
   return _listaGruposMercadoria;
}

// Popula todos os selects de grupo de mercadoria existentes no DOM
function popularSelectsGrupoMercadoria() {
   var grupos = carregarGruposMercadoria();
   var optsHtml = '<option value="">Selecione...</option>';
   grupos.forEach(function (g) {
      optsHtml += '<option value="' + g.desc + '">' + g.desc + "</option>";
   });

   $(".grupo-mercadoria").each(function () {
      var valorAtual = $(this).val();
      $(this).empty().append(optsHtml);
      if (valorAtual) $(this).val(valorAtual);
   });
}

// Retorna o HTML de options para um novo select de grupo de mercadoria
function _gerarOptionsGrupoMercadoria(valorSalvo) {
   var grupos = carregarGruposMercadoria();
   var html = '<option value="">Selecione...</option>';
   grupos.forEach(function (g) {
      var sel = (valorSalvo && valorSalvo === g.desc) ? ' selected' : '';
      html += '<option value="' + g.desc + '"' + sel + '>' + g.desc + "</option>";
   });
   return html;
}

function _opcoesCondicaoPagamento() {
   let opts = [
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

      // NOME DO BANCO — select populado via ds_bancoRM
      '<div class="fg span2"><label for="selectBancoNome' + s + '">Nome do Banco</label>' +
      '<div class="select-wrap">' +
      '<select id="selectBancoNome' + s + '" class="form-control banco-select">' + optsBanco + '</select>' +
      '</div>' +
      // hidden anchors para persistência no Fluig
      '<input type="hidden" id="banco' + s + '" name="banco' + s + '" class="banco-cod">' +
      '<input type="hidden" id="bancoDescricao' + s + '" name="bancoDescricao' + s + '" class="banco-descricao">' +
      '</div>' +

      // CÓDIGO DO BANCO — exibição readonly, preenchido automaticamente pelo select
      '<div class="fg"><label>Código do Banco</label>' +
      '<input type="text" id="bancoCodExibicao' + s + '" class="form-control" placeholder="Automático" readonly></div>' +

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

   // Lê dos hidden fields individuais (persistência confiável entre atividades)
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

   // Fallback: tenta ler do child table se os hidden fields estiverem vazios
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

         // Restaura o select de banco (tenta pelo código; fallback pelo nome)
         let $selectBanco = $("#selectBancoNome" + s);
         if (d.cod) {
            $selectBanco.val(d.cod);
         }
         if (!$selectBanco.val() && d.desc) {
            // Tenta encontrar option pelo nome salvo
            $selectBanco.find("option").each(function () {
               let texto = $(this).text();
               if (texto.indexOf(d.desc) !== -1) {
                  $selectBanco.val($(this).val());
                  return false;
               }
            });
         }
         // Sincroniza hidden fields a partir do select restaurado
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

   // Aplica Selectize em todos os selects de banco renderizados
   if (typeof inicializarSelectize === "function") {
      inicializarSelectize(".banco-select");
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

   let novoNumero = quantidade + 1;
   let novoS = _sufixoBancario(novoNumero);
   $wrap.append(_gerarHtmlCardBancario(novoNumero));

   // Aplica Selectize no select de banco recém-criado
   if (typeof inicializarSelectize === "function") {
      inicializarSelectize("#selectBancoNome" + novoS);
   }

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
   let usados = $("#dados-bancarios-cards .bank-card").length;
   for (let i = usados + 1; i <= LIMITE_CONTAS_BANCARIAS; i++) {
      $("#hiddenBanco" + i + "Cod"     ).val("");
      $("#hiddenBanco" + i + "Desc"    ).val("");
      $("#hiddenBanco" + i + "Agencia" ).val("");
      $("#hiddenBanco" + i + "Conta"   ).val("");
   }

   atualizarCamposBancariosRm();
}
function controlarBotaoAdicionarConta() {
   let quantidade = $("#dados-bancarios-cards .bank-card").length;
   let $botao = $("#btn-add-conta-bancaria");

   if (quantidade >= LIMITE_CONTAS_BANCARIAS) {
      $botao.prop("disabled", true).addClass("disabled");
   } else {
      $botao.prop("disabled", false).removeClass("disabled");
   }
}


// BEFORE SEND VALIDATE
// Declarado em window para que o Fluig encontre o hook pelo nome global.
// Com "let" a função fica no escopo do script mas não em window.beforeSendValidate,
// e o Fluig não a reconhece — resultando em envio sem validação.
window.beforeSendValidate = function (numState, nextState) {

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
   // step com o primeiro erro encontrado (para navegação automática)
   let primeiroStepComErro = null;
   // Cliente não tem step 3 (Documentação)
   const isCliente = valor("classificacao") === "1";

   if (acao == "inicio" || acao == "correcao") {
      // Navega a cada step antes de validar, pois validarCampoObrigatorio
      // ignora campos invisíveis — sem isso os steps ocultos nunca são checados.
      goToStep(1, false);
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

   if (acao == "validacao") {
      const decisao = valor("selectDecisao");

      if (!obrigatorio("observacaoValidacao", "Observações")) valido = false;
      if (!obrigatorio("selectDecisao", "Ação")) valido = false;

      if (decisao && decisao != "enviarRm" && decisao != "Correcao") {
         marcarErro("selectDecisao", "Selecione uma ação: Aprovar (Enviar ao RM) ou Reprovar (Correção).");
         valido = false;
      }

      goToStep(1, false);
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

   if (!valido) {
      // Navega ao step com o primeiro erro para o usuário ver os avisos inline
      if (primeiroStepComErro !== null) {
         goToStep(primeiroStepComErro, false);
      }
      focusCampoComErro();
      return false;
   }

   return true;
};