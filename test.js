<<<<<<< HEAD
var _ = require("underscore");
var catdatadetail=require('./etl_script/catdatadetail.json');
var datalookup=require('./etl_script/datalookup.json');
var etl_helper =require("./etl_script/etl_helper");
function test(){
	var file = __dirname + '/public/uploads/bikes-@17-1-2016.csv';
	etl_helper.start_process("bikes",file,true,function(response){
			formateDate(response);
		});
}
var error = {};
function formateDate (data) {
	error = {};
	_.each(data["Error"],function(value){

		var tmp = JSON.parse(value.errorlist);
		_.each(tmp,function(val,key){
=======
// var _ = require("underscore");
// var catdatadetail=require('./etl_script/catdatadetail.json');
// var datalookup=require('./etl_script/datalookup.json');
// var etl_helper =require("./etl_script/etl_helper");
// function test(){
// 	var file = __dirname + '/public/uploads/auto-@14-1-2016.csv';
// 	etl_helper.start_process("property",file,true,function(response){
// 			formateDate(response);
// 		});
// }
// var error = {};
// function formateDate (data) {
// 	_.each(data["Error"],function(value){
// 		var tmp = JSON.parse(value.errorlist);
// 		_.each(tmp,function(val,key){
>>>>>>> a9bb44aab28a55b25e5344441a72dcb34ca04f48

// 			if (!error[val.field]) {
// 				error[val.field] = new Array();
// 			};

<<<<<<< HEAD
			var fl = _.where(error[val.field],{msg:val.errormessage,"value":val.value});
			if (fl.length == 0) {
				error[val.field].push({count:0,msg:val.errormessage,"value":val.value || "not provided"});	
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
	
	console.log(error)
}
=======
// 			var fl = _.where(error[val.field],{msg:val.errormessage});
// 			if (fl.length == 0) {
// 				error[val.field].push({count:0,msg:val.errormessage,"value":val.value|| "not provided"});	
// 			}else{
// 				_.each(error[val.field],function(item){
// 					//console.log(item.msg,fl);
// 					if (item.msg === fl[0].msg) {
// 						item.count++;
// 					};
// 				});
// 			};

// 		});
// 	});
// 	console.log(error)
// }
>>>>>>> a9bb44aab28a55b25e5344441a72dcb34ca04f48

// test();
