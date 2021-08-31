const express = require('express');
const tourController = require('./../controller/tourController');
const authController = require('./../controller/authController');
const reviewRouter = require('./reviewRoutes');
const tourRouter = express.Router();

const {
  getTour,
  getAllTours,
  updateTour,
  deleteTour,
  createTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getTourWithin,
  getDistances
} = tourController;
const { protect, restrictTo } = authController;

//params middleware
//中间件
//只针对路由tour的中间件，在路由user里面是不会起作用的
//中间件中的中间件
// tourRouter.param('id',checkIDMiddleware);

//create checkBody middle
//针对post请求的middleware ==> createMiddleware

//中间件middleware的aliasTopTours的运行


//middleware router中间件
//在tourRouter里用reviewRouter;
tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter.route('/top-5-cheap')
  .get(aliasTopTours, getAllTours);
tourRouter.route('/tour-stats')
  .get(getTourStats);
//只有admin和lead-GUIDE和GUIDE才可以看到monthly-plan
tourRouter.route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);
// /tours-within/200/center/-45,40/unit/mi
tourRouter.route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getTourWithin);
tourRouter.route('/distances/:latlng/unit/:unit')
  .get(getDistances)


tourRouter.get('/', getAllTours);  //默认暴露所有的tours,使游客不登陆就可以看到所有tours信息
tourRouter.post('/', protect, restrictTo('admin', 'lead-guide'), createTour); //权限,只有admin和lead-guide才可以添加tours
tourRouter.route('/:id')
  .get(getTour)
  .patch(protect, restrictTo('admin', 'lead-guide'), updateTour) //权限,只有admin和lead-guide才可以修改和删除tours,中间件
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);


//创建某一个tourid的具体reviews
// tourRouter.route('/:tourId/reviews')
//   .post(protect, restrictTo('user'), createReview);

module.exports = tourRouter;
