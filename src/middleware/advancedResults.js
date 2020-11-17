const advancedResults = (model, populate) => async (req, res, next) => {
  const excludeQuery = ["select", "sort", "page", "limit"];

  let reqQuery = { ...req.query };
  excludeQuery.forEach((q) => {
    delete reqQuery[q];
  });
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );
  let query = model.find(JSON.parse(queryStr));

  // .populate("user", "name role email")
  // .populate("reviews")
  // .populate("courses", "title description tuition");
  //pagination
  const pagination = {};
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const totalDocuments = await model.countDocument;
  const firstPage = (page - 1) * limit;
  const lastPage = page * limit;
  if (firstPage > 0) {
    pagination.pre = {
      page: page - 1,
      limit,
    };
  }
  if (lastPage < totalDocuments) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  query.skip((page - 1) * limit).limit(limit);
  query.select(req.query.select);
  //Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query.sort(sortBy);
  } else {
    query.sort("-createdAt");
  }

  if (populate) {
    query = query.populate(populate);
  }

  const result = await query;
  //   console.log(result);
  res.advancedResults = {
    success: true,
    count: result.length,
    pagination,
    data: result,
  };
  next();
};
module.exports = advancedResults;
