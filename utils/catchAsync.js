module.exports = catchAsync = fn => {
  //catch async error
  return (req,res,next) => {
    //globalError中
    fn(req, res, next).catch(next); //返回一个promise，但凡出错就有进入到catch中
  }
}
