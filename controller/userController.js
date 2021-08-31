const AppError = require('../utils/appError');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const  { deleteOne, updateOne, getOne, getAll} = factory;

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//middleware express
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; //把当前登陆的user的id放在请求参数
  next();
}

//用户自己修改自己的信息
exports.updateMe = catchAsync(async (req, res, next) => {
  //1.create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    //400 bad request
    return next(new AppError(`this is route is not provided for updating password, please use updateMyPassword route!`, 400));
  }
  //2.update user document
  //中间件
  //注意此时交由更改的req.body,里面只能包含name和email
  const filterBody = filterObj(req.body, 'name', 'email');
  const updateUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser
    }
  });
});


exports.deleteMe = catchAsync(async (req, res, next) => {
  //并没有删除mongodb中的数据只是把该用户标记为active:false
  await User.findByIdAndUpdate(req.user.id,{
    active: false
  });

  //201代表删除
  //删除不改变什么data
  res.status(201).json({
    status:"success",
    data: null
  });

});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined, please use /singup instead'
  });
};


exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
//administrator
//don't updatePassword with this
exports.updateUser =  updateOne(User);

exports.deleteUser = deleteOne(User);

