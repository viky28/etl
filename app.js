 var http = require('http');
var express = require('express');
var multer = require('multer');
var path = require('path');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var _ = require("underscore");
var bodyParser = require('body-parser');
var fs = require('fs');
var mime = require("mime");
var json2xls = require('json2xls');
var done = false;


var etl_data_map = require("./etl_script/etl_data_map");
var etl_config = require("./etl_script/etl_config.json");
var lookups=require("./etl_script/datalookup.json");
var credential_data = require("./public/loginDetail.json");
var app = express();
var database = require("./usersDatabase");
var auth = require("./auth");
var catdatadetail=require('./etl_script/catdatadetail.json');
var datalookup=require('./etl_script/datalookup.json');
var etl_helper=require("./etl_script/etl_helper");
var listing=require('./etl_script/listing.json');


app.use(json2xls.middleware);
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(bodyParser.json());
app.use(cookieParser());

app.use(expressSession({secret:'somesecrettokenhere'}));
var uploadFilePath = "/public/uploads"
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
  	cb(null,'.'+uploadFilePath)
  },
  filename: function (req, file, cb) {
  	saveFile(req,file,cb,function(name){
  		cb(null, name)
  	});
  }
});

function saveFile(req,file,cb,next){
	var fileextention = path.extname(file.originalname);
	var tmp = file.originalname.split(fileextention)[0];
	var date = new Date();
	var dt = (date.getDate()-1)+"-"+(date.getMonth()+1)+"-"+date.getFullYear();
	var time = date.getHours() + ":" +date.getMinutes() + ":" +date.getSeconds();
  	var filename = tmp+ '-' +"@"+dt+fileextention;
  	var channel=req.body.channel;
  	var catagory=req.body.cat;

	var data = {type:req.session.user.type,file:filename,path:uploadFilePath,uploaded_date:dt,time:time,user:req.session.user.userid,channel:channel,catagory:catagory,status:"pending"};
  	database.insertData(data,function(err,result){
  		console.log(err);
  	});

  	next(filename);

}
app.use(multer({ storage:storage}).single("uploadFile"));

app.use(express.static(__dirname + '/public'));

app.post("/user/authenticate",function(req,res){

	var getData=req.body;
	var filter_data=_.findWhere(credential_data.users,{userid:getData.userid,password:getData.password,type:getData.type});
	if (filter_data) {
		req.session.user = {
			userid: req.body.userid,
			type: req.body.type
		}
		res.send(JSON.stringify({status:"success",type:filter_data.type}));

	} else{
		res.send(JSON.stringify({status:"error",msg:"Authentication Fail"}));
	};
	
});
app.post("/uploadFile",function(req,res){
	res.redirect("/");
});

app.get("/users/details",function(req,res){
	if(req.session.user)
		res.send(JSON.stringify(req.session.user));
	else{
		res.send(JSON.stringify({status:"error",msg:"Unaurthorized user"}));
	}
});

app.post("/users/data",function(req,res){
	var postjson = {type:req.body.type};
	database.getData(postjson,function(err,data){
		res.send(data);
	});
});

app.get('/logout', function(req, res){
  delete req.session.user
  res.redirect('/');
});

app.get('/downloadReport',function(req,res) {
	_.each(error,function(item,key){
		error[key] = JSON.stringify(item);
	});
	res.xls('Report.xlsx', error);
});

app.get('/download', function(req, res){
	database.getFile(req.query.file,function(err,result){
		var file = __dirname + result.path+'/'+result.file;		
		var filename = path.basename(file);
		var mimetype = mime.lookup(file);
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
	var data = [];
	var dtmp;
	_.each(catdatadetail,function(item,key){
		dtmp={};
		dtmp["text"] = key;
		var tmp = [];
			_.each(item,function(value,key1){
				if(value.mandatory==="true"){
					if (value.type.indexOf("$")> -1 || value.type.indexOf("#") > -1) {
						if(value.type.indexOf("$")> -1){
							tmp.push({"text":value.field+"(numeric)"});
						}else{
							tmp.push({"text":value.field,"children":getdataLookUp(datalookup[value.type.substring(1)])});
						}
					} else{
						tmp.push({"text":value.field});
					};
				}
			});

			dtmp["children"] = tmp;
		data.push(dtmp);	
	});
	res.json(data);
});

app.post('/showReport',function(req,res){
	
	 database.getFile(req.body.id ,function(err,result){
		if (!result) {
	
			res.send(result);	
		};
		
		var file = __dirname + result.path+'/'+result.file;		
		etl_helper.start_process(result.catagory,file,true,function(response){
			checkListing(res,response);
		});
		
	});
});


app.delete('/deleteRecord',function(req,res){
		console.log(saveFile)
		database.deleteRecords(req.query.id,function(err,result){
			
			res.send('success');
		});
});

app.put('/updateRecord',function(req,res){
	database.updateRecord(req.query.id,function(err,result){
		res.send('success');
	});
});	

http.createServer(app).listen(10000, function(){
	console.log('Express server listening on port ' + 10000);
});


function getdataLookUp(data){
	var list = [];

	_.each(data,function(value,key){
		list.push({"text":value.id});
	});
	return list;
}

var error={};
function checkListing(res,data) {
	//console.log(data);
	error = {};
	_.each(data["Error"],function(value){

		var tmp = JSON.parse(value.errorlist);
		_.each(tmp,function(val,key){

			if (!error[val.field]) {
				error[val.field] = new Array();
			};

			var fl = _.where(error[val.field],{msg:val.errormessage});
			if (fl.length == 0) {
				error[val.field].push({count:0,msg:val.errormessage,"value":val.value || "not provided"});	
			}else{
				//console.log("\n");
				_.each(error[val.field],function(item){
					//console.log(item.msg,fl);
					if (item.msg === fl[0].msg) {
						item.count++;
					};
				});
			};

		});
	});
	error["totalCount"] = data["errorCount"]+data["successCount"];
	error["errorCount"] = data["errorCount"];
	res.json(error);
}