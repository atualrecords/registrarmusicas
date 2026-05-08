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

    return {
      statusCode:200,
      body:JSON.stringify({
        status:'PAID'
      })
    }

  } catch(error){

    return {
      statusCode:500,
      body:JSON.stringify({
        erro:error.message
      })
    }

  }

}