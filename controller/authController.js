const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({
    id
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

//封装
const createSendToken = (user, statusCode, res) => {
  //注册jwt唯一签名
  const token = signToken(user._id);
  const cookieOption = {
    //7天
    expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    // secure: true,
    httpOnly: true //浏览器无法通过任何形式来获取该cookie中的信息
  };

  ///把token存放在cookie中，server send to client;
  //在每次请求后都把这个cookie送到客户端
  if(process.env.node_env === 'production') {
      cookieOption.secure = true;
  }

  user.password = undefined; //不显示该password

  res.cookie('jwt', token, cookieOption);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};


exports.singUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1.check email and password exists
  if (!email || !password) {
    //400代表bad request
    return next(new AppError(`Please provide your email and password`, 400)); //交由中间件处理异常，并停止运行此函数
  }
  //2.check if user exists and password is correct
  const usr = await User.findOne({ email }).select('+password');
  // console.log(usr);
  // password是用户指定的password，而user.password则是database中存放的
  //401代表未授权
  if (!usr || !await usr.correctPassword(password, usr.password)) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //3.if ok send token to the client
  createSendToken(usr, 200, res);
});


//middleware function(保护路由)在没登陆前是不允许看tours的
exports.protect = catchAsync(async (req, res, next) => {
  //1.getting the token and check of it's there(检查是否有token存在)
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];//split：数组变字符串
    // console.log(token);
  }
  if (!token) {
    return next(new AppError('You are not logged in,Please login in to get access.', 401));
  }
  //2.verification token(检查token是否正确)
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //verify方法是异步方法
  // console.log(decode); //decode对象

  //3.check if user still exists
  //token还在但是对应的user没了，也是不行的
  const currentUser = await User.findById(decode.id);
  if (!currentUser) {
    return next(new AppError('The token belonging to this user does no longer exist', 401));
  }
  //4.check if user change password after the token was issued
  //检查密码是否在token发出去以后更新过，如果更新过则会出现相应问题
  if (currentUser.changePasswordAfter(decode.iat)) {
    return next(new AppError(`User recent change the password, please login again!`, 401));
  }
  //grant access the protected route
  req.user = currentUser; //在中间件中传递值
  next();
});


//限制用户的权限 中间件
//..运算符收集多余参数
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin', 'lead-guide'] role='user'
    //这里的role来自上一个中间件
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have the permission to perform this action',401));
    }
    next();
  };
};


exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1.get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    //404 not found
    return next(new AppError(' There is no user with that email address '), 404);
  }
  //2.generate the reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  console.log(resetToken);
  //3.send it to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forget your password? Submit a patch request with your new password and password passwordConfirm to ${resetURL} \n
     if your did not forget your password, please ignore this email
   `;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (10min内有效)',
      message
    });
    res.status(200).json({
      status: 'success',
      message: 'Token send to email!'
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was a error while sending the email,try later'), 500);
  }
});

//重置密码
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1.get user based on the token
  //在路由上的token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gte: Date.now() } }); //token一定要没过期
  //2.if token has not expired and there is user set the new password
  if (!user) {
    //bad request
    return next(new AppError('Token is invalid or has expired'), 400);
  }
  user.password = req.body.password; //post方法
  user.passwordConfirm = req.body.passwordConfirm; //重复确认密码
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3 update changepasswordat property in this current user

  //4 login the user in ,send jwt
  //这里要将token继续送出去
  //在postman中需要继续接受
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //在更新之前需要用户提供原来的密码，改密码
  //1.get user from collection
  const user = await User.findById(req.user._id).select('+password'); //选择password
  //2.check if the password is corrent
  //db中存的密码加密的密码
  //对比现在的password
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    //401代表无权限
    return next(new AppError('Your current password is wrong, you have not permission to change the password'), 401);
  }
  //3.update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); //这里如果使用findByIdAndUpdate()是不会起作用的，因为userModel的中间件无法使用了

  //4.login the user in , send jwt
  createSendToken(user, 200, res);
});

