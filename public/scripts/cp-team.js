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
