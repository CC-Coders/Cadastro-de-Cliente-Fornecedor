// CONSULTAS AO RM
//
// Cada dataset é consultado uma única vez por sessão e vira uma lista de itens no
// formato { valor, rotulo, ...extras }. Esse formato único permite um só popularSelect()
// para todos os campos e mantém os dados extras (código do município, alíquota, id da
// natureza) em memória — e não em atributos data-* das options, que o campo de busca apaga.

// LISTAS JÁ CONSULTADAS, INDEXADAS POR CHAVE.
let _cacheRM = {};

// DEVOLVE O CONTEÚDO DE UM CAMPO DO DATASET COMO TEXTO LIMPO.
function _txt(valor) {
   return (valor || "").toString().trim();
}

// CONVERTE O RETORNO PADRÃO DOS DATASETS (STATUS / MENSAGEM / RESULT) EM ARRAY.
function _parsearDataset(ds, nomeDataset) {
   const linha = ds?.values?.[0];
   if (!linha) {
      console.warn("[Dataset] " + nomeDataset + " vazio ou indisponível.");
      return [];
   }

   if (_txt(linha.STATUS) === "ERRO") {
      console.error("[Dataset] " + nomeDataset + " retornou ERRO: " + _txt(linha.MENSAGEM));
      return [];
   }

   const result = _txt(linha.RESULT);
   if (!result || result === "null") {
      console.warn("[Dataset] " + nomeDataset + " sem resultados.");
      return [];
   }

   try {
      const lista = JSON.parse(result);
      return Array.isArray(lista) ? lista : [];
   } catch (e) {
      console.error("[Dataset] " + nomeDataset + " com RESULT inválido:", e);
      return [];
   }
}

// CONSULTA UM DATASET UMA ÚNICA VEZ E DEVOLVE A LISTA JÁ NO FORMATO DOS SELECTS.
function _listaRM(chave, nomeDataset, constraints, montarItem) {
   if (_cacheRM[chave]) return _cacheRM[chave];

   let linhas = [];
   try {
      linhas = _parsearDataset(
         DatasetFactory.getDataset(nomeDataset, null, constraints || null, null),
         nomeDataset
      );
   } catch (e) {
      console.error("[Dataset] Erro ao consultar " + nomeDataset + ":", e);
   }

   _cacheRM[chave] = linhas.map(montarItem).filter(function (item) { return item.valor !== ""; });
   return _cacheRM[chave];
}

// LOCALIZA O ITEM DE UMA LISTA PELO SEU VALOR.
function itemDaLista(itens, valor) {
   valor = _txt(valor);
   return itens.find(function (item) { return item.valor === valor; }) || null;
}

// NORMALIZA UM TEXTO PARA COMPARAÇÃO, IGNORANDO ACENTOS E CAIXA.
function _normalizarTexto(texto) {
   return (texto || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
}

// ---------------------------------------------------------------------------
// LISTAS DO RM
// ---------------------------------------------------------------------------

// TIPOS DE CLIENTE/FORNECEDOR — { valor: código, rotulo }
function listaTipos() {
   return _listaRM("tipos", "ds_tipoClienteFornecedorRM", null, function (row) {
      const cod = _txt(row.CODTCF);
      return { valor: cod, rotulo: cod + " - " + _txt(row.DESCRICAO) };
   });
}

// NATUREZAS DE RENDIMENTO — { valor: código, rotulo, idNat }
function listaNaturezaRendimento() {
   return _listaRM("natureza", "naturezaRendimento", null, function (row) {
      const cod = _txt(row.CODNATRENDIMENTO);
      return {
         valor: cod,
         rotulo: cod + " — " + _txt(row.DESCRICAORENDIMENTO),
         idNat: _txt(row.IDNATRENDIMENTO)
      };
   });
}

// CÓDIGOS DE RECEITA IRRF — { valor: código, rotulo, aliquota }
function listaIrrf() {
   return _listaRM("irrf", "ds_irrfRM", null, function (row) {
      const cod = _txt(row.codreceita || row.CODRECEITA);
      return {
         valor: cod,
         rotulo: cod + " — " + _txt(row.descricao || row.DESCRICAO),
         aliquota: _txt(row.aliquota || row.ALIQUOTA) || "0"
      };
   });
}

// PAÍSES ESTRANGEIROS — { valor: nome, rotulo: nome }
function listaPaises() {
   return _listaRM("paises", "ds_paisRM", null, function (row) {
      const nome = _txt(row.NOMEPAI);
      return { valor: nome, rotulo: nome };
   });
}

// ESTADOS — { valor: UF, rotulo }
function listaEstados() {
   return _listaRM("estados", "ds_estadoRM", null, function (row) {
      const uf = _txt(row.CODETD || row.codetd);
      return { valor: uf, rotulo: _txt(row.NOME || row.nome) + " (" + uf + ")" };
   });
}

// MUNICÍPIOS DE UMA UF — { valor: nome, rotulo: nome, cod: código do município }
function listaMunicipios(uf) {
   if (!uf) return [];

   const MUST = (typeof ConstraintType === "undefined") ? 1 : ConstraintType.MUST;

   return _listaRM("municipios:" + uf, "ds_municipioRM",
      [DatasetFactory.createConstraint("CODETDMUNICIPIO", uf, uf, MUST)],
      function (row) {
         const nome = _txt(row.NOMEMUNICIPIO || row.nomemunicipio);
         return { valor: nome, rotulo: nome, cod: _txt(row.CODMUNICIPIO || row.codmunicipio) };
      });
}

// BANCOS — { valor: número do banco, rotulo: nome }
function listaBancos() {
   return _listaRM("bancos", "ds_bancoRM", null, function (row) {
      return { valor: _txt(row.NUMBANCO), rotulo: _txt(row.NOME) };
   });
}

// GRUPOS DE MERCADORIA — { valor: descrição, rotulo: descrição }
function listaGruposMercadoria() {
   return _listaRM("gruposMercadoria", "ds_grupoMercadoriaRM", null, function (row) {
      const desc = _txt(row.DESCRICAO);
      return { valor: desc, rotulo: desc };
   });
}

// ---------------------------------------------------------------------------
// PREENCHIMENTO DOS CAMPOS
// ---------------------------------------------------------------------------

// MONTA AS OPTIONS DE UMA LISTA, COM O PLACEHOLDER NA PRIMEIRA POSIÇÃO.
function opcoesDaLista(itens, placeholder) {
   let html = '<option value="">' + (placeholder || "Selecione...") + "</option>";
   itens.forEach(function (item) {
      html += '<option value="' + escaparHtml(item.valor) + '">' + escaparHtml(item.rotulo) + "</option>";
   });
   return html;
}

// PREENCHE UM CAMPO COM A LISTA INFORMADA E RESTAURA O VALOR SALVO.
// O campo nem sempre é um <select>: em modo view o Fluig entrega um <span> (mostra só o
// rótulo) e a cidade vira um <input> no endereço estrangeiro (digitação livre, sem lista).
function popularSelect(seletor, itens, placeholder, valorSalvo) {
   const $campo = $(seletor);
   if (!$campo.length || $campo.is("input")) return;

   valorSalvo = _txt(valorSalvo);

   if (!$campo.is("select")) {
      const item = itemDaLista(itens, valorSalvo);
      $campo.empty().text(item ? item.rotulo : "");
      return;
   }

   $campo.html(opcoesDaLista(itens, placeholder)).val(valorSalvo);
   atualizarBuscaSelect($campo);
}

// ESVAZIA UM SELECT, DEIXANDO APENAS O PLACEHOLDER.
function limparSelect(seletor, placeholder) {
   popularSelect(seletor, [], placeholder, "");
}

// ---------------------------------------------------------------------------
// CAMPOS DO FORMULÁRIO
// ---------------------------------------------------------------------------

// TIPOS DISPONÍVEIS: "005" só existe para Cliente e "020" (RDO) só para Pessoa Física.
// A restrição vale apenas enquanto o solicitante preenche — na Validação a lista é completa.
function tiposPermitidos() {
   if (!ehEtapaPreenchimento()) return listaTipos();

   const ehCliente = _txt($("#classificacao").val()) === "1";
   const ehFisica = _txt($("#categoria").val()) === "F";

   return listaTipos().filter(function (item) {
      if (item.valor === "005") return ehCliente;
      if (item.valor === "020") return ehFisica;
      return true;
   });
}

// CARREGA OS TIPOS DE CLIENTE/FORNECEDOR.
function carregarTiposClienteFornecedor() {
   const $tipo = $("#tipo");
   const salvo = _txt($("#tipoSelecionado").val() || $tipo.val() || $tipo.attr("value"));

   popularSelect($tipo, tiposPermitidos(), "Selecione...", salvo);
   sincronizarTipoSelecionado();
}

// COPIA O TIPO ESCOLHIDO PARA OS CAMPOS QUE VÃO PARA O RM.
function sincronizarTipoSelecionado() {
   const cod = _txt($("#tipo").val());
   const item = itemDaLista(listaTipos(), cod);

   $("#tipoSelecionado").val(cod);
   $("#tipoDescricao").val(item ? item.rotulo : "");
}

// INDICA SE O TIPO ESCOLHIDO É RDO.
function ehTipoRDO() {
   const item = itemDaLista(listaTipos(), $("#tipo").val());
   return !!item && /\bRDO\b/.test(item.rotulo.toUpperCase());
}

// CARREGA AS NATUREZAS DE RENDIMENTO.
function carregarNaturezaRendimento() {
   const $natureza = $("#naturezaRendimento");
   const salvo = _txt($("#codNaturezaRendimento").val() || $natureza.val() || $natureza.attr("value"));

   popularSelect($natureza, listaNaturezaRendimento(), "Selecione...", salvo);
   sincronizarNaturezaRendimento();
}

// COPIA A NATUREZA ESCOLHIDA (código e id) PARA OS CAMPOS QUE VÃO PARA O RM.
function sincronizarNaturezaRendimento() {
   const cod = _txt($("#naturezaRendimento").val());
   const item = itemDaLista(listaNaturezaRendimento(), cod);

   $("#codNaturezaRendimento").val(cod);
   $("#idNatRendimento").val(item ? item.idNat : "");
}

// CÓDIGOS DE IRRF ACEITOS PARA CADA TIPO DE PESSOA.
const IRRF_POR_CATEGORIA = {
   F: ["0588", "3208", "0001"],
   J: ["1708", "17081", "0001"]
};

// CARREGA OS CÓDIGOS DE RECEITA IRRF PERMITIDOS PARA A CATEGORIA ATUAL.
// Com preservarValor a escolha anterior é mantida; sem ele o campo recomeça vazio.
function carregarOpcoesIrrf(preservarValor) {
   const $irrf = $("#selectDescricaoIrrf");
   const salvo = preservarValor
      ? _txt($("#hiddenCodIrrf").val() || $irrf.val() || $irrf.attr("value"))
      : "";

   const permitidos = IRRF_POR_CATEGORIA[_txt($("#categoria").val()).toUpperCase()];
   const itens = permitidos
      ? listaIrrf().filter(function (item) { return permitidos.indexOf(item.valor) !== -1; })
      : listaIrrf();

   popularSelect($irrf, itens, "Selecione...", salvo);
   sincronizarIrrf();
}

// COPIA O CÓDIGO DE IRRF ESCOLHIDO E SUA ALÍQUOTA PARA OS CAMPOS QUE VÃO PARA O RM.
function sincronizarIrrf() {
   const cod = _txt($("#selectDescricaoIrrf").val());
   const item = itemDaLista(listaIrrf(), cod);

   $("#hiddenCodIrrf").val(cod);
   $("#irrf").val(item ? item.aliquota : "");
}

// CARREGA OS PAÍSES DO CAMPO DE ENDEREÇO NO EXTERIOR.
function carregarPaisesEstrangeiros() {
   const salvo = _txt($("#pais").val());
   popularSelect("#selectPaisEstrangeiro", listaPaises(), "Selecione o país...",
      salvo === "Brasil" ? "" : salvo);
}

// CARREGA OS ESTADOS. Com incluirExterior a opção "EX" é acrescentada (endereço no exterior).
function popularSelectEstado(incluirExterior) {
   const $estado = $("#estado");
   const salvo = _txt($estado.val() || $estado.attr("value") || $("#hiddenEstadoValor").val());

   let itens = listaEstados();
   if (incluirExterior) itens = [{ valor: "EX", rotulo: "EX" }].concat(itens);

   popularSelect($estado, itens, "Selecione o estado...", salvo);
}

// CARREGA AS CIDADES DA UF INFORMADA E ATUALIZA O CÓDIGO DO MUNICÍPIO.
function popularSelectMunicipio(uf) {
   const $cidade = $("#cidade");
   const salvo = _txt($cidade.val() || $cidade.attr("value") || $("#nomeCidadeSalva").val());

   popularSelect($cidade, listaMunicipios(uf), "Selecione a cidade...", salvo);
   sincronizarMunicipio(uf);
}

// COPIA A CIDADE ESCOLHIDA (nome e código) PARA OS CAMPOS QUE VÃO PARA O RM.
function sincronizarMunicipio(uf) {
   const nome = _txt($("#cidade").val());
   const item = itemDaLista(listaMunicipios(uf || $("#estado").val()), nome);

   $("#codMunicipio").val(item ? item.cod : "");
   if (nome) $("#nomeCidadeSalva").val(nome);
}

// CARREGA AS OPÇÕES DE TODOS OS CAMPOS DE GRUPO DE MERCADORIA.
function popularSelectsGrupoMercadoria() {
   $(".grupo-mercadoria").each(function () {
      const salvo = _txt($(this).val() || $(this).attr("value"));
      popularSelect(this, listaGruposMercadoria(), "Selecione...", salvo);
   });
}

// PREENCHE ESTADO E CIDADE A PARTIR DE UMA CONSULTA EXTERNA (CEP / Receita Federal).
// A cidade vem por nome, então é localizada ignorando acentos e caixa.
function preencherEnderecoRM(uf, nomeCidade) {
   uf = _txt(uf);
   if (!uf) return;

   definirValorSelect("#estado", uf);
   $("#hiddenEstadoValor").val(uf);
   limparErroCampo("estado");

   popularSelectMunicipio(uf);
   if (!nomeCidade) return;

   const cidade = _localizarMunicipio(uf, nomeCidade);
   if (!cidade) {
      console.warn("[RM-ENDERECO] Cidade '" + nomeCidade + "' não encontrada na UF " + uf + ".");
      return;
   }

   definirValorSelect("#cidade", cidade.valor);
   $("#codMunicipio").val(cidade.cod);
   $("#nomeCidadeSalva").val(cidade.valor);
   limparErroCampo("cidade");
}

// LOCALIZA UM MUNICÍPIO PELO NOME, ACEITANDO PEQUENAS DIFERENÇAS DE GRAFIA.
function _localizarMunicipio(uf, nomeCidade) {
   const municipios = listaMunicipios(uf);
   const alvo = _normalizarTexto(nomeCidade);

   return municipios.find(function (item) { return _normalizarTexto(item.rotulo) === alvo; })
      || municipios.find(function (item) {
         const nome = _normalizarTexto(item.rotulo);
         return nome.includes(alvo) || alvo.includes(nome);
      })
      || null;
}

// RESTAURA O ENDEREÇO SALVO NO PROCESSO APÓS O CARREGAMENTO DO FORMULÁRIO.
function restaurarEnderecoRM() {
   const uf = _txt($("#hiddenEstadoValor").val() || $("#estado").val());
   if (!uf) return;

   definirValorSelect("#estado", uf);
   popularSelectMunicipio(uf);

   const nomeSalvo = _txt($("#nomeCidadeSalva").val());
   if (nomeSalvo) {
      definirValorSelect("#cidade", nomeSalvo);
      sincronizarMunicipio(uf);
   }
}
