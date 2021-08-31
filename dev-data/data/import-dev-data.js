const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs'); //file system module
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Reviews = require('../../models/reviewModel');


dotenv.config({
  //.始终代表根目录在node js当中
  path: './config.env'
});
console.log(process.env);
const db = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(db, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: false
}).then(() => {
  console.log('connect success');
});

//read json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')); //把json转换javascript普通对象
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

//import the data to db;
const importData = async () => {
  try {
    await Tour.create(tours); //也可以接收一个含有文档对象的数组
    await User.create(users, { validateBeforeSave: false });
    await Reviews.create(reviews);
    console.log('data successfully loaded');
    process.exit();
  } catch (e) {
    console.log(e);
  }
};

//delete all data from db
const deleteData = async () => {
  try {
    await Tour.deleteMany(); //自动删除数据库中所有的文档
    await User.deleteMany();
    await Reviews.deleteMany();
    console.log('data successfully deleted');
    process.exit();
  } catch (e) {
    console.log(e);
  }
};

//利用命令行参数
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);

