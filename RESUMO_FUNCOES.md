# Resumo das funções — Cadastro de Cliente/Fornecedor

Visão geral do que cada função faz, organizada por arquivo. Serve como mapa
rápido para manutenção e onboarding.

- **Frontend (formulário):** `forms/cadastroFornecedor/js/*` + `events/displayFields.js`
- **Backend (workflow):** `workflow/scripts/*`
- **Datasets (consultas ao RM):** `datasets/*`

---

## Backend — Workflow (server-side)

### `workflow/scripts/...beforeTaskSave.js`
Evento executado ao concluir cada atividade do processo.

- `beforeTaskSave(colleagueId, nextSequenceId, userList)` — registra o histórico de cada etapa e, quando a Validação decide "Correção", dispara o e-mail ao solicitante.
- `adicionarHistorico(usuario, atividade, acao, observacao)` — insere uma linha na tabela-filho de histórico (`tableHistorico`).
- `montarAlteracoesEdicaoValidacao()` — compara o snapshot tirado no início da Validação com os valores atuais e descreve o que o validador alterou.
- `isCampoCheckboxAuditoria(campo)` — diz se um campo é booleano/checkbox (para normalizar antes de comparar).
- `normalizarCheckboxAuditoria(valor)` — converte "on/true/1/sim" em "Sim", o resto em "Não".
- `notificarSolicitanteCorrecao(motivo, userList, colleagueId)` — envia e-mail de "voltou para correção" com o motivo e o link; resolve o destinatário em 3 níveis (card → userList → colleagueId).
- `buscaEmailUsuarioFluig(login)` — busca o e-mail cadastrado do usuário no dataset `colleague`.
- `enviarEmailFluig(email, assunto, corpoEmail)` — envia o e-mail via serviço `customEmailSender` (template `TPL_PADRAO_CASTILHO`).

### `workflow/scripts/...afterProcessFinish.js`
Evento executado quando o processo é finalizado.

- `afterProcessFinish(colleagueId, processId, threadSequence, userList)` — notifica o solicitante por e-mail com o link da solicitação concluída.
- `buscaEmailUsuarioFluig(login)` / `enviarEmailFluig(...)` — mesmas auxiliares de e-mail descritas acima.

### `workflow/scripts/...servicetask16.js`
Atividade de serviço que integra o cadastro com o RM (TOTVS).

- `servicetask16(attempt, message)` — orquestra a integração: cria o Cliente/Fornecedor (FCFO), grava as contas bancárias em todas as coligadas e popula as tabelas auxiliares.
- `chamarRM(dataServerName, xml, coligadaOverride)` — envia um XML ao DataServer do RM via `ds_saveRecordRM` e trata o retorno (sucesso/erro).
- `x(s)` — escapa caracteres especiais para montar o XML com segurança.
- `salvarFcfoAuxiliar(codCfo, coligada)` — popula `FCFO_AUXILIAR`, `FCFO_AUXILIAR_CNAE` e `FCFO_AUXILIAR_GRUPO_MERCADORIA` no banco custom (idempotente: DELETE + INSERT).
- `_parseCnae(valor)` — separa "código — descrição" do CNAE em partes.
- `_buscarCodTb2Fat(descricao)` — busca o código do grupo de mercadoria (CODTB2FAT) na tabela TTB2 do RM.
- `_execSql(sql, params)` — executa INSERT/DELETE no banco custom (`/jdbc/CastilhoCustom`) via prepared statement.

---

## Frontend — Evento do formulário

### `forms/cadastroFornecedor/events/displayFields.js`
- `displayFields(form, customHTML)` — roda ao exibir o formulário: salva o solicitante na abertura, define a ação por atividade (início/validação/correção/view) e injeta os scripts de inicialização da barra de processo e do modo VIEW.

---

## Frontend — `api.js` (integrações externas e RM)

- `buscarCep(cep)` — consulta o CEP e dispara o preenchimento do endereço.
- `preencherEndereco(data)` — preenche rua, bairro, cidade e estado com o retorno do CEP.
- `limpaCamposEndereco()` — limpa os campos de endereço.
- `normalizarCnpj(cnpj)` — remove máscara e padroniza o CNPJ.
- `buscarCnpj(cnpj)` — orquestra a busca: checa duplicidade no RM e, se novo, consulta a Sintegrapi e preenche o formulário.
- `limparCamposCnpj()` — limpa os campos preenchidos pela consulta de CNPJ.
- `verificarCpfDuplicado(cpf)` — verifica se o CPF já existe no RM e trava o cadastro em caso positivo.
- `limparCamposCpf()` — limpa os campos relacionados ao CPF.
- `_verificarCnpjNoRM(cnpj)` — consulta o dataset `ds_verificarCnpjRM` e retorna os dados do CFO ou null.
- `preencherDadosCnpjRM(data)` — preenche o formulário com os dados vindos do RM.
- `preencherDadosCnpj(data)` — preenche o formulário com os dados vindos da Sintegrapi.
- `_buscarInscricaoEstadualSintegra(cnpj, uf)` — busca a Inscrição Estadual na Sintegra.
- `preencherCnaesSecundarios(atividades)` — cria e preenche os campos de CNAE secundário.
- `formatarCep(cep)` / `formatarTelefone(tel)` — aplicam máscara de exibição.

---

## Frontend — `validation.js` (validações)

- `aplicarAsteriscoObrigatorio()` — adiciona o asterisco vermelho nos campos obrigatórios visíveis.
- `exibirErroCampo(campoId, mensagem)` — mostra a mensagem de erro abaixo do campo.
- `focusCampoComErro()` — rola e foca no primeiro campo com erro.
- `validarCampoObrigatorio(campoId, label)` — valida um único campo obrigatório.
- `validarDocumentosPorCategoria()` — valida CPF/RG (PF), CNPJ/IE (PJ) ou documento estrangeiro; checa formato do RG e data de nascimento não-futura.
- `limparUploadsCategoria(tipo)` — limpa os anexos ao trocar de categoria.
- `validarListaCampos(campos)` — valida uma lista de campos, respeitando `skipWhen` (regras condicionais).
- `validarPreCadastro(exibirToast)` — valida a etapa 1 (classificação, categoria, documentos, endereço).
- `_retencaoAtiva()` — diz se o toggle de retenção está ligado.
- `_toastCamposObrigatorios()` — exibe o toast de "preencha os campos obrigatórios".
- `validarDadosBancarios()` — valida banco, agência e conta de cada conta cadastrada.
- `validarDadosCadastrais(exibirToast)` — valida a etapa fiscal/comercial/bancária/contato (aplica regras de PF e RDO via skipWhen).
- `validarPainelRetencaoVisual()` — destaca o painel de retenção quando nenhum imposto foi marcado.
- `validarEtapaAtual(exibirToast)` — valida apenas a etapa atual do stepper antes de avançar.
- `controlarDocumentacaoPorCategoria()` — ajusta o grid de anexos conforme PF/PJ.
- `validarDocumentacao(exibirToast)` — valida os anexos obrigatórios da etapa de documentação.
- `limparErroCampo(campoId)` — limpa o erro visual de um campo.
- `limparErrosPreCadastro()` / `limparErrosDadosCadastrais()` — limpam os erros das respectivas etapas.
- `aplicarStatusCampo(campoId, valido)` — aplica o estilo de válido/inválido.
- `validarCPF(cpf)` — valida CPF pelos dígitos verificadores.
- `validarRG(rg)` — valida o formato do RG (9 dígitos, não repetidos).
- `validarCNPJ(cnpj)` — valida CNPJ pelos dígitos verificadores.
- `validarHistoricoDecisao(exibirToast)` — valida a decisão/observação na etapa de Validação.

---

## Frontend — `ui.js` (interface e regras de exibição)

- `_build` / `_open` / `_close` / `_filter` / `_position` — internos do select com busca (autocomplete dos selects).
- `controlarCamposClassificacao()` — ajusta os campos conforme Cliente/Fornecedor/Ambos.
- `controlarCamposCategoria()` — ajusta documentos, bloco de PF, CNAE, ICMS e Regime Fiscal conforme PF/PJ e estrangeiro.
- `controlarCamposDependentes()` — mostra/esconde o campo de número de dependentes.
- `controlarEnderecoEstrangeiro(ativo)` — alterna o endereço entre nacional e estrangeiro (estado "EX").
- `controlarAlertaCnpj()` — exibe alertas de CNPJ incompleto / CPF.
- `controlarRetencaoPorTipo()` — reseta a retenção quando o tipo não a permite.
- `_ehTipoRDO()` — identifica se o tipo selecionado é RDO.
- `controlarNaturezaPorTipo()` — oculta e dispensa a Natureza de Rendimentos quando o tipo é RDO.
- `controlarPainelRetencoes()` — mostra/esconde o painel de impostos de retenção.
- `resetarRetencao()` — limpa as seleções de retenção.
- `getStepsVisiveis()` / `getStepAtual()` — apoiam a navegação do stepper.
- `goToStep(step, animar)` / `goToNextVisibleStep()` / `goToPrevVisibleStep()` — navegam entre as etapas.
- `atualizarSetas()` — atualiza os botões de avançar/voltar.
- `toggleSection(el)` — abre/fecha uma seção sanfonada.
- `bloquearTudoInicio()` / `habilitarTudoInicio()` — bloqueiam/liberam todos os campos.
- `ehModoView()` — diz se o formulário está em modo somente-leitura.
- `configurarModoView()` — configura o modo histórico/VIEW (expande tudo, campos cinza e bloqueados).
- `ajustarCamposView()` — ajusta os campos para exibição no VIEW.
- `expandirTudoView()` — abre todas as seções no VIEW.
- `normalizarSelectsView()` — corrige os selects que o Fluig converte em span no VIEW.
- `resolverSpansView()` — preenche os spans (ex-selects) com os valores salvos.
- `mostrarTextoDoSpan(idCampo, valorSalvo)` — exibe o texto correto em um span do VIEW.
- `controlarEdicaoInicioValidacao()` — controla quais campos o validador pode editar.

---

## Frontend — `events.js` (registro de eventos)

- `bindEventos()` — ponto único que agrupa o registro de todos os eventos do formulário.
- `bindEventosCamposBasicos()` — eventos de classificação, categoria e tipo.
- `bindEventosDocumentos()` — eventos dos campos de documento (CPF/CNPJ/RG) e suas validações em tempo real.
- `bindEventosEndereco()` — eventos de CEP, estado e cidade.
- `bindEventosRetencao()` — eventos do painel de impostos de retenção.
- `bindEventosDependentes()` — eventos do toggle/quantidade de dependentes.
- `bindEventosSimplesNacional()` — eventos do toggle Simples Nacional.
- `bindEventosCnaeSecundario()` — eventos dos campos de CNAE secundário.
- `bindEventosGrupoMercadoria()` — eventos dos grupos de mercadoria.
- `bindEventosDadosBancarios()` — eventos das contas bancárias.
- `bindEventosDecisao()` — eventos da decisão na etapa de Validação.
- `bindEventoTrocaCategoriaComAnexos()` — confirma a troca de categoria quando há anexos incluídos.
- `bindEventosCamposDinamicos()` — eventos dos campos que sincronizam com hidden.
- `bindEventosUpload()` — eventos das áreas de upload.
- `existeAnexoIncluido()` — verifica se há algum anexo já incluído.
- `validarDocumentoDigitado(config)` — valida um documento enquanto o usuário digita.
- `aguardarRemocaoConfirmada(config)` — aguarda a confirmação de remoção de um anexo.
- `confirmarModaisRemocaoEmLote()` — confirma automaticamente os modais ao remover vários anexos.
- `removerTodosAnexosUmPorUmSemPerguntar()` — remove todos os anexos sem perguntar.
- `excluirTodosAnexosDoProcesso()` — exclui todos os anexos da solicitação.
- `ocultarToastsRemocaoAnexos()` / `limparTodosUploadsVisuais()` / `limparErroCampoObrigatorioPreenchido(campo)` — utilitários de limpeza visual.

---

## Frontend — `Functions.js` (campos dinâmicos, máscaras e datasets do RM)

**Grupos de mercadoria e CNAE (campos dinâmicos)**
- `adicionarGrupoMercadoria()` / `removerContaBancaria` etc. — adicionam/removem itens das listas dinâmicas.
- `reordenarGruposMercadoria()` / `reordenarCnaesSecundarios()` — reordenam os itens após inclusão/remoção.
- `controlarBotaoAdicionarGrupoMercadoria()` / `controlarBotaoAdicionarCnae()` — habilitam o botão até o limite.
- `adicionarCnae()` — adiciona um campo de CNAE secundário.
- `_reordenarItens(...)` / `_controlarBotaoAdicionar(...)` — helpers genéricos das listas.

**Histórico e máscaras**
- `getLinhasHistorico()` / `geraHtmlHistorico(linha)` / `controlarStepperHistorico()` — montam o histórico de decisões do processo.
- `inicializarMascaras()` / `aplicarMascaraCnae($campo)` / `inicializarMascarasBancarias()` — aplicam as máscaras dos campos.

**Snapshot e sincronização**
- `inicializarSnapshotEdicaoValidacao()` — guarda o estado dos campos no início da validação (para auditoria).
- `sincronizarCamposDinamicosHidden()` — copia os valores dinâmicos para os campos hidden persistidos.
- `atualizarCamposBancariosRm()` — copia agência/conta sem máscara para os campos enviados ao RM.
- `sincronizarTabelaBancaria()` — espelha as contas nos campos hidden.
- `sincronizarTabelasRelatorio()` — espelha CNAEs, grupos e contas nas tabelas usadas na impressão.

**Datasets do RM (carregam selects)**
- `carregarTiposClienteFornecedor()` — carrega os tipos de cliente/fornecedor.
- `carregarNaturezaRendimento()` — carrega as naturezas de rendimento.
- `carregarOpcoesIrrf(preservarValor)` / `_popularSelectIrrf(...)` — carregam e filtram os códigos IRRF por PF/PJ.
- `carregarPaisesEstrangeiros()` / `_popularSelectPaises(...)` — carregam a lista de países.
- `carregarEstadosRM()` / `popularSelectEstado()` — carregam e populam os estados.
- `carregarMunicipiosPorUF(uf)` / `popularSelectMunicipio(uf)` — carregam os municípios por estado.
- `preencherEnderecoRM(uf, nomeCidade)` / `restaurarEnderecoRM()` — preenchem/restauram o endereço a partir do RM.
- `carregarBancosRM()` / `_gerarOptionsBanco()` — carregam a lista de bancos.
- `carregarGruposMercadoria()` / `popularSelectsGrupoMercadoria()` / `_gerarOptionsGrupoMercadoria(...)` — carregam os grupos de mercadoria.
- `_parsearDataset(ds, nomeDataset)` / `_aplicarValorCampo($el, valor)` / `_normalizarTexto(str)` — helpers de leitura de dataset e preenchimento.

**Contas bancárias**
- `inicializarDadosBancarios()` — monta e restaura os cards de contas bancárias.
- `adicionarContaBancaria()` / `removerContaBancaria(numero)` / `_reordenarCardsBancarios()` — gerenciam as contas.
- `controlarBotaoAdicionarConta()` — habilita o botão até o limite de contas.
- `_sufixoBancario(numero)` / `_gerarHtmlCardBancario(numero)` — helpers de montagem dos cards.
- `_validarTodasEtapas()` — valida o formulário inteiro antes do envio final.

---

## Frontend — `Script.js` (bootstrap e estado)

- `inicializarTela()` — prepara a tela na abertura (seções, primeiro passo, dados do fornecedor).
- `sincronizarEstadoInicial()` — restaura o estado ao reabrir (tipo, estado, grupos, CNAEs, checkboxes) e reaplica as regras de PF e RDO.
- `controlarBotoesImprimir()` — mostra os botões de impressão quando aplicável.
- `fecharDadosComerciais(animar)` / `abrirDadosComerciais()` — abrem/fecham a seção de dados comerciais.
- `_checkboxAtivo($el)` — diz se um checkbox/toggle está marcado (considerando o valor salvo).
- `restaurarCheckboxesSalvos()` — re-marca os toggles salvos (retenção, simples, dependentes, estrangeiro).
- `restaurarGruposMercadoriaSalvos()` / `restaurarCnaesSecundariosSalvos()` — recriam os itens dinâmicos salvos.
- `aplicarBarraProcesso()` — monta o stepper destacando a atividade atual.
- `atualizarLayoutStepper()` / `destacarBotao(botaoSelecionado)` — ajustam o visual do stepper.

---

## Frontend — `upload.js` (anexos integrados ao Fluig)

- `inicializarUploadsFluig()` — liga cada área de upload customizada ao input nativo de anexos do Fluig.
- `abrirAnexoNativoFluig()` / `abrirAbaAnexosFluig()` — abrem o componente nativo de anexos.
- `monitorarInputNativoFluig()` / `_iniciarObservadorAnexosInvalidos()` — observam o input nativo e anexos inválidos.
- `_clicarBotaoRemoverFluig(trNode)` — aciona o botão de remover do anexo nativo.
- `atualizarContadorAnexosFluig()` — atualiza o contador de anexos.
- `finalizarUploadVisualFluig(config, nomeArquivo)` / `montarStatusAnexo(...)` — atualizam o status visual do upload.
- `buscarIdAnexoPorNome(nomeArquivo)` / `getHiddenAnexoId(sufixoCampo)` — recuperam o ID do anexo.
- `restaurarUploadsSalvos()` — restaura os anexos já enviados ao reabrir.
- `adicionarBotaoVisualizarAnexo(...)` / `visualizarAnexoFluig(nomeArquivo)` — permitem abrir o anexo.
- `obterSufixoUpload(inputId, $area)` — descobre o sufixo do campo de upload.
- `limparStatusUpload(config)` / `limparVisualUploadConfirmado(config)` / `limparCardVisualAnexo(sufixoCampo)` — limpam o estado visual.
- `anexoAindaExisteNoFluig(docId, nomeArquivo)` — confere se o anexo ainda existe.
- `removerAnexoFluig(config)` — remove um anexo.
- `validarUploadObrigatorio(campoId, label)` — valida anexos obrigatórios.
- `marcarUploadErro(campoId, mensagem)` / `marcarUploadSucesso(campoId)` — marcam o resultado do upload.
- `validarArquivoPermitido(file)` — valida tipo e tamanho do arquivo.
- `ocultarToastRemocaoAutomatica()` / `ocultarModalRemocaoAutomaticaAtivo()` / `removerOcultacaoModalRemocaoAutomatica()` — controlam os avisos de remoção automática.

---

## Frontend — `mobile.js` (ajustes mobile)

- `isMobileFluig()` — detecta se o formulário está aberto no app/mobile do Fluig.
- `aplicarLayoutMobile()` — aplica os ajustes de layout para telas pequenas.
- `_encontrarInputFluig()` / `_injetarViaDataTransfer(...)` / `_fallbackVisualLocal(...)` — apoiam o upload de anexos no mobile.

---

## Datasets — consultas ao RM e gravação

- `ds_estadoRM.js` — lista os estados (UF) do RM.
- `ds_municipioRM.js` — lista os municípios por estado.
- `ds_paisRM.js` — lista os países.
- `ds_bancoRM.js` — lista os bancos.
- `ds_irrfRM.js` — lista os códigos de receita IRRF.
- `ds_grupoMercadoriaRM.js` — lista os grupos de mercadoria (TTB2).
- `ds_tipoClienteFornecedorRM.js` — lista os tipos de cliente/fornecedor.
- `naturezaRendimento.js` — lista as naturezas de rendimento.
- `ds_verificarCnpjRM.js` — verifica se um CNPJ já existe no RM e retorna seus dados.
- `ds_saveRecordRM.js` — envia um XML ao DataServer do RM (grava CFO, dados de pagamento etc.) e retorna status/código.
