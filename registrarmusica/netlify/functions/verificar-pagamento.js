exports.handler = async function(event) {
  try {
    const protocolo = event.queryStringParameters?.protocolo

    const transaction_nsu =
      event.queryStringParameters?.transaction_nsu || null

    const slug =
      event.queryStringParameters?.slug ||
      event.queryStringParameters?.invoice_slug ||
      null

    if (!protocolo) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          erro: 'Protocolo não informado',
          status: 'PENDING'
        })
      }
    }

    const supabaseResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/registros?protocolo=eq.${encodeURIComponent(protocolo)}&select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    )

    const registros = await supabaseResponse.json()
    const registro = registros?.[0]

    if (!registro) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          erro: 'Registro não encontrado',
          status: 'PENDING'
        })
      }
    }

    if (registro.status_pagamento === 'pago') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'PAID',
          origem: 'supabase'
        })
      }
    }

    if (!transaction_nsu || !slug) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'PENDING',
          detalhe: 'Aguardando confirmação da InfinitePay'
        })
      }
    }

    const handle = process.env.INFINITEPAY_HANDLE || 'eval-da-2c1'

    const checkPayload = {
      handle: handle,
      order_nsu: protocolo,
      transaction_nsu: transaction_nsu,
      slug: slug
    }

    const checkResponse = await fetch(
      'https://api.checkout.infinitepay.io/payment_check',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(checkPayload)
      }
    )

    const checkTexto = await checkResponse.text()

    let check = {}

    try {
      check = JSON.parse(checkTexto)
    } catch {
      check = { raw: checkTexto }
    }

    if (!checkResponse.ok) {
      return {
        statusCode: checkResponse.status,
        body: JSON.stringify({
          erro: 'Erro ao consultar pagamento InfinitePay',
          detalhe: check,
          status: 'PENDING'
        })
      }
    }

    const pago =
      check.success === true &&
      (
        check.paid === true ||
        Number(check.paid_amount || 0) > 0
      )

    if (pago) {
      const atualizarResponse = await fetch(
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

      if (!atualizarResponse.ok) {
        const erroAtualizar = await atualizarResponse.text()

        return {
          statusCode: 500,
          body: JSON.stringify({
            erro: 'Pagamento aprovado, mas erro ao atualizar Supabase',
            detalhe: erroAtualizar,
            status: 'PENDING'
          })
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: pago ? 'PAID' : 'PENDING',
        infinitepay: check
      })
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        erro: error.message,
        status: 'PENDING'
      })
    }
  }
}