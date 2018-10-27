import jwtExpress from "express-jwt";

//make sure the user is logged - Authentication
exports.loginRequired = function(req, res, next) {
  try {
    //get token from http header
    const token = req.headers.authorization.split(" ")[1];
    jwtExpress.verify(token, process.env.SECRET_KEY, function(err, decoded) {
      if (decoded) {
        return next();
      } else {
        //token cantnot be decoded
        return next()({
          status: 401,
          message: "please log in first"
        });
      }
    });
  } catch (e) {
    return next()({
      status: 401,
      message: "please log in first"
    });
  }
};

//make sure we get the correct user - Authorization

exports.ensureCorrectUser = function(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwtExpress.verify(token, process.env.SECRET_KEY, function(err, decoded) {
      if (decoded && decoded.id === req.params.id) {
        return next();
      } else {
        return next()({
          status: 401,
          message: "Unauthorized"
        });
      }
    });
  } catch (e) {
    return next()({
      status: 401,
      message: "Unauthorized"
    });
  }
};
