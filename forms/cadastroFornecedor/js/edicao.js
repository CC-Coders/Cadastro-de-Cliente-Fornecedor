
// ABRE O MODAL DE BUSCA/EDIÇÃO DE CLIENTE/FORNECEDOR (CFO) E INICIALIZA OS HANDLERS.
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

      $('body').addClass('modal-edicao-aberto');
      $('#modalEdicaoCfo').off('hidden.bs.modal').on('hidden.bs.modal', function () {
         $('body').removeClass('modal-edicao-aberto');
      });

      var instModal = $('#modalEdicaoCfo').data('bs.modal');
      if (instModal && instModal.options) {
         instModal.options.backdrop = 'static';
         instModal.options.keyboard = false;
      }
   });
}

// BUSCA CLIENTE/FORNECEDOR (CFO) NO RM PELO TERMO DIGITADO, CHAMA renderizarResultadosEdicao().
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

// MONTA A TABELA DE RESULTADOS DA BUSCA DE CLIENTE/FORNECEDOR (CFO) E HABILITA O CLICK PARA SELEÇÃO.
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
         + '<td data-label="Código">' + cod + '</td>'
         + '<td data-label="Nome">' + nome + '</td>'
         + '<td data-label="CNPJ/CPF">' + doc + '</td>'
         + '<td data-label="Cidade/UF">' + cidadeUf + '</td>'
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

// CARREGA OS DADOS DO CLIENTE/FORNECEDOR (CFO) SELECIONADO PARA EDIÇÃO, CHAMA preencherEdicaoCompleta().
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

      FLUIGC.toast({ title: 'Edição', message: 'Cadastro carregado para edição.', type: 'success', timeout: 4000 });

   } catch (e) {
      console.error('[edicao] Erro ao selecionar CFO:', e);
      FLUIGC.toast({ title: 'Erro', message: 'Falha ao carregar os dados do cliente/fornecedor.', type: 'danger' });
      $('#edicaoCarregando').remove();
   }
}

// PREENCHE O FORMULÁRIO DE EDIÇÃO COM OS DADOS VINDOS DO RM (cadastro, auxiliar, cnaes, grupos, bancos).
function preencherEdicaoCompleta(detalhes) {
   var c = (detalhes && detalhes.cadastro) ? detalhes.cadastro : {};

   globalThis._preenchendoEdicao = true;


   var categoria = (c.CATEGORIA || '').toString().trim().toUpperCase(); // F ou J
   if (categoria) { $('#categoria').val(categoria).trigger('change'); }

   var mapPagrecInv = { '2': '1', '1': '2', '3': '3' }; 
   var classif = mapPagrecInv[(c.PAGREC || '').toString().trim()] || '';
   if (classif) { $('#classificacao').val(classif).trigger('change'); }

   if (c.CODTCF) { $('#tipo').val(c.CODTCF).trigger('change'); }

   var cgc = (c.CGCCFO || '').toString().replace(/\D/g, '');
   if (categoria === 'J') {
      globalThis._cnpjJaConsultado = cgc;
      $('#docCnpj').val(cgc).trigger('input');
   } else if (categoria === 'F') {
      globalThis._cpfJaConsultado = cgc;
      $('#docCpf').val(cgc).trigger('input');
   }


   $('#razaoSocial').val(c.NOMEFANTASIA || c.NOME || '');
   $('#nomeFantasia').val(c.NOME || '');


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

   $('#telefone').val(_fmtTelEdicao(c.TELEFONE || ''));
   $('#celular').val(_fmtTelEdicao(c.CELULAR || ''));
   $('#emailCr').val(c.EMAIL || '');

   if (c.INSCRESTADUAL) { $('#docInscricaoEstadual').val(c.INSCRESTADUAL).trigger('input'); }
   if (c.INSCRMUNICIPAL) { $('#docInscricaoMunicipal').val(c.INSCRMUNICIPAL).trigger('input'); }

   if (c.CONTRIBUINTE) { $('#icms').val(c.CONTRIBUINTE).trigger('change'); }

   if (c.CODRECEITA) {
      $('#selectDescricaoIrrf').val(c.CODRECEITA).trigger('change');
      $('#hiddenCodIrrf').val(c.CODRECEITA);
   }

   if (c.IDNATRENDIMENTO) {
      var $optNat = $('#naturezaRendimento option').filter(function () {
         return String($(this).data('idnat')) === String(c.IDNATRENDIMENTO);
      });
      if ($optNat.length) {
         $('#naturezaRendimento').val($optNat.val()).trigger('change');
      }
      $('#idNatRendimento').val(c.IDNATRENDIMENTO);
   }

   var simples = (c.OPTANTEPELOSIMPLES || '0').toString().trim();
   $('#simplesNacional').val(simples === '1' ? '1' : '0').trigger('change');

   if (categoria === 'F') {
      $('#docRg').val(c.RG || '');
      $('#docRgOrgao').val(c.CI_ORGAO || '');
      $('#docRgUf').val(c.CI_UF || '');
      $('#dtNascimento').val(c.DTNASCIMENTO || ''); // input date espera YYYY-MM-DD
      if (c.ESTADOCIVIL) { $('#estadoCivil').val(c.ESTADOCIVIL).trigger('change'); }
      $('#numDependentes').val(c.NUMDEPENDENTES || '0');
   }


   var aux = detalhes.auxiliar || {};

   // Regime fiscal
   if (aux.REGIME_FISCAL) {
      $('#regimeFiscal').val(aux.REGIME_FISCAL).trigger('change');
   }

   // Retenções
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

   if (aux.EMAIL_COMERCIAL) { $('#emailComercial').val(aux.EMAIL_COMERCIAL); }
   if (aux.WEBSITE) { $('#site').val(aux.WEBSITE); }

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

   preencherBancosEdicao(detalhes.bancos || []);
   $('#idpgtoBoletoEdicao').val((detalhes.boletoIdpgto || '').toString());

   $('#codcfoEdicao').val((c.CODCFO || '').toString());
   $('#coligadaEdicao').val((c.CODCOLIGADA || '').toString());
   $('#idcfoEdicao').val((c.IDCFO || '').toString());
   globalThis._modoEdicao = true;

   setTimeout(function () {
      globalThis._preenchendoEdicao = false;
      capturarSnapshotEdicao();
   }, 800);

}

// PREENCHE OS CARDS DE CONTAS BANCÁRIAS COM OS DADOS VINDOS DO RM (até 5 contas, preenchendo os hidden).
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

   globalThis._contasRmEdicao = contasRm;

   if (typeof inicializarDadosBancarios === 'function') {
      inicializarDadosBancarios();
   }
   aplicarBancosEdicaoReadonly();
}

// TRAVA OS CAMPOS DE CONTAS BANCÁRIAS PARA EDIÇÃO (readonly) E MONTA O JSON PARA O servicetask16.
function aplicarBancosEdicaoReadonly() {
   var contas = globalThis._contasRmEdicao || [];

   $('#dados-bancarios-cards .bank-card').each(function (idx) {
      var $card = $(this);
      if ($card.attr('data-rm') === '1') { return; } 

      var info = contas[idx] || {};
      $card.attr('data-rm', '1');
      $card.attr('data-idpgto', info.idpgto || '');

      $card.find('select, input[type="text"]').prop('disabled', true).addClass('campo-bloqueado');

      $card.find('.btn-remove-bank').remove();

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

// SERIALIZA AS CONTAS BANCÁRIAS EM JSON PARA O servicetask16 (somente as que têm algum dado preenchido).
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

// CAMPOS QUE DEVEM SER COMPARADOS COM O SNAPSHOT PARA DETECTAR ALTERAÇÕES (destaque amarelo).
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

// NORMALIZA O VALOR PARA COMPARAÇÃO (remove espaços, pontos, traços, parênteses e barras; converte para maiúsculas).
function _normValorEdicao(v) {
   return (v || '').toString().replace(/[\s.\-\/()]/g, '').toUpperCase();
}

// SALVA O SNAPSHOT DOS CAMPOS DE EDIÇÃO NO HIDDEN #snapshotEdicaoRM PARA COMPARAÇÃO POSTERIOR.
function capturarSnapshotEdicao() {
   var snap = {};
   for (var i = 0; i < CAMPOS_EDICAO_COMPARAR.length; i++) {
      var id = CAMPOS_EDICAO_COMPARAR[i];
      snap[id] = ($('#' + id).val() || '').toString();
   }
   $('#snapshotEdicaoRM').val(JSON.stringify(snap));
}

// COMPARA OS CAMPOS DE EDIÇÃO COM O SNAPSHOT SALVO E REALÇA OS QUE FORAM ALTERADOS (classe .campo-alterado).
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

// ENTRA NO MODO DE EDIÇÃO, MOSTRA O FORMULÁRIO E ESCONDE A TELA DE SELEÇÃO INICIAL
function entrarModoEdicao() {
   globalThis._modoEdicao = true;

   $('#telaSelecaoInicial').removeClass('tsi-ativo');
   $('#formSolicitacao > header, #preCadastro').show();

   if (typeof aplicarVisibilidadeDocumentacao === 'function') {
      aplicarVisibilidadeDocumentacao();
   }
}

// FORMATA O CEP (usa formatarCep se existir)
function _fmtCepEdicao(cep) {
   if (typeof formatarCep === 'function') { return formatarCep(cep); }
   var d = (cep || '').toString().replace(/\D/g, '');
   return d.length === 8 ? d.slice(0, 5) + '-' + d.slice(5) : cep;
}

// FORMATA O TELEFONE (usa formatarTelefone se existir)
function _fmtTelEdicao(tel) {
   if (typeof formatarTelefone === 'function') { return formatarTelefone(tel); }
   return tel;
}

// HANDLERS DAS CONTAS BANCÁRIAS NA EDIÇÃO: RECALCULA O JSON AO MUDAR CONTA/ATIVA/ADICIONAR/REMOVER.
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
