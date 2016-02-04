'use strict'

var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var readline = require('readline');
var rest = require("restler");
var Converter = require("csvtojson").Converter;
var Sequence = require('sequence').Sequence;
var request = require('request');

var util = require('./util');
var etl_config = require("./etl_config.json");
var etl_data_map = require("./etl_data_map");
var lookups = require("./datalookup.json");
var catdetails = require("./catdatadetail.json");




var helper = {};
//error object that save in file, after last operation
var ERROR_LOG = {};
var type_validation = {};

helper.start_process=function(type,filePath ,file_name,channel,checkOnly,next){
  ERROR_LOG = {};
  ERROR_LOG["errorCount"] = 0;
  ERROR_LOG["successCount"] = 0;
    var sequence = Sequence.create();
     sequence
    .then(function(nextfunc){
      checkForLastRow(next);
      readCsvFile(file_name.trim(),type,checkOnly,function(data){
        buildPostJson(data, type, channel, "en",filePath,checkOnly,function(b_response, action){
          if (checkOnly) {
            ////console.log(b_response);
          } else{
              if(action === "delete") {
                deleteList(b_response);
              } else{
                submitData(b_response);  
              };
          };
        });
      });
    });
}

module.exports = helper;



var row_count=0;
var error_count=0;
  var success_count=0;
function readCsvFile(file,type,flag,next) {
  
  //console.log("*****processing start***\n",file,type,flag);
  var converter = new Converter({constructResult:false});
  row_count = 1;
  

  var delay_time = etl_config["user_config"]["delay_in_millisecond"];
  var repeat_time = 100;


  converter.on("record_parsed", function (jsonObj,rawRow,rowIndex) {
      if (delay_time > repeat_time*delay_time) {
          delay_time = delay_time;
      }

      if (flag) {
        row_count++;
        next(jsonObj);

      } else{
        setTimeout(function(){
            //if(row_count >6) process.exit(0);
            row_count++;
            next(jsonObj);
          },delay_time);
  
      };
      
      delay_time+=etl_config["user_config"]["delay_in_millisecond"];
      
  });
  fs.createReadStream(file).pipe(converter);
}

/****************************************Build post json from csv data for posting***********
************************************/

function buildPostJson(data, type,channel,lang,file_path,flag,next){
  
  var postJson = {};
  var catdetail = catdetails[type];
  var sequence = Sequence.create();
  var operation = "";
  sequence
  .then(function(nextfunc){
    //build json post structur
    var etl_data = etl_data_map[type];


    postJson["category"] = type;
    postJson["channel"] = channel;
    //default config data
    _.each(etl_config["defult_config"],function(value, key){
       postJson[key] = value;
    });
    
    
    //console.log(data);
    _.each(data, function(value, key){
        try {
          
          var filter_key = getKeyFormList(etl_config[type], key);
          if (typeof(value) === "object") {
            value = value['']
          };

          if (filter_key == "") {
            if (key == "images" || key == "thumbnail") {
              var key_type = getKeyType(key);
              type_validation[key_type].validate(value,key,postJson);
            }else{
              postJson[key] = value+"";
            }
          };
          var key_type = getKeyType(filter_key);
          if (value && filter_key && etl_config["user_config"]["skip_field"].indexOf(key) === -1  && value != "") {
            var field = _.findWhere(catdetail, {field:filter_key});
            
            if (field) {
            //field that available in catdatadetails

              var reff = lookups[field.type.substring(1)];
             var filter_value = _.filter(reff, function(item){
                return item.name[lang].toUpperCase().trim() === value.toString().toUpperCase().trim() || item.id.toUpperCase() === value.toString().toUpperCase();
              }); 
              //console.log("filter_value",value,key_type,filter_key,filter_value);
              if(key_type) {
                type_validation[filter_key].validate(value,filter_key,postJson);
              }else if(filter_value.length > 0){
                postJson[filter_key] = filter_value[0].id;
                
              }else if(etl_data && etl_data[filter_key] &&  etl_data[filter_key][value]){
                postJson[filter_key] = etl_data[filter_key][value];
              }else{
                postJson[filter_key] = value.toString();
              }
            }else{
              //console.log("key_type",key_type,value,filter_key);
              if(key_type) {
                type_validation[key_type].validate(value,filter_key,postJson);
              }else if(filter_key === "action"){
                var action = _.find(etl_config["user_config"][filter_key],function(action_item){
                  return action_item.value === value;
                });
                ////console.log("action",action);
                if (action) {
                  operation = action[0].id;
                }
                
              }else{
                postJson[filter_key] = value.toString();
              }
            }
        }
      } catch (e) {
        //console.error("[EXCEPTION]-",e.name,e.message,data['msisdn']);
        
      }
    });
    insertTitileAndDesc(postJson,type,function(){
      nextfunc();   
    });
   
  
 }).then(function(nextfunc){
   //validate the Json
  var validListing_Error = validListing(postJson);
   if (!validListing_Error) {
      //console.log("1",postJson);
        ERROR_LOG["errorCount"]++;
        return;
      }else{
        
         ERROR_LOG["successCount"]++;
        
        nextfunc();
      }  
  }).then(function(nextfunc){
    if(flag){
      nextfunc();
    }else{
      imageUpload(postJson,file_path,function(){
        console.log(postJson);
      nextfunc();
      });
    }
    
  })
 .then(function(nextfunc){
    next(postJson,operation);
  });
}



function validListing(newListing){
  if(!ERROR_LOG["Error"]){
    ERROR_LOG["Error"] = new Array();
  }
  if(!util.listingAddAdditional(newListing)){
    ERROR_LOG["Error"].push({field:"Rest Call",value:"Non restful call",list:JSON.stringify(newListing)});
    ////console.log(newListing,"[VALIDATE ERROR]-Non restful call");
    return false;
  }

  var validationResults = validateListing(newListing);

  if(validationResults.length > 0){
    //ERROR_LOG_LIST.push(newListing);
    ERROR_LOG["Error"].push({id:newListing.msisdn,errorlist:JSON.stringify(validationResults)});  
    //console.log("[VALIDATE ERROR]",validationResults);
    return false;
  }
  return true;
 }

type_validation.array={
  validate:function(value, key, postJson){
    
    if (!postJson[key]) {
      postJson[key] = new Array();
    }
    this.insertData(value, key, postJson);
    return;
  },
  insertData:function(value, key, postJson){
    postJson[key].push(value);
  }
}
type_validation.date={
  validate:function(value, key, postJson){
    try{
      var index = etl_config["system_config"]["available_date_fortmat"].indexOf(etl_config["key_type_config"]["date_format"]);
      if (index > -1) {
        calDate(index, value,key,postJson)
      } else{
        //ERROR_LOG["Error"].push({id:value,msg:"Date is not valid"});
      };
    }catch(e){
      ////console.log(e);
      //insertError(value,{errormessage:"getting exception in data parsing"});;
    }
  }
}
type_validation.price={

  validate:function(value, key, postJson){
    
    var priceCon = {
      "K": 1000,
      "Mn":1000000
    }
    var new_key = "";
    value = value.toString();
    
    var num = value.match(/\d+/g);
    if(num && (value.indexOf("Mn") > -1 || value.indexOf("K") > -1)){
        var num_len = num.length;
        if (value.indexOf("Mn") > -1) {
          value = parseInt(num[num_len-1])*priceCon["Mn"];
        }else {
          value = parseInt(num[num_len-1])*priceCon["K"];
        }
    }else if(num){
      var num_len = num.length;
      value = parseInt(num[num_len-1]);
    }else if(etl_config["key_type_config"]["price"].indexOf(value) >-1){
      //console.log("pricesLLL",value, key, postJson);
        if(etl_config["key_type_config"]["callforprice"].indexOf(value) > -1){
            new_key = "callprice";
        }else if(etl_config["key_type_config"]["negotiable"].indexOf(value) > -1){
           new_key = "negotiable";
        }
       value = -1;
    }else{
      //ERROR_LOG["Error"].push({id:value,msg:"Price is not valid"});
      return;
    }  
    this.insertData(value, key, postJson,new_key);
    return;
  },
  insertData:function(value, key, postJson,new_key){
    //console.log("price",value, key, postJson,new_key);
     if (value === -1) {
        postJson[new_key] = value;
        postJson[key] = value;
      }else {
        postJson[key] = value;
      }
    return;
  }
}

function createUserIfNotExits(msisdn, next) {
    rest.get(etl_config["system_config"]["getusr"]+"?createifnotfound=yes&userid="+msisdn).on("complete",function(data, response){
      //////console.log(data);
      if ( response && (response.statusCode == 200 || data.status === 'user created')) {
          //console.log("[USER RESPONSE]- User created for "+msisdn);
          next();

      } else {
          ////console.log("[USER RESPONSE]- Not able to create user for "+msisdn);
          //insertError("user_response",{response : data, msisdn: msisdn});
      }
    });
}

function submitData(postJson,next) {
  if(!ERROR_LOG["Response"])
    ERROR_LOG["Response"] = new Array();
  createUserIfNotExits(postJson.msisdn,function(){
      //////console.log(postJson);
      rest.postJson(etl_config["system_config"]["postlisturl"], postJson).once('complete', function(data, response) {
          var x;
          try {
            x = JSON.parse(data.split("\n").join("--"));
            if (x.status == "ERROR") {

              ////console.log("[POSTING RESPONSE]-Posting is fail, please check log");
              ERROR_LOG["Response"].push({id:postJson.msisdn,msg:data});
            }else {
              ERROR_LOG["Response"].push({id:postJson.msisdn,msg:"Success post for "});
              ////console.log("[POSTING RESPONSE]- Success post for "+postJson.msisdn);
            }
          }catch (e) {
            ////console.log("[POSTING RESPONSE]-Exception");
            //insertError("posting_exception",{response : data, msisdn: postJson.msisdn});
          }

          if (next) {
              next();
          }
      });
  });
}




//repeat to check for last row
var last_row=0;
function checkForLastRow(next){
  var timeOut = setTimeout(function(){
    if (row_count != last_row) {
      checkForLastRow(next);
      last_row = row_count;
    }else{
      ////console.log("Write error in error file.Wait for moment");
      ////console.log(ERROR_LOG);
      //console.log("final out put",next,row_count ,last_row);
      row_count = last_row = 0;
      clearTimeout(timeOut);
      next(ERROR_LOG);
    }
  },2000);
}

//copy of util validation 
function validateListing(listing){
  
  var error_list = [];

  var p = catdetails[listing.category];
    
    // check the essentials like msisdn transactiontype and category
    if(!p){
      error_list.push({field:"category",value:p, errormessage:"invalid category",list:listing});
      return error_list;
    }

    if(!listing.msisdn && !listing.email && !listing.userid){
        error_list.push({field:"msisdn" ,value:listing.msisdn,errormessage:"msisdn missing for ",list:listing});
        return error_list;
    }


    if(!listing.channel){
        error_list.push({field:"channel",value:listing.channel ,errormessage:"invalid channel for ",list:listing});
        return error_list;
    }

    if((!listing.transactiontype)||((listing.transactiontype!=="seek")&&(listing.transactiontype!=="post"))){
        
        error_list.push({field:"transactiontype",value:listing.transactiontype ,errormessage:"transactiontype needs to be seek or post for ",list:listing});
        
        return error_list;
    }

    // check the category bits now
    var skip=[];
    _.each(p, function(item){
        if(_.indexOf(skip, item.field)!==-1){
          return [];
        }

        if(item.modes){
          if(item.modes.toLowerCase().indexOf(listing.channel.toLowerCase())===-1){
              return [];
          }
        }
        
        if((item.showfor)&&(item.showfor.indexOf(listing.transactiontype)===-1)){
          return [];
        }

        // Cecking if any of the fields are complex objects rather than strings.
        if(listing[item.field]){
          if((typeof listing[item.field] !== "string")&&(typeof listing[item.field] !== "number")){
             error_list.push({field:item.field,value:listing[item.field] ,errormessage:"needs to be a simple string and not an array or object for ",list:list});
          }
        }

        // check for mandatory
        if((item.mandatory)&&(item.mandatory==="true")){
          // shows
          if(!listing[item.field]){
            error_list.push({field:item.field ,value:listing[item.field],errormessage: item.field+" not found",list:listing});
          }else if((""+listing[item.field]).length < 1){
            error_list.push({field:item.field,value:listing[item.field] ,errormessage: item.field+" is empty",list:listing});
          }
        }

        if((item.validation)&&(listing[item.field])){
          if(item.validation==="numeric"){
            if(!isNumeric(listing[item.field])){
              error_list.push({field:item.field,value:listing[item.field] ,errormessage:item.field+" is not numeric",list:listing});
            }
          } else if(item.validation==="alphanumeric"){
            if(!isAlphaNumeric(listing[item.field])){
              error_list.push({field:item.field,value:listing[item.field] ,errormessage:item.field+" is not alphanumeric (can contain alphabet, numbers, hyphen, comma, period and underscore)",list:listing});
            }
      }
    }

    if((listing[item.field])&&(item.type.substring(0,1) === "#")){
      var reff = lookups[item.type.substring(1)];
      var lookup = _.findWhere(reff, {id:listing[item.field]});
      if(!lookup){
        error_list.push({field:item.field,value:listing[item.field] ,errormessage:item.field+ " is not valid",list:listing});
      }else {
        if(lookup.skip){
          try{
            skip=skip.concat(lookup.skip);
          }catch (e) {}
        }
      }
    }
    if((item.mandatory === "true") && (item.depends)&&(item.depends!=="none")&&(item.depends!=="false")){
      var reff = lookups[item.type.substring(1)];
      var dep = listing[item.depends];
      var lookup = _.findWhere(reff, {id:listing[item.field], parent:dep});
      if(!lookup){
        error_list.push({field:item.field,value:listing[item.field] ,errormessage:item.field+" dependency not met",list:listing});
      }
    }
  });
    
  return error_list;
}
function isNumeric(n){
  if(!/^[0-9.,-]+$/.test(n)){
    return false;
  }
  try {
    return !isNaN(parseFloat(n)) && isFinite(n);
  } catch (e) {
    return false;
  }
}

function isAlphaNumeric(str){
  if(/^[a-zA-Z0-9-_\ ]+$/.test(str)){
    return true;
  } else {
    return false;
  }
}

function insertError(id,msg){
  if(!ERROR_LOG[id]){
    ERROR_LOG[id] = new Array();
  }
  try{
    msg = JSON.stringify(msg);
  }catch(e){}
  
  if (ERROR_LOG[id].indexOf(msg) === -1) {
    ERROR_LOG[id].push(msg);  
  };
}

function getKeyFormList(data, search_key){
  var item_key = "";

  _.each(data,function(value,key){
     if (value.indexOf(search_key) > -1) {
       item_key = key;
     };
  });

  return item_key;
}

function getKeyType(search_key){
  var key_type = "";

  _.each(etl_config["key_type_config"],function(value,key){
     if (value.indexOf(search_key) > -1) {
      //console.log("key",search_key,key,value);
       key_type = key;
     };
  });

  return key_type;
}

function deleteList(postJson){
  var json = {fields:"extid",values:postJson["extid"]};

  rest.postJson(etl_config["system_config"]["getlistforfield"], json).once('complete', function(response) {
      var data = JSON.parse(response);

      if (data.status === "error") {
        error_list.push({id:postJson["extid"] ,errormessage:response.msg});
      } else{
          rest.del(etl_config["system_config"]["deletelist"]+"?id="+resonse.msg.id).once('complete', function(d_response) {
              ////console.log(d_response);
          });
      };
  });
}


function calDate(index, value, key, postJson){
  switch(index){
    case 0:
        postJson[key]=new Date(value);
      break;
    case 1:
      postJson[key]=new Date(value.slice(2,4)+" "+value.slice(0,2)+" "+value.slice(4,value.length));
      break;
    case 2:
      postJson[key]=new Date(value.slice(0,2)+" "+value.slice(2,4)+" "+value.slice(4,value.length));
      break;
    case 3:
      var tmp = value.split("-");
      postJson[key]=new Date(tmp[1]+" "+tmp[0]+" "+tmp[2]);
      break;
    default:
      postJson[key]= isNaN(Date.parse(value))? new Date(Date.parse(value)) :new Date(Date.parse(value))
  }
}

function insertTitileAndDesc(postJson,type,next){
  var miss = etl_config["missing_field"][type];

  if(!postJson["title"]) {
    postJson["title"] = ""
    _.each(miss["title"],function(item){
      postJson["title"] = postJson["title"] + postJson[item];
    });
  };

  if(!postJson["desc"]) {
    postJson["desc"] = ""
    _.each(miss["desc"],function(item){
      var tmp = postJson[item] == "N/A" ? "":postJson[item];
      postJson["desc"] = postJson["desc"] + tmp;
    });
  };
  next();
}

function imageUpload(postJson,path,next){
    // console.log("postjson",postJson);
    var tmp = [];
    var thumbnil = null;
    var imgUrl = path+"/image/";
    _.each(postJson["images"],function(item,index){
       var formData = {
            my_file: fs.createReadStream(imgUrl+item)
        };    
        request.post({url:'http://54.229.146.161/media/upload', formData: formData}, function optionalCallback(err, httpResponse, body) {
            if (err) {
                console.error('upload failed:', err);
            }
            console.log('Upload successful!  Server responded with:', body);

            if (body) {
              body = JSON.parse(body);
              tmp.push(body.url);
              thumbnil = body.thumbnail;
            };
            if(postJson["images"].length-1==index){
              postJson["images"] = tmp;
              postJson["thumbnail"] = thumbnil;
              next();          
            }
        });
      //console.log(formData);
    });
    
    

}