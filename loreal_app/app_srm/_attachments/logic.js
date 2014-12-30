//check if user has session information in storage
var USERNAME = null;
var logic = {
	init : function(){
		USERNAME = webix.storage.session.get('USERNAME');
		if(USERNAME){
			logic.init_data();
		}else{
			logic.login();
		}
	},
				
	init_data: function(){
		//TODO - Get events for corresponding user(s)
		//Get user document		
		USERNAME = webix.storage.session.get('USERNAME');
		
		//Check again if any information changed
		webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_users?key=[\""+ USERNAME.username  +"\"]", 
			function(couchdoc){

				//Prepare data according to user roles
				var userdoc = (JSON.parse(couchdoc)).rows[0].value;
				if(!userdoc.active){
					//Automatically log out inactive users
					logoutOnClick();
					return ;
				}

				//Set session information
				webix.storage.session.remove('USERNAME');
				webix.storage.session.put('USERNAME', userdoc);	
				USERNAME = webix.storage.session.get('USERNAME');
				
				async.series([
					//Get user list
					function(callback){
			
						var role = (USERNAME.roles_admin ? 'admin':(USERNAME.roles_asm ? 'asm':(USERNAME.roles_sr ? 'sr':'guest')));
						//Get users
						userstable.setURL("proxyCouchDB->../users/_list/user_list/all_users?username="+USERNAME.username+"&roles="+role);
						userDataStore.setURL(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_list/user_data/all_users?roles="+role);
						userDataStore.loadData(callback);
							
					},
					//Get outlets
					function(callback){
						var outletsdata = [];
						webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/OUTLETS", 
							function(couchdoc){
								outletsdata = (JSON.parse(couchdoc)).data;
								outletstable.setOutletsData(outletsdata);
								agenda.setOutlets(outletsdata);
								callback(null,outletsdata);
							}
						);
					},
					//Get SR Report Template
					function(callback){
						var sereporttemplate = [];
						webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/ACTIVITIES", 
							function(couchdoc){
								srreporttemplate = (JSON.parse(couchdoc)).data;
								activitytable.setFormularRaportSR(srreporttemplate);
								callback(null,srreporttemplate);
							}
						);	
					},
					//get events
					function(callback) {
						var events_data = [];
						webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/events/_view/all_events",
							function(couchdoc) {
								var userdoc = (JSON.parse(couchdoc)).rows;
								for(var i = 0; i < userdoc.length; i++){
									userdoc[i].value.id = userdoc[i].value._id;
									events_data.push(userdoc[i].value);
								}
								agenda.setEventsData(events_data);
								callback(null, events_data);
							}
						);
					},
					//build user interface according to role(s)						
					function(callback){
						var role = (USERNAME.roles_admin ? 'roles_admin':(USERNAME.roles_asm ? 'roles_asm':((USERNAME.roles_sr || USERNAME.roles_guest) ? 'roles_sr':'')));
						mainlayout.setToolbar(role);

						//Get asm list
						userstable.setASMList(userDataStore.getASMUserList());
						userstable.setUsersTable(role);

						//Get SR List
						outletstable.setSRList(userDataStore.getSRUserList());

						//Set users in Agenda
						agenda.setUsers(userDataStore.getUserList());
						
						//load the interface
						logic.main();
						webix.message(USERNAME.name + " " + USERNAME.surname + "<br/>Bine aţi venit în aplicaţia SR Manager!");						
						
						callback(null,"interface init done!");
					}
					],
					// optional callback
					function(err, results){
						//console.log(results);
						if(err) console.log("Error: " + err);
					}
				);
					
			
			}
		);	
		
	},
	
	login: function	() {
		if(!webix.isUndefined($$('main'))) $$('main').destructor();
		var loginform = {
				id: "loginform",			
				view:"form", 
				width:400,

				elements:[
					{ view:"text", type:"email", label:"Email", name:"email", placeholder:"user@loreal.com", value:""},
					{ view:"text", type:'password', label:"Parola", name:"password", value:""},
					{ view:"button", label:"Login" , type:"form", click:function(){
						if (! this.getParentView().validate())
							webix.message({ type:"error", text:"E-mail sau parola nu sunt valide!" });
						else{						
							$.couch.login({
							    name: $$('email').getValue(),
							    password: $$('password').getValue(),
							    success: function(data) {
							        console.log(data);
							        //TODO - register userCtx in session
									webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_users?key=[\""+ data.name  +"\"]", 
										function(couchdoc){

											//Prepare data according to user roles
											var userdoc = (JSON.parse(couchdoc)).rows[0].value;
											if(!userdoc.active){
												//Automatically log out inactive users
												logoutOnClick();
											}else{
												$$("loginform").hide();
												//Set session information
												webix.storage.session.put('USERNAME', userdoc);
												logic.init_data();
											}
										}
									);								
							    },
							    error: function(status) {
									webix.message({type:"error", text:"E-mail sau parola nu sunt valide!"});
							        //console.log(status);
							    }
							});
						}
					 }
					},
					{ rows:[ 
						//TODO - trimite mesaj catre ADMIN pentru resetare parola
					        { template:"Reiniţializare parola", type:"section"},
					        { view:"button", label:"Vreau să reiniţializez parola!", value:'', click:function(){
					        	webix.message({text:"Cererea dumneavoastră va fi tratată cu celeritate!"});
					        } 
							}
						]
					}
				],
				rules:{
					"email":webix.rules.isEmail,
					"password":webix.rules.isNotEmpty
				}
			};
			
		webix.ui({
			view:"window",
			id: "loginwindow",
			width:400,
			position:"top",
			head:"Vă rog să vă autentificaţi!",
			body: webix.copy(loginform)
		}).show();
	},
	
	main : function(){
		if(!webix.isUndefined($$('main'))) $$('main').destructor();
		webix.ui(mainlayout.getMainLayout());
	}
		
};