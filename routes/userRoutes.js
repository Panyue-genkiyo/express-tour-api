const express = require('express');
const userController = require('./../controller/userController');
const authController = require('./../controller/authController');
const userRouter = express.Router();

const { deleteUser, createUser, getUser, getAllUsers, updateUser, updateMe, deleteMe, getMe } = userController;
const { singUp, login, forgetPassword, resetPassword, updatePassword, protect,restrictTo } = authController;

//注册用户
userRouter.post('/sginup', singUp);
userRouter.post('/login', login); //登陆也是post

userRouter.post('/forgetPassword', forgetPassword);
userRouter.patch('/resetPassword/:token', resetPassword);

userRouter.use(protect); //在这条语句下面所有路由将会得到保护
//在这些的路由之前使用protect中间件

userRouter.patch('/updateMyPassword', updatePassword);
userRouter.patch('/updateMe', updateMe);
userRouter.delete('/deleteMe', deleteMe);

userRouter.use(restrictTo('admin')); //only admin 可以查看user,添加user

userRouter.route('/')
  .get(getAllUsers)
  .post(createUser);
userRouter.get('/me', getMe, getUser);
userRouter.route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);


module.exports = userRouter;
