// CEP
function buscarCep(cep) {
    $.ajax({
        url: "https://viacep.com.br/ws/" + cep + "/json/",
        method: "GET",
        dataType: "json",
        success: function(data) {
            if (data.erro) {
                FLUIGC.toast({
                    message: "CEP não encontrado.",
                    type: "danger"
                });

                limpaCamposEndereco();
                return;
            }

            preencherEndereco(data);
        },
        error: function() {
            FLUIGC.toast({
                message: "Erro ao buscar CEP.",
                type: "danger"
            });

            limpaCamposEndereco();
        }
    });
}
function preencherEndereco(data) {
    $("#endereco").val(data.logradouro || "");
    $("#bairro").val(data.bairro || "");
    $("#cidade").val(data.localidade || "");
    $("#estado").val(data.uf || "");
    $("#pais").val("Brasil");

    limparErroCampo("cep");
    limparErroCampo("endereco");
    limparErroCampo("bairro");
    limparErroCampo("cidade");
    limparErroCampo("estado");
    limparErroCampo("pais");

    $("#numero").focus();
}
function limpaCamposEndereco() {
    $("#endereco").val("");
    $("#bairro").val("");
    $("#cidade").val("");
    $("#estado").val("");
    $("#pais").val("");
    $("#numero").val("");
}

// CONSULTA EXTERNA DE IMAGEM DE USUÁRIO FLUIG
function promiseBuscaImagemUsuario(usuario) {
return fetch("/api/public/social/image/" + usuario)
    .then(res => res.blob())
    .then(blob => {
        const img = new Image();
        img.width = 60;
        img.height = 60;
        img.src = URL.createObjectURL(blob);
        img.classList.add("userImage");
        return img;
    });
}