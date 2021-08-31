const AppError = require("../utils/appError");
//开发环境
const sendErrorDev = (err,res) => {
  res.status(err.statusCode).send({
    status:err.status,
    error:err,
    message:err.message,
    stack:err.stack,
  });
}


//线上环境
const sendErrorProd = (err, res) => {
  //trust error,send message to client
  if(err.isOptional) {
    res.status(err.statusCode).send({
      status: err.status,
      message: err.message,
    });
  }else{
    //program error or other unknown error, don't leak error details
    //服务器的内部错误(例如代码出现问题)，此时我们并不想让client知道这些错误来自哪里
    //log error;
    console.error('ERROR 🤯 ',err);
    res.status(500).json({
      status:'error',
      message: 'Something went very wrong!'
    })
  }
}

const handleCastErrorDB = (err) => {
   const message = `Invalid ${err.path} : ${err.value}`;
   return new AppError(message,400); //把mongo的error转换为我们自己的error
}

const handDuplicateFieldsDB = (err) => {
  console.log(err);
  // const {name} = err.keyValue;
  //Object.keys()获取对象中所有的key
  // console.log(X);
  const message = `Duplicate field ${Object.keys(err.keyValue)},please use an another value!`;
  return new AppError(message,400);
}

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  console.log(errors);
  //join将数组转换为字符串
  return new AppError(`${errors.join('. ')}`,400);
}

//未授权
const handleJWTError = () => new AppError('Invalid token,please log in again',401);

const handleJWTTokenExpiredError = () => new AppError(`Your token has expired! Please log in again! `,401)

module.exports = (err,req,res,next) =>{
  // console.log(err.stack); //告诉我们错误在哪里
  err.statusCode =  err.statusCode || 500; //500 服务器内部错误
  err.status = err.status || 'error';

  if(process.env.NODE_ENV === 'development'){
    //开发环境
    console.log(err.name);
    sendErrorDev(err,res);
  }else if(process.env.NODE_ENV === 'production'){
    //生产环境
    console.log(err.message);
    let error = {
       ...err,
      message:err.message
    }
    console.log(error);
    if(err.name === 'CastError') {
      error = handleCastErrorDB(error);
    }else if(err.code === 11000){
      error = handDuplicateFieldsDB(error);
    }else if(err.name === 'ValidationError'){
      error = handleValidationErrorDB(error);
    }else if(err.name === 'JsonWebTokenError'){
      error = handleJWTError();
    }else if(err.name === 'TokenExpiredError'){
      //处理TokenExpiredError错误(token过期)
      error = handleJWTTokenExpiredError();
    }
    sendErrorProd(error,res);
  }
}
