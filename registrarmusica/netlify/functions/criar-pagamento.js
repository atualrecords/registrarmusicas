exports.handler = async function(event) {
  try {

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({
          erro: 'Método não permitido'
        })
      }
    }

    const dados = JSON.parse(event.body || '{}')

    const payload = {
      reference_id: dados.protocolo,

      customer: {
        name: dados.nome,
        email: dados.email
      },

      items: [
        {
          reference_id: dados.protocolo,
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
        `https://registrodemusica.netlify.app/verificar.html?protocolo=${dados.protocolo}`
    }

    // PRODUÇÃO
    const response = await fetch(
      'https://api.pagseguro.com/checkouts',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },

        body: JSON.stringify(payload)
      }
    )

    const texto = await response.text()

    let resposta = {}

    try {
      resposta = JSON.parse(texto)
    } catch {
      resposta = { raw: texto }
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          erro: 'Erro ao criar pagamento no PagBank',
          status: response.status,
          detalhe: resposta
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        pagamento: resposta
      })
    }

  } catch (error) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        erro: error.message
      })
    }

  }
}