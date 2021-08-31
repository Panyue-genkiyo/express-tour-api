const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeature = require('../utils/apIFeatures');


//抽象出来
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  //delete 通过id
  const doc = await Model.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError(`No document find with that ID ${req.params.id}`, 404)); //结束该controller
  }
  //204表示相应不返回任何data
  res.status(204).json({
    status: 'success',
    data: null
  });
});


exports.updateOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true //校验
  });

  if (!doc) {
    return next(new AppError(`No document find with that ID ${req.params.id}`, 404)); //结束该controller
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});


exports.createOne = Model => catchAsync(async (req, res) => {
  //添加数据到mongodb
  const newDoc = await Model.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      data: newDoc
    }
  });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
  // console.log(req.params);
  // let {id} = req.params;
  // //id * 1将id转换为数字类型
  // id = id * 1;
  //且填充字段guides(get )
  let query = Model.findById(req.params.id);
  if (popOptions) query = query.populate(popOptions);
  const doc = await query;//如果不存在
  if (!doc) {
    return next(new AppError(`No document find with that ID ${req.params.id}`, 404)); //结束该controller
  }
  //Tour.findOneBy({_id:req.params.id})
  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
  //如果路由中存在tourId,就代表是查找某一具体tour的全部review
  //to allow for nested get reviews on tours (hack)
  let filter = {};
  if(req.params.tourId) filter = {tour: req.params.tourId}
  const features = new APIFeature(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  // const docs = await features.query.explain();
  const docs = await features.query;
  //send response
  res.status(200).json({
    status: 'success',
    results: docs.length,
    data: {
      data: docs
    }
  });
});
