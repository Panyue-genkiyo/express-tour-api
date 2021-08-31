const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const  { deleteOne, updateOne, createOne, getOne, getAll } = factory;

//中间件
exports.setTourUserIds = (req,res,next) => {
  //生成某条具体tour的review
  //实现嵌套路由
  if(!req.body.tour) req.body.tour = req.params.tourId;
  if(!req.body.user) req.body.user = req.user.id;
  next();
}

exports.getAllReviews = getAll(Review);
exports.getReview = getOne(Review);
exports.createReview = createOne(Review);
exports.updateReview = updateOne(Review);
exports.deleteReviews = deleteOne(Review);
