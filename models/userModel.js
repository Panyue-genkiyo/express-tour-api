const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); //build in node module node模块自己存在的

//name,email,photo,password,passwordConfirm,passwordChangedAt
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user' //default 默认为普通用户
  },
  email: {
    //email必须是独一无二的
    type: String,
    required: [true, 'Please provide us your email'],
    unique: true,
    lowercase: true, //转换为小写
    //检查是否是email
    validate: [validator.isEmail, 'please provide a valid email']
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false //在被查找时是不会显示出来的
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //this only works on save（create a new user）（在修改时并不起作用）
      validator: function(el) {
        //用this。这里不能用arrow function
        return el === this.password; //验证
      },
      message: 'Password are not the same!!'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});


//在保存到database之前
//mongoose中间件
userSchema.pre('save', async function(next) {
  //只有在密码真正改变的时候才会运行这个加密算法来更新密码
  if (!this.isModified('password')) {
    return next();
  }
  //await
  //加盐算法
  this.password = await bcrypt.hash(this.password, 12);
  //delete confirm password fields
  //在验证成功后我们并不需要这个字段了(设置为undefined就好了)
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  //如果该文档没有改变密码字段或者这个文档是新加的，我就不改变passwordChangedAt字段
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //时间戳
  //为什么减一，防止token的产生时间在passwordChangedAt之前，以至于用户不能使用最新的token去登陆
  next();
});

//mongoose query 中间件
//find findOne
userSchema.pre(/^find/, function(next) {
  //this指向当前的query
  this.find({ active: { $ne: false } });
  next();
});

//校验密码是否正确
//静态方法
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  //this代表这个document
  //this.password //是不行的，因为这里password设置了select:false
  return await bcrypt.compare(candidatePassword, userPassword); //true or false?
};

//属于文档
//静态方法
userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(changeTimestamp, JWTTimestamp);
    return JWTTimestamp < changeTimestamp;
  }
  return false; //代表没改密码
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // console.log({resetToken}, this.passwordResetToken);
  //10min
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};


//model
const User = mongoose.model('User', userSchema);

module.exports = User;
