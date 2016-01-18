//$( "#content" ).load( "/views/login.html" );
var authUser = false;
function processLogin(){
	
		var userName = $("#id").val();
    	var password = $("#passwd").val();
    	var type=$('input:radio[name=optradio]:checked').val();
    	
	    	if(userName=="")
				{
					$('#dis').slideDown().html("<span>Please type Username</span>");
						return false;
				}
			if(password=="")
				{
					$('#dis').slideDown().html("<span>Please type Password</span>");
						return false;
				}
			if(!type)
				{
					$('#dis').slideDown().html("<span>Please check one radio button</span>");
						return false;
				}
	    	
    $.ajax({
		url : '/user/authenticate',
		dataType : 'text',
		contentType: "application/json; charset=utf-8",
		type : 'POST',
		data : JSON.stringify({'userid': userName, 'password':password,'type':type }),
		
		success : function(data){
			
			data = JSON.parse(data);
			
			if(data.status==='success' && data.type==='cp'){
				$("#logout").html("<a href='/logout' class='btn btn-default'>LogOut</a>");
				$("#content").load("/views/cp-team.html",function(){
					loadUploadedData("list","cp");
					showTreeView();
					getCatagory();
				});
					
			} else if(data.status==='success' && data.type==='msp') {
				$("#logout").html("<a href='/logout' class='btn btn-default'>LogOut</a>");
				$("#content").load("/views/msp-team.html",function(){
					loadUploadedData("wrapper","cp");
				});
					
			} else if(data.status==='error'){
				$('#msg').slideDown().html('<span>Please enter correct id or password</span>');
			}
			
		 },

		error : function(){
			
			console.log('not logged in');
		}
	});


}

