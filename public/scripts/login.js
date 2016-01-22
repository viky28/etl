var login = {
	errroMessage:{
		"userid":"Please enter your name",
		"password":"Please enter your password",
		"optradio":"Please check one radio button"
	}
};


function processLogin(){
	var errorMessage = "";
	
	errorMessage += $("#loginForm input[name=userid]").val()? "": "<span>"+login["errroMessage"]["userid"]+"</span></br>";
	errorMessage += $("#loginForm input[name=password]").val() !== "" ?"":"<span>"+login["errroMessage"]["password"]+"</span></br>";
	errorMessage += $("#loginForm input[name=optradio]").is(":checked") ? "" : "<span>"+login["errroMessage"]["optradio"]+"</span>";
	
	if (errorMessage == "") {
		$("#errormsg").html(errorMessage).addClass("hidden");
		var selected = $("#loginForm input[name=optradio]:checked")
		var data = {
			userid:$("#loginForm input[name=userid]").val(),
			password:$("#loginForm input[name=password]").val(),
			type:selected.val()
		}
		authenication(etlApp,data);
	}else{
		$("#errormsg").html(errorMessage).removeClass("hidden");
	};
	
}


function authenication(app,data) {
	console.log("Test")
	$.ajax({
		url : '/user/authenticate',
		dataType : 'json',
		contentType: "application/json; charset=utf-8",
		type : 'POST',
		data : JSON.stringify(data),
		success : function(data){
			//data = JSON.parse(data);
			loadUserProfile(data,function(){
				$("#errormsg").html("<span>Unauthrized User</span>").removeClass("hidden");
			});
		},
		error : function(){
			app.auth = false;
			app.errorMessage = "Server problem";
		}
	});
}

