exports.handler = async function(event) {

  try {

    const protocolo =
      event.queryStringParameters?.protocolo

    if(!protocolo){

      return {
        statusCode:400,
        body:JSON.stringify({
          erro:'Protocolo não informado'
        })
      }
    }

    const supabaseResponse =
      await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/registros?protocolo=eq.${encodeURIComponent(protocolo)}&select=*`,
        {
          headers:{
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      )

    const registros =
      await supabaseResponse.json()

    const registro =
      registros?.[0]

    if(!registro){

      return {
        statusCode:404,
        body:JSON.stringify({
          erro:'Registro não encontrado'
        })
      }
    }

    const pagbankId =
      registro.pagbank_id

    if(!pagbankId){

      return {
        statusCode:200,
        body:JSON.stringify({
          status:'PENDING'
        })
      }
    }

    const response =
      await fetch(
        `https://sandbox.api.pagseguro.com/checkouts/${pagbankId}`,
        {
          method:'GET',

          headers:{
            Authorization:`Bearer ${process.env.PAGBANK_TOKEN}`,
            Accept:'application/json'
          }
        }
      )

    const texto =
      await response.text()

    let resposta = {}

    try{
      resposta = JSON.parse(texto)
    }catch{
      resposta = { raw:texto }
    }

    if(!response.ok){

      return {
        statusCode:response.status,
        body:JSON.stringify({
          erro:'Erro ao consultar checkout',
          detalhe:resposta,
          status:'PENDING'
        })
      }
    }

    const charges =
      resposta?.charges || []

    let statusFinal = 'PENDING'

    if(charges.length > 0){

      const charge =
        charges[0]

      if(
        charge.status === 'PAID' ||
        charge.status === 'AUTHORIZED'
      ){
        statusFinal = 'PAID'
      }
    }

    return {
      statusCode:200,
      body:JSON.stringify({
        status: statusFinal,
        detalhe: resposta
      })
    }

  } catch(error){

    return {
      statusCode:500,
      body:JSON.stringify({
        erro:error.message,
        status:'PENDING'
      })
    }

  }

}