class Apiresponse {
    constructor(
        statusCode,
        data,
        success ,
        message= "Suscces"
    ){
        this.data = data
        this.statusCode = statusCode
        this.message = message
       this.success = success
    }
}