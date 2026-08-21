// UTILITÁRIOS

// ESCAPA UM TEXTO PARA USO SEGURO DENTRO DE HTML.
function escaparHtml(texto) {
   return (texto || "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
}

// HABILITA OU DESABILITA UM BOTÃO DE "ADICIONAR" CONFORME A QUANTIDADE ATUAL E O LIMITE.
function _controlarBotaoAdicionar(quantidade, limite, $botao) {
   const atingiu = quantidade >= limite;
   $botao.prop("disabled", atingiu).toggleClass("disabled", atingiu);
}

// RENUMERA OS ITENS DE UMA LISTA DINÂMICA, ATUALIZANDO IDS, NAMES E RÓTULOS.
function _reordenarItens(seletorLista, prefixoItem, prefixoCampo, textoLabel, seletorCampo, offset) {
   offset = offset || 1;
   $(seletorLista).each(function (index) {
      const numero = index + offset;
      $(this).attr("id", prefixoItem + numero);
      $(this).find("label").attr("for", prefixoCampo + numero).text(textoLabel + " " + numero);
      $(this).find(seletorCampo).attr("id", prefixoCampo + numero).attr("name", prefixoCampo + numero);
   });
}

// AVISA O USUÁRIO DE QUE O LIMITE DE UM CAMPO REPETÍVEL FOI ATINGIDO.
function _avisarLimite(mensagem) {
   FLUIGC.toast({ title: "Atenção", message: mensagem, type: "warning" });
}

// GRUPO DE MERCADORIA

// ACRESCENTA UM NOVO CAMPO DE GRUPO DE MERCADORIA, RESPEITANDO O LIMITE MÁXIMO.
function adicionarGrupoMercadoria() {
   const $wrap = $("#grupo-mercadoria-wrap");
   const numero = $wrap.find(".grupo-mercadoria-item").length + 2;

   if (numero > LIMITE_GRUPO_MERCADORIA) {
      _avisarLimite("Você pode adicionar no máximo " + LIMITE_GRUPO_MERCADORIA + " grupos de mercadoria.");
      return;
   }

   $wrap.append(
      '<div class="grid g2 grupo-mercadoria-item" id="grupo-mercadoria-item-' + numero + '">' +
      '  <div class="fg">' +
      '    <label for="grupoMercadoria' + numero + '">Grupo de Mercadoria ' + numero + "</label>" +
      '    <div class="select-wrap">' +
      '      <select id="grupoMercadoria' + numero + '" name="grupoMercadoria' + numero + '"' +
      '              class="form-control grupo-mercadoria">' +
      opcoesDaLista(listaGruposMercadoria(), "Selecione...") +
      "      </select>" +
      "    </div>" +
      "  </div>" +
      '  <div class="fg grupo-mercadoria-acao">' +
      '    <button type="button" class="btn btn-danger btn-remove-grupo-mercadoria">Remover</button>' +
      "  </div>" +
      "</div>"
   );

   aplicarBuscaSelect("#grupoMercadoria" + numero);
   sincronizarCamposDinamicosHidden();
   reposicionarBotaoAdicionarGrupo();
   controlarBotaoAdicionarGrupoMercadoria();
}

// MOVE O BOTÃO DE ADICIONAR PARA JUNTO DO ÚLTIMO GRUPO EXIBIDO.
function reposicionarBotaoAdicionarGrupo() {
   const $btn = $("#btn-add-grupo-mercadoria");
   if (!$btn.length) return;

   const $itens = $("#grupo-mercadoria-wrap .grupo-mercadoria-item");
   const $destino = $itens.length
      ? $itens.last().find(".grupo-mercadoria-acao").first()
      : $("#acaoGrupoMercadoria1");

   $destino.append($btn);
}

// RENUMERA OS GRUPOS DE MERCADORIA (o primeiro é fixo no HTML, os demais começam em 2).
function reordenarGruposMercadoria() {
   _reordenarItens("#grupo-mercadoria-wrap .grupo-mercadoria-item", "grupo-mercadoria-item-",
      "grupoMercadoria", "Grupo de Mercadoria", "select", 2);
}

// CONTROLA A DISPONIBILIDADE DO BOTÃO DE ADICIONAR GRUPO DE MERCADORIA.
function controlarBotaoAdicionarGrupoMercadoria() {
   const total = 1 + $("#grupo-mercadoria-wrap .grupo-mercadoria-item").length;
   _controlarBotaoAdicionar(total, LIMITE_GRUPO_MERCADORIA, $("#btn-add-grupo-mercadoria"));
}

// CNAE SECUNDÁRIO

// ACRESCENTA UM NOVO CAMPO DE CNAE SECUNDÁRIO, RESPEITANDO O LIMITE MÁXIMO.
function adicionarCnae() {
   const $wrap = $("#cnae-secundarios-wrap");
   const numero = $wrap.find(".cnae-secundario-item").length + 1;

   if (numero > LIMITE_CNAE_SECUNDARIO) {
      _avisarLimite("Você pode adicionar no máximo " + LIMITE_CNAE_SECUNDARIO + " CNAEs secundários.");
      return;
   }

   $wrap.append(
      '<div class="grid g2 cnae-secundario-item" id="cnae-secundario-' + numero + '">' +
      '  <div class="fg">' +
      '    <label for="cnaeSecundario' + numero + '">CNAE Secundário ' + numero + "</label>" +
      '    <input type="text" id="cnaeSecundario' + numero + '" name="cnaeSecundario' + numero + '"' +
      '           class="cnae-secundario form-control" placeholder="0000-0/00" maxlength="9">' +
      "  </div>" +
      '  <div class="fg cnae-secundario-acao">' +
      '    <button type="button" class="btn btn-danger btn-remove-cnae">Remover</button>' +
      "  </div>" +
      "</div>"
   );

   controlarBotaoAdicionarCnae();
   sincronizarCamposDinamicosHidden();
}

// RENUMERA OS CNAEs SECUNDÁRIOS.
function reordenarCnaesSecundarios() {
   _reordenarItens("#cnae-secundarios-wrap .cnae-secundario-item", "cnae-secundario-",
      "cnaeSecundario", "CNAE Secundário", "input", 1);
}

// CONTROLA A DISPONIBILIDADE DO BOTÃO DE ADICIONAR CNAE SECUNDÁRIO.
function controlarBotaoAdicionarCnae() {
   const total = $("#cnae-secundarios-wrap .cnae-secundario-item").length;
   _controlarBotaoAdicionar(total, LIMITE_CNAE_SECUNDARIO, $("#btn-add-cnae"));
}

// HISTÓRICO DE DECISÃO

// EXIBE A ETAPA DE HISTÓRICO QUANDO HÁ MOVIMENTAÇÕES OU QUANDO O SOLICITANTE VAI ENVIAR.
// asyncMontaHistorico, getLinhasHistorico e atualizarSetas vêm do motor compartilhado (historico.js).
function controlarStepperHistorico() {
   const exibir = getLinhasHistorico().length > 0 || ehEnvioSolicitante();

   $("#nav-step-HistoricoDecisao, #divDivisaoHistorico").toggle(exibir);

   if (exibir) {
      // O painel fica sempre visível: sem movimentações, asyncMontaHistorico
      // desenha o estado vazio em vez de esconder tudo.
      $("#historico").show();
      asyncMontaHistorico();
   }

   atualizarSetas();
}

// MÁSCARAS DE INPUT

// APLICA AS MÁSCARAS DE TODOS OS CAMPOS DO FORMULÁRIO.
function inicializarMascaras() {
   $("#docCpf").mask("000.000.000-00");
   $("#docCnpj").mask("AA.AAA.AAA/AAAA-00");
   // RG sem máscara: o formato varia por estado.
   $("#docInscricaoEstadual").mask("000.000.000.000");
   $("#docInscricaoMunicipal").mask("000.000.000.000");
   $("#cep").mask("00000-000");
   $("#numero").mask("000000");
   $("#telefone, #telComercial, #celular").mask("(00) 00000-0000");

   $("#cnaePrincipal").on("input", function () { aplicarMascaraCnae($(this)); });
   $("#dtNascimento").attr("max", new Date().toISOString().split("T")[0]);

   inicializarMascarasBancarias();
}

// FORMATA O CNAE NO PADRÃO 0000-0/00.
function aplicarMascaraCnae($campo) {
   let valor = $campo.val().replaceAll(/\D/g, "").slice(0, 7);

   if (valor.length > 5) valor = valor.replace(/^(\d{4})(\d)(\d{0,2})$/, "$1-$2/$3");
   else if (valor.length > 4) valor = valor.replace(/^(\d{4})(\d?)$/, "$1-$2");

   $campo.val(valor);
}

// FORMATA AGÊNCIA E CONTA À MEDIDA QUE SÃO DIGITADAS, MANTENDO A TABELA SINCRONIZADA.
function inicializarMascarasBancarias() {
   $(document).on("input", ".banco-agencia", function () {
      let valor = $(this).val().replaceAll(/\D/g, "").slice(0, 5);
      if (valor.length > 4) valor = valor.replace(/^(\d{4})(\d)$/, "$1-$2");
      $(this).val(valor);
      sincronizarTabelaBancaria();
   });

   $(document).on("input", ".banco-conta", function () {
      // Conta limitada a 16 dígitos. O último dígito vira verificador.
      let valor = $(this).val().replaceAll(/\D/g, "").slice(0, 16);
      if (valor.length > 1) valor = valor.replace(/(\d+)(\d)$/, "$1-$2");
      $(this).val(valor);
      sincronizarTabelaBancaria();
   });
}

// SINCRONIZAÇÃO DOS CAMPOS DINÂMICOS

// COPIA OS CAMPOS DINÂMICOS PARA OS HIDDEN QUE O FLUIG PERSISTE E A INTEGRAÇÃO LÊ.
function sincronizarCamposDinamicosHidden() {
   const uf = ($("#estado").val() || "").trim();
   if (uf) $("#hiddenEstadoValor").val(uf);

   const cidade = ($("#cidade").val() || "").trim();
   if (cidade) $("#nomeCidadeSalva").val(cidade);

   for (let i = 1; i <= LIMITE_GRUPO_MERCADORIA; i++) {
      const $select = $("#grupoMercadoria" + i);
      const $hidden = $("#hiddenGrupoMercadoria" + i);
      if (!$hidden.length || !$select.length) continue;

      const valor = ($select.val() || "").trim();
      // Durante a restauração um campo ainda vazio não pode apagar o valor salvo.
      if (valor || !globalThis._formRestaurando) $hidden.val(valor);
   }

   for (let i = 1; i <= LIMITE_CNAE_SECUNDARIO; i++) {
      const $campo = $("#cnaeSecundario" + i);
      const $hidden = $("#hiddenCnaeSecundario" + i);
      if (!$hidden.length || !$campo.length) continue;

      $hidden.val(($campo.val() || "").trim());
   }
}

// DADOS BANCÁRIOS

// RETORNA O SUFIXO DOS CAMPOS DE UMA CONTA (a primeira conta não tem sufixo).
function _sufixoBancario(numero) {
   return numero === 1 ? "" : String(numero);
}

// MONTA O CARD DE UMA CONTA BANCÁRIA.
function _gerarHtmlCardBancario(numero) {
   const sufixo = _sufixoBancario(numero);
   const btnRemover = numero === 1
      ? ""
      : '<button type="button" class="btn-remove-bank" data-numero="' + numero + '">Remover</button>';

   return (
      '<div class="bank-card" id="bank-card-' + numero + '">' +
      '  <div class="bank-card-head">' +
      '    <span class="bank-card-title">Conta Bancária ' + numero + "</span>" + btnRemover +
      "  </div>" +
      '  <div class="grid g3">' +
      '    <div class="fg span2">' +
      '      <label for="selectBancoNome' + sufixo + '">Nome do Banco</label>' +
      '      <div class="select-wrap">' +
      '        <select id="selectBancoNome' + sufixo + '" class="form-control banco-select">' +
      opcoesDaLista(listaBancos(), "Selecione o banco...") +
      "        </select>" +
      "      </div>" +
      '      <input type="hidden" id="banco' + sufixo + '" name="banco' + sufixo + '" class="banco-cod">' +
      '      <input type="hidden" id="bancoDescricao' + sufixo + '" name="bancoDescricao' + sufixo + '" class="banco-descricao">' +
      "    </div>" +
      '    <div class="fg"><label>Código do Banco</label>' +
      '      <input type="text" id="bancoCodExibicao' + sufixo + '" class="form-control" placeholder="000" readonly></div>' +
      '    <div class="fg"><label for="agencia' + sufixo + '">Agência</label>' +
      '      <input type="text" id="agencia' + sufixo + '" name="agencia' + sufixo + '" class="form-control banco-agencia" placeholder="0000-0"></div>' +
      '    <div class="fg"><label for="conta' + sufixo + '">Conta</label>' +
      '      <input type="text" id="conta' + sufixo + '" name="conta' + sufixo + '" class="form-control banco-conta" placeholder="00000-0"></div>' +
      "  </div>" +
      "</div>"
   );
}

// LÊ AS CONTAS BANCÁRIAS JÁ SALVAS NO PROCESSO (hidden do Fluig ou tabela auxiliar).
function _contasBancariasSalvas() {
   const contas = [];

   for (let i = 1; i <= LIMITE_CONTAS_BANCARIAS; i++) {
      const conta = {
         cod: ($("#hiddenBanco" + i + "Cod").val() || "").trim(),
         desc: ($("#hiddenBanco" + i + "Desc").val() || "").trim(),
         agencia: ($("#hiddenBanco" + i + "Agencia").val() || "").trim(),
         numero: ($("#hiddenBanco" + i + "Conta").val() || "").trim()
      };
      if (conta.cod || conta.agencia || conta.numero) contas.push(conta);
   }

   if (contas.length) return contas;

   $("#tableDadosBancarios tbody tr").each(function () {
      const conta = {
         cod: ($(this).find(".dbBanco").val() || "").trim(),
         desc: ($(this).find(".dbBancoDescricao").val() || "").trim(),
         agencia: ($(this).find(".dbAgencia").val() || "").trim(),
         numero: ($(this).find(".dbConta").val() || "").trim()
      };
      if (conta.cod || conta.agencia || conta.numero) contas.push(conta);
   });

   return contas;
}

// REAPLICA A MÁSCARA DE AGÊNCIA/CONTA EM VALORES QUE VÊM DO RM APENAS COM DÍGITOS.
function _formatarDigitoVerificador(valor) {
   valor = (valor || "").trim();
   return valor.length > 1 ? valor.slice(0, -1) + "-" + valor.slice(-1) : valor;
}

// MONTA OS CARDS DE CONTA BANCÁRIA, RESTAURANDO O QUE JÁ ESTIVER SALVO NO PROCESSO.
function inicializarDadosBancarios() {
   const $wrap = $("#dados-bancarios-cards").empty();
   const contas = _contasBancariasSalvas();

   if (!contas.length) {
      $wrap.append(_gerarHtmlCardBancario(1));
      aplicarBuscaSelect("#selectBancoNome");
      controlarBotaoAdicionarConta();
      return;
   }

   contas.forEach(function (conta, index) {
      const numero = index + 1;
      const sufixo = _sufixoBancario(numero);
      $wrap.append(_gerarHtmlCardBancario(numero));

      // O código do banco é a chave; a descrição só é usada se o código não vier salvo.
      const banco = itemDaLista(listaBancos(), conta.cod) || _bancoPorNome(conta.desc);

      definirValorSelect("#selectBancoNome" + sufixo, banco ? banco.valor : "");
      $("#banco" + sufixo).val(banco ? banco.valor : conta.cod);
      $("#bancoDescricao" + sufixo).val(banco ? banco.rotulo : conta.desc);
      $("#bancoCodExibicao" + sufixo).val(banco ? banco.valor : conta.cod);

      $("#agencia" + sufixo).val(_formatarDigitoVerificador(conta.agencia));
      $("#conta" + sufixo).val(_formatarDigitoVerificador(conta.numero));
   });

   aplicarBuscaSelect(".banco-select");
   controlarBotaoAdicionarConta();
   atualizarCamposBancariosRm();
}

// LOCALIZA UM BANCO PELO NOME (usado quando só a descrição foi salva).
function _bancoPorNome(nome) {
   nome = (nome || "").trim();
   if (!nome) return null;

   return listaBancos().find(function (banco) { return banco.rotulo.includes(nome); }) || null;
}

// ACRESCENTA UMA NOVA CONTA BANCÁRIA, RESPEITANDO O LIMITE MÁXIMO.
function adicionarContaBancaria() {
   const numero = $("#dados-bancarios-cards .bank-card").length + 1;

   if (numero > LIMITE_CONTAS_BANCARIAS) {
      _avisarLimite("Máximo de " + LIMITE_CONTAS_BANCARIAS + " contas bancárias.");
      return;
   }

   $("#dados-bancarios-cards").append(_gerarHtmlCardBancario(numero));
   aplicarBuscaSelect("#selectBancoNome" + _sufixoBancario(numero));

   sincronizarTabelaBancaria();
   controlarBotaoAdicionarConta();
}

// REMOVE UMA CONTA BANCÁRIA E RENUMERA AS RESTANTES.
function removerContaBancaria(numero) {
   $("#bank-card-" + numero).remove();
   _reordenarCardsBancarios();
   sincronizarTabelaBancaria();
   controlarBotaoAdicionarConta();
}

// RENUMERA OS CARDS DE CONTA BANCÁRIA, ATUALIZANDO IDS E NAMES DOS CAMPOS.
function _reordenarCardsBancarios() {
   $("#dados-bancarios-cards .bank-card").each(function (index) {
      const numero = index + 1;
      const sufixo = _sufixoBancario(numero);

      $(this).attr("id", "bank-card-" + numero);
      $(this).find(".bank-card-title").text("Conta Bancária " + numero);
      $(this).find(".btn-remove-bank").attr("data-numero", numero);

      $(this).find(".banco-select").attr("id", "selectBancoNome" + sufixo);
      $(this).find(".banco-cod").attr({ id: "banco" + sufixo, name: "banco" + sufixo });
      $(this).find(".banco-descricao").attr({ id: "bancoDescricao" + sufixo, name: "bancoDescricao" + sufixo });
      $(this).find(".banco-agencia").attr({ id: "agencia" + sufixo, name: "agencia" + sufixo });
      $(this).find(".banco-conta").attr({ id: "conta" + sufixo, name: "conta" + sufixo });

      if (numero === 1) $(this).find(".btn-remove-bank").remove();
   });
}

// COPIA OS CARDS BANCÁRIOS PARA A TABELA AUXILIAR E PARA OS HIDDEN DO FLUIG.
function sincronizarTabelaBancaria() {
   const $tbody = $("#tableDadosBancarios tbody").empty();

   $("#dados-bancarios-cards .bank-card").each(function (index) {
      const numero = index + 1;
      const sufixo = _sufixoBancario(numero);

      const banco = ($("#banco" + sufixo).val() || "").trim();
      const descricao = ($("#bancoDescricao" + sufixo).val() || "").trim();
      const agencia = ($("#agencia" + sufixo).val() || "").replace(/\D/g, "");
      const conta = ($("#conta" + sufixo).val() || "").replace(/\D/g, "");

      $tbody.append(
         "<tr>" +
         '<td><input type="hidden" name="dbBanco" class="dbBanco" value="' + escaparHtml(banco) + '"></td>' +
         '<td><input type="hidden" name="dbBancoDescricao" class="dbBancoDescricao" value="' + escaparHtml(descricao) + '"></td>' +
         '<td><input type="hidden" name="dbAgencia" class="dbAgencia" value="' + agencia + '"></td>' +
         '<td><input type="hidden" name="dbConta" class="dbConta" value="' + conta + '"></td>' +
         "</tr>"
      );

      _gravarHiddensConta(numero, banco, descricao, agencia, conta);
   });

   // Zera os hidden das contas que deixaram de existir.
   for (let i = $("#dados-bancarios-cards .bank-card").length + 1; i <= LIMITE_CONTAS_BANCARIAS; i++) {
      _gravarHiddensConta(i, "", "", "", "");
   }

   atualizarCamposBancariosRm();
}

// GRAVA UMA CONTA BANCÁRIA NOS CAMPOS HIDDEN QUE O FLUIG PERSISTE.
function _gravarHiddensConta(numero, banco, descricao, agencia, conta) {
   if (numero > LIMITE_CONTAS_BANCARIAS) return;

   $("#hiddenBanco" + numero + "Cod").val(banco);
   $("#hiddenBanco" + numero + "Desc").val(descricao);
   $("#hiddenBanco" + numero + "Agencia").val(agencia);
   $("#hiddenBanco" + numero + "Conta").val(conta);
}

// COPIA A PRIMEIRA CONTA (só dígitos) PARA OS CAMPOS QUE A INTEGRAÇÃO COM O RM LÊ.
function atualizarCamposBancariosRm() {
   $("#agenciaRm").val(($("#agencia").val() || "").replaceAll(/\D/g, ""));
   $("#contaRm").val(($("#conta").val() || "").replaceAll(/\D/g, ""));
}

// CONTROLA A DISPONIBILIDADE DO BOTÃO DE ADICIONAR CONTA BANCÁRIA.
function controlarBotaoAdicionarConta() {
   const total = $("#dados-bancarios-cards .bank-card").length;
   _controlarBotaoAdicionar(total, LIMITE_CONTAS_BANCARIAS, $("#btn-add-conta-bancaria"));
}

// TABELAS DE RELATÓRIO

// PREENCHE UMA TABELA DE RELATÓRIO A PARTIR DE UMA LISTA DE LINHAS, MANTENDO O TEMPLATE QUANDO VAZIA.
function _preencherTabelaRelatorio(seletorTabela, linhas) {
   const $tbody = $(seletorTabela + " tbody");
   const $template = $tbody.find("tr:first").clone();

   $tbody.empty();

   linhas.forEach(function (campos) {
      const $linha = $template.clone();
      Object.keys(campos).forEach(function (classe) {
         $linha.find("." + classe).val(campos[classe]);
      });
      $tbody.append($linha);
   });

   if (!$tbody.find("tr").length) $tbody.append($template);
}

// COPIA CNAEs E GRUPOS DE MERCADORIA PARA AS TABELAS USADAS NOS RELATÓRIOS DO PROCESSO.
function sincronizarTabelasRelatorio() {
   const cnaes = [];
   const cnaePrincipal = ($("#cnaePrincipal").val() || "").trim();

   if (cnaePrincipal) {
      cnaes.push({
         relCnaeTipo: "P",
         relCnaeCodigo: cnaePrincipal.split(" ")[0] || cnaePrincipal,
         relCnaeDescricao: cnaePrincipal
      });
   }

   for (let i = 1; i <= LIMITE_CNAE_SECUNDARIO; i++) {
      const cnae = ($("#hiddenCnaeSecundario" + i).val() || "").trim();
      if (!cnae) continue;

      cnaes.push({
         relCnaeTipo: "S",
         relCnaeCodigo: cnae.split(" ")[0] || cnae,
         relCnaeDescricao: cnae
      });
   }

   const grupos = [];
   for (let i = 1; i <= LIMITE_GRUPO_MERCADORIA; i++) {
      const grupo = ($("#hiddenGrupoMercadoria" + i).val() || "").trim();
      if (grupo) grupos.push({ relGmSeq: i, relGmDescricao: grupo });
   }

   _preencherTabelaRelatorio("#tbRelCnaes", cnaes);
   _preencherTabelaRelatorio("#tbRelGrupos", grupos);
}
