const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandle = require('./controller/errorController');


const app = express();

//设置模版引擎为pug
// app.set('view engine', 'pug');
// app.set('views', path.join(__dirname, 'views'));

//serving static files (静态文件路由)
//静态文件在public文件下
//localhost:3000/css/style.css
app.use(express.static(path.join(__dirname, 'public')));

//set security http headers
app.use(helmet());

//检查开发环境
//development logging
if (process.env.NODE_ENV === 'development') {
  //使用Morgan中间件 控制台打印请求信息
  app.use(morgan('dev'));
}

//global middleware
//全局中间件
//code:429 too many request error code
//limit request from the same ip
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //1h最多100次请求
  message: 'too many request from this ip, please try again an hour later'
});

//让这个中间件只作用于api路由
app.use('/api', limiter);

//中间中间件
//使用 middlwear(中间件)use，将某个中间件加到middleware stack中
//body parser(该中间件用于解析req.body中的数据) 下面中的事例代表如果超出了10kb，则请求不会被接受
app.use(express.json({ limit: '10kb' }));

//data sanitization against nosql query injection
app.use(mongoSanitize()); //检查req.body req.params req.query 去过滤出$

//data sanitization against xss attack
app.use(xss()); //防止用户输入插入不良javascript脚本,会将比如<div>变为&lt;div>

//prevent http params pollution //防止req.params字段重复甚至导致污染
app.use(hpp({
  //这里我们只允许params:duration重复
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'price',
    'difficulty'
  ]
}));


//在每次请求中都会一次调用中间件
//自己创建的middleware
//our test middleware
app.use((req, res, next) => {
  console.log('hello from the middleware 👋');
  //在中间件中别忘记在最后调用next方法
  // console.log(x); //中间件中出现bug，则默认被globalHandler抓捕
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});


//路由
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//所有method的http请求
//最后走这条路注意，到这里证明前面的都没有被匹配上，就代表请求是错误的
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //    status:'failed',
  //    message:`can't find ${req.originalUrl} on this server!`
  // })
  // const err = new Error(`Can't find ${req.originalUrl} in this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err); //跳到中间件
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
//分析错误的error handler(中间件)
app.use(globalErrorHandle);


//路由导入静态文件
module.exports = app;





