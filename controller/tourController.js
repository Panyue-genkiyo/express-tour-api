//const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`,'utf-8')); //把字符串转换为json对象
const Tour = require('../models/tourModel');
// const APIFeature = require('../utils/apIFeatures');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const { deleteOne, updateOne, createOne, getOne, getAll } = factory;

//checkId
//相当于从controller里面导出了一个中间件
//exports.checkIDMiddleware = (req,res,next,val) => {
// console.log(`Tour id ${val}`);
// let id = req.params.id * 1;
// //如果id为nan，则提前返回404请求异常
// if(id >= tours.length || isNaN(id)){
//   return res.status(404).json({
//     status:'failed',
//     message:'invalid id',
//   })
// }
//   next();
// }

//middleware
// exports.checkBodyMiddleware = (req,res,next) => {
//    if(!req.body.name || !req.body.price){
//      return res.status(404).json({
//        status:'Failed',
//        message:'Missing price or name'
//      })
//    }
//    next();
// }
//中间件
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price'; //rating降序，price升序，便宜但却是比较好的
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//router handles
//1
exports.getAllTours = getAll(Tour);
//只有在访问某个具体的tour的时候，才可以看到有关于它的评论
exports.getTour = getOne(Tour, { path: 'reviews' });
exports.createTour = createOne(Tour);
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);

exports.getTourStats = async (req, res) => {
  try {
    //regular query
    //aggregate返回aggregate对象
    const stats = await Tour.aggregate([
      {
        $match: {
          ratingsAverage: { $gte: 4.5 }
        }
      },
      {
        $group: {
          _id: {
            $toUpper: '$difficulty'
          }, //_id为null,就代表不分组，'$difficulty'代表以difficulty分组
          numTours: {
            $sum: 1 //文档记录的总数量
          },
          numRatings: {
            $sum: '$ratingsQuantity'
          },
          avgRating: {
            $avg: '$ratingsAverage'
          },
          avgPrice: {
            $avg: '$price'
          },
          minPrice: {
            $min: '$price'
          },
          maxPrice: {
            $max: '$price'
          }
        }
      },
      {
        $sort: {
          avgPrice: 1 //1递增排序,-1为降序排序
        }
      }
      // {
      //   $match:{
      //     _id: {
      //       $ne:'EASY' //可以过滤多次名，这里是查找difficulty不为EASY的，注意一定是ne
      //     }
      //   }
      // }
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (e) {
    res.status(404).json({
      status: 'failed',
      message: e
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'
      },
      //match过滤作用类似于select
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      }
      ,
      {
        $group: {
          _id: {
            $month: '$startDates'
          },
          numToursStarts: {
            $sum: 1
          },
          //我们需要更多的信息
          tours: {
            $push: '$name'
          }
        }
      },
      {
        $addFields: {
          month: '$_id'
        }
      },
      {
        $project: {
          _id: 0 //过滤掉我们不需要的字段不需要id为 0
        }
      },
      {
        $sort: {
          numToursStarts: -1 //降序排序
        }
      },
      {
        $limit: 12 //限制文档的数量
      }
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  } catch (e) {
    res.status(404).json({
      status: 'failed',
      message: e
    });
  }
};


// /tours-within/200/center/-45,40/unit/mi
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    return next(new AppError('Please provide latitutr and longitude in the format, lat,lng.', 400));
  }
  console.log(radius, lat, lng, unit);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } }
  );
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

// /distances/:latlng/unit/:unit
exports.getDistances = catchAsync(async (req, res, next) => {
  const {latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const  multiplier = unit === 'mi' ? 0.000621371192 : 0.001
  if (!lat || !lng) {
    return next(new AppError('Please provide latitutr and longitude in the format, lat,lng.', 400));
  }
  const distance = await Tour.aggregate([
    {
      $geoNear:{
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distance
    }
  })
});
