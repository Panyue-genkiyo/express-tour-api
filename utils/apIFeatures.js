class APIFeature {
  constructor(query,queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(){
    //execute query
    const queryObj = {...this.queryString}; //创建一个req.query的副本，而不只是它的引用
    const excludeFields = ['page','sort','limit','fields'];//我们希望过滤的请求参数
    excludeFields.forEach(el => delete queryObj[el]);
    // console.log(req.query,queryObj);//req.query请求参数，是一个对象包含请求参数
    //类似于mongodb的操作
    //Tour.find({duration:5,difficulty:'easy'})
    //利用mongoose的特殊写法
    //Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
    //2.advance filter(提高过滤请求参数的数量)
    let queryString = JSON.stringify(queryObj); //stringfy把string转换为字符串
    queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g,(match) => `$${match}`)
    // console.log(JSON.parse(queryString));
    //find返回的是query document对象
    this.query.find(JSON.parse(queryString));
    // let query = Tour.find(JSON.parse(queryString));//mongodb查找通过query所有的tour array,
    return this;
  }

  sort(){
    // 3. sort the result by price(使结果排序)
    // console.log(this.queryString.sort)
    if(this.queryString.sort){
      let sortBy = this.queryString.sort.split(',').join(" ");
      // console.log(sortBy)
      this.query = this.query.sort(sortBy);
      //sort('price ratingsAverage');
    }else{
      //如果不指定特殊的排序字段名，则默认
      this.query = this.query.sort('createdAt');
    }
    return this; //链式调用
  }

  limitFields(){
    //4.filed limit
    if(this.queryString.fields){
      const fields = this.queryString.fields.split(',').join(" ");
      this.query = this.query.select(fields);
    }else{
      //若不指定特殊的fields
      this.query = this.query.select('-__v'); //不查找__v
    }
    return this;
  }

  paginate(){
    //分页设定 pagination
    ///page=2&limit=10 1-10:page 1,11-20:page 2,21-30:page 3
    //检查
    const page = this.queryString.page * 1 || 1; //转换为数字类型,默认页面一
    const limit = this.queryString.limit * 1 || 100;//默认一页100条数据
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // if(this.queryString.page){
    //   const numsTours = await Tour.countDocuments(); //记录文档的数量
    //   if(skip >= numsTours){
    //     throw new Error('the page doesn\'t exist');
    //   }
    // }
    return this;
  }
}

module.exports = APIFeature;
