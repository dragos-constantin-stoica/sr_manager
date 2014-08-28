//users		

var changed_id = [];

var userstable = {	
	usersdata : [],	
	asmuserslist: [""],
	layout: {
			view:"treetable",
			id: "userstable",
			//autoconfig:true,
			columns:[
			{ id:"id",       header: "id", hidden:true, width: 50},
			{ id:"rev",       header: "rev", hidden:true, width: 50},
			{ id:"username", header:["Nume utilizator",{content:"textFilter"}], width:300, fillspace:true},
			{ id:"password", header:"Parola", hidden:true, editor:"text", width:100},		
			{ id:"name",     header:["Preume",{content:"textFilter"}], editor:"text", width:200},
			{ id:"surname",  header: ["Nume",{content:"textFilter"}], editor:"text", width:200},
			{ id:"boss_asm", header:["Nume şef SR (e un ASM)", {content:"textFilter"}], editor:"text" , 
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
			drag:"row",
			editable:true,
			select:"row",
			navigation:true,
			on:{
				onAfterEditStop:function(state, editor, ignoreUpdate){
					if(state.value != state.old){
						var sel = $$('userstable').getSelectedId();
						var row = $$('userstable').getItem(sel.row);
						if(changed_id.indexOf(row["id"]) == -1) changed_id.push(row["id"]);
					    //webix.message("Row " + row["id"] + " was changed");
					} 
				}
			}
	},
	
	usersmenu: {
		view:"toolbar",
		    id:"userstoolbar",
		    cols:[
			{ view:"button", id:"passworduser",    type:"iconButton", icon:"key",    label:"Scrimbă parola", width:150, click:"password_user();" },
			{ view:"button", id:"newuser",    type:"iconButton", icon:"plus",    label:"Crează utilizator", width:150, click:"new_user();" },
			{ view:"button", id:"groupbyasm", type:"iconButton", icon:"indent",  label:"Grupează ASM",      width:150, click:"group_by_ASM();" },
			{ view:"button", id:"ungroup",    type:"iconButton", icon:"outdent", label:"Afişează normal",   width:150, click:"ungroup_user();" },
			{ view:"button", id:"saveuser",   type:"iconButton", icon:"save",    label:"Salvează datele",   width:150, click:"save_user();" }
		]
	
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
					{ id:"rev",       header: "rev", hidden:true, width: 50},
					{ id:"username", header:["Nume utilizator",{content:"textFilter"}], width:300, fillspace:true},
					{ id:"password", header:"Parola", hidden:true, editor:"text", width:100},		
					{ id:"name",     header:["Preume",{content:"textFilter"}], editor:"text", width:200},
					{ id:"surname",  header: ["Nume",{content:"textFilter"}], editor:"text", width:200},
					{ id:"boss_asm", header:["Nume şef SR (e un ASM)", {content:"textFilter"}], editor:"select" , options:this.asmuserslist,
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
					drag:"row",
					editable:true,
					select:"row",
					navigation:true,
					on:{
						onAfterEditStop:function(state, editor, ignoreUpdate){
							if(state.value != state.old){
								var sel = $$('userstable').getSelectedId();
								var row = $$('userstable').getItem(sel.row);
								if(changed_id.indexOf(row["id"]) == -1) changed_id.push(row["id"]);
							    //webix.message("Row " + row["id"] + " was changed");
							} 
						}
					}
			};
			this.usersmenu = {
				view:"toolbar",
				    id:"userstoolbar",
				    cols:[
					{ view:"button", id:"passworduser",    type:"iconButton", icon:"key",    label:"Scrimbă parola", width:150, click:"password_user();" },
					{ view:"button", id:"newuser",    type:"iconButton", icon:"plus",    label:"Crează utilizator", width:150, click:"new_user();" },
					{ view:"button", id:"groupbyasm", type:"iconButton", icon:"indent",  label:"Grupează ASM",      width:150, click:"group_by_ASM();" },
					{ view:"button", id:"ungroup",    type:"iconButton", icon:"outdent", label:"Afişează normal",   width:150, click:"ungroup_user();" },
					{ view:"button", id:"saveuser",   type:"iconButton", icon:"save",    label:"Salvează datele",   width:150, click:"save_user();" }
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
					{ id:"name",     header:["Preume",{content:"textFilter"}], editor:"text", width:200},
					{ id:"surname",  header: ["Nume",{content:"textFilter"}], editor:"text", width:200},
					{ id:"boss_asm", header:"Nume şef SR (e un ASM)",	width:300},
					{ id:"roles_admin", header:"ADMIN", hidden:true, width:0, template:"{common.checkbox()}"},
					{ id:"roles_guest", header:"Guest", hidden:true, width:0, template:"{common.checkbox()}"},			
					{ id:"roles_asm",   header:"ASM",   hidden:true, width:0, template:"{common.checkbox()}"},
					{ id:"roles_sr",    header:"SR",    hidden:true, width:0, template:"{common.checkbox()}"},		
					{ id:"active",      header:"Activ", hidden:true, width:0, template:"{common.checkbox()}"}
					],
					editable:true,
					select:"row",
					navigation:true,
					on:{
						onAfterEditStop:function(state, editor, ignoreUpdate){
							if(state.value != state.old){
								var sel = $$('userstable').getSelectedId();
								var row = $$('userstable').getItem(sel.row);
								if(changed_id.indexOf(row["id"]) == -1) changed_id.push(row["id"]);
							    //webix.message("Row " + row["id"] + " was changed");
							} 
						}
					}
			};
			this.usersmenu = {
				view:"toolbar",
				    id:"userstoolbar",
				    cols:[
					{ view:"button", id:"passworduser",    type:"iconButton", icon:"key",    label:"Scrimbă parola", width:150, click:"password_user();" },
					{ view:"button", id:"saveuser",   type:"iconButton", icon:"save",    label:"Salvează datele",   width:150, click:"save_user();" }
				]
	
			};
		};
		
		if(role == 'roles_sr'){
			this.layout = {
					view:"treetable",
					id: "userstable",
					//autoconfig:true,
					columns:[
					{ id:"id",       header: "id", hidden:true, width: 50},
					{ id:"rev",       header: "rev", hidden:true, width: 50},
					{ id:"username", header:"Nume utilizator", width:300, fillspace:true},
					{ id:"password", header:"Parola", hidden:true, editor:"text", width:100},		
					{ id:"name",     header:"Preume", width:200},
					{ id:"surname",  header: "Nume",  width:200},
					{ id:"boss_asm", header:"Nume şef SR (e un ASM)", width:300},
					{ id:"roles_admin", header:"ADMIN", hidden:true, width:0, template:"{common.checkbox()}"},
					{ id:"roles_guest", header:"Guest", hidden:true, width:0,  template:"{common.checkbox()}"},			
					{ id:"roles_asm",   header:"ASM",   hidden:true, width:0,  template:"{common.checkbox()}"},
					{ id:"roles_sr",    header:"SR",    hidden:true, width:0,  template:"{common.checkbox()}"},		
					{ id:"active",      header:"Activ", hidden:true, width:0,  template:"{common.checkbox()}"}
					],
					select:"row",
					navigation:true,
					on:{
						onAfterEditStop:function(state, editor, ignoreUpdate){
							if(state.value != state.old){
								var sel = $$('userstable').getSelectedId();
								var row = $$('userstable').getItem(sel.row);
								if(changed_id.indexOf(row["id"]) == -1) changed_id.push(row["id"]);
							    //webix.message("Row " + row["id"] + " was changed");
							} 
						}
					}
			};
			this.usersmenu = {
				view:"toolbar",
				    id:"userstoolbar",
				    cols:[
					{ view:"button", id:"passworduser",    type:"iconButton", icon:"key",    label:"Scrimbă parola", width:150, click:"password_user();" },
					{ view:"button", id:"saveuser",   type:"iconButton", icon:"save",    label:"Salvează datele",   width:150, click:"save_user();" }
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
				
				var sel = $$('userstable').getSelectedId();
				var row = $$('userstable').getItem(sel.row);
				row["password"] = $$('newpassword').getValue(); 
				$$('userstable').updateItem(sel.row, row);
				if(row["rev"] != "new" && changed_id.indexOf(row["id"]) == -1) changed_id.push(row["id"]);
				
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
//save to couchdocument in loreal_app
//update _security in loreal_app
//update _users
function save_user(){
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
	        console.log( $$('userstable').getItem(row));
			var user_row = $$('userstable').getItem(row);
			//populate mandatory fields
			if (webix.isUndefined(user_row.roles_admin)) user_row.roles_admin = false;
			if (webix.isUndefined(user_row.roles_asm)) user_row.roles_asm = false;
			if (webix.isUndefined(user_row.roles_guest)) user_row.roles_guest = false;
			if (webix.isUndefined(user_row.roles_sr)) user_row.roles_sr = false;
			if (webix.isUndefined(user_row.active)) user_row.active = false;
			/*
			$.couch.session({
			    success: function(data) {
			        console.log(data);
			    }
			});
			*/
			//add admins to _security on loreal_app
			if(user_row.roles_admin && user_row.active){
				security_obj.admins.names.push(user_row.username);
			}
			
			//create all users
			if (user_row.rev == "new"){
				//new user
				var doc = {};
				doc.doc_type = "user";
				doc.username = user_row.username;
				doc.roles_admin = user_row.roles_admin;
				doc.roles_asm = user_row.roles_asm;
				doc.roles_guest = user_row.roles_guest;
				doc.roles_sr = user_row.roles_sr;
				doc.boss_asm = user_row.boss_asm;
				doc.name = user_row.name;
				doc.surname = user_row.surname;
				doc.active = user_row.active;
				$.couch.db("loreal_app").saveDoc(doc, {
				    success: function(data) {
				        //console.log(data);
				    },
				    error: function(status) {
				        console.log(status);
				    }
				});
				//create user in _users
				if(!webix.isUndefined(user_row.password)){
					var userDoc = {
					    password: user_row.password,
					    username: user_row.username
					};
					//create user in _users
					worker.postMessage({'cmd': 'newUser', 'msg': userDoc});	
				}
			};
			
			//update existing user
			if(changed_id.indexOf(user_row.id) != -1 && user_row.rev != "new"){
				//existing user, update
				var doc = {};
				doc.doc_type = "user";
				doc._id = user_row.id;
				doc._rev = user_row.rev;
				doc.username = user_row.username;
				doc.roles_admin = user_row.roles_admin;
				doc.roles_asm = user_row.roles_asm;
				doc.roles_guest = user_row.roles_guest;
				doc.roles_sr = user_row.roles_sr;
				doc.boss_asm = user_row.boss_asm;
				doc.name = user_row.name;
				doc.surname = user_row.surname;
				doc.active = user_row.active;
				//User auto/self deactivated 
				if(!user_row.active && user_row.username == USERNAME.username) FORCE_LOGOUT = true;
				
				$.couch.db("loreal_app").saveDoc(doc, {
				    success: function(data) {
				        console.log(data);
				    },
				    error: function(status) {
				        console.log(status);
				    }
				});
				//update _users with new password
				if(!webix.isUndefined(user_row.password)){
					//user must login again
					if(user_row.username == USERNAME.username) FORCE_LOGOUT = true;
					var userDoc = {
					    password: user_row.password,
					    username: user_row.username
					};
					worker.postMessage({'cmd':'setPassword', 'msg':userDoc});
				}
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
	
	//refresh user data
	//Check again if any information changed
	webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_users?key=[\""+ USERNAME.username  +"\"]", 
		function(couchdoc){

			//Prepare data according to user roles
			var userdoc = (JSON.parse(couchdoc)).rows[0].value;
			if(!userdoc.active){
				//Automatically log out inactive users
				logoutOnClick();
			}else{
				//Set session information
				webix.storage.session.remove('USERNAME');
				webix.storage.session.put('USERNAME', userdoc);	
				USERNAME = webix.storage.session.get('USERNAME');
				
				async.series([
					//Get asm list
					function(callback){
						webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_asm", 
							function(couchdoc){
								asmuserslist = [""];
								var userdoc = (JSON.parse(couchdoc)).rows;
								for(var i = 0; i < userdoc.length; i++){
									asmuserslist.push(userdoc[i].key[0]);
								}
								userstable.setASMList(asmuserslist);
								callback(null,"ASM list loaded");
							}
						);
					},
					//Get users
					function(callback){																	
						if(USERNAME.roles_admin){
							//Get all users
							webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_users", 
								function(couchdoc){
									usersdata = [];
									var userdoc = (JSON.parse(couchdoc)).rows;
									for(var i = 0; i < userdoc.length; i++){
										usersdata.push(userdoc[i].value);
									}
									userstable.setUsersData(usersdata);
									callback(null,"Admin users loaded");
								}
							);

						}else{
							if (USERNAME.roles_asm){
								//Get own profile and subordinates
								usersdata = [];
								usersdata.push(USERNAME);
								webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/asm_tree?key=[\""+ USERNAME.username  +"\"]", 
									function(couchdoc){
										var userdoc = (JSON.parse(couchdoc)).rows;
										for(var i = 0; i < userdoc.length; i++){
											usersdata.push(userdoc[i].value);
										}
										userstable.setUsersData(usersdata);
										callback(null,"ASM users loaded");
									}
								);
							}else{
								if(USERNAME.roles_guest || USERNAME.roles_sr){
									//Get own profile only
									usersdata = [];
									usersdata.push(USERNAME);
									userstable.setUsersData(usersdata);
									callback(null,"Guest/SR users loaded");
					
									//Activate toolbar items
									//Load outlets
									//Load scheduler events
								}
							}
						}
					},
					//Get SR list
					function (callback) {
						var srlist = ["[- NEALOCAT -]"];
						webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_sr", 
							function(couchdoc){
								var userdoc = (JSON.parse(couchdoc)).rows;
								for(var i = 0; i < userdoc.length; i++){
									srlist.push(userdoc[i].value.username);
								}
								outletstable.setSRList(srlist);
								callback(null,srlist);
							}
						);
					},
					//Get outlets
					function(callback){
						var outletsdata = [];
						webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/OUTLETS", 
							function(couchdoc){
								outletsdata = (JSON.parse(couchdoc)).data;
								outletstable.setOutletsData(outletsdata);
								callback(null,outletsdata);
							}
						);
					},
					//refresh all interface and show userstable
					function(callback){
						var role = (USERNAME.roles_admin?'roles_admin':(USERNAME.roles_asm?'roles_asm':((USERNAME.roles_sr || USERNAME.roles_guest)?'roles_sr':'')));
						mainlayout.setToolbar(role);
						userstable.setUsersTable(role);
						
						if(!webix.isUndefined($$('main'))) $$('main').destructor();
						//load the interface
						logic.main();
						usersOnClick();
					}],
					function(err, result){
						if(err) console.log("Error: " + err);
						webix.message("Datele au fost salvate cu succes!");
					}
				);
				
				
			}
		}
	);
	
};
