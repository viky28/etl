var userDetails = {};
$.ajax({
	url : '/users/details',
	dataType : 'text',
	contentType: "application/json; charset=utf-8",
	type : 'GET',
	success : function(data){
		
		data = JSON.parse(data);
			
			if (data.status == "error") {
					$( "#content" ).load( "/views/login.html" );
			} else{
					$("#logout").html("<a href='/logout' class='btn btn-default'>LogOut</a>");
				if(data.type==='cp'){
					$("#content").load("/views/cp-team.html",function(){
						loadUploadedData("list","cp");
						showTreeView();
						getCatagory();
					});
					
				} else if(data.type==='msp') {
					$("#content").load("/views/msp-team.html",function(){
						loadUploadedData("wrapper","cp");
					});
					
				}
			};
	},

	error : function(){
		console.log('problem in get request');
	}
});

function resetAll(){
	$("#error_msg").html("");
}

function ValidateFile(that){
	var val = $('#js-upload-files').val();
		if (val.indexOf(".csv") != -1) {
			return true;
		};
			$("#error_msg").html("Only Csv File Accepted");
			return false;
}

function loadUploadedData(id,type){
	$.ajax({
		url : '/users/data',
		dataType : 'text',
		contentType: "application/json; charset=utf-8",
		type : 'POST',
		data:JSON.stringify({type:type}),
		success : function(data){
			data = JSON.parse(data);
			var list = "<ul class='list-group'>";
				var alist = ["type","_id","path","user","channel","catagory"];
				var blist = ["type","_id","path","user","status","catagory"];
					for(var i=0;i<data.length;i++){
						list+="<li class='list-group-item'>";
							$.each(data[i],function(key,value){
								if(alist.indexOf(key) == -1 && id==='list'){
									list+="<span id='keys'>"+key+":-"+"</span><span>"+value+","+"</span>&nbsp;";
								} else if(blist.indexOf(key)== -1 && id==='wrapper'){
									list+="<span id='keys'>"+key+":-"+"</span><span>"+value+","+"</span>&nbsp;";
								}
							});
							if(id==='wrapper'){
								list+="|&nbsp;<span id='spa' onclick='changeStatus(\""+data[i]["_id"]+"\")'>Report</span></li>";
							}else if(id==='list'){
								list+="|&nbsp;<a href='#' onclick='deleteRecord(\""+data[i]["_id"]+"\")'>Delete</a></li>";
							}
					};
			list+="</ul>";
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
			
			location.reload();
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

function getCatagory(){
	$.ajax({
		url:'/treeview',
		contentType: "application/json; charset=utf-8",
		datatype:'JSON',
		type:'GET',
		success : function(data){
			var cat = "";
			for (var i = 0; i < data.length; i++) {
				cat+="<option value='"+data[i].text+"'>"+data[i].text+"</option>";
			};
			$("#catagory").html(cat);

		},
		error : function(){

		}
	});
}