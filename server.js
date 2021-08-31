//服务器主文件
const dotenv = require('dotenv');
const mongoose = require('mongoose');

//我们在sync方法中没有捕捉到的错误，运行是会发生的错误
//UncaughtException
//这个一定要放在整个server的顶端(开始监听错误)
process.on('uncaughtException',err => {
   console.log('UNCAUGHT EXCEPTION ! 😌 Shutting down...');
   console.log(err.name,err.message);
   console.log(err);
   process.exit(1);
});

//读取配置文件,一定要在app前读取配置文件，否则app将无法获取环境变量
dotenv.config({
   path:'./config.env'
});
const app = require('./index');
// console.log(app.get('env')); //development
// console.log(process.env);
const db = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)

mongoose.connect(db, {
   useNewUrlParser: true,
   useCreateIndex: true,
   useUnifiedTopology: false
}).then(() => {
   console.log('connect successful!!')
});


//new document
// const testTour = new Tour({
//    name:"The Park Camper",
//    price:997
// });

// //保存到数据库
// testTour.save().then((doc) => {
//    console.log(doc);
//    console.log('save successful');
// }).catch((e) => {
//    console.log(`error:${e}`)
// });

// mongoose.connect(process.env.DATABASE_LOCAL, {
//    useNewUrlParser: true,
//    useCreateIndex: true,
//    useUnifiedTopology: false
// }).then(() => {
//    console.log('connect successful!!');
// }

// console.log(process.env);//打印环境变量值

const port = process.env.PORT || 3000;
const server = app.listen(port,() => {
   console.log(`listening to the port ${port}`);
});

//其他情况的error无法追踪的时候使用
//没有被catch的
process.on('unhandledRejection',err => {
   console.log(err.name,err.message);
   console.log('UNHANDLER REJECTION ! 😌 Shutting down...');
   server.close(() => {
      process.exit(1);
   });
});

// console.log(`server loading...`);

