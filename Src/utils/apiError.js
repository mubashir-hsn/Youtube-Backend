class apiError extends Error{
    constructor(
        statusCode,
        message="Somethind went wrong",
        errors=[],
        stack =''
    ){
        super();
        this.message = message
        this.errors = errors
        this.statusCode = statusCode
        this.data = 
        this.success = false
        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {apiError}