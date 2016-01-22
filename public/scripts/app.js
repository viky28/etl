var etlApp = {
	auth:false,
	user:{}
};
etlApp.router = function(){
 	var url = window.location;
 	var hash = url.hash.substring(2).split("?");
 	switch(hash[0]){
 		case "":
 			location.hash = "/home";
 			break;
 		case "login":
 			loadPage("views/login.html");
 			break;
 		case "cp-profile":
 			loadPage("views/cp-team.html",cp_team.loadCpProfile);
 			break;
 		case "msp-team":
 			loadPage("views/msp-team.html",msp_team.loadMSPProfile);
 			break;
 		case "report":
 			loadPage("views/report.html",msp_team.loadreport(hash[1]));
 			break;
 		default:
 			loadPage("views/home.html");
 	}
}

etlApp.checkUser = function(app,next) {
	$.ajax({
		url : '/users/details',
		dataType : 'text',
		contentType: "application/json; charset=utf-8",
		type : 'GET',
		success : function(data){
			data = JSON.parse(data);
			loadUserProfile(data,next);
		},
		error : function(){
			app.auth = false;
			app.errorMessage = "Problem to access server";
			next();
		}
	});
}

$(document).ready(function() { 
	etlApp.router();
	if (!etlApp.auth) {
 		etlApp.checkUser(etlApp,function(){
 			if (!etlApp.auth) {
 				changeUrl("#/login");
 			};
 		});
 	};
 });
$(window).on('hashchange', function(e){
	etlApp.router();
});