//users		

var userstable = {	

	EDITSTOP: false,
	url: "",
	usersdata : [],	
	asmuserslist: [""],
	layout: {
			view:"treetable",
			id: "userstable",
			//autoconfig:true,
			columns:[
			{ id:"id",       header: "id", hidden:true, width: 50},
			{ id:"_id",      header: "_id", hidden:true, width: 50},
			{ id:"_rev",     header: "_rev", hidden:true, width: 50},
			{ id:"username", header:["Nume utilizator",{content:"textFilter"}], width:300, fillspace:true},
			{ id:"password", header:"Parola", hidden:true, editor:"text", width:100},		
			{ id:"name",     header:["Prenume",{content:"textFilter"}], editor:"text", width:200},
			{ id:"surname",  header: ["Nume",{content:"textFilter"}], editor:"text", width:200},
			{ id:"boss_asm", header:["Nume ASM", {content:"textFilter"}], editor:"text" , 
				template:function(obj, common){
							if (obj.$group) return common.treetable(obj, common) + obj.value;
							return obj.boss_asm;
						}, 
				width:300},
			{ id:"roles_admin", header:"ADMIN", width:100, template:"{common.checkbox()}", editor:"checkbox", checkValue:true, uncheckValue:false },
			{ id:"roles_guest", header:"Guest", width:55,  template:"{common.checkbox()}", editor:"checkbox", checkValue:true, uncheckValue:false },			
			{ id:"roles_asm",   header:"ASM",   width:55,  template:"{common.checkbox()}", editor:"checkbox", checkValue:true, uncheckValue:false },
			{ id:"roles_sr",    header:"SR",    width:55,  template:"{common.checkbox()}", editor:"checkbox", checkValue:true, uncheckValue:false },		
			{ id:"active",      header:"Activ", width:55,  template:"{common.checkbox()}", editor:"checkbox", checkValue:true, uncheckValue:false }
			],
			on:{
		        'onAfterAdd': function(obj, index){ console.log("New item added!"); },
		        'onAfterEditStop': function(state, editor, ignoreUpdate){console.log("After edit stop");}
		    },
			drag:"row",
			editable:true,
			select:"row",
			navigation:true,
			save:"proxyCouchDB->../users/_update/user_update"
	},	
	usersmenu: {
		view:"toolbar",
		    id:"userstoolbar",
		    cols:[
				{ view:"button", id:"passworduser",    type:"iconButton", icon:"key",    label:"Scrimbă parola", width:150, click:"password_user();" },
				{ view:"button", id:"newuser",    type:"iconButton", icon:"plus",    label:"Crează utilizator", width:150, click:"new_user();" },
				{ view:"button", id:"groupbyasm", type:"iconButton", icon:"indent",  label:"Grupează ASM",      width:150, click:"group_by_ASM();" },
				{ view:"button", id:"ungroup",    type:"iconButton", icon:"outdent", label:"Afişează normal",   width:150, click:"ungroup_user();" }
			]
	},
	
	setURL: function(url){
		this.url = url;
	},

	getUsersMenu: function () {
		return this.usersmenu;
	},
		
	getUsersTable: function(){
		return this.layout;
	},
	
	setUsersTable:function (role) {
		if(role == 'roles_admin'){
			this.layout = {
					view:"treetable",
					id: "userstable",
					//autoconfig:true,
					columns:[
					{ id:"id",       header: "id", hidden:true, width: 50},
					{ id:"_id",      header: "_id", hidden:true, width: 50},					
					{ id:"_rev",     header: "_rev", hidden:true, width: 50},
					{ id:"username", header:["Nume utilizator",{content:"textFilter"}], width:300, fillspace:true},
					{ id:"password", header:"Parola", hidden:true, editor:"text", width:100},		
					{ id:"name",     header:["Prenume",{content:"textFilter"}], editor:"text", width:200},
					{ id:"surname",  header: ["Nume",{content:"textFilter"}], editor:"text", width:200},
					{ id:"boss_asm", header:["Nume ASM", {content:"textFilter"}], editor:"select" , options:this.asmuserslist,
						template:function(obj, common){
									if (obj.$group) return common.treetable(obj, common) + obj.value;
									return obj.boss_asm;
								}, 
						width:300},
					{ id:"roles_admin", header:"ADMIN", width:100, template:"{common.checkbox()}", editor:"checkbox", checkValue:true, uncheckValue:false },
					{ id:"roles_guest", header:"Guest", width:55,  template:"{common.checkbox()}", editor:"checkbox", checkValue:true, uncheckValue:false },			
					{ id:"roles_asm",   header:"ASM",   width:55,  template:"{common.checkbox()}", editor:"checkbox", checkValue:true, uncheckValue:false },
					{ id:"roles_sr",    header:"SR",    width:55,  template:"{common.checkbox()}", editor:"checkbox", checkValue:true, uncheckValue:false },		
					{ id:"active",      header:"Activ", width:55,  template:"{common.checkbox()}", editor:"checkbox", checkValue:true, uncheckValue:false }
					],
					on:{
				        'onAfterAdd': addUser,
				        'onAfterEditStop': function(state, editor, ignoreUpdate){userstable.EDITSTOP = true;},
				        'onDataUpdate': updateUser
				    },
					drag:"row",
					editable:true,
					select:"row",
					navigation:true,
					url:userstable.url,
					save:"proxyCouchDB->../users/_update/user_update"
			};
			this.usersmenu = {
				view:"toolbar",
			    id:"userstoolbar",
			    cols:[
					{ view:"button", id:"passworduser",    type:"iconButton", icon:"key",    label:"Scrimbă parola", width:150, click:"password_user();" },
					{ view:"button", id:"newuser",    type:"iconButton", icon:"plus",    label:"Crează utilizator", width:150, click:"new_user();" },
					{ view:"button", id:"groupbyasm", type:"iconButton", icon:"indent",  label:"Grupează ASM",      width:150, click:"group_by_ASM();" },
					{ view:"button", id:"ungroup",    type:"iconButton", icon:"outdent", label:"Afişează normal",   width:150, click:"ungroup_user();" }
				]
			};
		};
		
		if(role == 'roles_asm'){
			this.layout = {
					view:"treetable",
					id: "userstable",
					//autoconfig:true,
					columns:[
					{ id:"id",       header: "id", hidden:true, width: 50},
					{ id:"rev",       header: "rev", hidden:true, width: 50},
					{ id:"username", header:["Nume utilizator",{content:"textFilter"}], width:300, fillspace:true},
					{ id:"password", header:"Parola", hidden:true, editor:"text", width:100},		
					{ id:"name",     header:["Prenume",{content:"textFilter"}], editor:"text", width:200},
					{ id:"surname",  header: ["Nume",{content:"textFilter"}], editor:"text", width:200},
					{ id:"boss_asm", header:"Nume ASM",	width:300},
					{ id:"roles_admin", header:"ADMIN", hidden:true, width:0, template:"{common.checkbox()}"},
					{ id:"roles_guest", header:"Guest", hidden:true, width:0, template:"{common.checkbox()}"},			
					{ id:"roles_asm",   header:"ASM",   hidden:true, width:0, template:"{common.checkbox()}"},
					{ id:"roles_sr",    header:"SR",    hidden:true, width:0, template:"{common.checkbox()}"},		
					{ id:"active",      header:"Activ", hidden:true, width:0, template:"{common.checkbox()}"}
					],
					on:{
				        'onAfterAdd': addUser,
				        'onAfterEditStop': function(state, editor, ignoreUpdate){userstable.EDITSTOP = true;},
				        'onDataUpdate': updateUser
				    },
					editable:true,
					select:"row",
					navigation:true,
					url:userstable.url,
					save:"proxyCouchDB->../users/_update/user_update"
			};
			this.usersmenu = {
				view:"toolbar",
				    id:"userstoolbar",
				    cols:[
					{ view:"button", id:"passworduser",    type:"iconButton", icon:"key",    label:"Scrimbă parola", width:150, click:"password_user();" }
				]
	
			};
		};
		
		if(role == 'roles_sr' || role == 'roles_guest' ){
			this.layout = {
					view:"treetable",
					id: "userstable",
					//autoconfig:true,
					columns:[
					{ id:"id",       header: "id", hidden:true, width: 50},
					{ id:"rev",       header: "rev", hidden:true, width: 50},
					{ id:"username", header:"Nume utilizator", width:300, fillspace:true},
					{ id:"password", header:"Parola", hidden:true, editor:"text", width:100},		
					{ id:"name",     header:"Prenume", width:200},
					{ id:"surname",  header: "Nume",  width:200},
					{ id:"boss_asm", header:"Nume ASM", width:300},
					{ id:"roles_admin", header:"ADMIN", hidden:true, width:0, template:"{common.checkbox()}"},
					{ id:"roles_guest", header:"Guest", hidden:true, width:0,  template:"{common.checkbox()}"},			
					{ id:"roles_asm",   header:"ASM",   hidden:true, width:0,  template:"{common.checkbox()}"},
					{ id:"roles_sr",    header:"SR",    hidden:true, width:0,  template:"{common.checkbox()}"},		
					{ id:"active",      header:"Activ", hidden:true, width:0,  template:"{common.checkbox()}"}
					],
					on:{
				        'onAfterAdd': addUser,
				        'onAfterEditStop': function(state, editor, ignoreUpdate){userstable.EDITSTOP = true;},
				        'onDataUpdate': updateUser
				    },
					select:"row",
					navigation:true,
					url:userstable.url,
					save:"proxyCouchDB->../users/_update/user_update"
			};
			this.usersmenu = {
				view:"toolbar",
				    id:"userstoolbar",
				    cols:[
					{ view:"button", id:"passworduser",    type:"iconButton", icon:"key",    label:"Scrimbă parola", width:150, click:"password_user();" }
				]
	
			};
		};
	},
		
	setASMList: function(asmuserslist){
		this.asmuserslist = asmuserslist;
	},
		
	setUsersData: function(usersdata){
		this.usersdata = usersdata;
	},
	
	getUsersData: function(){
		return this.usersdata;
	}
	
};

//password form	
var newpasswordform = {
	id: "newpasswordform",			
	view:"form", 
	width:400,

	elements:[
		{ view:"text", type:'password', label:"Parola", name:"newpassword", value:""},
		{ view:"button", label:"Schimbă parola!" , type:"form", click:function(){
			if (! this.getParentView().validate())
				webix.message({ type:"error", text:"Parola nu este validă!" });
			else{
				userstable.EDITSTOP = true;
				
				var sel = $$('userstable').getSelectedId();
				var row = $$('userstable').getItem(sel.row);
				row["password"] = $$('newpassword').getValue(); 
				$$('userstable').updateItem(sel.row, row);

				$$('new_user').hide();
				$$('newpasswordform').destructor();						
				$$('new_user').destructor();
				webix.message({text:"Parola a fost schimbată!<br/>Salvaţi datele!"});						
			}
		 }
		}
	],
	rules:{
		"newpassword":webix.rules.isNotEmpty
	}
};
function password_user(){
	if ($$('userstable').getSelectedId(true).join()!==""){
		webix.ui({
			view:"window",
			id: "new_user",
			width:400,
			position:"top",
			head:"Parola nouă!",
			body:webix.copy(newpasswordform)
		}).show();
	}else{
		webix.message({type:"error",text:"Selectaţi un utilizator!"});
	}
};

//new user form	
var newuserform = {
	id: "newuserform",			
	view:"form", 
	width:400,

	elements:[
	{ rows:[ { template:"Numele de utilizator nu se mai poate schimba!", type:"clean"}]
	},
		{ view:"text", type:"email", label:"Email", name:"newemail", placeholder:"user@loreal.com", value:""},
		{ view:"text", type:'password', label:"Parola", name:"newpassword", value:""},
		{ view:"button", label:"Utilizator NOU!" , type:"form", click:function(){
			if (! this.getParentView().validate())
				webix.message({ type:"error", text:"E-mail sau parola nu sunt valide!" });
			else{
				//Get email on creation - this is not editable
				$$('userstable').add({rev:"new", 
					username:$$('newemail').getValue(), 
					password:$$('newpassword').getValue(), 
					boss_asm:"", name:"", surname:"",
					roles_admin:false, roles_asm:false, roles_sr:false, roles_guest:true, active:true});
				$$('new_user').hide();
				$$('newuserform').destructor();						
				$$('new_user').destructor();						
			}
		 }
		}
	],
	rules:{
		"newemail":webix.rules.isEmail,
		"newpassword":webix.rules.isNotEmpty
	}
};
function new_user(){
	webix.ui({
		view:"window",
		id: "new_user",
		width:400,
		position:"top",
		head:"Creare utilizator nou!",
		body:webix.copy(newuserform)
	}).show();
};

//Group/ungroup by ASM
function group_by_ASM(){
	$$('userstable').ungroup();
	$$('userstable').group({
		by:"boss_asm"
	});
};
function ungroup_user(){
	$$('userstable').filter();
	$$('userstable').getFilter("boss_asm").value="";
	$$('userstable').ungroup();
};

//Save user information
//TODO - Refresh SR list
//update _users

function addUser (obj, index) {

	console.log("Add user start!");


	var security_obj = {
		"admins": {
		       "names": [],
		       "roles": []
		   },
		   "members": {
		       "names": [],
		       "roles": []
		   }
	};
	var FORCE_LOGOUT = false;

	$$('userstable').eachRow( 
	    function (row){ 
			var user_row = $$('userstable').getItem(row);
			
			//add admins to _security on loreal_app
			if(user_row.roles_admin && user_row.active){
				security_obj.admins.names.push(user_row.username);
			}
			
			//create all users
			if (user_row.username == $$('userstable').getItem(obj).username){
				//new user

				//create user in _users
				if(!webix.isUndefined(user_row.password)){
					var userDoc = {
					    password: user_row.password,
					    username: user_row.username
					};
					//create user in _users
					worker.postMessage({'cmd': 'newUser', 'msg': userDoc});	
				}
				//check for inactive user and log it out
				FORCE_LOGOUT = !user_row.active;
			};
			
	    },
		true
	);
					
	//update _security from loreal_app
	if(USERNAME.roles_admin)
		worker.postMessage({'cmd': 'setSecurity', 'msg': security_obj});

	console.log("Add user end!");
	userstable.EDITSTOP = true;
	if(FORCE_LOGOUT){ 
		logoutOnClick();
	}
}

function updateUser (id, obj, mode) {
	if(!userstable.EDITSTOP){

		console.log("Update user start!");


		var security_obj = {
			"admins": {
			       "names": [],
			       "roles": []
			   },
			   "members": {
			       "names": [],
			       "roles": []
			   }
		};
		var FORCE_LOGOUT = false;

		$$('userstable').eachRow( 
		    function (row){ 
				var user_row = $$('userstable').getItem(row);
				
				//add admins to _security on loreal_app
				if(user_row.roles_admin && user_row.active){
					security_obj.admins.names.push(user_row.username);
				}
								
				//update existing user
				
				//User auto/self deactivated 
				if(!user_row.active && user_row.username == USERNAME.username) FORCE_LOGOUT = true;
				

				//update _users with new password
				if(!webix.isUndefined(user_row.password) && user_row.password.length > 0){
					//user must login again
					if(user_row.username == USERNAME.username) FORCE_LOGOUT = true;
					var userDoc = {
					    password: user_row.password,
					    username: user_row.username,
					    type: "user"
					};
					worker.postMessage({'cmd':'setPassword', 'msg':userDoc});
				}
								
		    },
			true
		);

		//update _security from loreal_app
		if(USERNAME.roles_admin)
			worker.postMessage({'cmd': 'setSecurity', 'msg': security_obj});

		if(FORCE_LOGOUT){ 
			logoutOnClick();
			return;
		}

		console.log("Update user end!");


	}else{
		userstable.EDITSTOP = !userstable.EDITSTOP;
	}
}