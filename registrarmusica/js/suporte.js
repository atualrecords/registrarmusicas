// ==========================================================
// REGISTRAR AGORA
// Envio de solicitações de suporte
// ==========================================================

document.addEventListener("DOMContentLoaded", function () {
    const formulario = document.getElementById("supportForm");
    const botaoEnviar = document.getElementById("submitButton");
    const mensagemRetorno = document.getElementById("formMessage");

    if (!formulario) {
        console.error("Formulário de suporte não encontrado.");
        return;
    }

    function mostrarMensagem(tipo, conteudo) {
        mensagemRetorno.classList.remove(
            "hidden",
            "bg-green-500/10",
            "border-green-500/30",
            "text-green-200",
            "bg-red-500/10",
            "border-red-500/30",
            "text-red-200"
        );

        mensagemRetorno.classList.add(
            "border",
            "rounded-xl",
            "p-4",
            "text-sm"
        );

        if (tipo === "sucesso") {
            mensagemRetorno.classList.add(
                "bg-green-500/10",
                "border-green-500/30",
                "text-green-200"
            );
        } else {
            mensagemRetorno.classList.add(
                "bg-red-500/10",
                "border-red-500/30",
                "text-red-200"
            );
        }

        mensagemRetorno.innerHTML = conteudo;
    }

    function alterarCarregamento(ativo) {
        botaoEnviar.disabled = ativo;
        botaoEnviar.textContent = ativo
            ? "Enviando solicitação..."
            : "Enviar Solicitação";

        botaoEnviar.classList.toggle("opacity-60", ativo);
        botaoEnviar.classList.toggle("cursor-not-allowed", ativo);
    }

    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        mensagemRetorno.classList.add("hidden");

        if (!formulario.checkValidity()) {
            formulario.reportValidity();
            return;
        }

        const nome = document.getElementById("nome").value.trim();
        const email = document
            .getElementById("email")
            .value
            .trim()
            .toLowerCase();

        const telefone = document
            .getElementById("telefone")
            .value
            .trim();

        const categoria = document
            .getElementById("categoria")
            .value
            .trim();

        const assuntoInformado = document
            .getElementById("assunto")
            .value
            .trim();

        const mensagem = document
            .getElementById("mensagem")
            .value
            .trim();

        if (nome.length < 2) {
            mostrarMensagem(
                "erro",
                "Informe seu nome completo."
            );
            return;
        }

        if (assuntoInformado.length < 3) {
            mostrarMensagem(
                "erro",
                "Informe um assunto com pelo menos 3 caracteres."
            );
            return;
        }

        if (mensagem.length < 10) {
            mostrarMensagem(
                "erro",
                "Descreva o problema com pelo menos 10 caracteres."
            );
            return;
        }

        const protocolo = window.gerarProtocolo("SUP");

        const assunto = categoria
            ? `[${categoria}] ${assuntoInformado}`.slice(0, 160)
            : assuntoInformado.slice(0, 160);

        const chamado = {
            protocolo: protocolo,
            nome: nome,
            email: email,
            telefone: telefone || null,
            assunto: assunto,
            mensagem: mensagem,
            status: "Aberto"
        };

        alterarCarregamento(true);

        try {
            const { error } = await window.supabase
                .from("support_tickets")
                .insert(chamado);

            if (error) {
                throw error;
            }

            formulario.reset();

            mostrarMensagem(
                "sucesso",
                `
                <strong>Solicitação enviada com sucesso!</strong>
                <br><br>
                Seu protocolo é:
                <strong class="text-white">${protocolo}</strong>
                <br><br>
                Guarde esse número. Nossa equipe responderá pelo e-mail informado.
                `
            );
        } catch (erro) {
            console.error("Erro ao enviar solicitação:", erro);

            mostrarMensagem(
                "erro",
                `
                Não foi possível enviar sua solicitação neste momento.
                Verifique os dados e tente novamente.
                `
            );
        } finally {
            alterarCarregamento(false);
        }
    });
});