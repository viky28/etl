'use strict';
var fs = require('fs');
var path = require('path');
var _ = require("underscore");
var mime = require("mime");
var json2xls = require('json2xls');
var unzip = require("unzip");
var rmdir = require( 'rmdir' );

var database = require("./usersDatabase");
var credential_data = require("./public/loginDetail.json");
var catdatadetail=require('./etl_script/catdatadetail.json');
var datalookup=require('./etl_script/datalookup.json');
var etl_helper = require('./etl_script/etl_helper')

var uploadFilePath = "/public/uploads/";
var downloadFilePath = "/public/downloads";

var helper = {};
helper.getDate = function(){
	var date = new Date();
	date = date.getFullYear()+"_"+(date.getMonth()+1)+"_"+(date.getDate())+"_"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds();
	return date;
}
helper.deleteFile = function(file_id,next){
	
	database.getFile(file_id,function(err,result){
		if(!result) {
			debug("deletion error", err,result);
			next("fail to delete the file")
		}
		// var filePath = __dirname + result.path+'/'+result.file;
		var folder=result.path.split("/")[3];
		console.log("folder is",folder)
		rmdir( __dirname+"/public/uploads/"+folder , function ( err, dirs, files ){
		  console.log( dirs );
		  console.log( files );
		  console.log( 'all files are removed' );
		});
		database.deleteRecords(file_id,function(err,result1){
			// fs.unlinkSync(filePath);
			next("successfully deleted");
		});	
	});
}

helper.saveFile = function(req,file,cb,next){

	var fileextention = path.extname(file.originalname);
	var tmp = file.originalname.split(fileextention)[0];
	var filename = tmp+ '_'+helper.getDate()+fileextention;
  	var channel=req.body.channel;
  	var catagory=req.body.cat;
  	var id = null;
	var data = {type:req.session.user.type,file:filename,path:tmp,uploaded_date:new Date(),user:req.session.user.userid,channel:channel,catagory:catagory,status:"pending"};
  	database.insertData(data,function(err,result){
	 	next(filename,function(){
	 		helper.unzipFile(req,result.ops[0]._id);
	 	});
	});
}

helper.unzipFile = function(req,file_id){
	if(!file_id){
		console.log("file id not found");
	}
	// console.log("filename",req.file)
	var filepath = req.file.destination+"/"+req.file.filename;
	var fileextention = path.extname(req.file.originalname);
	var tmp = req.file.filename.split(fileextention)[0];
	// console.log("tmp file",tmp);
	fs.createReadStream(filepath).pipe(unzip.Extract({ path: 'public/uploads/'+tmp }));
	fs.unlinkSync(filepath);
	database.getFile(file_id,function(err,result){
		var path=result.path;
		path={$set:{path:uploadFilePath+tmp+'/'+path}};
		database.updateRecord(file_id,path,function(){
			
		});
		
	});
}


helper.getUser = function(user_data,next){
	var filter_data=_.findWhere(credential_data.users,{userid:user_data.userid,password:user_data.password,type:user_data.type});
	if (filter_data) {
		next(true);
	}else{
		next(false);
	}
}

helper.getUploadFile = function(postjson,next){
	database.getData(postjson,function(err,data){
		next(data);
	});
}


helper.getReport = function(id,next){
	database.getFile(id,function(err,result){
		var data = result.result;
		_.each(data,function(item,key){
			data[key] = JSON.stringify(item);
		});
		next(data);	
	});
}

helper.downloadFile = function(file_id,next){
	
	database.getFile(file_id,function(err,result){
		var file = __dirname + result.path+'/'+result.file;		
		var filename = path.basename(file);
		var mimetype = mime.lookup(file);
		next(filename,mimetype,file);
	});
}

helper.getTreeData = function(next){
	treeData(catdatadetail,next);
}

helper.generateReport = function(id,type,next){
	database.getFile(id ,function(err,result){
		if (!result) {
			console.log("Result not fount");
			next(result);
			return;	
		};
		
		if (type && result.result) {
			console.log("Result found");
			next(result.result);
			return;
		}
		var file = __dirname + result.path;
		
		var allFile;
		fs.readdir(file, function(err, files) {
    		if (err) return;
    			files.forEach(function(f) {
    				if(f.indexOf(".csv")> -1){
    					console.log('Files: ==' + f);
    					allFile = f;
    				//return f;
    				}
    			});

    		etl_helper.start_process(result.catagory,file,file+'/'+allFile,result.channel,type,function(response){
				console.log("File Validated");
				checkListing(response,type,function(error_result){
					helper.saveRecord(id,error_result);
					next(error_result);
				});
			});
		});
		console.log("files are",allFile)
		// var file = __dirname + result.path+result.file;	
		// console.log("file is",result.path+result.file);
		
		
	});
}

helper.updateRecord = function(id,status,next){
	var upt = {$set:{status:status}}
	database.updateRecord(id,upt,function(err,result){
		next();
	});
}
helper.saveRecord = function(id,result){
	var upt = {$set:{result:result}}
	database.updateRecord(id,upt,function(err,result){
		console.log("Record saved.");
	});
}
module.exports=helper;


function treeData(catdatadetail,next){
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
	next(data);
}

function checkListing(data,type,next) {
	var error = {};
    _.each(data["Error"],function(value){

        var tmp = JSON.parse(value.errorlist);
        _.each(tmp,function(val,key){

            if (!error[val.field]) {
                error[val.field] = new Array();
            };

            var fl = _.where(error[val.field],{msg:val.errormessage,"value":val.value || "not provided"});
            if (fl.length == 0) {
                error[val.field].push({count:1,msg:val.errormessage,"value":val.value || "not provided"});   
            }else{
                //console.log("\n");
                _.each(error[val.field],function(item){
                    //console.log(item.msg,fl);
                    if (item.msg === fl[0].msg && item.value === fl[0].value) {
                        item.count++;
                    };
                });
            };

        });
    });
	error["totalCount"] = data["errorCount"]+data["successCount"];
	error["errorCount"] = data["errorCount"];
	if(data["Response"]){
		error["otherError"] = data["Response"];
	}	
	next(error);	
}


function getdataLookUp(data){
	var list = [];

	_.each(data,function(value,key){
		list.push({"text":value.id});
	});
	return list;
}
