document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("supportForm");
  const button = document.getElementById("submitButton");
  const box = document.getElementById("formMessage");

  if (!form || !button || !box) {
    console.error("Elementos do formulário de suporte não encontrados.");
    return;
  }

  const showMessage = (type, text) => {
    box.className = "rounded-xl p-4 text-sm border " + (
      type === "success"
        ? "bg-green-500/10 border-green-500/30 text-green-200"
        : "bg-red-500/10 border-red-500/30 text-red-200"
    );
    box.innerHTML = text;
    box.classList.remove("hidden");
  };

  const generateProtocol = () => {
    const now = new Date();
    const date =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");

    const random = crypto.getRandomValues(new Uint32Array(1))[0]
      .toString()
      .slice(-6)
      .padStart(6, "0");

    return `SUP-${date}-${random}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    box.classList.add("hidden");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!window.supabaseClient) {
      showMessage(
        "error",
        "A conexão com o sistema de suporte não foi carregada. Verifique o arquivo js/supabase.js."
      );
      return;
    }

    const protocolo = generateProtocol();
    const categoria = document.getElementById("categoria").value.trim();
    const assuntoBase = document.getElementById("assunto").value.trim();

    const payload = {
      protocolo,
      nome: document.getElementById("nome").value.trim(),
      email: document.getElementById("email").value.trim().toLowerCase(),
      telefone: document.getElementById("telefone").value.trim() || null,
      assunto: categoria
        ? `[${categoria}] ${assuntoBase}`.slice(0, 160)
        : assuntoBase.slice(0, 160),
      mensagem: document.getElementById("mensagem").value.trim(),
      status: "Aberto"
    };

    button.disabled = true;
    button.textContent = "Enviando...";

    try {
      const { error } = await window.supabaseClient
        .from("support_tickets")
        .insert([payload]);

      if (error) throw error;

      form.reset();
      showMessage(
        "success",
        `<strong>Solicitação enviada com sucesso!</strong><br><br>
         Seu protocolo é: <strong class="text-white">${protocolo}</strong>`
      );
    } catch (error) {
      console.error("Erro ao enviar chamado:", error);
      showMessage(
        "error",
        `Não foi possível enviar sua solicitação.<br><br>
         <strong>Detalhe:</strong> ${error.message || "erro desconhecido"}`
      );
    } finally {
      button.disabled = false;
      button.textContent = "Enviar Solicitação";
    }
  });
});
