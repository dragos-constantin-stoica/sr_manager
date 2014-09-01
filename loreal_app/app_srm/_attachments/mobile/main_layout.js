//main menu with all components
var mainlayout = {
	mytoolbar:
	{
		view:"toolbar",
		id:"myToolbar",
		cols:[
			{ view:"button", id:"agenda", type:"iconButton", icon:"calendar", label:"Agenda", click:"agendaOnClick();" },
			{ view:"toggle", id:"offline", type:"iconButton", name:"offline", offIcon:"refresh", onIcon:"cloud", offLabel:"OFFLINE", onLabel:"Online",click:"offlineOnClick();" },
			{ view:"button", id:"logout",type:"iconButton", icon:"sign-out", label:"Logout", click:"logoutOnClick();"}
		]
	
	},
	
	//main layout	
	getMainLayout: function () {
		
		return {
			id: "main",
			type:"clean",
			rows:[
			{
				rows:[
				webix.copy(this.mytoolbar)	
				]
			},
			webix.copy(agenda.getAgenda())
			]
		};
	},
	
	getToolbar: function () {
		return this.mytoolbar;
	},
	
	setToolbar: function (role) {
		//for convenience
		//the toolbar is not changed
	}
};

function agendaOnClick () {
	//Planner is loaded by default, do not create a new instance and do not unload/destroy it
	$$('viewstoolbar').show();
	$$('z').show();
	//$$('planner').show();
	//$$('planner').resize(true);
};
function offlineOnClick() {
	var state = $$("offline").getParentView().getValues();
	//get by name attribute
	//1 is on, 0 is off
	if (state.offline == 1){
		//we are back online, sync data
		webix.alert({
		    title: "Online",
		    text: "Acum treceţi în modul Online.<br/>Conexiunea de date trebuie să fie activată!",
		    type:"alert-warning",
			ok: "OK",
			cancel:"Anulează",
			callback: function(result){
				if(result){
					OFFLINE = false;
					$$("logout").enable();
				}
			}
		});
		
	}else{
		//we go offline, sync only local data
		webix.alert({
		    title: "!!! OFFLINE !!!",
		    text: "Acum treceţi în modul OFFLINE.<br/>După sincronizare puteţi închide conexiunea de date!",
		    type:"alert-warning",
			ok: "OK",
			cancel:"Anulează",
			callback: function(result){
				if(result){
					OFFLINE = true;	
					$$("logout").disable();
				}
			}
		});
	}
	
	//console.log("Button state:" + state.offline);
	
};
function logoutOnClick(){
	$.couch.logout({
	    success: function(data) {
	        console.log(data);
			webix.storage.session.remove('USERNAME');			
			if(!webix.isUndefined($$('loginform'))) $$('loginform').destructor();
			if(!webix.isUndefined($$('main')))$$('main').destructor();
			logic.init();
	    }
	});
};

