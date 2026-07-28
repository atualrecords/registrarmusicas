document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("supportForm");
  const button = document.getElementById("submitButton");
  const box = document.getElementById("formMessage");

  if (!form || !button || !box) return;

  const show = (ok, html) => {
    box.className = "rounded-xl p-4 text-sm border " + (ok
      ? "bg-green-500/10 border-green-500/30 text-green-200"
      : "bg-red-500/10 border-red-500/30 text-red-200");
    box.innerHTML = html;
    box.classList.remove("hidden");
  };

  const protocol = () => {
    const d = new Date();
    const date = d.getFullYear().toString()
      + String(d.getMonth() + 1).padStart(2, "0")
      + String(d.getDate()).padStart(2, "0");
    const random = crypto.getRandomValues(new Uint32Array(1))[0]
      .toString().slice(-6).padStart(6, "0");
    return `SUP-${date}-${random}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    box.classList.add("hidden");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const protocolo = protocol();
    const categoria = document.getElementById("categoria").value.trim();
    const assuntoBase = document.getElementById("assunto").value.trim();

    const payload = {
      protocolo,
      nome: document.getElementById("nome").value.trim(),
      email: document.getElementById("email").value.trim().toLowerCase(),
      telefone: document.getElementById("telefone").value.trim() || null,
      assunto: categoria ? `[${categoria}] ${assuntoBase}`.slice(0, 160) : assuntoBase.slice(0, 160),
      mensagem: document.getElementById("mensagem").value.trim(),
      status: "Aberto"
    };

    button.disabled = true;
    button.textContent = "Enviando...";

    try {
      const { error: insertError } = await window.supabaseClient
        .from("support_tickets")
        .insert([payload]);

      if (insertError) throw insertError;

      const { error: emailError } = await window.supabaseClient.functions.invoke(
        "send-support-email",
        { body: payload }
      );

      form.reset();

      if (emailError) {
        console.error(emailError);
        show(true, `<strong>Solicitação enviada com sucesso!</strong><br><br>Seu protocolo é: <strong>${protocolo}</strong><br><br>O chamado foi registrado.`);
      } else {
        show(true, `<strong>Solicitação enviada com sucesso!</strong><br><br>Seu protocolo é: <strong>${protocolo}</strong><br><br>Nossa equipe recebeu a notificação.`);
      }
    } catch (error) {
      console.error(error);
      show(false, `Não foi possível enviar sua solicitação.<br><br><strong>Detalhe:</strong> ${error.message || "erro desconhecido"}`);
    } finally {
      button.disabled = false;
      button.textContent = "Enviar Solicitação";
    }
  });
});
