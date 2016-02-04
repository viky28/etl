var msp_team = {};

msp_team.loadMSPProfile = function(){
	loadUploadedData("wrapper","cp");
}
msp_team.loadreport = function(id){
	id = id.split("=")[1];
	showListing(id);
}

function showListing(id){
	$.ajax({
		url : '/showReport',
		type : 'POST',
		dataType : 'json',
		contentType: "application/json; charset=utf-8",
		data:JSON.stringify({id:id}),
		success : function(data){
			//console.log("tpe",typeof(data));
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
				list+="</tbody></table>";
				var count = "<span class='count-report'>Total : "+data["totalCount"]+"</span></br><span style='color:red' class='count-report'>Errors : "+data["errorCount"]+"</span>";
				$('#showDetails').html(count+"</br>"+list);
				var repo_list="<h1>Data Report</h1>"+
							"<a href='/downloadReport?id="+id+"'>Download</a>"+
							"<a href='/#/msp-team'>cancel</a>"+
							"<a href='/uploadReport?id="+id+"'>upload</a>";
				$('#repo').html(repo_list);
				setTimeout(function(){
					$('#repo').html(repo_list);	
					$('#showDetails').html(count+"</br>"+list);
				},1000);
				//console.log(count,list,repo_list);

		},
		error : function(){
			console.log("error");
		}
	});
}