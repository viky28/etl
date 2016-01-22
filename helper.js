'use strict';
var fs = require('fs');
var path = require('path');
var _ = require("underscore");
var mime = require("mime");

var database = require("./usersDatabase");
var credential_data = require("./public/loginDetail.json");
var catdatadetail=require('./etl_script/catdatadetail.json');
var datalookup=require('./etl_script/datalookup.json');


var uploadFilePath = "/public/uploads";

var helper = {};
helper.getDate = function(){
	var date = new Date();
	date = date.getFullYear()+"_"+(date.getMonth()+1)+"_"+(date.getDate())+"_"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds();
	return date;
}
helper.deleteFile = function(file_id,next){
	
	database.getFile(file_id,function(err,result){
		var file = __dirname + result.path+'/'+result.file;
		database.deleteRecords(req.query.id,function(err,result){
			fs.unlinkSync(filePath);
			next();
		});	
	});
}

helper.saveFile = function(req,file,cb,next){

	var fileextention = path.extname(file.originalname);
	var tmp = file.originalname.split(fileextention)[0];
	var filename = tmp+ '_'+helper.getDate()+fileextention;
  	var channel=req.body.channel;
  	var catagory=req.body.cat;

	var data = {type:req.session.user.type,file:filename,path:uploadFilePath,uploaded_date:new Date(),user:req.session.user.userid,channel:channel,catagory:catagory,status:"pending"};
  	database.insertData(data,function(err,result){
  		console.log(err);
  	});

  	next(filename);

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


helper.getRepot = function(data,next){
	_.each(data,function(item,key){
		data[key] = JSON.stringify(item);
	});
	next(data);
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

helper.generateReport = function(id,next){
	database.getFile(id ,function(err,result){
		if (!result) {
			next(result);	
		};
		
		var file = __dirname + result.path+'/'+result.file;		
		etl_helper.start_process(result.catagory,file,true,function(response){
			checkListing(response,next);
		});
		
	});
}

helper.updateRecord = function(id,next){
	database.updateRecord(req.query.id,function(err,result){
		next();
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
function checkListing(data,next) {
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
	next(error);
}


function getdataLookUp(data){
	var list = [];

	_.each(data,function(value,key){
		list.push({"text":value.id});
	});
	return list;
}
