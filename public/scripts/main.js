function resetAll(){
	$("#error_msg").html("");
}

function ValidateFile(that){
	var val = $('#js-upload-files').val();
		if (val.indexOf(".zip") != -1) {
			return true;
		};
		$("#errormsg").html("<span>Only Zip File Accepted</span>");
		return false;
}

function loadUploadedData(id,type){
	$.ajax({
		url : '/users/data',
		dataType : 'json',
		contentType: "application/json; charset=utf-8",
		type : 'POST',
		data:JSON.stringify({type:type}),
		success : function(data){
			var list = "";
			var alist = ["type","_id","path","user","channel","catagory"];
			var blist = ["type","_id","path","user","status","catagory"];
			
			for(var i=0;i<data.length;i++){
				list+="<li class='list-group-item'>";
				
				$.each(data[i],function(key,value){
					var dat = new Date(value) == "Invalid Date" ? value : new Date(value);
					if(alist.indexOf(key) == -1 && id==='list'){
						list+="<span id='keys'>"+key+":-"+"</span><span>"+dat+","+"</span>&nbsp;";
					} else if(blist.indexOf(key)== -1 && id==='wrapper'){
						list+="<span id='keys'>"+key+":-"+"</span><span>"+dat+","+"</span>&nbsp;";
					}
				});
				
				if(id==='wrapper'){
					list+="|&nbsp;<a href='/#/report?id="+data[i]["_id"]+"'>Report</a></li>";
				}else if(id==='list'){
					list+="|&nbsp;<a href='#' onclick='deleteRecord(\""+data[i]["_id"]+"\")'>Delete</a></li>";
				}
			};

			list = list == ""?"<span>Record not found</span>":"<ul class='list-group'>"+list+"</ul>";
			$("#"+id).html(list);
		},
		error : function(){
			console.log('problem in get request');
		}

	});
}


function showPanel(classs) {
	$("."+classs).toggle(200);
}

function deleteRecord(id){
	$.ajax({
		url:'/deleteRecord?id='+id,
		dataType : 'text',
		contentType: "application/json; charset=utf-8",
		type : 'DELETE',
		success : function(result){
			changeUrl("/cp-profile");
		},
		error : function(){
			console.log("error");
		}
	});
}

function changeStatus(id){
	$.ajax({
		url : '/updateRecord?id='+id,
		dataType : 'text',
		contentType: "application/json; charset=utf-8",
		type : 'PUT',
		success : function(result){
			// console.log("updated"+result);
				$('.dialog').load('/views/report.html',function(){
					showListing(id);
				}).removeClass("hidden");
		},
		error : function(){
			console.log("error");
		}
	});
}


function loadUserProfile(data,next){
	var app = etlApp;
	console.log(data);
	if (data.status == "success") {
		app.user.type = data.type;
		app.auth = true;
		app.errorMessage = "SuccessFully Login";
		var type = data.type == "cp" ? "cp-profile":"msp-team";
		$("#logout").html("<a href='/logout' class='btn btn-default'>LogOut</a>");
		changeUrl("/"+type);
	}else{
		app.auth = false;
		app.errorMessage = "Authentication Fail";
		if(next) next();
	};
}

//change url 
function changeUrl(url){
	location.hash = url;
}
//load page
function loadPage(page,next){
	$("#content").load(page,function(){
		if (next)
			next();
	});
}
