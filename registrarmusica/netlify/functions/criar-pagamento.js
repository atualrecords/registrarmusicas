exports.handler = async function(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ erro: 'Método não permitido' })
      }
    }

    const dados = JSON.parse(event.body || '{}')

    const protocolo = dados.protocolo
    const handle = process.env.INFINITEPAY_HANDLE || 'eval-da-2c1'

    if (!protocolo) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erro: 'Protocolo não informado' })
      }
    }

    const payload = {
      handle: handle,
      order_nsu: protocolo,
      items: [
        {
          quantity: 1,
          price: 3750,
          description: 'Registro Autoral Digital'
        }
      ],
      redirect_url:
        `https://registrodemusica.netlify.app/verificar.html?protocolo=${encodeURIComponent(protocolo)}`,
      webhook_url:
        `https://registrodemusica.netlify.app/.netlify/functions/infinitepay-webhook`
    }

    const response = await fetch(
      'https://api.checkout.infinitepay.io/links',
      {
        method: 'POST',
        headers: {
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
          erro: 'Erro ao criar pagamento na InfinitePay',
          status: response.status,
          detalhe: resposta,
          payload_enviado: payload
        })
      }
    }

    const linkPagamento =
      resposta.url ||
      resposta.link ||
      resposta.checkout_url ||
      resposta.payment_url ||
      resposta.invoice_url ||
      resposta?.data?.url ||
      resposta?.data?.link ||
      resposta?.data?.checkout_url ||
      null

    return {
      statusCode: 200,
      body: JSON.stringify({
        pagamento: {
          ...resposta,
          id: resposta.slug || resposta.id || protocolo,
          reference_id: protocolo,
          order_nsu: protocolo,
          url: linkPagamento,
          checkout_url: linkPagamento,
          payment_url: linkPagamento
        }
      })
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: error.message })
    }
  }
}