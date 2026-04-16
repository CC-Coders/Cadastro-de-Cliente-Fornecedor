
let categoriaAtual = "";

function atualizarProdutosGlobais() {
    categoriaAtual = $("#categoria").val();
    $("#tableColaboradores tbody .produtoSelect").each(function () {
        atualizarProdutosPorCategoria(categoriaAtual, $(this));
    });
}


function adicionarColaborador() {
    const colaboradorRow = `
        <tr>
            <td>
                <input class="form-control nomeColaborador" placeholder="Nome" name="nome_colaborador">
            </td>
            <td>
                <input class="form-control cargoColaborador" placeholder="Cargo" name="cargo_colaborador">
            </td>
            <td>
                <table class="table table-bordered tableProdutos">
                    <thead>
                        <tr>
                            <th>Produto</th>
                             <th style="width:150px">Quantidade</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <select class="form-control produtoSelect" name="produto_colaborador">
                                    <option value="">Selecione uma Categoria</option>
                                </select>
                            </td>
                                <td>
                                                                                                  <input type="number"  name="produto_quantidade"
                                                                                  class="form-control quantidadeSelect" />
                                                        </td>
                            <td style="text-align: center;">
                                <button type="button" class="btn btn-primary btnAdicionarProduto"><i class="flaticon flaticon-add-box icon-sm" aria-hidden="true"></i></button>
                                <button type="button" class="btn btn-danger btnRemoverProduto"><i class="flaticon flaticon-trash icon-sm" aria-hidden="true"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
            <td>
                <button type="button" class="btn btn-danger btnRemoverColaborador"><i class="flaticon flaticon-trash icon-sm" aria-hidden="true"></i></button>
            </td>
        </tr>`;

    $("#tableColaboradores>tbody").append(colaboradorRow);
    const addedRow = $("#tableColaboradores>tbody").find("tr:last");

    addedRow.find(".btnRemoverColaborador").on("click", function () {
        $(this).closest("tr").remove();
    });

    addedRow.find(".btnRemoverProduto").on("click", function () {
        $(this).closest("tr").remove();
    });
    const produtoSelect = addedRow.find(".produtoSelect");
    atualizarProdutosPorCategoria(categoriaAtual, produtoSelect);
}

function adicionarProdutoColaborador(tbody) {
    const produtoRow = `
    <tr>
        <td>
            <select class="form-control produtoSelect" name="produto_colaborador">
                <option value="">Selecione uma categoria primeiro</option>
            </select>
        </td>
             <td>
                  <input type="number"  name="produto_quantidade" class="form-control quantidadeSelect" />
            </td>
        <td style="text-align: center;">
              <button type="button" class="btn btn-primary btnAdicionarProduto">
                <i class="flaticon flaticon-add-box icon-sm"></i>
            </button>
            <button type="button" class="btn btn-danger btnRemoverProduto">
                <i class="flaticon flaticon-trash icon-sm"></i>
            </button>

        </td>
    </tr>;`

    tbody.append(produtoRow);

    const addedProdutoRow = tbody.find("tr:last");

    addedProdutoRow.find(".btnRemoverProduto").on("click", function () {
        $(this).closest("tr").remove();
    });

    const produtoSelect = addedProdutoRow.find(".produtoSelect");
    atualizarProdutosPorCategoria(categoriaAtual, produtoSelect);
}

function atualizarProdutosPorCategoria(categoria, produtoSelect) {
    produtoSelect.empty().append('<option value="">Selecione</option>');

    if (categoria === "Softwares/Licenças") {
        produtoSelect.append('<option value="Adobe Acrobat Pro">Adobe Acrobat Pro</option>');
        produtoSelect.append('<option value="Anydesk">Anydesk</option>');
        produtoSelect.append('<option value="AutoCAD Civil 3D">AutoCAD Civil 3D</option>');
        produtoSelect.append('<option value="AutoCAD LT">AutoCAD LT</option>');
        produtoSelect.append('<option value="Antivírus corporativo (Bitdefender)">Antivírus corporativo (Bitdefender)</option>');
        produtoSelect.append('<option value="MS Project>MS Project</option>');
        produtoSelect.append('<option value="Microsoft Windows">Microsoft Windows</option>');
        produtoSelect.append('<option value="Microsoft Office">Microsoft Office</option>');
        produtoSelect.append('<option value="Microsoft Teams">Microsoft Teams</option>');
        produtoSelect.append('<option value="Microsoft 365 Basic">Microsoft 365 Basic</option>');
        produtoSelect.append('<option value="Microsoft 365 Standard">Microsoft 365 Standard</option>');
        produtoSelect.append('<option value="Microsoft SharePoint Plan 01">Microsoft SharePoint Plan 01</option>');
        produtoSelect.append('<option value="Microsoft SharePoint Plan 02">Microsoft SharePoint Plan 02</option>');
        produtoSelect.append('<option value="Microsoft Exchange Plan 01">Microsoft Exchange Plan 01</option>');
        produtoSelect.append('<option value="Microsoft Exchange Plan 02">Microsoft Exchange Plan 02</option>');
        produtoSelect.append('<option value="Ms Project Plan 03">Ms Project Plan 03</option>');
    } else if (categoria === "Hardwares/Equipamentos de Informática") {
        produtoSelect.append('<option value="Adaptador de Rede USB">Adaptador de Rede USB</option>');
        produtoSelect.append('<option value="Cabo HDMI">Cabo HDMI</option>');
        produtoSelect.append('<option value="Celular">Celular</option>');
        produtoSelect.append('<option value="Fone de Ouvido com Microfone">Fone de Ouvido com Microfone</option>');
        produtoSelect.append('<option value="HD Externo">HD Externo</option>');
        produtoSelect.append('<option value="Hubs USB">Hubs USB</option>');
        produtoSelect.append('<option value="Impressora Mono">Impressora Mono</option>');
        produtoSelect.append('<option value="Impressora Color">Impressora Color</option>');
        produtoSelect.append('<option value="Impressora Plotter">Impressora Plotter</option>');
        produtoSelect.append('<option value="Kit Teclado e Mouse">Kit Teclado e Mouse</option>');
        produtoSelect.append('<option value="Monitor">Monitor</option>');
        produtoSelect.append('<option value="Mousepad Ergonômico">Mousepad Ergonômico</option>');
        produtoSelect.append('<option value="Mousepad Liso">Mousepad Liso</option>');
        produtoSelect.append('<option value="Mouse">Mouse</option>');
        produtoSelect.append('<option value="Nobreak">Nobreak</option>');
        produtoSelect.append('<option value="Notebook Corporativo">Notebook Corporativo</option>');
        produtoSelect.append('<option value="Notebook Corporativo com Autocad">Notebook Corporativo com Autocad</option>');
        produtoSelect.append('<option value="Roteador">Roteador</option>');
        produtoSelect.append('<option value="Scanner">Scanner</option>');
        produtoSelect.append('<option value="SSD">SSD</option>');
        produtoSelect.append('<option value="Starlink">Starlink</option>');
        produtoSelect.append('<option value="Switches (Gerenciáveis e não Gerenciáveis)">Switches (Gerenciáveis e não Gerenciáveis)</option>');
        produtoSelect.append('<option value="Tablet">Tablet</option>');
        produtoSelect.append('<option value="Teclado">Teclado</option>');
        produtoSelect.append('<option value="Webcam">Webcam</option>');
    }
}

function preencherObrasDoUsuario() {
    const userCode = $("#solicitante").val();
    if (!userCode) {
        console.error("O valor de 'solicitante' está vazio ou não foi encontrado.");
        FLUIGC.toast({
            title: "Erro:",
            message: "O usuário solicitante não está definido.",
            type: "warning"
        });
        return;
    }

    try {
        const permissoes = buscaObrasPorPermissaoDoUsuario(userCode, true);
        if (permissoes.length > 0) {
            const selectObra = $("#obra");
            const selectCCustoOrigem = $("#ccustoOrigem");
            const selectCCustoDestino = $("#ccustoDestino");

            selectObra.empty();
            selectCCustoOrigem.empty();
            selectCCustoDestino.empty();

            let optionsObra = "<option value='' id='option'>Selecione uma obra</option>";
            let optionsOrigem = "<option value='' id='option'>Selecione um centro de custo</option>";
            let optionsDestino = "<option value='' id='option'>Selecione um centro de custo</option>";
            let codcoligadaAtual = "";

            permissoes.forEach(ccusto => {
                if (codcoligadaAtual !== ccusto.CODCOLIGADA) {
                    if (codcoligadaAtual !== "") {
                        optionsObra += "</optgroup>";
                        optionsOrigem += "</optgroup>";
                        optionsDestino += "</optgroup>";
                    }
                    optionsObra += `<optgroup label="${ccusto.CODCOLIGADA} - ${ccusto.NOMEFANTASIA}">`;
                    optionsOrigem += `<optgroup label="${ccusto.CODCOLIGADA} - ${ccusto.NOMEFANTASIA}">`;
                    optionsDestino += `<optgroup label="${ccusto.CODCOLIGADA} - ${ccusto.NOMEFANTASIA}">`;
                    codcoligadaAtual = ccusto.CODCOLIGADA;
                }

                const optionValue = `${ccusto.CODCOLIGADA} - ${ccusto.CODCCUSTO} - ${ccusto.perfil}`;
                const optionLabel = `${ccusto.CODCCUSTO} - ${ccusto.perfil}`;

                optionsObra += `<option value="${optionValue}">${optionLabel}</option>`;
                optionsOrigem += `<option value="${optionValue}">${optionLabel}</option>`;
                optionsDestino += `<option value="${optionValue}">${optionLabel}</option>`;
            });
            optionsObra += "</optgroup>";
            optionsOrigem += "</optgroup>";
            optionsDestino += "</optgroup>";
            selectObra.append(optionsObra);
            selectCCustoOrigem.append(optionsOrigem);
            selectCCustoDestino.append(optionsDestino);
        } else {
            FLUIGC.toast({
                title: "Aviso:",
                message: "Nenhuma permissão encontrada para o usuário.",
                type: "warning"
            });
        }
    } catch (error) {
        console.error("Erro ao preencher obras do usuário:", error);
        FLUIGC.toast({
            title: "Erro ao preencher obras do usuário:",
            message: error.message || error,
            type: "danger"
        });
    }
}

function CriaListaColaboradores() {
    const json = JSON.parse($("#inputUsuariosJSON").val());
    $("#tableColaboradores>tbody").empty();

    json.forEach((colaborador) => {
        const colaboradorRow = `
            <tr>
                <td><input class="form-control" value="${colaborador.nome}" readonly></td>
                <td><input class="form-control" value="${colaborador.cargo}" readonly></td>
                <td>
                    <table class="table table-bordered tableProdutos">
                        <thead>
                            <tr><th>Produto</th></tr>
                        </thead>
                        <tbody>
                            ${colaborador.produtos
                .map(
                    (produto) => `
                        <tr>                           
                            <td><input class="form-control" value="${produto.nome || produto}" readonly></td>
                            <td><input class="form-control" value="${produto.quantidade || ''}" readonly></td>
                        </tr>`
                )
                .join("")}
                        </tbody>
                    </table>
                </td>
            </tr>`;
        $("#tableColaboradores>tbody").append(colaboradorRow);
    });
}

function renderizarProdutosVisualizacao() {
    const json = JSON.parse($("#produtosSelecionadosJSON").val() || "[]");
    console.log(json);
    const tbody = $("#tabelaProdutosVisualizacao tbody");
    tbody.empty();

    let index = 0;

    json.forEach((produto) => {
        const quantidade = parseInt(produto.QuantidadeItem || "1");
        for (let i = 0; i < quantidade; i++) {
            const row = `
                    <tr>
                        <td>${produto.IdPrdItem || ''}</td>
                        <td>${produto.CodPrdItem || ''}</td>
                        <td>${produto.CodUndItem || ''}</td>
                        <td>${produto.DescricaoItem || ''}</td>
                        <td>1</td> 
                        <td>${produto.ValorUnitItem || ''}</td>
                        <td>
                            <input type="text" class="form-control prefixoInput" 
                                   data-index="${index}" value="${produto.Prefixo || ''}" 
                                   placeholder="Digite o prefixo">
                        </td>
                    </tr>
                `;
            tbody.append(row);
            index++;
        }
    });
}

function salvarPrefixosPreenchidos() {
    const json = JSON.parse($("#produtosSelecionadosJSON").val() || "[]");
    const inputs = $(".prefixoInput");
    let novaLista = [];

    let index = 0;
    json.forEach((produto) => {
        const quantidade = parseInt(produto.QuantidadeItem || "1");

        for (let i = 0; i < quantidade; i++) {
            let novoProduto = { ...produto };
            novoProduto.QuantidadeItem = "1";
            const prefixoInput = inputs.filter(`[data-index="${index}"]`);
            novoProduto.Prefixo = prefixoInput.val() || "";

            novaLista.push(novoProduto);
            index++;
        }
    });
    $("#produtosSelecionadosJSON").val(JSON.stringify(novaLista));
    console.log($("#produtosSelecionadosJSON").val())
}

function buscaProdutos() {
    return new Promise((resolve, reject) => {
        try {
            var coligada = $("#coligada").val().split(" - ")[0]
            var constraints = [
                DatasetFactory.createConstraint("CODCOLIGADA", coligada, coligada, ConstraintType.MUST),
                DatasetFactory.createConstraint("TipoProduto", "OC/OS", "OC/OS", ConstraintType.MUST),
                DatasetFactory.createConstraint("CODIGOPRD", "10", "10", ConstraintType.MUST)
            ];

            DatasetFactory.getDataset("BuscaProdutosRM", null, constraints, null, {
                success: function (produtos) {
                    resolve(produtos);
                },
                error: function (error) {
                    console.error('[buscaProdutos] Erro ao buscar dataset:', error);
                    reject(error);
                }
            });
        } catch (e) {
            console.error('[buscaProdutos] Erro na função:', e);
            reject(e);
        }
    });
}

function carregarTabelaProdutos() {
    $('#tabelaProdutosAdicionados').DataTable().clear().destroy();
    buscaProdutos()
        .then(function (produtos) {
            console.log(produtos)
            if (!produtos || !produtos.values) {
                throw new Error('Dados de produtos inválidos ou vazios');
            }

            $('#tabelaProdutos').DataTable({
                destroy: true,
                data: produtos.values,
                columns: [
                    { data: "IDPRD", title: "ID" },
                    { data: "NOMEFANTASIA", title: "Produto" },
                    { data: "CODIGOPRD", title: "Código" },
                    { data: "CODUNDCONTROLE", title: "Unidade" },
                    {
                        data: null,
                        title: "Ações",
                        render: function (data, type, row) {
                            //   console.log(row)
                            return '<button class="btn btn-success btn-adicionar-produto" data-id="' + row.IDPRD + '">Adicionar</button>';
                        },
                        orderable: false
                    }
                ],
                language: {
                    sEmptyTable: "NENHUM REGISTRO ENCONTRADO",
                    lengthMenu: "Resultados por Página _MENU_",
                    sInfo: "Mostrando de _START_ até _END_ de _TOTAL_ Registros",
                    sInfoEmpty: "Mostrando 0 Até 0 de 0 Registros",
                    sInfoFiltered: "(FILTRADOS DE _MAX_ REGISTROS)",
                    sInfoThousands: ".",
                    sLengthMenu: "_MENU_ Resultados por Página",
                    sLoadingRecords: "Carregando...",
                    sProcessing: "Processando...",
                    sZeroRecords: "NENHUM REGISTRO ENCONTRADO",
                    sSearch: "Pesquisar",
                    oPaginate: {
                        sNext: "Próximo",
                        sPrevious: "Anterior",
                        sFirst: "Primeiro",
                        sLast: "Último"
                    },
                    oAria: {
                        sSortAscending: ": ORDENAR COLUNAS DE FORMA ASCENDENTE",
                        sSortDescending: ": ORDENAR COLUNAS DE FORMA DESCENDENTE"
                    },
                    select: {
                        rows: {
                            _: "SELECIONADO %d LINHAS",
                            0: "NENHUMA LINHA SELECIONADA",
                            1: "SELECIONADO 1 LINHA"
                        }
                    },
                    buttons: {
                        copy: "COPIAR PARA A ÁREA DE TRANSFERÊNCIA",
                        copyTitle: "CÓPIA BEM SUCEDIDA",
                        copySuccess: {
                            1: "UMA LINHA COPIADA COM SUCESSO",
                            _: "%d LINHAS COPIADAS COM SUCESSO"
                        }
                    }
                },
                initComplete: function () {
                    $(document).off('click', '.btn-adicionar-produto').on('click', '.btn-adicionar-produto', function () {
                        var produtoId = $(this).data('id');
                        var produto = produtos.values.find(p => p.IDPRD == produtoId);
                        var coligadaSelecionada = $("#valorColigada").val()
                        var codFilialSelecionado = $("#valorFilial").val()
                        if (produto) {
                            adicionarProduto(produto);
                        }
                        carregarSelects(coligadaSelecionada, codFilialSelecionado);
                    });
                }
            });
        })
        .catch(function (error) {
            console.error('[carregarTabelaProdutos] Erro ao carregar tabela:', error);
            FLUIGC.toast({
                title: "Erro",
                message: "Falha ao carregar produtos: " + error.message,
                type: "danger"
            });

            $('#tabelaProdutos tbody').html(
                '<tr><td colspan="5" class="text-center text-danger">' +
                'Erro ao carregar produtos. Verifique o console para detalhes.' +
                '</td></tr>'
            );
        });
}

var produtosSelecionados = [];


function adicionarProduto(produto) {
    console.log("selecionado:", produtosSelecionados);
    console.log("produto:", produto);

    // const produtoExistente = produtosSelecionados.find(p => p.IDPRD == produto.IDPRD);

    // if (produtoExistente) {
    //     produtoExistente.QUANTIDADE = Number(produtoExistente.QUANTIDADE || 0) + 1;
    //     FLUIGC.toast({
    //         title: "Aviso",
    //         message: "Este produto já estava selecionado. Quantidade incrementada em +1.",
    //         type: "warning"
    //     });
    // } else {
    const decimais = produto.DECIMAIS || 2;
    const valorUnitario = parseFloat((0).toFixed(decimais));

    const produtoSelecionado = {
        IDPRD: produto.IDPRD,
        CODIGOPRD: produto.CODIGOPRD,
        NOMEFANTASIA: produto.NOMEFANTASIA,
        CODUNDCONTROLE: produto.CODUNDCONTROLE,
        DECIMAIS: decimais,
        DESCRICAO: "",
        QUANTIDADE: 1,
        VALORUNITARIO: valorUnitario,
        CENTROCUSTO: "",
        DEPARTAMENTO: "",
        RATEIO: "100",
        CODTB1FAT: produto.CODTB1FAT
    };

    produtosSelecionados.push(produtoSelecionado);
    FLUIGC.toast({
        title: "Sucesso",
        message: "Produto adicionado com sucesso",
        type: "success"
    });
    // }

    atualizarTabelaProdutosSelecionados();
}


function atualizarTabelaProdutosSelecionados() {
    const table = $('#tabelaProdutosSelecionados').DataTable();

    if (table) {
        table.destroy();
    }

    $('#tabelaProdutosSelecionados').DataTable({
        data: produtosSelecionados,
        pageLength: 25,
        destroy: true,
        columns: [
            { data: "CODIGOPRD", title: "Código" },
            { data: "NOMEFANTASIA", title: "Produto" },
            { data: "CODUNDCONTROLE", title: "Unidade" },
            {
                data: "DESCRICAO",
                title: "Descrição",
                render: (data, type, row) => `
                        <input type="text" class="form-control input-descricao" data-id="${row.IDPRD}" value="${data}">
                    `
            },
            {
                data: "QUANTIDADE",
                title: "Quantidade",
                render: (data, type, row) => `
                        <input type="number" class="form-control input-quantidade" data-id="${row.IDPRD}" value="${data}" step="0.01">
                    `
            },
            {
                data: "VALORUNITARIO",
                title: "Valor Unitário",
                render: (data, type, row) => `
                        <input type="text" class="form-control input-valor" data-id="${row.IDPRD}" value="${data}" readonly>
                    `
            },
            {
                data: "CENTROCUSTO",
                title: "Centro de Custo",
                render: (data, type, row) => `
                        <select class="form-control centro-custo-select" data-id="${row.IDPRD}" data-codcoligada="${$("#coligada").val().split(" - ")[0]}">
                            <option value="">Carregando...</option>
                            <option value="1.4.025">1.4.025</option>
                        </select>
                    `
            },
            {
                data: "DEPARTAMENTO",
                title: "Departamento",
                render: (data, type, row) => `
                        <select class="form-control select-departamento" data-id="${row.IDPRD}">
                            <option value="1.2.45">1.2.45</option>
                        </select>
                    `
            },
            {
                data: "RATEIO",
                title: "Rateio %",
                render: (data, type, row) => `
                        <input type="number" class="form-control input-rateio" data-id="${row.IDPRD}" value="${data}" min="0" max="100">
                    `
            },
            {
                data: "IDPRD",
                title: "Ações",
                render: (data, type, row) => `
                        <button class="btn btn-danger btn-remover-produto" data-idprd="${data}">Remover</button>
                    `
            },
            {
                data: "CODTB1FAT",
                title: "CODTB1FAT",
                visible: false
            }
        ],
        language: {
            sEmptyTable: "NENHUM REGISTRO ENCONTRADO",
            lengthMenu: "Resultados por Página _MENU_",
            sInfo: "Mostrando de _START_ até _END_ de _TOTAL_ Registros",
            sInfoEmpty: "Mostrando 0 Até 0 de 0 Registros",
            sInfoFiltered: "(FILTRADOS DE _MAX_ REGISTROS)",
            sInfoThousands: ".",
            sLengthMenu: "_MENU_ Resultados por Página",
            sLoadingRecords: "Carregando...",
            sProcessing: "Processando...",
            sZeroRecords: "NENHUM REGISTRO ENCONTRADO",
            sSearch: "Pesquisar",
            oPaginate: {
                sNext: "Próximo",
                sPrevious: "Anterior",
                sFirst: "Primeiro",
                sLast: "Último"
            },
            oAria: {
                sSortAscending: ": ORDENAR COLUNAS DE FORMA ASCENDENTE",
                sSortDescending: ": ORDENAR COLUNAS DE FORMA DESCENDENTE"
            },
            select: {
                rows: {
                    _: "SELECIONADO %d LINHAS",
                    0: "NENHUMA LINHA SELECIONADA",
                    1: "SELECIONADO 1 LINHA"
                }
            },
            buttons: {
                copy: "COPIAR PARA A ÁREA DE TRANSFERÊNCIA",
                copyTitle: "CÓPIA BEM SUCEDIDA",
                copySuccess: {
                    1: "UMA LINHA COPIADA COM SUCESSO",
                    _: "%d LINHAS COPIADAS COM SUCESSO"
                }
            }
        },

    });

    produtosSelecionados.forEach(produto => {
        carregarCentrosCustoParaProduto(produto.IDPRD);
    });
    $('#tabelaProdutosSelecionados tbody').off('click', '.btn-remover-produto');
    $('#tabelaProdutosSelecionados tbody').on('click', '.btn-remover-produto', function () {
        const id = $(this).data('idprd');
        produtosSelecionados = produtosSelecionados.filter(p => p.IDPRD != id);
        atualizarTabelaProdutosSelecionados();
    });
}



function carregarCentrosCustoParaProduto(produtoId) {
    const codColigada = $("#coligada").val().split(" - ")[0];
    const select = $(`.centro-custo-select[data-id="${produtoId}"]`);

    select.empty().append('<option value="">Selecione...</option>');
    const constraints = [
        DatasetFactory.createConstraint("CODCOLIGADA", codColigada, codColigada, ConstraintType.MUST),
        DatasetFactory.createConstraint("ATIVO", "S", "S", ConstraintType.MUST)
    ];

    DatasetFactory.getDataset("dsCentroCusto", null, constraints, null, {
        success: function (dataset) {
            dataset.values.forEach(ccusto => {
                const optionValue = `${ccusto.CODCCUSTO} - ${ccusto.NOME}`;
                select.append(`<option value="${optionValue}">${optionValue}</option>`);
            });

            const produto = produtosSelecionados.find(p => p.IDPRD == produtoId);
            if (produto && produto.CENTROCUSTO) {
                select.val(produto.CENTROCUSTO);
            }
        },
        error: function (error) {
            console.error("Erro ao buscar centros de custo:", error);
            select.empty().append('<option value="">Erro ao carregar</option>');
        }
    });
}

function adicionarEventosAosCampos() {
    $(document).on('change', '.input-descricao', function () {
        const id = $(this).data('id');
        const produto = produtosSelecionados.find(p => p.IDPRD == id);
        if (produto) produto.DESCRICAO = $(this).val();
    });

    $(document).on('change', '.input-quantidade', function () {
        const id = $(this).data('id');
        const produto = produtosSelecionados.find(p => p.IDPRD == id);
        if (produto) produto.QUANTIDADE = $(this).val();
    });

    $(document).on('change', '.select-departamento', function () {
        const id = $(this).data('id');
        const produto = produtosSelecionados.find(p => p.IDPRD == id);
        if (produto) produto.DEPARTAMENTO = $(this).val();
    });

    $(document).on('change', '.input-rateio', function () {
        const id = $(this).data('id');
        const produto = produtosSelecionados.find(p => p.IDPRD == id);
        if (produto) {
            let valor = parseFloat($(this).val());
            if (valor > 100) valor = 100;
            if (valor < 0) valor = 0;
            produto.RATEIO = valor.toString();
            $(this).val(valor);
        }
    });
    $(document).on('click', '.btn-remover-produto', function () {
        //const id = $(this).data('idprd'); 
        const id = $(this).data('id');
        produtosSelecionados = produtosSelecionados.filter(p => p.IDPRD != id);
        atualizarTabelaProdutosSelecionados();
    });
}


function preencherSelects() {
    const centrosCusto = [];
    const departamentos = [];

    $('.select-centro-custo').each(function () {
        const select = $(this);
        select.empty();
        centrosCusto.forEach(cc => {
            select.append(`<option value="${cc}">${cc}</option>`);
        });
    });

    $('.select-departamento').each(function () {
        const select = $(this);
        select.empty();
        departamentos.forEach(depto => {
            select.append(`<option value="${depto}">${depto}</option>`);
        });
    });
}

function buscarCentrosCustoParaRateio() {
    return new Promise((resolve, reject) => {
        const codColigada = $("#coligada").val().split(" - ")[0];

        if (!codColigada) {
            reject("Coligada não selecionada");
            return;
        }

        DatasetFactory.getDataset("GCCUSTO", null, [
            DatasetFactory.createConstraint("ATIVO", "S", "S", ConstraintType.MUST),
            DatasetFactory.createConstraint("CODCOLIGADA", codColigada, codColigada, ConstraintType.MUST),
            DatasetFactory.createConstraint("CODCCUSTO", "1.2.043", "1.2.043", ConstraintType.MUST_NOT)
        ], ["CODCCUSTO", "NOME"], {
            success: (ds) => {
                if (ds.values && ds.values.length > 0) {
                    resolve(ds.values);
                } else {
                    reject("Nenhum centro de custo encontrado");
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}
function inicializarCalendario(readonly = false) {
    FLUIGC.calendar(".date:not(#dataOcorrencia)", {
        pickDate: true,
        pickTime: false,
        minDate: "01/01/2024",
        maxDate: "12/31/2030",
        language: "pt-br",
        dateFormat: "dd/mm/yyyy"
    });
}
//function inicializarCalendario(readonly = false) {
//    if (!readonly) {
//        FLUIGC.calendar(".date", {
//            pickDate: true,
//            pickTime: false,
//            minDate: "01/01/2024",
//            maxDate: "12/31/2030",
//            language: "pt-br",
//            dateFormat: "dd/mm/yyyy"
//        });
//    } else {
//        $(".date").each(function () {
//            var $field = $(this);
//            var currentDate = moment().format("DD/MM/YYYY");
//            if (!$field.val()) {
//                $field.val(currentDate);
//            }
//            $field
//                .prop("readonly", true)
//                .css({
//                    backgroundColor: "#e9ecef",
//                    cursor: "not-allowed",
//                    color: "#495057"
//                })
//                .off("click.fc.datepicker")
//                .on("click focus", function (e) {
//                    e.preventDefault();
//                    e.stopImmediatePropagation();
//                    return false;
//                });
//        });
//    }
//}
function calendario(readonly = false) {
    var today = moment().format("DD/MM/YYYY");
    if (!$("#dataOcorrencia").val()) {
        $("#dataOcorrencia").val(today);
    }

    $("#dataOcorrencia").off("click.fc.datepicker");
    if (!readonly) {
        FLUIGC.calendar("#dataOcorrencia", {
            pickTime: false,
            language: "pt-br",
            startDate: moment(today, "DD/MM/YYYY").toDate(),
            endDate: moment(today, "DD/MM/YYYY").toDate(),
            defaultDate: moment(today, "DD/MM/YYYY").toDate(),
            minDate: moment(today, "DD/MM/YYYY").toDate()
        });
    }
    $("#dataOcorrencia")
        .prop("readonly", true)
        .css({
            backgroundColor: "#e9ecef",
            cursor: "not-allowed",
            color: "#495057"
        })
        .on("click focus", function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        });
    $("#dataOcorrenciaHidden").val($("#dataOcorrencia").val());
}

//function calendario(readonly = false) {
//    var currentDate = moment().format("DD/MM/YYYY");
//    var today = moment().format('DD/MM/YYYY');
//    $("#dataOcorrencia").off('click.fc.datepicker');
//    if (!$("#dataOcorrencia").val()) {
//        $("#dataOcorrencia").val(currentDate);
//    }
//
//    if (!readonly) {
//        if (currentDate !== null) {
//            FLUIGC.calendar("#dataOcorrencia", {
//                pickTime: false,
//                language: 'pt-br',
//                startDate: moment(currentDate, 'DD/MM/YYYY').toDate(),
//                endDate: moment(currentDate, 'DD/MM/YYYY').toDate(),
//                defaultDate: moment(currentDate, 'DD/MM/YYYY').toDate(),
//                minDate: moment(today, 'DD/MM/YYYY').toDate()
//            });
//        } else {
//            FLUIGC.calendar("#dataOcorrencia", {
//                pickTime: false,
//                language: 'pt-br',
//                minDate: moment(today, 'DD/MM/YYYY').toDate()
//            });
//        }
//    } else {
//        $("#dataOcorrencia")
//            .prop("readonly", true)
//            .css({
//                backgroundColor: "#e9ecef",
//                cursor: "not-allowed",
//                color: "#495057"
//            })
//            .on("click focus", function (e) {
//                e.preventDefault();
//                e.stopImmediatePropagation();
//                return false;
//            });
//    }
//
//    var valorData = $("#dataOcorrencia").val();
//    $("#dataOcorrenciaHidden").val(valorData);
//}

function ValidaEmailsEmCopia() {
    if ($("#email").val() == "") {
        return true;
    }
    var valida = true;
    var re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    var emails = $("#email").val().trim().split(";");
    emails.forEach(email => {
        if (valida == true && !re.test(email.trim())) {
            valida = false;
        }
    });
    if (!valida) {
        FLUIGC.toast({
            message: "E-mails em cópia inválido!",
            type: "warning"
        });
        $([document.documentElement, document.body]).animate({
            scrollTop: $("#email").offset().top - (screen.height * 0.15)
        }, 700);
        $("#email").addClass("has-error");
    }
    return valida;
}

function ValidaCampos() {
    var atividade = $("#atividade").val();
    var formMode = $("#formMode").val();
    var valida = true;
    var colaboradores = []
    var produtosSelecionadosJSON = []
    var equipeTI = []
    if ($("#decisaoCancelar").is(":checked")) {
        const observacaoRetorno = $("#observacao").val().trim();
        if (!observacaoRetorno) {
            $("#observacao").addClass("has-error");
            if (valida) {
                valida = false;
                FLUIGC.toast({
                    message: "Preencha o campo 'Observação' antes de retornar!",
                    type: "warning",
                });
                $([document.documentElement, document.body]).animate({
                    scrollTop: $("#observacao").offset().top - (screen.height * 0.15),
                }, 700);
            }
        } else {
            $("#observacao").removeClass("has-error");
        }
    }
    if (atividade == 0) {
        $(".inputInfoChamado").each(function () {
            if ($(this).is(":visible") && ($(this).val() == null || $(this).val() == undefined || $(this).val() == "")) {
                $(this).addClass("has-error");
                if (valida == true) {
                    const campoId = $(this).attr("id");
                    valida = false;
                    FLUIGC.toast({
                        message: `Campo ${campoId} não preenchido!`,
                        type: "warning"
                    });
                    $([document.documentElement, document.body]).animate({
                        scrollTop: $(this).offset().top - (screen.height * 0.15)
                    }, 700);
                }
            }
        });
        $("#tableColaboradores>tbody>tr").each(function () {
            const nome = $(this).find(".nomeColaborador").val();
            const cargo = $(this).find(".cargoColaborador").val();
            const produtos = [];
            $(this).find(".tableProdutos>tbody>tr").each(function () {
                const produto = $(this).find(".produtoSelect").val();
                const quantidade = $(this).find(".quantidadeSelect").val();


                if (!categoria || !produto) {
                    $(this).find("produtoSelect").addClass("has-error");
                    if (valida) {
                        valida = false;
                        FLUIGC.toast({
                            message: "Preencha todos os campos de Categoria e Produto!",
                            type: "warning",
                        });
                    }
                } else {
                    //     produtos.push(produto)
                    produtos.push({
                        nome: produto,
                        quantidade: quantidade || 1
                    })
                }
            });
            if (!nome || !cargo) {
                $(this).find(".nomeColaborador, .cargoColaborador").addClass("has-error");
                if (valida) {
                    valida = false;
                    FLUIGC.toast({
                        message: "Preencha todos os campos de Nome e Cargo do Colaborador!",
                        type: "warning",
                    });
                }
            } else {
                colaboradores.push({
                    nome: nome,
                    cargo: cargo,
                    produtos: produtos,
                });
            }
            $("#inputUsuariosJSON").val(JSON.stringify(colaboradores));
            console.log($("#inputUsuariosJSON").val());
        });
        $("#enderecoDestinoHidden").val($("#enderecoDestino").val());
    }
    if (atividade == 5) {
        $('#tabelaProdutosSelecionados>tbody>tr').each(function () {
            const row = $(this);
            const descricao = row.find('.input-descricao').val() || "";
            const quantidade = row.find('.input-quantidade').val() || "";
            const valorUnitario = row.find('.input-valor').val() || "";
            const rateioCCusto = row.find('.centro-custo-select').val() || "";
            const rateioDepartamento = row.find('.select-departamento').val() || "";
            const percentualRateio = row.find('.input-rateio').val() || "100";
            const idPrdItem = row.find('.btn-remover-produto').data('idprd') || "";
            const produtoOriginal = produtosSelecionados.find(p => p.IDPRD == idPrdItem);
            const codtb1fat = produtoOriginal ? produtoOriginal.CODTB1FAT : "";
            if (!descricao || !quantidade || !valorUnitario) {
                console.warn("Alguns campos obrigatórios não estão preenchidos na linha:", row);
                return;
            }
            produtosSelecionadosJSON.push({
                IdPrdItem: idPrdItem,
                CodPrdItem: row.find('td:eq(0)').text().trim() || "",
                DescPrdItem: row.find('td:eq(1)').text().trim() || "",
                CodUndItem: row.find('td:eq(2)').text().trim() || "",
                ProdutoItem: `${row.find('td:eq(0)').text().trim()} - ${row.find('td:eq(1)').text().trim()}`,
                DescricaoItem: descricao.trim(),
                QuantidadeItem: quantidade.trim(),
                ValorUnitItem: valorUnitario.trim(),
                CODTB1FAT: codtb1fat,
            });
        });
        $("#produtosSelecionadosJSON").val(JSON.stringify(produtosSelecionadosJSON));
        console.log($("#produtosSelecionadosJSON").val());
    }
    if (atividade == 14) {
        const produtosSelecionadosJSON = JSON.parse($("#produtosSelecionadosJSON").val() || "[]");
        $("#tabelaProdutosVisualizacao tbody tr").each(function () {
            const index = $(this).find(".prefixoInput").data("index");
            const prefixo = $(this).find(".prefixoInput").val().trim();
            if (produtosSelecionadosJSON[index]) {
                produtosSelecionadosJSON[index].Prefixo = prefixo || null;
            }
        });
        $("#produtosSelecionadosJSON").val(JSON.stringify(produtosSelecionadosJSON));
        console.log("JSON atualizado com prefixos:", produtosSelecionadosJSON);
    }
    // if (atividade == 25) {
    if (atividade == 145 && ($("#estoque").val() == "Entrega sem compra" || true)) {
        $("#tableEquipeTI>tbody>tr").each(function () {
            const descricao = $(this).find(".descricaoInput").val();
            const responsavel = $(this).find(".responsavelInput").val();
            const prefixo = $(this).find(".prefixoInput").val();
            const quantidade = $(this).find(".quantidadeInput").val();
            const valor = $(this).find(".valorInput").val();
            if (!descricao || !prefixo || !quantidade || !valor) {
                $(this).find("input").addClass("has-error");
                if (valida) {
                    valida = false;
                    FLUIGC.toast({
                        message: "Preencha todos os campos da Tabela de Equipe TI!",
                        type: "warning",
                    });
                }
            } else {
                equipeTI.push({
                    descricao: descricao,
                    responsavel: responsavel,
                    prefixo: prefixo,
                    quantidade: quantidade,
                    valor: valor,
                });
            }
        });
        $("#inputEquipeTIJSON").val(JSON.stringify(equipeTI));
        console.log($("#inputEquipeTIJSON").val());
    }
    if (atividade == 123) {
    	  var textoAnexo = $("#textFileTermo").text().trim();
    	  if (      textoAnexo === "Nenhum arquivo selecionado" ||
    	            textoAnexo === "" ||
    	            textoAnexo.toLowerCase().includes("nenhum arquivo")
    	        ) {
    	            valida = false;
    	            FLUIGC.toast({
    	                message: "É obrigatório inserir o anexo antes de prosseguir!",
    	                type: "warning",
    	            });
    	            return false;
    	        }
    }
    return valida;
}

function BuscaColigadas() {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("DatasetSolicitacaoDeCompraseServicos", null, [
            DatasetFactory.createConstraint("operacao", "BuscaColigadas", "BuscaColigadas", ConstraintType.MUST),
            DatasetFactory.createConstraint("codusuario", $("#userCode").val(), $("#userCode").val(), ConstraintType.MUST),
            DatasetFactory.createConstraint("permissaoGeral", (VerificaSeUsuarioPermissaoGeral() == true ? "true" : "false"), (VerificaSeUsuarioPermissaoGeral() == true ? "true" : "false"), ConstraintType.MUST)
        ], null, {
            success: (coligadas => {
                $("#coligada").empty().append("<option value=''>Selecione</option>");
                var selected = $("#coligada").val();
                coligadas.values.forEach((coligada, i) => {
                    $("#coligada").append("<option value='" + coligada.CODCOLIGADA + " - " + coligada.COLIGADA + "'>" + coligada.CODCOLIGADA + " - " + coligada.COLIGADA + "</option>");
                    if (i == coligadas.values.length - 1) {
                        $("#coligada").val(selected);
                    }
                });
                resolve()
            }),
            error: (error => {
                FLUIGC.toast({
                    title: "Erro ao buscar coligadas: ",
                    message: error,
                    type: warning
                });
                reject();
            })
        });
    })

}

function VerificaSeUsuarioPermissaoGeral() {
    var ds = DatasetFactory.getDataset("colleagueGroup", ["colleagueId"], [
        DatasetFactory.createConstraint("colleagueId", $("#userCode").val(), $("#userCode").val(), ConstraintType.MUST),
        DatasetFactory.createConstraint("groupId", "Comprador", "Comprador", ConstraintType.SHOULD),
        DatasetFactory.createConstraint("groupId", "Matriz", "Matriz", ConstraintType.SHOULD),
        DatasetFactory.createConstraint("groupId", "Administrador TI", "Administrador TI", ConstraintType.SHOULD)
    ], null);


    if (ds.values.length > 0) {
        return true;
    }
    else {
        return false;
    }
}
function BuscaFilial() {
    return new Promise((resolve, reject) => {
        const codColigada = $("#coligada").val().split(" - ")[0];
        if (!codColigada) {
            FLUIGC.toast({
                title: "Atenção:",
                message: "Selecione uma coligada antes de buscar filiais.",
                type: "warning"
            });
            reject("Coligada não selecionada.");
            return;
        }
        DatasetFactory.getDataset(
            "DatasetSolicitacaoDeCompraseServicos",
            null,
            [
                DatasetFactory.createConstraint("operacao", "BuscaFilial", "BuscaFilial", ConstraintType.MUST),
                DatasetFactory.createConstraint("codcoligada", codColigada, codColigada, ConstraintType.MUST)
            ],
            null,
            {
                success: (filiais) => {
                    const list = [];
                    filiais.values.forEach((filial) => {
                        list.push({
                            value: filial.CODFILIAL + " - " + filial.FILIAL,
                            label: filial.CODFILIAL + " - " + filial.FILIAL
                        });
                    });
                    resolve(list);
                },
                error: (error) => {
                    FLUIGC.toast({
                        title: "Erro ao buscar filiais:",
                        message: error,
                        type: "danger"
                    });
                    reject(error);
                }
            }
        );
    });
}

function BuscaLocalDeEstoque(filial) {
    return new Promise((resolve, reject) => {
        const codColigada = $("#coligada").val().split(" - ")[0];

        if (!codColigada || !filial) {
            FLUIGC.toast({
                title: "Atenção:",
                message: "Selecione a coligada e a filial antes de buscar locais de estoque.",
                type: "warning"
            });
            reject("Coligada ou filial não selecionada.");
            return;
        }

        DatasetFactory.getDataset(
            "DatasetSolicitacaoDeCompraseServicos",
            null,
            [
                DatasetFactory.createConstraint("operacao", "BuscaLocalDeEstoque", "BuscaLocalDeEstoque", ConstraintType.MUST),
                DatasetFactory.createConstraint("codusuario", $("#userCode").val(), $("#userCode").val(), ConstraintType.MUST),
                DatasetFactory.createConstraint("codcoligada", codColigada, codColigada, ConstraintType.MUST),
                DatasetFactory.createConstraint("codfilial", filial, filial, ConstraintType.MUST),
                DatasetFactory.createConstraint(
                    "permissaoGeral",
                    VerificaSeUsuarioPermissaoGeral() ? "true" : "false",
                    VerificaSeUsuarioPermissaoGeral() ? "true" : "false",
                    ConstraintType.MUST
                )
            ],
            null,
            {
                success: (locaisDeEstoque) => {
                    const list = [];
                    locaisDeEstoque.values.forEach((local) => {
                        list.push({
                            value: local.CODLOC + " - " + local.NOME,
                            label: local.CODLOC + " - " + local.NOME
                        });
                    });
                    resolve(list);
                },
                error: (error) => {
                    FLUIGC.toast({
                        title: "Erro ao buscar local de estoque:",
                        message: error,
                        type: "danger"
                    });
                    reject(error);
                }
            }
        );
    });
}




async function PreencheLocalDeEstoque(filialSelecionada) {
    try {
        $("#localEstoque").empty().append("<option value=''>Selecione...</option>");
        const locais = await BuscaLocalDeEstoque(filialSelecionada);
        if (locais.length === 0) {
            $("#localEstoque").append("<option value=''>Nenhum local de estoque encontrado</option>");
        } else {
            locais.forEach(local => {
                $("#localEstoque").append(`<option value='${local.value}'>${local.label}</option>`);
            });
        }
    } catch (error) {
        console.error("Erro ao preencher local de estoque:", error);
    }
}


function atualizarItensHidden() {
    var itens = [];
    $('#tabelaProdutosSelecionados tbody tr').each(function () {
        var row = $(this);
        const idPrdItem = row.find('.btn-remover-produto').data('idprd') || "";
        const produtoOriginal = produtosSelecionados.find(p => p.IDPRD == idPrdItem);
        const codtb1fat = produtoOriginal ? produtoOriginal.CODTB1FAT : "";
        itens.push({
            ItemId: makeid(10),
            IdPrdItem: row.find('.input-descricao').data('id') || "",
            CodPrdItem: row.find('td:eq(0)').text().trim(),
            DescPrdItem: row.find('td:eq(1)').text().trim(),
            DescricaoItem: row.find('.input-descricao').val().trim(),
            QuantidadeItem: row.find('.input-quantidade').val().trim(),
            ValorUnitItem: row.find('.input-valor').val().trim() || "",
            CodUndItem: row.find('td:eq(2)').text().trim(),
            ProdutoItem: `${row.find('td:eq(0)').text().trim()} - ${row.find('td:eq(1)').text().trim()}`,
            CODTB1FAT: codtb1fat,
            PrazoEntrega: "",
            SubEmpreiteiro: false,
            SubEmpreiteiroObservacao: "",
            SubEmpreiteiroSelect: "",
            RateioCCusto: row.find('.centro-custo-select').val(),
            RateioDepto: [{
                Departamento: row.find('.select-departamento').val() || "",
                Percentual: row.find('.input-rateio').val().trim() || "100"
            }]
        });
    });
    $('#itensOrcamento').val(JSON.stringify(itens));
    console.log("Itens orçamento enviados api:", itens);
}
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


function BuscaCondicaoDePagamento() {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("DatasetSolicitacaoDeCompraseServicos", null, [
            DatasetFactory.createConstraint("operacao", "BuscaCondicaoDePagamento", "BuscaCondicaoDePagamento", ConstraintType.MUST),
            DatasetFactory.createConstraint("codcoligada", $("#coligada").val().split(" - ")[0], $("#coligada").val().split(" - ")[0], ConstraintType.MUST)
        ], null, {
            success: (condicoesDePagto) => {
                const select = $('#condPagamento');
                select.empty().append('<option value="">Selecione...</option>');

                condicoesDePagto.values.forEach(condicao => {
                    select.append(
                        `<option value="${condicao.CODCPG}___${condicao.NOME}">${condicao.NOME}</option>`
                    );
                });
                resolve();
            },
            error: (error) => {
                FLUIGC.toast({
                    title: "Erro ao buscar condições de pagamento",
                    message: error,
                    type: "warning"
                });
                reject(error);
            }
        });
    });
}

function carregarSelects(codColigada, codFilial) {
    Promise.all([
        BuscaCondicaoDePagamento(codColigada),
        BuscaFormaDePagamento(codColigada),
        BuscaTransporte(codColigada),
        BuscaRateioPorCentroDeCusto(codColigada),
        BuscaRateioPorDepartamento(codColigada, codFilial)
    ]).then(() => {
        console.log('Todos os selects foram carregados');
    }).catch(error => {
        console.error('Erro ao carregar selects:', error);
    });
}

function BuscaCondicaoDePagamento(codColigada) {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("DatasetSolicitacaoDeCompraseServicos", null, [
            DatasetFactory.createConstraint("operacao", "BuscaCondicaoDePagamento", "BuscaCondicaoDePagamento", ConstraintType.MUST),
            DatasetFactory.createConstraint("codcoligada", codColigada, codColigada, ConstraintType.MUST)
        ], null, {
            success: (ds) => {
                $('#condPagamento').empty().append('<option value="">Selecione...</option>');

                ds.values.forEach(item => {
                    $('#condPagamento').append(
                        `<option value="${item.CODCPG}___${item.NOME}">${item.NOME}</option>`
                    );
                });
                resolve();
            },
            error: reject
        });
    });
}

function BuscaFormaDePagamento(codColigada) {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("DatasetSolicitacaoDeCompraseServicos", null, [
            DatasetFactory.createConstraint("operacao", "BuscaFormaDePagamento", "BuscaFormaDePagamento", ConstraintType.MUST),
            DatasetFactory.createConstraint("codcoligada", codColigada, codColigada, ConstraintType.MUST)
        ], null, {
            success: (ds) => {
                $('#formaPagamento').empty().append('<option value="">Selecione...</option>');

                ds.values.forEach(item => {
                    $('#formaPagamento').append(
                        `<option value="${item.CODTB1FLX} - ${item.DESCRICAO}">${item.CODTB1FLX} - ${item.DESCRICAO}</option>`
                    );
                });
                resolve();
            },
            error: reject
        });
    });
}

//function BuscaTransporte(codColigada) {
//    return new Promise((resolve, reject) => {
//        DatasetFactory.getDataset("TTRARM", null, [
//            DatasetFactory.createConstraint("CODCOLIGADA", codColigada, codColigada, ConstraintType.MUST)
//        ], null, {
//            success: (ds) => {
//                $('#transporte').empty().append('<option value="">Selecione...</option>');
//                $('#transportadora').empty().append('<option value="">Selecione...</option>');
//                ds.values.forEach(item => {
//                    const option = `<option value="${item.CODTRA} - ${item.NOME}">${item.CODTRA} - ${item.NOME}</option>`;
//                    $('#transporte').append(option);
//                    $('#transportadora').append(option);
//                });
//                resolve();
//            },
//            error: reject
//        });
//    });
//}
function BuscaTransporte(codColigada) {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("DatasetSuporteContabilidade", null, [
            DatasetFactory.createConstraint("operacao", "BuscaTransportadora", "BuscaTransportadora", ConstraintType.MUST),
        ], null, {
            success: (ds) => {
                console.log(ds)
                $('#transporte').empty().append('<option value="">Selecione...</option>');
                $('#transportadora').empty().append('<option value="">Selecione...</option>');
                ds.values.forEach(item => {
                    const option = `<option value="${item.CGC} - ${item.NOME}">${item.CGC} - ${item.NOME}</option>`;
                    $('#transporte').append(option);
                    $('#transportadora').append(option);
                });
                resolve();
            },
            error: reject
        });
    });
}

function uploadSelectedFile(inputId, fileDescription) {
    try {
        var element = parent.document.getElementById("ecm-navigation-inputFile-clone");
        if (element) {
            element.setAttribute("data-on-camera", "true");
            if (fileDescription && inputId) {
                element.setAttribute("data-file-name-camera", fileDescription);
                element.setAttribute("data-inputNameFile", inputId);
            }
            function handleFileSelect(event) {
                var files = event.target.files;
                if (files.length > 0) {
                    var fileName = files[0].name;
                    var fileStatus = document.getElementById("text" + inputId.replace('input', '')) ||
                        document.querySelector('[id^="text' + inputId.replace('input', '') + '"]') ||
                        document.querySelector('.fileSelectionStatus');
                    if (fileStatus) {
                        fileStatus.textContent = 'Arquivo selecionado: ' + fileName;
                    } else {
                        console.warn("Elemento de status não encontrado para:", inputId);
                    }
                    FLUIGC.toast({
                        message: 'Enviando arquivo, aguarde...',
                        type: 'info',
                        timeout: 6000
                    });
                    CriacaoDocumentosFluig(inputId, files);
                }
                element.removeEventListener('change', handleFileSelect);
            }
            element.addEventListener('change', handleFileSelect);
            element.click();
        }
    } catch (e) {
        console.error("Erro em uploadSelectedFile:", e);
        FLUIGC.toast({
            message: 'Erro ao selecionar arquivo',
            type: 'danger'
        });
    }
}

function CriacaoDocumentosFluig(inputId, files) {
    console.log(inputId, files)
    var processo = WKNumProces;

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var fileName = processo + '-' + file.name;
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var base64Data = e.target.result.split("base64,")[1];
                var folderId = 2084064

                var constraints = [
                    DatasetFactory.createConstraint("processo", processo, processo, ConstraintType.MUST),
                    DatasetFactory.createConstraint("conteudo", base64Data, base64Data, ConstraintType.MUST),
                    DatasetFactory.createConstraint("nome", fileName, fileName, ConstraintType.MUST),
                    DatasetFactory.createConstraint("descricao", fileName, fileName, ConstraintType.MUST),
                    DatasetFactory.createConstraint("pasta", folderId, folderId, ConstraintType.MUST)
                ];
                console.log(constraints)
                DatasetFactory.getDataset("CriacaoDocumentosFluig", null, constraints, null, {
                    success: function (dataset) {
                        if (
                            dataset &&
                            dataset.values &&
                            dataset.values.length > 0 &&
                            dataset.values[0].Status === 'true' &&
                            dataset.values[0].Resultado
                        ) {
                            $("#anexoInserido").val("S");
                            FLUIGC.toast.close();
                            FLUIGC.toast({
                                message: 'Arquivo "' + file.name + '" enviado com sucesso!',
                                type: 'success',
                                timeout: 3000
                            });
                        } else {
                            $("#anexoInserido").val("N");
                            FLUIGC.toast.close();
                            FLUIGC.toast({
                                message: 'Erro ao enviar arquivo "' + file.name + '"',
                                type: 'danger',
                                timeout: 5000
                            });
                        }
                    },
                    error: function (error) {
                        console.error("Erro ao criar documento no Fluig: ", error);
                        FLUIGC.toast({
                            message: 'Erro ao enviar arquivo',
                            type: 'danger',
                            timeout: 5000
                        });
                    }
                });

            } catch (error) {
                console.error("Erro no processamento do arquivo:", error);
            }
        };

        reader.onerror = function (error) {
            console.error("Erro na leitura do arquivo:", error);
        };

        reader.readAsDataURL(file);
    }
}
function BuscaRateioPorCentroDeCusto(codColigada) {
    console.log("CODCOLIGADA enviado:", codColigada);
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("GCCUSTO", null, [
            DatasetFactory.createConstraint("ATIVO", "T", "T", ConstraintType.MUST),
            DatasetFactory.createConstraint("CODCOLIGADA", codColigada, codColigada, ConstraintType.MUST),
            DatasetFactory.createConstraint("CODCCUSTO", "1.2.043", "1.2.043", ConstraintType.MUST_NOT)
        ], ["CODCCUSTO"], {
            success: (ds) => {
                const select = $(".centro-custo-select");
                select.empty().append('<option value="">Selecione...</option>');
                ds.values.forEach(ccusto => {
                    select.append(
                        `<option value="${ccusto.CODCCUSTO} - ${ccusto.NOME}">${ccusto.CODCCUSTO} - ${ccusto.NOME}</option>`
                    );
                });
                resolve();
            },
            error: (error) => {
                FLUIGC.toast({
                    title: "Erro ao buscar Centro de Custo:",
                    message: error,
                    type: "warning"
                });
                reject(error);
            }
        });
    });
}

function BuscaRateioPorDepartamento(codColigada, codFilial) {
    console.log(codColigada)
    console.log(codFilial)
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("DepartamentosRM", null, [
            DatasetFactory.createConstraint("codcoligada", codColigada, codColigada, ConstraintType.MUST),
            DatasetFactory.createConstraint("codfilial", codFilial, codFilial, ConstraintType.MUST)
        ], null, {
            success: (ds) => {
                const select = $(".select-departamento");
                select.empty().append('<option value="">Selecione...</option>');
                ds.values.forEach(departamento => {
                    select.append(
                        `<option value="${departamento.coddepartamento} - ${departamento.nome}">${departamento.coddepartamento} - ${departamento.nome}</option>`
                    );
                });

                resolve();
            },
            error: (error) => {
                FLUIGC.toast({
                    title: "Erro ao buscar Departamentos:",
                    message: error,
                    type: "warning"
                });
                reject(error);
            }
        });
    });
}

function adicionarLinhaEquipeTI() {
    const linhaHTML = `
    <tr>
        <td>
            <input type="text" class="form-control descricaoInput" name="descricao">
        </td>
         <td>
            <input type="text" class="form-control responsavelInput" name="responsavel">
        </td>
        <td>
            <input type="text" class="form-control prefixoInput" name="prefixo">
        </td>
        <td>
            <input type="number" class="form-control quantidadeInput" name="quantidade" min="0" step="1">
        </td>
        <td>
            <input type="text" class="form-control valorInput" name="valor" pattern="^[0-9]+(\\.[0-9]{1,2})?$">
        </td>
        <td style="text-align: center;">
            <button type="button" class="btn btn-danger btnRemoverLinha"><i class="flaticon flaticon-trash icon-sm" aria-hidden="true"></i></button>
        </td>
    </tr>`;

    $("#tableEquipeTI > tbody").append(linhaHTML);
    //  $("#tableEquipeTI > tbody").find("tr:last .valorInput").mask('000.000.000,00', {reverse: true});
    $("#tableEquipeTI > tbody").find("tr:last .btnRemoverLinha").on("click", function () {
        $(this).closest("tr").remove();
    });
}

function CriaListaEquipeTI() {
    const json = JSON.parse($("#inputEquipeTIJSON").val());
    console.log(json)
    $("#tableEquipeTI>tbody").empty();

    json.forEach((linha) => {
        const linhaHTML = `
            <tr>
                <td><input class="form-control" value="${linha.descricao}" readonly></td>
                <td><input class="form-control" value="${linha.responsavel}" readonly></td>
                <td><input class="form-control" value="${linha.prefixo}" readonly></td>
                <td><input class="form-control" value="${linha.quantidade}" readonly></td>
                <td><input class="form-control" value="${linha.valor}" readonly></td>
            </tr>`;
        $("#tableEquipeTI>tbody").append(linhaHTML);
    });
}

function CriaListaEquipeTI2() {
    const produtosSelecionadosJSON = JSON.parse($("#produtosSelecionadosJSON").val() || "[]");
    const tbody = $("#tabelaProdutosVisualizacao tbody");
    tbody.empty();

    produtosSelecionadosJSON.forEach(produto => {
        const row = `
                <tr>
                    <td>${produto.IdPrdItem || ''}</td>
                    <td>${produto.CodPrdItem || ''}</td>
                    <td>${produto.CodUndItem || ''}</td>
                    <td>${produto.DescricaoItem || ''}</td>
                    <td>${produto.QuantidadeItem || ''}</td>
                    <td>${produto.ValorUnitItem || ''}</td>
                    <td>${produto.Prefixo || ''}</td>
                </tr>
            `;
        tbody.append(row);
    })
}

function obterValoresMovimento() {
    const idMovOrigem = $("#idmovCapturadoCompras").val();
    //  const idMovOrigem = "1552"
    const idProcessoCompras = $("#idProcessoCompras").val();
    console.log("IDMOV(s) de origem capturado:", idMovOrigem);

    if (!idMovOrigem) {
        console.error("IDMOV de origem não fornecido.");
        return null;
    }

    try {
        const ids = idMovOrigem.split(",").map(id => id.trim()).filter(id => id);
        const container = document.getElementById("divContabilidadeContent");
        container.innerHTML = "";

        ids.forEach(id => {
            const constraints = [
                DatasetFactory.createConstraint("IDMOVORIGEM", id, id, ConstraintType.MUST)
            ];
            const dataset = DatasetFactory.getDataset("buscaIdmovDestino", null, constraints, null);
            console.log(`Dataset retornado para IDMOV ${id}:`, dataset);

            if (dataset && dataset.values && dataset.values.length > 0) {
                dataset.values.forEach(dado => {
                    const dataEmissao = dado.DATAEMISSAO
                        ? dado.DATAEMISSAO.split(" ")[0].split("-").reverse().join("/")
                        : "N/A";
                    const dataSaida = dado.DATASAIDA
                        ? dado.DATASAIDA.split(" ")[0].split("-").reverse().join("/")
                        : "N/A";

                    const conteudo = `
                            <div class="card-movimento" style="border:1px solid #ddd; padding:10px; margin-bottom:15px; border-radius:6px;">
                                <h5>Movimento ID: ${id}</h5>
                                <div class="row">
                                    <div class="col-md-5">
                                        <div class="form-input">
                                            <label>Solicitação OC:</label>
                                            <span>${idProcessoCompras || "N/A"}</span>
                                        </div>
                                    </div>
                                 
                                    <div class="col-md-4">
                                        <div class="form-input">
                                            <label>Número do Movimento:</label>
                                            <span>${dado.NUMEROMOV || "N/A"}</span>
                                        </div>
                                    </div>
                                       <div class="col-md-3">
                                        <div class="form-input">
                                            <label>Data de Saída:</label>
                                            <span>${dataSaida}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-5">
                                        <div class="form-input">
                                            <label>Fornecedor:</label>
                                            <span>${dado.FORNECEDOR || "N/A"}</span>
                                        </div>
                                    </div>
                                   <div class="col-md-4">
                                        <div class="form-input">
                                            <label>CNPJ do Fornecedor:</label>
                                            <span>${dado.CNPJ || "N/A"}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-input">
                                            <label>Data de Emissão:</label>
                                            <span>${dataEmissao}</span>
                                        </div>
                                    </div>                
                                </div>
                                <div class="row">
                                 <div class="col-md-4">
                                        <div class="form-input">
                                            <label>Coligada:</label>
                                            <span>${dado.CODCOLIGADA || "N/A"}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-8">
                                        <div class="form-input">
                                            <label>Chave de Acesso NFe:</label>
                                            <span>${dado.CHAVEACESSONFE || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    container.innerHTML += conteudo;
                });
            } else {
                console.warn("Nenhum valor encontrado no dataset para IDMOV:", id);
                container.innerHTML += `<p>Nenhuma informação disponível para IDMOV ${id}. A nota possivelmente não foi lançada.</p>`;
            }
        });
    } catch (e) {
        console.error("Erro ao obter valores do dataset:", e.message);
        document.getElementById("divContabilidadeContent").innerHTML =
            "<p>Erro ao carregar informações.</p>";
    }
}

function carregarEExibirResumoProdutos() {
    var jsonProdutos = $("#produtosSelecionadosJSON").val();

    if (jsonProdutos && jsonProdutos !== "[]") {
        try {
            var produtos = JSON.parse(jsonProdutos);
            exibirProdutosComprados(produtos);
        } catch (e) {
            console.error("Erro ao carregar resumo:", e);
        }
    }
}

function exibirProdutosComprados(produtos) {
    if (produtos.length === 0) {
        return;
    }
    var numSolCompras = $("#idProcessoCompras").val()
    var url = `http://fluig.castilho.com.br:1010/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${numSolCompras}`;
    var htmlResumo = `
            <div class="panel panel-default" style="margin-bottom: 20px;">
                <div class="panel-heading" style="background-color: black; color: white;">
                    <h4 class="panel-title">🛒 Produtos enviados para Compra</h4>
                </div>
                <div class="panel-body">
                 <div class="row"><b> Solicitação de Compra: </b>
                        <a href="${url}" target="_blank" 
                           style="color: #ffc300; text-decoration: underline; font-weight: bold;">
                            Nº ${numSolCompras}
                        </a>
                    </div>
                `;


    produtos.forEach(function (produto, index) {
        var quantidade = parseFloat(produto.QuantidadeItem) || 0;
        var valorUnitario = parseFloat(produto.ValorUnitItem) || 0;

        htmlResumo += `
                    <div class="produto-item" style="border-bottom: 1px solid #eee; padding: 10px 0; ${index === produtos.length - 1 ? 'border-bottom: none;' : ''}">
                        <div class="row">
                            <div class="col-md-4">
                                <strong>Produto:</strong><br>
                                ${produto.DescPrdItem || 'N/A'}
                            </div>
                            <div class="col-md-3">
                                <strong>Descrição:</strong><br>
                                ${produto.DescricaoItem || 'N/A'}
                            </div>
                            <div class="col-md-2">
                                <strong>Quantidade:</strong><br>
                                ${quantidade} ${produto.CodUndItem}
                            </div>
                            <div class="col-md-3">
                                <strong>Valor Unitário:</strong><br>
                                R$ ${valorUnitario.toFixed(2)}
                            </div>
                        </div>
                    </div>`;
    });

    htmlResumo += `
                </div>
            </div>`;
    $("#divProdutosComprados").html(htmlResumo);
}

function tornarSelectsReadOnlySolicitante() {
    $("#categoria, #coligada, #localEstoque").css({
        pointerEvents: "none",
        backgroundColor: "#e9ecef",
        color: "#495057",
    }).attr("aria-readonly", "true");

    $("#categoria, #coligada, #localEstoque").on("keydown", e => e.preventDefault());

    $(".custom-select").each(function () {
        const select = $(this);
        select.css({
            pointerEvents: "none",
            opacity: "0.9"
        });
        select.find("input[type='checkbox']").prop("disabled", true);
        select.find(".select-box").css({
            backgroundColor: "#e9ecef",
            cursor: "not-allowed"
        });
    });
}


function inicializarPaginacao(atividadeAtual) {
    //const etapaParalelo = $("#etapaParalelo").val() === "true";
    //const etapaParalelo = $("#etapaParalelo").val() === "true" || $("#etapaParalelo").val() === true;

    const configFn = paginacaoPorAtividade[atividadeAtual];
    const config = typeof configFn === "function" ? configFn() : configFn || { mostrar: false, paginas: [] };

    if (!config.mostrar) {
        $(".navegacao-formulario").hide();
        $(".pagina").show().css({
            "position": "relative",
            "opacity": "1",
            "pointer-events": "auto"
        });
        return;
    }

    $(".navegacao-formulario").show();
    //$(".bolinhas").empty();
    $(".bolinhas").html("");


    config.paginas.forEach((pagina, index) => {
        const div = $(`<div class="pagination" data-index="${index}">${pagina.nome}</div>`);
        $(".bolinhas").append(div);
    });

    //$(".pagination").click(function(){
    $(".pagination").off("click").on("click", function () {
        const indice = parseInt($(this).attr("data-index"));
        paginaAtual = indice;
        mostrarPagina(indice);
    });
    console.log("🧩 Total de páginas criadas:", config.paginas.length);
    paginaAtual = 0;
    mostrarPagina(paginaAtual);
}

const paginacaoPorAtividade = {
    0: () => ({ mostrar: false, paginas: [] }),
    5: () => ({
        mostrar: true,
        paginas: [
            { id: "pagina-1", nome: "Dados Solicitante" },
            { id: "pagina-2", nome: "Preencher para Compra" },
            { id: "pagina-9", nome: "Entrega" }
        ]
    }),
    145: () => ({
        mostrar: true,
        paginas: [
            { id: "pagina-1", nome: "Dados Solicitante" },
            { id: "pagina-4", nome: "Preencher para Envio" },
            { id: "pagina-9", nome: "Entrega" }
        ]
    }),
    52: () => ({
        mostrar: true,
        paginas: [
            { id: "pagina-1", nome: "Dados Solicitante" },
            { id: "pagina-4", nome: "Dados da TI" },
            { id: "pagina-6", nome: "Preencher Transporte" }
        ]
    }),
    58: () => ({
        mostrar: true,
        paginas: [
            { id: "pagina-1", nome: "Dados Solicitante" },
            { id: "pagina-4", nome: "Dados TI" },
            { id: "pagina-6", nome: "Dados Suprimentos" },
            { id: "pagina-10", nome: "Enviar Nota Fiscal" }
        ]
    }),


    60: () => ({
        mostrar: true,
        paginas: [
            { id: "pagina-4", nome: "Dados da TI" },
            { id: "pagina-6", nome: "Preencher Rastreio" }
        ]
    }),

    14: () => ({
        mostrar: true,
        paginas: [
            { id: "pagina-3", nome: "Dados Contabilidade" }
        ]
    }),
    25: () => ({
        mostrar: true,
        paginas: [
            { id: "pagina-3", nome: "Dados Contabilidade" },
            { id: "pagina-5", nome: "Dados Para Preencher" }
        ]
    }),
    118: () => ({
        mostrar: true,
        paginas: [
            { id: "pagina-3", nome: "Dados Compra" }
        ]
    }),
    123: () => ({
        mostrar: true,
        paginas: [
            { id: "pagina-8", nome: "Recebimento do equipamento" }
        ]
    })
};


document.addEventListener("DOMContentLoaded", () => {
    //  mostrarPagina(paginaAtual);
    document.getElementById("btn-avancar").addEventListener("click", avancarPagina);
    document.getElementById("btn-voltar").addEventListener("click", voltarPagina);
    $(document).on("click", ".pagination", function () {
        const indice = parseInt($(this).attr("data-index"));
        paginaAtual = indice;
        mostrarPagina(indice);
    });
});

let paginaAtual = 0;


function mostrarPagina(indice) {
    $(".pagination-active").removeClass("pagination-active");
    $(`.pagination[data-index="${indice}"]`).addClass("pagination-active");
    const atividadeAtual = $("#atividade").val();
    const configFn = paginacaoPorAtividade[atividadeAtual];
    const config = typeof configFn === "function" ? configFn() : configFn || { mostrar: false, paginas: [] };

    const todasPaginas = document.querySelectorAll(".pagina");
    todasPaginas.forEach(p => {
        p.classList.remove("ativa", "escondida-para-direita", "escondida-para-esquerda");
        p.style.position = "absolute";
        p.style.opacity = "0";
        p.style.pointerEvents = "none";
    });
    if (config.paginas[indice]) {
        const paginaId = config.paginas[indice].id;
        const paginaAtualElement = document.getElementById(paginaId);
        if (paginaAtualElement) {
            paginaAtualElement.classList.add("ativa");
            paginaAtualElement.style.position = "relative";
            paginaAtualElement.style.opacity = "1";
            paginaAtualElement.style.pointerEvents = "auto";
        }
    }

    $(window).scrollTop(0);
}


function avancarPagina() {
    const atividadeAtual = $("#atividade").val();
    const configFn = paginacaoPorAtividade[atividadeAtual];
    const config = typeof configFn === "function" ? configFn() : configFn || { mostrar: false, paginas: [] };

    const totalPaginas = config.paginas.length;

    if (paginaAtual < totalPaginas - 1) {
        paginaAtual++;
        mostrarPagina(paginaAtual);
    }
}

function voltarPagina() {
    if (paginaAtual > 0) {
        paginaAtual--;
        mostrarPagina(paginaAtual);
    }
}
