//main menu with all components

var maintoolbar = {
	mytoolbar : [
		// text, tooltip, action
		{ id: "users", type: "button", img:"account_functions.png", text: "Utilizatori", title: "Gestionare utilizatori", action: "usersOnClick"},
		{ id: "outlets", type: "button", img:"cart.png",  text: "Magazine", action:"outletsOnClick" },
		{ id: "activity", type: "button", img:"check_boxes_series.png",  text: "Activităţi", action:"activitymanagementOnClick"},
		{ id: "agenda", type: "button", img:"calendar.png",  text: "Agenda", action:"agendaOnClick" },
		{ id: "reports", type: "button", img:"chart_bar.png", text: "Rapoarte" },
		{ id: "messages", type: "button", img:"emails.png",  text: "Mesaje" },
		{ id: "logout", type: "button", img:"disconnect.png", text: "Logout", action:"logoutOnClick"}
	],
	
	setToolbar: function(toolbar) {
		this.mytoolbar = toolbar;
	},

	setRoleToolbar: function(role){
		if(role == "roles_admin"){
			this.mytoolbar = [
				// text, tooltip, action
				{ id: "users", type: "button", img:"account_functions.png", text: "Utilizatori", title: "Gestionare utilizatori", action: "usersOnClick"},
				{ id: "outlets", type: "button", img:"cart.png",  text: "Magazine", action:"outletsOnClick" },
				{ id: "activity", type: "button", img:"check_boxes_series.png",  text: "Activităţi", action:"activitymanagementOnClick"},
				{ id: "agenda", type: "button", img:"calendar.png",  text: "Agenda", action:"agendaOnClick" },
				{ id: "reports", type: "button", img:"chart_bar.png", text: "Rapoarte" },
				{ id: "messages", type: "button", img:"emails.png",  text: "Mesaje" },
				{ id: "logout", type: "button", img:"disconnect.png", text: "Logout", action:"logoutOnClick"}
			];
		}

		if(role == "roles_asm"){
			this.mytoolbar = [
				// text, tooltip, action
				{ id: "users", type: "button", img:"account_functions.png", text: "Utilizatori", title: "Gestionare utilizatori", action: "usersOnClick"},
				{ id: "agenda", type: "button", img:"calendar.png",  text: "Agenda", action:"agendaOnClick" },
				{ id: "reports", type: "button", img:"chart_bar.png", text: "Rapoarte" },
				{ id: "messages", type: "button", img:"emails.png",  text: "Mesaje" },
				{ id: "logout", type: "button", img:"disconnect.png", text: "Logout", action:"logoutOnClick"}
			];
		}

		if(role == "roles_sr"){
			this.mytoolbar = [
				// text, tooltip, action
				{ id: "users", type: "button", img:"account_functions.png", text: "Utilizatori", title: "Gestionare Profil", action: "usersOnClick"},
				{ id: "agenda", type: "button", img:"calendar.png",  text: "Agenda", action:"agendaOnClick" },
				{ id: "reports", type: "button", img:"chart_bar.png", text: "Rapoarte" },
				{ id: "messages", type: "button", img:"emails.png",  text: "Mesaje" },
				{ id: "logout", type: "button", img:"disconnect.png", text: "Logout", action:"logoutOnClick"}
			];
		}
	},
	
	getToolbar: function () {
		return this.mytoolbar;
	}
}


function usersOnClick () {
	showView("userstable");
};
function outletsOnClick (){
	showView("outletstable");
};
function activitymanagementOnClick () {
	showView("activitytable");
};
function agendaOnClick () {
	showView("agenda");
};
function logoutOnClick(){
	$.couch.logout({
	    success: function(data) {
	        //console.log(data);
			sessionStorage.removeItem('USERNAME');
			
			if (typeof dhxWins !== 'undefined' && dhxWins != null && dhxWins.unload != null) {
				dhxWins.unload();
				dhxWins = loginwindow = loginform = null;
			}
			if(typeof layout !== 'undefined' && layout != null && layout.unload != null){
				layout.unload();
				layout = null;
			}
			logic.init();
	    }
	});
};