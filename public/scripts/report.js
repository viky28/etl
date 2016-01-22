function gotoMsp(){
	location.reload();
}

function showListing(id){
	$.ajax({
		url : '/showReport',
		type : 'POST',
		dataType : 'JSON',
		contentType: "application/json; charset=utf-8",
		data:JSON.stringify({id:id}),
		success : function(data){
			 //console.log(data,typeof data)//data = JSON.parse(data);
			 	var list="<table class='table table-bordered'>";
			 	list+="<thead><tr><th>Field</th><th>Value</th><th>ErrorMsg</th><th>ErrorCount</th></tr></thead><tbody>"
				for(item in data){
					//console.log(data[item]);
					
					if (typeof data[item] == "object") {
						list+="<tr class='success'><td rowspan="+(data[item].length+1)+">"+item+"</td></tr>";
						$.each(data[item],function(key,value){
							list+="<tr class='warning'><td>"+(value.value||"not avaible")+"</td><td>"+value.msg+"</td><td>"+value.count+"</td></tr>";
						
						});	
						
					};
					
					
				}
				list+="</tbody>";
				
				list+="</table>";
				$('#showDetails').html(list);
				$('#total').html("Total : "+data["totalCount"]);
				$('#error').html("Errors : "+data["errorCount"]);

		},
		error : function(){
			console.log("error");
		}
	});
}

// function downReport(){
// 	$.ajax({
// 		url : '/downloadReport',
// 		type : 'GET',
// 		dataType : 'text',
// 		contentType: "application/json; charset=utf-8",
// 		success : function(data){
// 			console.log("successfully downloaded")
// 		},
// 		error : function(){
// 			console.log("error");
// 		}
// 	});
// }