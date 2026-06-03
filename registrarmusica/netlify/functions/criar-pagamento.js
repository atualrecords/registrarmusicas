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

    const handle = process.env.INFINITEPAY_HANDLE || 'eval-da-2c1'
    const protocolo = dados.protocolo
    const nome = dados.nome || 'Cliente Registrar Agora'
    const email = dados.email || ''
    const whatsapp = dados.whatsapp || ''

    if (!protocolo) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          erro: 'Protocolo não informado'
        })
      }
    }

    const baseUrl = 'https://registrodemusica.netlify.app'

    const payload = {
      handle: handle,

      order_nsu: protocolo,

      items: [
        {
          quantity: 1,
          price: 3750,
          description: 'Registro Autoral Digital - Registrar Agora'
        }
      ],

      customer: {
        name: nome,
        email: email,
        phone_number: whatsapp
      },

      redirect_url:
        `${baseUrl}/verificar.html?protocolo=${encodeURIComponent(protocolo)}`,

      webhook_url:
        `${baseUrl}/.netlify/functions/infinitepay-webhook`
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
      console.log('STATUS INFINITEPAY:', response.status)
      console.log('RESPOSTA INFINITEPAY:', texto)

      return {
        statusCode: response.status,
        body: JSON.stringify({
          erro: 'Erro ao criar pagamento na InfinitePay',
          status: response.status,
          detalhe: resposta
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
      resposta?.data?.payment_url ||
      resposta?.data?.invoice_url ||
      null

    if (!linkPagamento) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          erro: 'Pagamento criado, mas o link não foi encontrado',
          detalhe: resposta
        })
      }
    }

    const pagamento = {
      ...resposta,
      id: resposta.slug || resposta.invoice_slug || resposta.id || protocolo,
      reference_id: protocolo,
      order_nsu: protocolo,
      url: linkPagamento,
      checkout_url: linkPagamento,
      payment_url: linkPagamento
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        pagamento: pagamento
      })
    }

  } catch (error) {
    console.log('ERRO INTERNO:', error.message)

    return {
      statusCode: 500,
      body: JSON.stringify({
        erro: error.message
      })
    }
  }
}