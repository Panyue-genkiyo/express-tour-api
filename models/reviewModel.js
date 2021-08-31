const mongoose = require('mongoose');
const Tour = require('../models/tourModel');

//review / rating / createdAt / tour_id(ref to tour) / user_id(ref to user)

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review can not be empty !']
  },
  rating: {
    type: Number,
    min: [1, 'rating must be above 1.0'],
    max: [5, 'rating must be below 5.0']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'review must  belong to a tour']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'review must belong to a user']
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reviewSchema.index({
  user:1,
  tour:1
}, {
  unique: true
});

//mongoose 中间件
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path:'tour',
  //   select:'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

//static methods
reviewSchema.statics.calcAverageRatings = async function(tour) {
  //tour 代表tour_id
  //this代表当前的model
  const stats = await this.aggregate([
    {
      $match: {
        tour
      }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, //分组
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tour, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    //没有review的情况下
    await Tour.findByIdAndUpdate(tour, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  //this指代当前的review
  //this.constructor代表Review
  this.constructor.calcAverageRatings(this.tour);
});

/**
 * findOneAndDelete
 * findOneAndUpdate
 */
//在更新之前
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //获得当前的review document
  //this代表当前的query
  this.r = await this.findOne(); //把当前的review文档保存在query中
  // console.log(r);
  next();
});

//在更新之后
reviewSchema.post(/^findOneAnd/, async function() {
  //当该文档被更新完成之后, 在这里重新计算tour的rating
  //this代表query，this.r代表该documentation
  //不能在这里await this.findOne() 因为在这里query已被执行，这里是不生效的 query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;



