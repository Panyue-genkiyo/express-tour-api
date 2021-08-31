class AppError extends Error{
    constructor(msg,statusCode) {
      super(msg);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail':'error';
      this.isOptional = true;
      Error.captureStackTrace(this,this.constructor);
    }
}

//导出
module.exports = AppError;
