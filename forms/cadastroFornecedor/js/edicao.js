/**
 * edicao.js — Edição de Cliente/Fornecedor existente.
 *
 * Fluxo: tela de seleção -> "Editar" -> modal de busca (CNPJ/CPF/Nome/CODCFO)
 *  -> seleção -> preenche o formulário com os dados do RM -> usuário altera
 *  -> "Enviar" segue o fluxo normal (Validação -> RM), e o servicetask16 faz
 *  UPDATE (usa o CODCFO real gravado nos hidden de edição) em vez de criar.
 */

/**
 * Abre o modal de busca de Cliente/Fornecedor (padrão FLUIGC.modal).
 * Chamado pelo botão "Editar" da tela de seleção inicial.
 */
function abrirModalEdicao() {
   var corpo = ''
      + '<div class="edicao-busca">'
      + '   <div class="edicao-busca-head">'
      + '      <div class="edicao-busca-icone"><i class="flaticon flaticon-search"></i></div>'
      + '      <div class="edicao-busca-head-text">'
      + '         <div class="edicao-busca-titulo">Buscar cliente / fornecedor</div>'
      + '         <div class="edicao-busca-sub">Pesquise por CNPJ, CPF, nome ou código (CODCFO)</div>'
      + '      </div>'
      + '   </div>'
      + '   <div class="edicao-busca-row">'
      + '      <input type="text" id="edicaoTermoBusca" class="edicao-busca-input" '
      + '             placeholder="Digite CNPJ, CPF, nome ou código..." autocomplete="off" />'
      + '      <button type="button" id="edicaoBtnBuscar" class="edicao-busca-btn">Buscar</button>'
      + '   </div>'
      + '   <div id="edicaoResultados" class="edicao-resultados">'
      + '      <div class="edicao-msg">Digite um CNPJ, CPF, nome ou código e clique em Buscar.</div>'
      + '   </div>'
      + '</div>';

   FLUIGC.modal({
      title: 'Editar Cliente / Fornecedor',
      id: 'modalEdicaoCfo',
      size: 'large',
      backdrop: 'static',
      keyboard: false,
      content: corpo,
      actions: [{ label: 'Fechar', autoClose: true, bind: 'data-dismiss' }]
   }, function (err) {
      if (err) {
         console.error('[edicao] Falha ao abrir modal:', err);
         return;
      }
      $('#edicaoBtnBuscar').off('click').on('click', buscarCfoParaEdicao);
      $('#edicaoTermoBusca').off('keydown').on('keydown', function (e) {
         if (e.which === 13) { e.preventDefault(); buscarCfoParaEdicao(); }
      });
      setTimeout(function () { $('#edicaoTermoBusca').focus(); }, 200);

      // Escurece o fundo enquanto o modal está aberto (esconde o formulário atrás).
      $('body').addClass('modal-edicao-aberto');
      $('#modalEdicaoCfo').off('hidden.bs.modal').on('hidden.bs.modal', function () {
         $('body').removeClass('modal-edicao-aberto');
      });

      // Reforça: não fecha ao clicar fora nem com ESC — apenas pelo X ou Fechar.
      var instModal = $('#modalEdicaoCfo').data('bs.modal');
      if (instModal && instModal.options) {
         instModal.options.backdrop = 'static';
         instModal.options.keyboard = false;
      }
   });
}

/**
 * Consulta o ds_buscarCfoRM com o termo digitado e renderiza a lista de resultados.
 */
function buscarCfoParaEdicao() {
   var termo = ($('#edicaoTermoBusca').val() || '').trim();
   if (termo.length < 2) {
      FLUIGC.toast({ title: 'Busca', message: 'Digite ao menos 2 caracteres.', type: 'warning' });
      return;
   }

   $('#edicaoResultados').html('<div class="edicao-msg">Buscando...</div>');

   try {
      var ds = DatasetFactory.getDataset(
         'ds_buscarCfoRM',
         null,
         [DatasetFactory.createConstraint('TERMO', termo, termo, ConstraintType.MUST)],
         null
      );

      if (!ds || !ds.values || !ds.values.length) {
         $('#edicaoResultados').html('<div class="edicao-msg">Dataset ds_buscarCfoRM não publicado.</div>');
         return;
      }

      var status = (ds.values[0].STATUS || '').toString().trim();
      if (status === 'ERRO') {
         var msg = (ds.values[0].MENSAGEM || 'erro desconhecido').toString();
         $('#edicaoResultados').html('<div class="edicao-msg edicao-erro">Erro: ' + msg + '</div>');
         return;
      }

      var result = ds.values[0].RESULT;
      var lista = result ? JSON.parse(result) : [];
      renderizarResultadosEdicao(lista);

   } catch (e) {
      console.error('[edicao] Erro na busca:', e);
      $('#edicaoResultados').html('<div class="edicao-msg edicao-erro">Não foi possível buscar. Verifique o dataset ds_buscarCfoRM.</div>');
   }
}

/**
 * Monta a tabela de resultados; cada linha seleciona o CFO ao ser clicada.
 */
function renderizarResultadosEdicao(lista) {
   if (!lista || !lista.length) {
      $('#edicaoResultados').html('<div class="edicao-msg">Nenhum cliente/fornecedor encontrado.</div>');
      return;
   }

   var html = '<table class="edicao-tabela"><thead><tr>'
      + '<th>Código</th><th>Nome</th><th>CNPJ/CPF</th><th>Cidade/UF</th>'
      + '</tr></thead><tbody>';

   for (var i = 0; i < lista.length; i++) {
      var r = lista[i];
      var cod = (r.CODCFO || '').toString();
      var col = (r.CODCOLIGADA || '').toString();
      var nome = (r.NOME || r.NOMEFANTASIA || '').toString();
      var doc = (r.CGCCFO || '').toString();
      var cidadeUf = ((r.CIDADE || '') + (r.UF ? ' / ' + r.UF : '')).toString();

      html += '<tr class="edicao-linha" data-codcfo="' + cod + '" data-coligada="' + col + '">'
         + '<td>' + cod + '</td>'
         + '<td>' + nome + '</td>'
         + '<td>' + doc + '</td>'
         + '<td>' + cidadeUf + '</td>'
         + '</tr>';
   }
   html += '</tbody></table>';

   $('#edicaoResultados').html(html);

   $('#edicaoResultados .edicao-linha').off('click').on('click', function () {
      var codcfo = $(this).data('codcfo');
      var coligada = $(this).data('coligada');
      selecionarCfoEdicao(codcfo, coligada);
   });
}

/**
 * Busca os dados completos do CFO (ds_detalhesCfoRM), preenche o formulário,
 * fecha o modal e entra em modo edição.
 */
function selecionarCfoEdicao(codcfo, coligada) {
   $('#edicaoResultados').prepend('<div class="edicao-msg" id="edicaoCarregando">Carregando dados...</div>');

   try {
      var ds = DatasetFactory.getDataset(
         'ds_detalhesCfoRM',
         null,
         [
            DatasetFactory.createConstraint('CODCFO', codcfo, codcfo, ConstraintType.MUST),
            DatasetFactory.createConstraint('CODCOLIGADA', coligada, coligada, ConstraintType.MUST)
         ],
         null
      );

      if (!ds || !ds.values || !ds.values.length || (ds.values[0].STATUS || '') === 'ERRO') {
         var msg = (ds && ds.values && ds.values.length) ? ds.values[0].MENSAGEM : 'sem retorno';
         FLUIGC.toast({ title: 'Erro', message: 'Não foi possível carregar os dados: ' + msg, type: 'danger' });
         $('#edicaoCarregando').remove();
         return;
      }

      var detalhes = JSON.parse(ds.values[0].RESULT || '{}');

      preencherEdicaoCompleta(detalhes);
      entrarModoEdicao();

      $('#modalEdicaoCfo').modal('hide');

      FLUIGC.toast({ title: 'Edição', message: 'Dados carregados. Faça as alterações e clique em Enviar.', type: 'success', timeout: 4000 });

   } catch (e) {
      console.error('[edicao] Erro ao selecionar CFO:', e);
      FLUIGC.toast({ title: 'Erro', message: 'Falha ao carregar os dados do cliente/fornecedor.', type: 'danger' });
      $('#edicaoCarregando').remove();
   }
}

/**
 * Preenche o formulário inteiro a partir dos dados do RM (ds_detalhesCfoRM).
 * Observação sobre a inversão de nomes (igual ao servicetask16):
 *   RM.NOME = nome fantasia | RM.NOMEFANTASIA = razão social.
 */
function preencherEdicaoCompleta(detalhes) {
   var c = (detalhes && detalhes.cadastro) ? detalhes.cadastro : {};

   // Suprime as verificações de duplicidade (CNPJ/CPF) enquanto carrega os dados:
   // estamos editando um registro que JÁ existe no RM, então duplicidade é esperada.
   globalThis._preenchendoEdicao = true;

   // --- 1) Classificação / categoria / tipo (primeiro: reconfiguram o formulário) ---
   var categoria = (c.CATEGORIA || '').toString().trim().toUpperCase(); // F ou J
   if (categoria) { $('#categoria').val(categoria).trigger('change'); }

   var mapPagrecInv = { '2': '1', '1': '2', '3': '3' }; // inverso do servicetask16
   var classif = mapPagrecInv[(c.PAGREC || '').toString().trim()] || '';
   if (classif) { $('#classificacao').val(classif).trigger('change'); }

   if (c.CODTCF) { $('#tipo').val(c.CODTCF).trigger('change'); }

   // --- 2) Documento (marca como "já consultado" p/ não redisparar verificação) ---
   var cgc = (c.CGCCFO || '').toString().replace(/\D/g, '');
   if (categoria === 'J') {
      globalThis._cnpjJaConsultado = cgc;
      $('#docCnpj').val(cgc).trigger('input');
   } else if (categoria === 'F') {
      globalThis._cpfJaConsultado = cgc;
      $('#docCpf').val(cgc).trigger('input');
   }

   // --- 3) Nome / Fantasia (INVERSÃO) ---
   $('#razaoSocial').val(c.NOMEFANTASIA || c.NOME || '');
   $('#nomeFantasia').val(c.NOME || '');

   // --- 4) Endereço ---
   $('#endereco').val(c.LOGRADOURO || '');
   $('#numero').val(c.NUMERO || '');
   $('#complemento').val(c.COMPLEMENTO || '');
   $('#bairro').val(c.BAIRRO || '');
   $('#cep').val(_fmtCepEdicao(c.CEP || ''));
   $('#pais').val('Brasil');
   if (typeof preencherEnderecoRM === 'function') {
      preencherEnderecoRM(c.UF || '', c.CIDADE || '');
   }
   if (typeof sincronizarCamposDinamicosHidden === 'function') {
      sincronizarCamposDinamicosHidden();
   }

   // --- 5) Contato ---
   $('#telefone').val(_fmtTelEdicao(c.TELEFONE || ''));
   $('#celular').val(_fmtTelEdicao(c.CELULAR || ''));
   $('#emailCr').val(c.EMAIL || '');

   // --- 6) Inscrições ---
   if (c.INSCRESTADUAL) { $('#docInscricaoEstadual').val(c.INSCRESTADUAL).trigger('input'); }
   if (c.INSCRMUNICIPAL) { $('#docInscricaoMunicipal').val(c.INSCRMUNICIPAL).trigger('input'); }

   // --- 7) Fiscal ---
   if (c.CONTRIBUINTE) { $('#icms').val(c.CONTRIBUINTE).trigger('change'); }

   // Código de Receita IRRF — o value do option é o próprio CODRECEITA.
   if (c.CODRECEITA) {
      $('#selectDescricaoIrrf').val(c.CODRECEITA).trigger('change');
      $('#hiddenCodIrrf').val(c.CODRECEITA);
   }

   // Natureza de Rendimentos — o option certo é o que tem data-idnat = IDNATRENDIMENTO.
   if (c.IDNATRENDIMENTO) {
      var $optNat = $('#naturezaRendimento option').filter(function () {
         return String($(this).data('idnat')) === String(c.IDNATRENDIMENTO);
      });
      if ($optNat.length) {
         $('#naturezaRendimento').val($optNat.val()).trigger('change');
      }
      $('#idNatRendimento').val(c.IDNATRENDIMENTO);
   }

   // Simples Nacional (toggle com hidden 0/1)
   var simples = (c.OPTANTEPELOSIMPLES || '0').toString().trim();
   $('#simplesNacional').val(simples === '1' ? '1' : '0').trigger('change');

   // --- 8) Pessoa Física ---
   if (categoria === 'F') {
      $('#docRg').val(c.RG || '');
      $('#docRgOrgao').val(c.CI_ORGAO || '');
      $('#docRgUf').val(c.CI_UF || '');
      $('#dtNascimento').val(c.DTNASCIMENTO || ''); // input date espera YYYY-MM-DD
      if (c.ESTADOCIVIL) { $('#estadoCivil').val(c.ESTADOCIVIL).trigger('change'); }
      $('#numDependentes').val(c.NUMDEPENDENTES || '0');
   }

   // --- 9) Dados da tabela auxiliar (não vão ao RM): regime, retenções, CNAE, grupos.
   //        Se não houver registro, os campos ficam em branco para o usuário preencher. ---
   var aux = detalhes.auxiliar || {};

   // Regime fiscal
   if (aux.REGIME_FISCAL) {
      $('#regimeFiscal').val(aux.REGIME_FISCAL).trigger('change');
   }

   // Retenções (toggle geral + impostos)
   var temRetencao = (aux.RETENCAO_INSS === 'S' || aux.RETENCAO_CSLL === 'S' ||
                      aux.RETENCAO_PIS === 'S' || aux.RETENCAO_COFINS === 'S');
   if (temRetencao) {
      $('#toggleRetencao').prop('checked', true).trigger('change');
      var mapRet = { inss: 'RETENCAO_INSS', csll: 'RETENCAO_CSLL', pis: 'RETENCAO_PIS', cofins: 'RETENCAO_COFINS' };
      Object.keys(mapRet).forEach(function (idImp) {
         if (aux[mapRet[idImp]] === 'S') {
            $('#' + idImp).prop('checked', true).trigger('change');
         }
      });
   }

   // E-mail comercial / site (também ficam na auxiliar, não no RM)
   if (aux.EMAIL_COMERCIAL) { $('#emailComercial').val(aux.EMAIL_COMERCIAL); }
   if (aux.WEBSITE) { $('#site').val(aux.WEBSITE); }

   // CNAE principal (texto) + secundários
   var cnaes = detalhes.cnaes || [];
   var cnaePrinc = null;
   var cnaesSec = [];
   cnaes.forEach(function (cn) {
      if (String(cn.PRINCIPAL) === '1' && !cnaePrinc) {
         cnaePrinc = cn;
      } else {
         cnaesSec.push({ codigo: cn.CODIGO, descricao: cn.DESCRICAO });
      }
   });
   if (!cnaePrinc && cnaes.length) {
      cnaePrinc = cnaes[0];
      cnaesSec = cnaes.slice(1).map(function (cn) { return { codigo: cn.CODIGO, descricao: cn.DESCRICAO }; });
   }
   if (cnaePrinc) {
      var txtCnae = (cnaePrinc.CODIGO || '') + (cnaePrinc.DESCRICAO ? ' — ' + cnaePrinc.DESCRICAO : '');
      $('#cnaePrincipal').val(txtCnae).trigger('input');
   }
   if (cnaesSec.length && typeof preencherCnaesSecundarios === 'function') {
      preencherCnaesSecundarios(cnaesSec);
   }

   // Grupos de mercadoria (principal + secundários) — o value do select é a descrição
   var grupos = detalhes.grupos || [];
   if (grupos.length) {
      $('#grupoMercadoria1').val((grupos[0].DESCRICAO || '')).trigger('change');
      for (var g = 1; g < grupos.length; g++) {
         if (typeof adicionarGrupoMercadoria === 'function') {
            adicionarGrupoMercadoria();
            $('#grupoMercadoria' + (g + 1)).val((grupos[g].DESCRICAO || '')).trigger('change');
         }
      }
   }

   // --- 10) Bancos ---
   preencherBancosEdicao(detalhes.bancos || []);
   $('#idpgtoBoletoEdicao').val((detalhes.boletoIdpgto || '').toString());

   // --- 11) Estado de edição (persistido no card) ---
   $('#codcfoEdicao').val((c.CODCFO || '').toString());
   $('#coligadaEdicao').val((c.CODCOLIGADA || '').toString());
   $('#idcfoEdicao').val((c.IDCFO || '').toString());
   globalThis._modoEdicao = true;

   // Libera as verificações de duplicidade para edições manuais posteriores.
   // setTimeout cobre qualquer disparo assíncrono remanescente dos triggers acima.
   setTimeout(function () {
      globalThis._preenchendoEdicao = false;
      capturarSnapshotEdicao(); // dados do RM já preenchidos e estáveis = snapshot original
   }, 800);

   // NOTA: retenções (painel de impostos) e CNAEs secundários ainda não são
   // restaurados aqui — dependem de comportamento de UI a validar em homologação.
}

/**
 * Preenche as contas bancárias nos hidden e reconstrói os cards via
 * inicializarDadosBancarios() (que lê os hidden e recria a UI).
 */
function preencherBancosEdicao(bancos) {
   for (var i = 1; i <= 5; i++) {
      $('#hiddenBanco' + i + 'Cod').val('');
      $('#hiddenBanco' + i + 'Desc').val('');
      $('#hiddenBanco' + i + 'Agencia').val('');
      $('#hiddenBanco' + i + 'Conta').val('');
   }

   var contasRm = [];
   var n = 0;
   for (var b = 0; b < bancos.length && n < 5; b++) {
      var conta = bancos[b];
      var numBanco = (conta.NUMEROBANCO || '').toString().trim();
      var agencia = ((conta.CODIGOAGENCIA || '') + (conta.DIGITOAGENCIA || '')).replace(/\D/g, '');
      var ctCorrente = ((conta.CONTACORRENTE || '') + (conta.DIGITOCONTA || '')).replace(/\D/g, '');

      if (!numBanco && !agencia && !ctCorrente) { continue; }

      n++;
      $('#hiddenBanco' + n + 'Cod').val(numBanco);
      $('#hiddenBanco' + n + 'Desc').val((conta.NOMEAGENCIA || '').toString().trim());
      $('#hiddenBanco' + n + 'Agencia').val(agencia);
      $('#hiddenBanco' + n + 'Conta').val(ctCorrente);

      contasRm.push({
         idpgto: (conta.IDPGTO || '').toString().trim(),
         ativo: (String(conta.ATIVO) === '0') ? '0' : '1'
      });
   }

   // Guarda idpgto/ativo das contas do RM para a UI travar e permitir inativar.
   globalThis._contasRmEdicao = contasRm;

   if (typeof inicializarDadosBancarios === 'function') {
      inicializarDadosBancarios();
   }
   aplicarBancosEdicaoReadonly();
}

/**
 * Trava as contas vindas do RM (não editáveis), remove o botão "Remover" e
 * adiciona um toggle "Conta ativa" em cada uma. Contas adicionadas depois pelo
 * usuário permanecem editáveis.
 */
function aplicarBancosEdicaoReadonly() {
   var contas = globalThis._contasRmEdicao || [];

   $('#dados-bancarios-cards .bank-card').each(function (idx) {
      var $card = $(this);
      if ($card.attr('data-rm') === '1') { return; } // já tratado

      var info = contas[idx] || {};
      $card.attr('data-rm', '1');
      $card.attr('data-idpgto', info.idpgto || '');

      // Campos travados (não pode editar uma conta existente).
      $card.find('select, input[type="text"]').prop('disabled', true).addClass('campo-bloqueado');

      // Não pode remover conta existente — só inativar.
      $card.find('.btn-remove-bank').remove();

      // Toggle "Conta ativa".
      var ativo = String(info.ativo) !== '0';
      if (!$card.find('.chk-conta-ativa').length) {
         $card.find('.bank-card-head').append(
            '<label class="conta-ativa-toggle">' +
            '<input type="checkbox" class="chk-conta-ativa" ' + (ativo ? 'checked' : '') + '/> Conta ativa' +
            '</label>'
         );
      }
      $card.toggleClass('conta-inativa', !ativo);
   });

   montarBancosEdicaoJson();
}

/**
 * Lê todos os cards (do RM + novos) e grava o estado das contas no hidden
 * #bancosEdicaoJson, que o servicetask16 usa na edição (idpgto/ativo/novo).
 */
function montarBancosEdicaoJson() {
   if (!ehModoEdicao()) { return; }

   var contas = [];
   $('#dados-bancarios-cards .bank-card').each(function (idx) {
      var $card = $(this);
      var num = idx + 1;
      var s = (num === 1) ? '' : String(num);

      var ehRm = $card.attr('data-rm') === '1';
      var ativo = ehRm ? ($card.find('.chk-conta-ativa').is(':checked') ? '1' : '0') : '1';
      var idpgto = $card.attr('data-idpgto') || '';

      var cod     = ($('#banco' + s).val()          || '').toString().trim();
      var desc    = ($('#bancoDescricao' + s).val()  || '').toString().trim();
      var agencia = ($('#agencia' + s).val()         || '').replace(/\D/g, '');
      var conta   = ($('#conta' + s).val()           || '').replace(/\D/g, '');

      if (!cod && !agencia && !conta) { return; }

      contas.push({
         idpgto: idpgto,
         novo: ehRm ? 0 : 1,
         ativo: ativo,
         banco: cod,
         desc: desc,
         agencia: agencia,
         conta: conta
      });
   });

   $('#bancosEdicaoJson').val(JSON.stringify(contas));
}

// Campos comparados para realçar o que o solicitante alterou (Validação/Correção).
var CAMPOS_EDICAO_COMPARAR = [
   'classificacao', 'categoria', 'tipo',
   'docCnpj', 'docCpf',
   'razaoSocial', 'nomeFantasia',
   'docInscricaoEstadual', 'docInscricaoMunicipal',
   'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado',
   'telefone', 'celular', 'emailCr',
   'icms', 'simplesNacional', 'naturezaRendimento', 'selectDescricaoIrrf',
   'regimeFiscal', 'cnaePrincipal', 'grupoMercadoria1', 'emailComercial',
   'docRg', 'docRgOrgao', 'docRgUf', 'dtNascimento', 'estadoCivil', 'numDependentes'
];

function _normValorEdicao(v) {
   return (v || '').toString().replace(/[\s.\-\/()]/g, '').toUpperCase();
}

/** Captura os valores atuais (vindos do RM) num snapshot persistido no card. */
function capturarSnapshotEdicao() {
   var snap = {};
   for (var i = 0; i < CAMPOS_EDICAO_COMPARAR.length; i++) {
      var id = CAMPOS_EDICAO_COMPARAR[i];
      snap[id] = ($('#' + id).val() || '').toString();
   }
   $('#snapshotEdicaoRM').val(JSON.stringify(snap));
}

/** Realça (amarelo) os campos cujo valor difere do snapshot original do RM. */
function realcarCamposAlterados() {
   var raw = ($('#snapshotEdicaoRM').val() || '').toString();
   if (!raw) { return; }
   var snap;
   try { snap = JSON.parse(raw); } catch (e) { return; }

   for (var i = 0; i < CAMPOS_EDICAO_COMPARAR.length; i++) {
      var id = CAMPOS_EDICAO_COMPARAR[i];
      var $campo = $('#' + id);
      var $fg = $campo.closest('.fg');
      if (!$fg.length) { continue; }
      var diferente = _normValorEdicao($campo.val()) !== _normValorEdicao(snap[id]);
      $fg.toggleClass('campo-alterado', diferente);
   }
}

/**
 * Entra em modo edição: revela o formulário e esconde a etapa de Documentação.
 */
function entrarModoEdicao() {
   globalThis._modoEdicao = true;

   $('#telaSelecaoInicial').removeClass('tsi-ativo');
   $('#formSolicitacao > header, #preCadastro').show();

   if (typeof aplicarVisibilidadeDocumentacao === 'function') {
      aplicarVisibilidadeDocumentacao();
   }
}

/* Helpers de formatação locais (caem para as funções globais se existirem). */
function _fmtCepEdicao(cep) {
   if (typeof formatarCep === 'function') { return formatarCep(cep); }
   var d = (cep || '').toString().replace(/\D/g, '');
   return d.length === 8 ? d.slice(0, 5) + '-' + d.slice(5) : cep;
}
function _fmtTelEdicao(tel) {
   if (typeof formatarTelefone === 'function') { return formatarTelefone(tel); }
   return tel;
}

// Mantém o JSON das contas (#bancosEdicaoJson) atualizado conforme o usuário
// inativa, edita ou adiciona contas na edição.
$(function () {
   $(document).on('change', '.chk-conta-ativa', function () {
      $(this).closest('.bank-card').toggleClass('conta-inativa', !$(this).is(':checked'));
      montarBancosEdicaoJson();
   });
   $(document).on('input change', '#dados-bancarios-cards input, #dados-bancarios-cards select', function () {
      montarBancosEdicaoJson();
   });
   $(document).on('click', '#btn-add-conta-bancaria, .btn-remove-bank', function () {
      setTimeout(montarBancosEdicaoJson, 80);
   });
});
