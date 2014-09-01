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
				//if user is created by admin and not declared as loreal_app document there are no results
				//TOD check that there is only one record

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
						//Get user list
						function(callback){
				
							if(USERNAME.roles_admin){
								//Get all users
								webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_users", 
									function(couchdoc){
										var usersdata = [];
										var userdoc = (JSON.parse(couchdoc)).rows;
										for(var i = 0; i < userdoc.length; i++){
											usersdata.push(userdoc[i].value);
										}
										callback(null,usersdata);
										
									}
								);
							}else{
								if (USERNAME.roles_asm){
									//Get own profile and subordinates
									var usersdata = [];
									usersdata.push(USERNAME);
									webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/asm_tree?key=[\""+ USERNAME.username  +"\"]", 
										function(couchdoc){
											var userdoc = (JSON.parse(couchdoc)).rows;
											for(var i = 0; i < userdoc.length; i++){
												usersdata.push(userdoc[i].value);
											}
											callback(null,usersdata);
										}
									);
								}else{
									if(USERNAME.roles_guest || USERNAME.roles_sr){
										//Get own profile only
										var usersdata = [];
										usersdata.push(USERNAME);
										callback(null,usersdata);
						
										//Activate toolbar items
										//Load outlets
										//Load scheduler events
									}
								}
							}
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
						//build user interface according to role(s)						
						function(callback){
							var role = (USERNAME.roles_admin ? 'roles_admin':(USERNAME.roles_asm ? 'roles_asm':((USERNAME.roles_sr || USERNAME.roles_guest) ? 'roles_sr':'')));
							mainlayout.setToolbar(role);
							//load the interface
							logic.main();
							webix.message(USERNAME.name + " " + USERNAME.surname + "<br/>Bine aţi venit în aplicaţia SRM!");						
							
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
			}
		);	
		
	},
	
	login: function	() {
		if(!webix.isUndefined($$('main'))) $$('main').destructor();
		//webix.ui(mainlayout.getMainLayout());
		
		var loginform = {
				id: "loginform",			
				view:"form", 

				elements:[
					{ type:"section", template:"SRM Mobile - Login"},
					{ view:"text", type:"email", label:"Email", name:"email",labelPosition:"top", placeholder:"user@loreal.com", value:""},
					{ view:"text", type:'password', label:"Parola",labelPosition:"top", name:"password", value:""},
					{ view:"button", label:"Login" , type:"form", click:function(){
						if (! this.getParentView().validate())
							webix.message({ type:"error", text:"E-mail sau parola nu sunt valide!" });
						else{						
							$.couch.login({
							    name: $$('email').getValue(),
							    password: $$('password').getValue(),
							    success: function(data) {
							        console.log(data);
									webix.ajax(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_users?key=[\""+ data.name  +"\"]", 
										function(couchdoc){
											var userdoc = (JSON.parse(couchdoc)).rows[0].value;

											//Prepare data according to user roles
											if(userdoc.roles_admin || userdoc.roles_asm){
												webix.message({type:"error", text:"Această aplicaţie este destinată pentru SR şi Guest!"});
												logoutOnClick();
												return;
											}
											if(!userdoc.active){
												//Automatically log out inactive users
												logoutOnClick();
											}else{
												$$('loginform').destructor();
												//$$('myToolbar').show();
												//$$("planner").show();
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
					}
				],
				rules:{
					"email":webix.rules.isEmail,
					"password":webix.rules.isNotEmpty
				}
			};
		if(!webix.isUndefined($$('loginform'))) $$('loginform').destructor();	
		webix.ui(webix.copy(loginform));	
		if(!webix.isUndefined($$('myToolbar'))) $$('myToolbar').hide();
	},
	
	main : function(){
		if(!webix.isUndefined($$('main'))) $$('main').destructor();
		webix.ui(mainlayout.getMainLayout());
	}
		
};
