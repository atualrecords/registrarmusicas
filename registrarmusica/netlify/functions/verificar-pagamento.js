exports.handler = async function(event) {
  try {
    const protocolo = event.queryStringParameters?.protocolo

    if(!protocolo){
      return {
        statusCode: 400,
        body: JSON.stringify({
          erro: 'Protocolo não informado'
        })
      }
    }

    const response = await fetch(
      `https://sandbox.api.pagseguro.com/checkouts?reference_id=${encodeURIComponent(protocolo)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
          Accept: 'application/json'
        }
      }
    )

    const texto = await response.text()

    let resposta = {}

    try {
      resposta = JSON.parse(texto)
    } catch {
      resposta = { raw: texto }
    }

    if(!response.ok){
      return {
        statusCode: response.status,
        body: JSON.stringify({
          erro: 'Erro ao consultar pagamento no PagBank',
          detalhe: resposta,
          status: 'PENDING'
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: resposta.status || resposta.payment_status || 'PENDING',
        detalhe: resposta
      })
    }

  } catch(error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        erro: error.message,
        status: 'PENDING'
      })
    }
  }
}