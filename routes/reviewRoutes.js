const express = require('express');

const reviewController = require('../controller/reviewController');
const authController = require('../controller/authController');
const { getAllReviews, createReview, deleteReviews,updateReview, setTourUserIds, getReview} = reviewController;
const { protect, restrictTo } = authController;

const reviewRouter = express.Router({
  mergeParams: true
}); //合并restful请求参数

// POST /tours/12344/reviews
// GET /tours/11111/reviews
// POST /reviews

//只有登陆完的人才能预览评论
reviewRouter.use(protect);


//保护路由
reviewRouter.route('/')
  .get(getAllReviews)
  //中间件
  //只有user才能发评论
  .post(restrictTo('user'), setTourUserIds ,createReview);

reviewRouter.route('/:id')
  .get(getReview)
  //user(只能修改自己的)和admin可以删除评论和修改评论
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReviews);


module.exports = reviewRouter;
