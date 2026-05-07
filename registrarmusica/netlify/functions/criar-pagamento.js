exports.handler = async function(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ erro: 'Método não permitido' })
      }
    }

    const dados = JSON.parse(event.body || '{}')

    const response = await fetch('https://api.pagseguro.com/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        reference_id: dados.protocolo,
        customer: {
          name: dados.nome,
          email: dados.email
        },
        items: [
          {
            name: 'Registro Autoral',
            quantity: 1,
            unit_amount: 3750
          }
        ],
        redirect_url: `https://registrarmusicas.netlify.app/verificar.html?protocolo=${dados.protocolo}`
      })
    })

    const texto = await response.text()

    let pagamento

    try {
      pagamento = JSON.parse(texto)
    } catch {
      pagamento = { resposta_bruta: texto }
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          erro: 'Erro ao criar pagamento no PagBank',
          detalhe: pagamento
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ pagamento })
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: error.message })
    }
  }
}