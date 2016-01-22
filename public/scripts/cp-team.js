var cp_team = {};

cp_team.loadCpProfile = function(){
	showTreeView();
	loadUploadedData("list","cp");
}



function showUploads(){
	var url="/uploadFile";
	var data=
	$.ajax({
			url:url,
			type:'POST',
			dataType:'text',
			data:data,
		success : function(data){

		},
		error : function(){

		}
	});
}


//show tree shot
function showTreeView(){
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

			$("#treeview").jstree({
				'core' : {
					'data':data
				}
			});
		},
		error : function(){

		}
	});
}
