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
// Agência/conta são só números; o dígito verificador tem campo próprio (não é mais
// deduzido cortando o último caractere digitado).
function inicializarMascarasBancarias() {
   $(document).on("input", ".banco-agencia", function () {
      $(this).val($(this).val().replace(/\D/g, "").slice(0, MAX_AGENCIA_RM));
      sincronizarTabelaBancaria();
   });

   $(document).on("input", ".banco-conta", function () {
      $(this).val($(this).val().replace(/\D/g, "").slice(0, MAX_CONTA_RM));
      sincronizarTabelaBancaria();
   });

   $(document).on("input", ".banco-digito-agencia, .banco-digito-conta", function () {
      $(this).val($(this).val().replace(/[^0-9A-Za-z]/g, "").toUpperCase().slice(0, MAX_DIGITO_RM));
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

   if (typeof sincronizarTabelaEnderecos === "function") sincronizarTabelaEnderecos();
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
      "  </div>" +
      '  <div class="grid g2">' +
      '    <div class="banco-num-group">' +
      '      <div class="fg banco-num-main"><label for="agencia' + sufixo + '">Agência</label>' +
      '        <input type="text" id="agencia' + sufixo + '" name="agencia' + sufixo + '" class="form-control banco-agencia" placeholder="0000"></div>' +
      '      <div class="fg banco-num-dig"><label for="digitoAgencia' + sufixo + '">Dígito</label>' +
      '        <input type="text" id="digitoAgencia' + sufixo + '" name="digitoAgencia' + sufixo + '" class="form-control banco-digito-agencia" placeholder="0"></div>' +
      "    </div>" +
      '    <div class="banco-num-group">' +
      '      <div class="fg banco-num-main"><label for="conta' + sufixo + '">Conta</label>' +
      '        <input type="text" id="conta' + sufixo + '" name="conta' + sufixo + '" class="form-control banco-conta" placeholder="00000"></div>' +
      '      <div class="fg banco-num-dig"><label for="digitoConta' + sufixo + '">Dígito</label>' +
      '        <input type="text" id="digitoConta' + sufixo + '" name="digitoConta' + sufixo + '" class="form-control banco-digito-conta" placeholder="0"></div>' +
      "    </div>" +
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
         digAgencia: ($("#hiddenBanco" + i + "DigAgencia").val() || "").trim(),
         numero: ($("#hiddenBanco" + i + "Conta").val() || "").trim(),
         digConta: ($("#hiddenBanco" + i + "DigConta").val() || "").trim()
      };
      if (conta.cod || conta.agencia || conta.numero) contas.push(conta);
   }

   if (contas.length) return contas;

   $("#tableDadosBancarios tbody tr").each(function () {
      const conta = {
         cod: ($(this).find(".dbBanco").val() || "").trim(),
         desc: ($(this).find(".dbBancoDescricao").val() || "").trim(),
         agencia: ($(this).find(".dbAgencia").val() || "").trim(),
         digAgencia: ($(this).find(".dbDigAgencia").val() || "").trim(),
         numero: ($(this).find(".dbConta").val() || "").trim(),
         digConta: ($(this).find(".dbDigConta").val() || "").trim()
      };
      if (conta.cod || conta.agencia || conta.numero) contas.push(conta);
   });

   return contas;
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

      $("#agencia" + sufixo).val(conta.agencia);
      $("#digitoAgencia" + sufixo).val(conta.digAgencia);
      $("#conta" + sufixo).val(conta.numero);
      $("#digitoConta" + sufixo).val(conta.digConta);
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
      $(this).find(".banco-digito-agencia").attr({ id: "digitoAgencia" + sufixo, name: "digitoAgencia" + sufixo });
      $(this).find(".banco-conta").attr({ id: "conta" + sufixo, name: "conta" + sufixo });
      $(this).find(".banco-digito-conta").attr({ id: "digitoConta" + sufixo, name: "digitoConta" + sufixo });

      if (numero === 1) $(this).find(".btn-remove-bank").remove();
   });
}

// COPIA OS CARDS BANCÁRIOS PARA A TABELA AUXILIAR E PARA OS HIDDEN DO FLUIG.
function sincronizarTabelaBancaria() {
   // Enquanto o formulario restaura os cards ainda nao existem, e o laco de limpeza
   // no fim zeraria de 1 a 5 justamente os hidden que inicializarDadosBancarios le.
   if (globalThis._formRestaurando) return;

   const $tbody = $("#tableDadosBancarios tbody").empty();

   $("#dados-bancarios-cards .bank-card").each(function (index) {
      const numero = index + 1;
      const sufixo = _sufixoBancario(numero);

      const banco = ($("#banco" + sufixo).val() || "").trim();
      const descricao = ($("#bancoDescricao" + sufixo).val() || "").trim();
      const agencia = ($("#agencia" + sufixo).val() || "").replace(/\D/g, "");
      const digAgencia = ($("#digitoAgencia" + sufixo).val() || "").trim();
      const conta = ($("#conta" + sufixo).val() || "").replace(/\D/g, "");
      const digConta = ($("#digitoConta" + sufixo).val() || "").trim();

      $tbody.append(
         "<tr>" +
         '<td><input type="hidden" name="dbBanco" class="dbBanco" value="' + escaparHtml(banco) + '"></td>' +
         '<td><input type="hidden" name="dbBancoDescricao" class="dbBancoDescricao" value="' + escaparHtml(descricao) + '"></td>' +
         '<td><input type="hidden" name="dbAgencia" class="dbAgencia" value="' + agencia + '"></td>' +
         '<td><input type="hidden" name="dbDigAgencia" class="dbDigAgencia" value="' + escaparHtml(digAgencia) + '"></td>' +
         '<td><input type="hidden" name="dbConta" class="dbConta" value="' + conta + '"></td>' +
         '<td><input type="hidden" name="dbDigConta" class="dbDigConta" value="' + escaparHtml(digConta) + '"></td>' +
         "</tr>"
      );

      _gravarHiddensConta(numero, banco, descricao, agencia, digAgencia, conta, digConta);
   });

   // Zera os hidden das contas que deixaram de existir.
   for (let i = $("#dados-bancarios-cards .bank-card").length + 1; i <= LIMITE_CONTAS_BANCARIAS; i++) {
      _gravarHiddensConta(i, "", "", "", "", "", "");
   }

   atualizarCamposBancariosRm();
}

// GRAVA UMA CONTA BANCÁRIA NOS CAMPOS HIDDEN QUE O FLUIG PERSISTE.
function _gravarHiddensConta(numero, banco, descricao, agencia, digAgencia, conta, digConta) {
   if (numero > LIMITE_CONTAS_BANCARIAS) return;

   $("#hiddenBanco" + numero + "Cod").val(banco);
   $("#hiddenBanco" + numero + "Desc").val(descricao);
   $("#hiddenBanco" + numero + "Agencia").val(agencia);
   $("#hiddenBanco" + numero + "DigAgencia").val(digAgencia);
   $("#hiddenBanco" + numero + "Conta").val(conta);
   $("#hiddenBanco" + numero + "DigConta").val(digConta);
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

// ENDEREÇOS
//
// O endereço 1 é o do HTML (#cep, #endereco, #numero...) e continua sendo o único que a
// integração com o RM lê — por isso ele fica estático, com os IDs originais intactos.
// Os endereços 2+ são gerados aqui, com sufixo numérico, e persistem na tableEnderecos.

// SUFIXO DOS CAMPOS DE UM ENDEREÇO (o primeiro usa os IDs originais, sem sufixo).
function _sufixoEndereco(numero) {
   return numero === 1 ? "" : String(numero);
}

// RÓTULO EXIBIDO DE UM ENDEREÇO ADICIONAL.
// O endereço 1 é o "Endereço de Cadastro", então os adicionais (numerados 2, 3... por
// dentro, por causa dos IDs dos campos) aparecem para o usuário como 1, 2...
function _rotuloEndereco(numero) {
   return "Endereço " + (numero - 1);
}

// MONTA O CARD DE UM ENDEREÇO ADICIONAL.
// O card carrega os dois modos (nacional e exterior) e alterna a visibilidade em
// aplicarModoEstrangeiroNoCard — trocar o DOM daria o mesmo trabalho da renumeração.
function _gerarHtmlCardEndereco(numero) {
   const s = _sufixoEndereco(numero);

   return (
      '<div class="addr-card endereco-extra" id="addr-card-' + numero + '">' +
      '  <div class="addr-card-head">' +
      '    <span class="addr-card-title">' + _rotuloEndereco(numero) + "</span>" +
      '    <input type="text" id="descricaoEndereco' + s + '" name="descricaoEndereco' + s + '"' +
      '           class="form-control addr-card-desc endereco-descricao"' +
      '           placeholder="Descrição do endereço (ex.: Matriz, Filial, Entrega) *" maxlength="60">' +
      '    <button type="button" class="btn-remove-addr" data-numero="' + numero + '">Remover</button>' +
      "  </div>" +
      '  <input type="hidden" id="idContatoEndereco' + s + '" name="idContatoEndereco' + s + '" class="endereco-idcontato">' +
      '  <div class="grid grid-endereco sem-pais">' +
      '    <div class="fg col-cep endereco-fg-cep"><label for="cep' + s + '">CEP</label>' +
      '      <input type="text" id="cep' + s + '" name="cep' + s + '" class="form-control endereco-cep" placeholder="00000-000"></div>' +
      '    <div class="fg col-rua"><label for="endereco' + s + '">Endereço</label>' +
      '      <input type="text" id="endereco' + s + '" name="endereco' + s + '" class="form-control endereco-rua" placeholder="Rua, Avenida, Rodovia..."></div>' +
      '    <div class="fg col-numero"><label for="numero' + s + '">Número</label>' +
      '      <input type="text" id="numero' + s + '" name="numero' + s + '" class="form-control endereco-numero" placeholder="Nº"></div>' +
      '    <div class="fg col-complemento"><label for="complemento' + s + '">Complemento</label>' +
      '      <input type="text" id="complemento' + s + '" name="complemento' + s + '" class="form-control endereco-complemento" placeholder="Sala, Andar, Bloco..."></div>' +
      '    <div class="fg col-estado endereco-fg-estado"><label for="estado' + s + '" class="endereco-estado-label">Estado</label>' +
      '      <div class="select-wrap endereco-estado-wrap">' +
      '        <select id="estado' + s + '" name="estado' + s + '" class="form-control endereco-estado">' +
      opcoesDaLista(listaEstados(), "Selecione o estado...") +
      "        </select>" +
      "      </div>" +
      '      <input type="text" class="form-control endereco-exterior" value="EX" readonly tabindex="-1" style="display:none"></div>' +
      '    <div class="fg col-cidade"><label for="cidade' + s + '">Cidade</label>' +
      '      <div class="select-wrap endereco-cidade-wrap">' +
      '        <select id="cidade' + s + '" name="cidade' + s + '" class="form-control endereco-cidade">' +
      '          <option value="">Selecione a cidade...</option>' +
      "        </select>" +
      "      </div>" +
      '      <input type="text" class="form-control endereco-cidade-livre" placeholder="Cidade / Localidade" style="display:none">' +
      '      <input type="hidden" id="codMunicipio' + s + '" name="codMunicipio' + s + '" class="endereco-codmunicipio"></div>' +
      '    <div class="fg col-bairro"><label for="bairro' + s + '">Bairro</label>' +
      '      <input type="text" id="bairro' + s + '" name="bairro' + s + '" class="form-control endereco-bairro" placeholder="Bairro"></div>' +
      "  </div>" +
      "</div>"
   );
}

// INDICA SE O CADASTRO ESTÁ EM MODO DE ENDEREÇO ESTRANGEIRO.
function _ehEnderecoEstrangeiro() {
   return ($("#categoria").val() || "").trim() === "J" && $("#toggleEstrangeiro").is(":checked");
}

// AJUSTA UM CARD DE ENDEREÇO ADICIONAL AO MODO NACIONAL OU EXTERIOR.
// No exterior não há CEP nem UF: o estado é fixo "EX" e a cidade é digitada livremente.
function aplicarModoEstrangeiroNoCard($card, ativo) {
   $card.find(".grid-endereco").toggleClass("modo-exterior", ativo);
   $card.find(".endereco-fg-cep").toggle(!ativo);
   $card.find(".endereco-estado-wrap").toggle(!ativo);
   $card.find(".endereco-exterior").toggle(ativo);
   $card.find(".endereco-cidade-wrap").toggle(!ativo);
   $card.find(".endereco-cidade-livre").toggle(ativo);

   $card.find(".endereco-estado-label").text(ativo ? "End. Exterior" : "Estado");

   if (ativo) {
      $card.find(".endereco-cep").val("");
      definirValorSelect($card.find(".endereco-estado"), "EX");
      $card.find(".endereco-codmunicipio").val("");
      return;
   }

   $card.find(".endereco-cidade-livre").val("");
   if (($card.find(".endereco-estado").val() || "") === "EX") {
      definirValorSelect($card.find(".endereco-estado"), "");
   }
}

// APLICA O MODO NACIONAL/EXTERIOR A TODOS OS ENDEREÇOS ADICIONAIS.
function aplicarModoEstrangeiroNosEnderecos(ativo) {
   $("#enderecos-cards .endereco-extra").each(function () {
      aplicarModoEstrangeiroNoCard($(this), ativo);
   });

   sincronizarTabelaEnderecos();
}

// LÊ A CIDADE DE UM CARD, VINDA DO SELECT (nacional) OU DO CAMPO LIVRE (exterior).
function _valorCidadeCard($card) {
   return _ehEnderecoEstrangeiro()
      ? ($card.find(".endereco-cidade-livre").val() || "")
      : ($card.find(".endereco-cidade").val() || "");
}

// ACRESCENTA UM NOVO ENDEREÇO, RESPEITANDO O LIMITE MÁXIMO.
function adicionarEndereco() {
   // +1 pelo endereço fixo do HTML, que não vive dentro do wrap.
   const numero = $("#enderecos-cards .endereco-extra").length + 2;

   if (numero > LIMITE_ENDERECOS) {
      _avisarLimite("Você pode adicionar no máximo " + LIMITE_ENDERECOS + " endereços.");
      return;
   }

   $("#enderecos-cards").append(_gerarHtmlCardEndereco(numero));

   const s = _sufixoEndereco(numero);
   $("#cep" + s).mask("00000-000");
   $("#numero" + s).mask("000000");
   aplicarBuscaSelect("#estado" + s + ", #cidade" + s);

   aplicarModoEstrangeiroNoCard($("#addr-card-" + numero), _ehEnderecoEstrangeiro());

   sincronizarTabelaEnderecos();
   controlarBotaoAdicionarEndereco();
}

// REMOVE UM ENDEREÇO E RENUMERA OS RESTANTES.
function removerEndereco(numero) {
   $("#addr-card-" + numero).remove();
   _reordenarCardsEndereco();
   sincronizarTabelaEnderecos();
   controlarBotaoAdicionarEndereco();
}

// RENUMERA OS CARDS DE ENDEREÇO, ATUALIZANDO IDS, NAMES E RÓTULOS.
function _reordenarCardsEndereco() {
   $("#enderecos-cards .endereco-extra").each(function (index) {
      const numero = index + 2; // o endereço 1 é o fixo do HTML
      const s = _sufixoEndereco(numero);

      $(this).attr("id", "addr-card-" + numero);
      $(this).find(".addr-card-title").text(_rotuloEndereco(numero));
      $(this).find(".btn-remove-addr").attr("data-numero", numero);

      _renomearCampoEndereco($(this), ".endereco-idcontato", "idContatoEndereco", s);
      _renomearCampoEndereco($(this), ".endereco-descricao", "descricaoEndereco", s);
      _renomearCampoEndereco($(this), ".endereco-cep", "cep", s);
      _renomearCampoEndereco($(this), ".endereco-rua", "endereco", s);
      _renomearCampoEndereco($(this), ".endereco-numero", "numero", s);
      _renomearCampoEndereco($(this), ".endereco-complemento", "complemento", s);
      _renomearCampoEndereco($(this), ".endereco-bairro", "bairro", s);
      _renomearCampoEndereco($(this), ".endereco-cidade", "cidade", s);
      _renomearCampoEndereco($(this), ".endereco-codmunicipio", "codMunicipio", s);
      _renomearCampoEndereco($(this), ".endereco-estado", "estado", s);
   });
}

// AJUSTA ID, NAME E O "for" DO RÓTULO DE UM CAMPO RENUMERADO.
function _renomearCampoEndereco($card, seletor, prefixo, sufixo) {
   const id = prefixo + sufixo;
   $card.find(seletor).attr({ id: id, name: id });
   $card.find('label[for^="' + prefixo + '"]').attr("for", id);
}

// COPIA OS ENDEREÇOS ADICIONAIS PARA A TABELA QUE O FLUIG PERSISTE.
// Enquanto o formulário restaura, os cards ainda não existem: sincronizar agora
// apagaria da tabela justamente os endereços que inicializarEnderecos vai ler.
function sincronizarTabelaEnderecos() {
   if (globalThis._formRestaurando) return;

   const $tbody = $("#tableEnderecos tbody").empty();
   const paraRm = [];

   $("#enderecos-cards .endereco-extra").each(function (index) {
      const $card = $(this);
      const numero = index + 2;
      const s = _sufixoEndereco(numero);

      const endereco = {
         ordem: numero,
         idcontato: ($("#idContatoEndereco" + s).val() || "").trim(),
         descricao: ($("#descricaoEndereco" + s).val() || "").trim(),
         cep: ($("#cep" + s).val() || "").trim(),
         rua: ($("#endereco" + s).val() || "").trim(),
         numero: ($("#numero" + s).val() || "").trim(),
         complemento: ($("#complemento" + s).val() || "").trim(),
         bairro: ($("#bairro" + s).val() || "").trim(),
         cidade: (_valorCidadeCard($card) || "").trim(),
         estado: ($("#estado" + s).val() || "").trim(),
         codMunicipio: ($("#codMunicipio" + s).val() || "").trim()
      };

      $tbody.append(
         "<tr>" +
         _celulaEndereco("endIdContato", endereco.idcontato) +
         _celulaEndereco("endDescricao", endereco.descricao) +
         _celulaEndereco("endCep", endereco.cep) +
         _celulaEndereco("endRua", endereco.rua) +
         _celulaEndereco("endNumero", endereco.numero) +
         _celulaEndereco("endComplemento", endereco.complemento) +
         _celulaEndereco("endBairro", endereco.bairro) +
         _celulaEndereco("endCidade", endereco.cidade) +
         _celulaEndereco("endEstado", endereco.estado) +
         _celulaEndereco("endCodMunicipio", endereco.codMunicipio) +
         "</tr>"
      );

      // Só vale enviar ao RM o endereço que tem ao menos logradouro ou CEP.
      if (endereco.cep || endereco.rua) paraRm.push(endereco);
   });

   // O servicetask16 lê este JSON para gravar os endereços extras na FCFOCONTATO.
   $("#enderecosJson").val(JSON.stringify(paraRm));
}

// MONTA UMA CÉLULA HIDDEN DA tableEnderecos.
function _celulaEndereco(nome, valor) {
   return '<td><input type="hidden" name="' + nome + '" class="' + nome +
          '" value="' + escaparHtml((valor || "").trim()) + '"></td>';
}

// LÊ OS ENDEREÇOS ADICIONAIS JÁ SALVOS NO PROCESSO (hidden do Fluig ou tabela auxiliar).
// A tableEnderecos é tabela filha e não volta preenchida ao reabrir o formulário — quem
// de fato persiste é o hidden enderecosJson, igual aos hiddenBanco* dos dados bancários.
function _enderecosSalvos() {
   const enderecos = [];

   const json = ($("#enderecosJson").val() || "").trim();
   if (json && json !== "[]") {
      try {
         const salvos = JSON.parse(json);
         if (Array.isArray(salvos) && salvos.length) return salvos;
      } catch (erro) {
         console.error("enderecosJson inválido, usando a tabela auxiliar:", erro);
      }
   }

   $("#tableEnderecos tbody tr").each(function () {
      const endereco = {
         idcontato: ($(this).find(".endIdContato").val() || "").trim(),
         descricao: ($(this).find(".endDescricao").val() || "").trim(),
         cep: ($(this).find(".endCep").val() || "").trim(),
         rua: ($(this).find(".endRua").val() || "").trim(),
         numero: ($(this).find(".endNumero").val() || "").trim(),
         complemento: ($(this).find(".endComplemento").val() || "").trim(),
         bairro: ($(this).find(".endBairro").val() || "").trim(),
         cidade: ($(this).find(".endCidade").val() || "").trim(),
         estado: ($(this).find(".endEstado").val() || "").trim(),
         codMunicipio: ($(this).find(".endCodMunicipio").val() || "").trim()
      };
      if (endereco.cep || endereco.rua) enderecos.push(endereco);
   });

   return enderecos;
}

// RECRIA OS CARDS DOS ENDEREÇOS ADICIONAIS SALVOS NO PROCESSO.
function inicializarEnderecos() {
   const $wrap = $("#enderecos-cards").empty();
   const estrangeiro = _ehEnderecoEstrangeiro();

   _enderecosSalvos().forEach(function (endereco, index) {
      const numero = index + 2;
      const s = _sufixoEndereco(numero);

      $wrap.append(_gerarHtmlCardEndereco(numero));

      $("#idContatoEndereco" + s).val(endereco.idcontato || "");
      $("#descricaoEndereco" + s).val(endereco.descricao || "");
      $("#cep" + s).val(endereco.cep).mask("00000-000");
      $("#endereco" + s).val(endereco.rua);
      $("#numero" + s).val(endereco.numero).mask("000000");
      $("#complemento" + s).val(endereco.complemento);
      $("#bairro" + s).val(endereco.bairro);
      $("#codMunicipio" + s).val(endereco.codMunicipio);

      // A lista de cidades depende da UF, então o estado é restaurado primeiro.
      definirValorSelect("#estado" + s, endereco.estado);
      popularSelect("#cidade" + s, listaMunicipios(endereco.estado), "Selecione a cidade...", endereco.cidade);

      aplicarBuscaSelect("#estado" + s + ", #cidade" + s);

      const $card = $("#addr-card-" + numero);
      aplicarModoEstrangeiroNoCard($card, estrangeiro);
      // No exterior a cidade salva vive no campo livre, não no select.
      if (estrangeiro) $card.find(".endereco-cidade-livre").val(endereco.cidade);
   });

   controlarBotaoAdicionarEndereco();
}

// CONTROLA A DISPONIBILIDADE DO BOTÃO DE ADICIONAR ENDEREÇO.
function controlarBotaoAdicionarEndereco() {
   const total = $("#enderecos-cards .endereco-extra").length + 1; // + o endereço fixo
   _controlarBotaoAdicionar(total, LIMITE_ENDERECOS, $("#btn-add-endereco"));
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
