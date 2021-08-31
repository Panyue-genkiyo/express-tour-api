const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');
//scheme for data


const tourScheme = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a tour must have a name'],
    unique: true, //并不是validator
    maxlength: [40, 'a tour name must have less or equal than 40 characters'],
    minlength: [10, 'a tour name must have more or equal than 10 characters']
    // validate: [validator.isAlpha,'a tour name must only contains characters']
  },
  slug: {
    type: String
  },
  duration: {
    type: Number,
    required: [true, 'a tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'a tour must have a max group size']
  },
  difficulty: {
    type: String,
    required: [true, 'a tour should have a difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either: easy, middle, difficult'
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,  //默认值
    //默认validator
    min: [1, 'rating must be above 1.0'],
    max: [5, 'rating must be below 5.0'],
    set: val => Math.round(val * 10) / 10  //4.6666 => 4.7
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'a tour must have a price']
  },
  priceDiscount: {
    type: Number,
    //我们自己的validator
    validate: {
      //callback
      validator: function(val) {
        //我们这里需要使用this，所以不能使用箭头函数
        //this only points to current doc on NEW Document creation
        return val < this.price; //this --> document
      },
      message: 'discount price {{VALUE}} should be below regular price'
    }
  },
  summary: {
    type: String,
    trim: true //trim只会使用string，去除字符串的两端的空格
  },
  description: {
    type: String,
    required: [true, 'a tour must have a description']
  },
  imageCover: {
    type: String, //name of the image
    required: [true, 'a tour must have a cover image']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  //location 放在了tour里
  startLocation: {
    //GEO JSON
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  guides: [
    {
      //child reference
      type: mongoose.Schema.ObjectId,
      ref: 'User' //关联其他model,这是关键,
    }
  ],
}, {
  //schema 配置选项
  toJSON: {
    //当每次这个data都被转换为json的时候,都会执行的操作(把)
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

tourScheme.index({price : 1, ratingsAverage : -1}); //1 升序存index -1降序存index 提高读写速度
tourScheme.index({slug : 1});
tourScheme.index({startLocation: '2dsphere'});
//类似于mysql的视图机制
//不存在与database中
//但是在查找时无法使用这个当作关键字，因为他并不属于数据库中的一部分,虚拟
tourScheme.virtual('durationWeeks')
  .get(function() {
    //注意这里不能使用剪头函数，因为箭头函数没有自己的this
    return this.duration / 7;
  });

//让tour知道所有关于它的评论
//virtual populate
//并不保存到database中
tourScheme.virtual('reviews',{
  ref: 'Review',
  foreignField: 'tour', //这里代表着reviewModel中的tour字段(类似于外键)
  localField: '_id' //这里是指当前tourModel中的__id字段
});

//mongoose中间件，在文档保存之前运行回调函数 ---> document middle
//run before save() and create() 但是不使用与insertMany
//中间件
tourScheme.pre('save', function(next) {
  // console.log(this); //注意此时的this等于document(等于我们添加的document)，这是写入database之前触发的操作
  this.slug = slugify(this.name, '-'); //在文档插入之前
  next(); //这里注意一定要调用next()
});

//在保存之前
//只在save和create时起作用的
//update的时候不起作用
//嵌套的方法
// tourScheme.pre('save',async function(next){
//    const guidesPromise = this.guides.map(async id => await User.findById(id)); //这个是个数组包含查找user的promise
//    this.guides = await Promise.all(guidesPromise);
//    next();
// });

//child reference是需要使用populate


// tourScheme.pre('save',function(next){
//   console.log('will save the docment');
//   next();
// })
//
// //在所有pre middleware执行完之后
// tourScheme.post('save',function(doc,next){
//    console.log(doc);
//    next();
// })

//query middleware
//find findOne findOneUpdate
tourScheme.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } }); //此时this是query
  this.start = Date.now();
  next();
});

//query middware
tourScheme.pre(/^find/, function(next) {
  //this指代当前的query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt' //不填充user的passwordChangeAt和__v这两个字段
  });
  next();
});

tourScheme.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds !`);// 检查query所需时间
  // console.log(docs); //没找到
  next();
});//mongoose aggregation middleware
// tourScheme.pre('aggregate', function(next) {
//   //再加一个过滤条件
//   this.pipeline().unshift({
//     $match: {
//       //防止选出秘密的secret
//       secretTour: {
//         $ne: true
//       }
//     }
//   });
//   console.log(this.pipeline()); //此时this是aggregation object
//   next();
// });

const Tour = mongoose.model('Tour', tourScheme);

module.exports = Tour; //默认deafult用modules.exports

