exports.handler = async function(event) {
  try {
    const protocolo = event.queryStringParameters?.protocolo

    if(!protocolo){
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

    if(!registro){
      return {
        statusCode: 404,
        body: JSON.stringify({
          erro: 'Registro não encontrado',
          status: 'PENDING'
        })
      }
    }

    const pagbankId = registro.pagbank_id

    if(!pagbankId){
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'PENDING',
          detalhe: 'Registro ainda não possui pagbank_id'
        })
      }
    }

    const checkoutResponse = await fetch(
      `https://api.pagseguro.com/checkouts/${pagbankId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
          Accept: 'application/json'
        }
      }
    )

    const checkoutTexto = await checkoutResponse.text()

    let checkout = {}

    try {
      checkout = JSON.parse(checkoutTexto)
    } catch {
      checkout = { raw: checkoutTexto }
    }

    if(!checkoutResponse.ok){
      return {
        statusCode: checkoutResponse.status,
        body: JSON.stringify({
          erro: 'Erro ao consultar checkout',
          detalhe: checkout,
          status: 'PENDING'
        })
      }
    }

    const orderId = checkout?.orders?.[0]?.id

    if(!orderId){
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'PENDING',
          detalhe: checkout
        })
      }
    }

    const orderResponse = await fetch(
      `https://api.pagseguro.com/orders/${orderId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
          Accept: 'application/json'
        }
      }
    )

    const orderTexto = await orderResponse.text()

    let order = {}

    try {
      order = JSON.parse(orderTexto)
    } catch {
      order = { raw: orderTexto }
    }

    if(!orderResponse.ok){
      return {
        statusCode: orderResponse.status,
        body: JSON.stringify({
          erro: 'Erro ao consultar pedido',
          checkout,
          detalhe: order,
          status: 'PENDING'
        })
      }
    }

    const charges = order?.charges || []

    let statusFinal = 'PENDING'

    const algumPagamentoAprovado = charges.some(charge =>
      charge.status === 'PAID'
    )

    if(algumPagamentoAprovado){
      statusFinal = 'PAID'
    }

    if(statusFinal === 'PAID'){
      await fetch(
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
            status_pagamento: 'pago'
          })
        }
      )
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: statusFinal,
        checkout,
        order
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