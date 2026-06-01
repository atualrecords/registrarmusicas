exports.handler = async function() {
  const protocolo = 'LOG-SANDBOX-' + Date.now()

  const payload = {
    reference_id: protocolo,
    customer: {
      name: 'Cliente Teste',
      email: 'cliente.teste@email.com'
    },
    items: [
      {
        reference_id: protocolo,
        name: 'Registro Autoral',
        quantity: 1,
        unit_amount: 3750
      }
    ],
    payment_methods: [
      { type: 'PIX' },
      { type: 'CREDIT_CARD' },
      { type: 'BOLETO' }
    ],
    redirect_url:
      'https://registrodemusica.netlify.app/verificar.html?protocolo=' + protocolo
  }

  const response = await fetch(
    'https://sandbox.api.pagseguro.com/checkouts',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAGBANK_SANDBOX_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    }
  )

  const texto = await response.text()

  let resposta
  try {
    resposta = JSON.parse(texto)
  } catch {
    resposta = { raw: texto }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    },
    body:
`LOG DE TESTE SANDBOX - PAGBANK

URL DA APLICAÇÃO:
https://registrodemusica.netlify.app

ENDPOINT:
POST https://sandbox.api.pagseguro.com/checkouts

MEIOS DE PAGAMENTO UTILIZADOS:
PIX
CREDIT_CARD
BOLETO

REQUEST:
${JSON.stringify(payload, null, 2)}

RESPONSE HTTP STATUS:
${response.status}

RESPONSE:
${JSON.stringify(resposta, null, 2)}
`
  }
}