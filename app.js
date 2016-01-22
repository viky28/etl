 var http = require('http');
var express = require('express');
var multer = require('multer');
var path = require('path');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var _ = require("underscore");
var bodyParser = require('body-parser');
var fs = require('fs');

var json2xls = require('json2xls');
var done = false;


var etl_data_map = require("./etl_script/etl_data_map");
var etl_config = require("./etl_script/etl_config.json");
var lookups=require("./etl_script/datalookup.json");

var app = express();

var auth = require("./auth");

var etl_helper=require("./etl_script/etl_helper");
var listing=require('./etl_script/listing.json');

var app_helper = require("./helper");


app.use(json2xls.middleware);
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(bodyParser.json());
app.use(cookieParser());

app.use(expressSession({secret:'somesecrettokenhere'}));
var uploadFilePath = "/public/uploads";
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
  	cb(null,'.'+uploadFilePath)
  },
  filename: function (req, file, cb) {
  	app_helper.saveFile(req,file,cb,function(name){
  		cb(null, name)
  	});
  }
});


app.use(multer({ storage:storage}).single("uploadFile"));

app.use(express.static(__dirname + '/public'));


app.post("/user/authenticate",function(req,res){

	var user_data=req.body;
	app_helper.getUser(user_data,function(result){
		if (result) {
			req.session.user = {
				userid: user_data.userid,
				type: user_data.type
			}
			res.json({status:"success",type:user_data.type});
		} else{
			res.json({status:"error",msg:"Authentication Fail"});
		};
	});
});

app.post("/uploadFile",function(req,res){
	res.redirect("/");
});

app.get("/users/details",function(req,res){
	if(req.session.user)
		res.json({status:"success",type:req.session.user.type});
	else{
		res.json({status:"error",msg:"Unaurthorized user"});
	}
});

app.post("/users/data",function(req,res){
	var postjson = {type:req.body.type};
	app_helper.getUploadFile(postjson,function(result){
		res.json(result);
	});
});

app.get('/logout', function(req, res){
  delete req.session.user
  res.redirect('/');
});

app.get('/downloadReport',function(req,res) {

	app_helper.getRepot(error,function(result){
		res.xls('Report.xlsx', result);	
	});
	
});

app.get('/download', function(req, res){
	app_helper.downloadFile(req.query.file,function(filename,mimetype,file){
		res.setHeader('Content-disposition', 'attachment; filename=' + filename);
  		res.setHeader('Content-type', mimetype);
  		var filestream = fs.createReadStream(file);
  		filestream.pipe(res);
	});
});

app.get('/downloadConfig',function(req,res){
	var file = __dirname + '/etl_script/etl_config.json';		
	var filename = path.basename(file);
	var mimetype = mime.lookup(file);
	res.setHeader('Content-disposition', 'attachment; filename=' + filename);
	res.setHeader('Content-type', mimetype);

	var filestream = fs.createReadStream(file);
	filestream.pipe(res);
});


app.get('/treeview', function(req,res){

	app_helper.getTreeData(function(result){
		res.json(result);
	});
});

app.post('/showReport',function(req,res){
	app_helper.generateReport(req.body.id,function(result){
		res.json(result);
	});
});

app.delete('/deleteRecord',function(req,res){
	app_helper.deleteFile(req.query.id,function(){
		res.send('success');	
	});
	
});

app.put('/updateRecord',function(req,res){
	app_helper.updateRecord(req.query.id,function(){
		res.send("success");
	})
});	

app.get("*",function(req,res){
	res.redirect('/');
});
http.createServer(app).listen(10000, function(){
	console.log('Express server listening on port ' + 10000);
});

