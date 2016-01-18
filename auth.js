var auth = {};
auth.checkAuth = function(req, res, next) {
  if (req.path !=="/login" && (!req.session || !req.session.user_id)) {
  	
  } else {
    next();
  }
}

auth.saveSession = function(req,userID){
	req.session.user_id = userID;
}
module.exports=auth;