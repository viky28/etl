function showTreeView(){
$.ajax({
	url:'/treeview',
	contentType: "application/json; charset=utf-8",
	datatype:'JSON',
	type:'GET',
	success : function(data){
		console.log(data);
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
