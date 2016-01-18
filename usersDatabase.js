'use strict';

var mongodb = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

var database={};
var theDb = null;
 
database.getdb=function(next){
	if(!theDb) {
		mongodb.MongoClient.connect("mongodb://localhost:27017/voda",function(err,db){
			if(err){
				next(err);
			} else {
				theDb={
					db:db,
					etl:db.collection('etl')
				};
				next(null, theDb);
				
			}
		});
	} else {
			next(null, theDb);
		}		
}
database.insertData = function(data,next){
	database.getdb(function(err,db){
		if(!err){
			db.etl.save(data,function(err,result){
				db.etl.find().sort({uploaded_date:1,time:1});
				next(err,result);
			});
		}
	});
}

database.getData = function(data,next){
	database.getdb(function(err,db){
		if(!err){
			db.etl.find(data).toArray(function(err,result){
				next(err,result);
			});
		}
	});
}
database.getFile = function(id,next){
	database.getdb(function(err,db){
		if(!err){
			db.etl.findOne({_id:ObjectId(id)},function(err,result){
				next(err,result);
			});
		}
	});
}

database.deleteRecords = function(id,next){
	database.getdb(function(err, db) {
		if (err) {
			console.log("not deleted");
			return;
		}
		//var item = db.etl.findOne({_id:ObjectId(id)});
		db.etl.remove({_id:ObjectId(id)}, function(err, res) {
				if(err)
					next(false);
				else
					next(true);
		});
	});

}

database.updateRecord=function(id,next){
	database.getdb(function(err,db){
		if(err){
			console.log("not updated");
			return;
		}
		db.etl.updateOne({_id:ObjectId(id)},{ $set: { "status": "processing" } },function(err,res){
			if(err)
				next(false);
			else
				next(true);
		});
	})
}

module.exports=database;	
