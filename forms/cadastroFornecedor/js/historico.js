
// RETORNA A ORDEM DA ETAPA COM BASE NO NOME DA ATIVIDADE.
function _ordemAtividadeHist(nome) {
    nome = (nome || "").trim();
    for (var i = 0; i < ETAPAS.length; i++) {
        if (ETAPAS[i].rotulo === nome) return i + 1;
    }
    return 0;
}

// BUSCA O NOME DO USUÁRIO ATRAVÉS DA MATRÍCULA NO DATASET.
function BuscaNomeUsuario(usuario) {
    try {
        var ds = DatasetFactory.getDataset("colleague", null, [
            DatasetFactory.createConstraint("colleagueId", usuario, usuario, ConstraintType.MUST)
        ], null);
        if (ds && ds.values && ds.values.length > 0) {
            return ds.values[0].colleagueName || usuario;
        }
    } catch (e) {}
    return usuario;
}

// LÊ E RETORNA AS LINHAS DO HISTÓRICO DO FORMULÁRIO.
function getLinhasHistorico() {
    var retorno = [];

    $("#tableHistorico tbody tr").each(function () {
        var usuario = $(this).find(".tableHistoricoUsuario").val();
        if (!usuario) return; // pula a linha-modelo vazia

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

// GERA O HTML DE UM CARD COM AS INFORMAÇÕES DO HISTÓRICO.
function geraHtmlHistorico(linha) {
    var DATA = linha.DATA ? linha.DATA.split(" ") : ["", ""];
    if (DATA[0]) {
        DATA = DATA[0].split("-").reverse().join("/") + " " + (DATA[1] || "");
    } else {
        DATA = "";
    }

    var textoObs = (linha.OBSERVACAO || "").replace(/^(<br\s*\/?>|\s)*/gi, "").trim();

    var _ordAtual = _ordemAtividadeHist(linha.ATIVIDADE);
    var _ordProx = _ordemAtividadeHist(linha.PROXIMA_ATIVIDADE);
    var _acao = (linha.ACAO || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    var _negativoTxt = _acao.indexOf("reprov") !== -1 || _acao.indexOf("devolv") !== -1 ||
                       _acao.indexOf("corrig") !== -1 || _acao.indexOf("correcao") !== -1;
    var _positivoTxt = _acao.indexOf("aprov") !== -1 || _acao.indexOf("enviar") !== -1 || _acao.indexOf("reenvio") !== -1;

    var borda = "";
    if (_ordAtual && _ordProx && _ordProx < _ordAtual) borda = "border:solid 1px red;";
    else if (_ordAtual && _ordProx && _ordProx > _ordAtual) borda = "border:solid 1px green;";
    else if (_negativoTxt) borda = "border:solid 1px red;";
    else if (_positivoTxt) borda = "border:solid 1px green;";

    var proxima = linha.PROXIMA_ATIVIDADE
        ? '<i class="flaticon flaticon-arrow-right icon-xs" aria-hidden="true"></i> <small>' + linha.PROXIMA_ATIVIDADE + '</small>'
        : '';

    return '' +
        '<div class="card">' +
        '  <div class="card-body" style="' + borda + '">' +
        '    <div style="display:flex;">' +
        '      <div class="divImageUser" style="margin-right:20px;"></div>' +
        '      <div>' +
        '        <h3 class="card-title" style="margin-bottom:0px; color:black;">' + BuscaNomeUsuario(linha.USUARIO) +
        '          <small>' + (linha.ATIVIDADE || "") + '</small> ' + proxima +
        '        </h3>' +
        '        <small>' + DATA + '</small>' +
        '        <p class="card-text">' + (textoObs ? textoObs : (linha.ACAO || "")) + '</p>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>';
}

// BUSCA A IMAGEM DO USUÁRIO
function promiseBuscaImagemUsuario(usuario) {
    return fetch("/api/public/social/image/" + usuario)
        .then(function (res) { return res.blob(); })
        .then(function (blob) {
            var img = new Image();
            img.width = 60;
            img.height = 60;
            img.src = URL.createObjectURL(blob);
            img.classList.add("userImage");
            return img;
        });
}

// MONTA A LINHA DO TEMPO COM AS MOVIMENTAÇÕES DO PROCESSO.
async function asyncMontaHistorico() {
    var $div = $("#divLinhasHistorico");
    if (!$div.length) return;
    $div.empty();

    var linhasHistorico = getLinhasHistorico();

    if (!linhasHistorico.length) {
        $div.html(
            '<div style="padding:24px;text-align:center;color:#999;font-size:13px;border:1px dashed #ddd;border-radius:4px;background:#F7F8FA;">' +
            '<i class="flaticon flaticon-clock icon-md" style="display:block;font-size:32px;color:#bbb;margin-bottom:8px;"></i>' +
            'Nenhuma movimentação registrada até o momento.' +
            '</div>'
        );
        return;
    }

    var _atividadeAtualNome = nomeEtapaPorEstado(parseInt($("#atividade").val()) || 0);
    for (var i = 0; i < linhasHistorico.length; i++) {
        if (!linhasHistorico[i].PROXIMA_ATIVIDADE) {
            linhasHistorico[i].PROXIMA_ATIVIDADE =
                (linhasHistorico[i + 1] && linhasHistorico[i + 1].ATIVIDADE) ||
                (i === linhasHistorico.length - 1 ? _atividadeAtualNome : "");
        }
    }

    linhasHistorico = linhasHistorico.reverse(); // mais recente no topo

    for (var j = 0; j < linhasHistorico.length; j++) {
        var linha = linhasHistorico[j];
        $div.append(geraHtmlHistorico(linha));
        try {
            $(".divImageUser:last").append(await promiseBuscaImagemUsuario(linha.USUARIO));
        } catch (err) {
            console.warn("Não foi possível carregar imagem do usuário:", linha.USUARIO, err);
        }
    }
}
