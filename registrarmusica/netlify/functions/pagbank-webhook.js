exports.handler = async function(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ erro: 'Método não permitido' })
      }
    }

    const payload = JSON.parse(event.body || '{}')

    console.log('WEBHOOK PAGBANK:', JSON.stringify(payload))

    return {
      statusCode: 200,
      body: JSON.stringify({
        recebido: true,
        mensagem: 'Webhook recebido com sucesso'
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