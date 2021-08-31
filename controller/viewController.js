const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  //获取tour data
  const tours = await Tour.find();

  //构建模版

  //用数据来渲染模版

  res.status(200).render('overview', {
    title: 'All tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res) => {
  //1 get the data for the query slug (include guides and reviews)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user' //只过滤出我们想要的字段
  });

  //2 build template


  //3.

  res.status(200).render('tour', {
    //传递数据到base.pug模版文件中
    title: 'The Forest Hiker Tour',
    tour
  });
});


