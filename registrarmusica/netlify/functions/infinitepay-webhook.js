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

    const payload = JSON.parse(event.body || '{}')

    console.log('WEBHOOK INFINITEPAY:', JSON.stringify(payload))

    const protocolo = payload.order_nsu
    const transaction_nsu = payload.transaction_nsu || null
    const slug = payload.invoice_slug || payload.slug || null
    const receipt_url = payload.receipt_url || null
    const capture_method = payload.capture_method || null

    if (!protocolo) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          erro: 'order_nsu não informado no webhook'
        })
      }
    }

    const pago =
      payload.paid === true ||
      Number(payload.paid_amount || 0) > 0

    if (pago) {
      const respostaSupabase = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/registros?protocolo=eq.${encodeURIComponent(protocolo)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            status_pagamento: 'pago',
            pagbank_id: slug || transaction_nsu || protocolo
          })
        }
      )

      if (!respostaSupabase.ok) {
        const textoErro = await respostaSupabase.text()

        console.log('ERRO AO ATUALIZAR SUPABASE:', textoErro)

        return {
          statusCode: 500,
          body: JSON.stringify({
            erro: 'Erro ao atualizar registro no Supabase',
            detalhe: textoErro
          })
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        recebido: true,
        pago,
        protocolo,
        transaction_nsu,
        slug,
        receipt_url,
        capture_method
      })
    }

  } catch (error) {
    console.log('ERRO WEBHOOK INFINITEPAY:', error.message)

    return {
      statusCode: 500,
      body: JSON.stringify({
        erro: error.message
      })
    }
  }
}