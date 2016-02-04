var unzip = require("unzip");
var fs = require("fs");
var database = require("./usersDatabase");
var app_helper = require("./helper");
var path = require('path');
var rmdir = require( 'rmdir' );

function test() {
	console.log("in testkjdsnfjsknfjks")
	var file_id="56af0ea92cc3680017e6a317";
	//app_helper.deleteFile = function(file_id){
	console.log("in test")
	database.getFile(file_id,function(err,result){
		if(!result) {
			console.log("deletion error", err,result);
			//next("fail to delete the file")
		}

		var folder=result.path.split("/")[3];
		console.log("folder is",folder)
		rmdir( __dirname+"/public/uploads/"+folder , function ( err, dirs, files ){
		  console.log( dirs );
		  console.log( files );
		  console.log( 'all files are removed' );
		});
		console.log("file deleted successfully",result.path)
		//database.deleteRecords(file_id,function(err,result1){
			// fs.unlinkSync(filePath);
			
			
			//next("successfully deleted");
		// });	
	});
//}
}
test();