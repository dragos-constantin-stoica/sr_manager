
//check if user has session information
var USERNAME = null;
var layout = null;

var logic = {
	init : function(){
		//Check for USERNAME
		USERNAME = sessionStorage.getItem("USERNAME");
		window.dhx4.ajax.method = "get";
		
		if(USERNAME){
			logic.init_data();
		}else{
			logic.login();
		}
	},
				
	init_data: function(){
		// TODO: SR Report
		//Get user document		
		USERNAME = sessionStorage.getItem("USERNAME");
		USERNAME = JSON.parse(USERNAME);
		
		//Check again if any information changed
		window.dhx4.ajax.get(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_users?key=[\""+ USERNAME.username  +"\"]", 
			function(response){

				//Prepare data according to user roles
				var userdoc = (JSON.parse(response.xmlDoc.responseText)).rows[0].value;
				if(!userdoc.active){
					//Automatically log out inactive users
					logoutOnClick();
				}else{
					//Set session information
					sessionStorage.removeItem('USERNAME');
					sessionStorage.setItem('USERNAME', JSON.stringify(userdoc));
					USERNAME = sessionStorage.getItem("USERNAME");
					USERNAME = JSON.parse(USERNAME);
										
					async.series([
						//Get asm list
						function(callback){
							window.dhx4.ajax.get(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_asm", 
								function(response){
									asmuserslist = [""];
									var userdoc = (JSON.parse(response.xmlDoc.responseText)).rows;
									for(var i = 0; i < userdoc.length; i++){
										asmuserslist.push(userdoc[i].key[0]);
									}
									userstable.setASMList(asmuserslist);
									callback(null,asmuserslist);
								}
							);
						},
						//Get user list
						function(callback){
				
							if(USERNAME.roles_admin){
								//Get all users
								window.dhx4.ajax.get(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_users", 
									function(response){
										var usersdata = {};
										usersdata.rows = [];
										var userdoc = (JSON.parse(response.xmlDoc.responseText)).rows;
										for(var i = 0; i < userdoc.length; i++){
											usersdata.rows.push({ 
												id: userdoc[i].value.id, 
												data:[
													userdoc[i].value.id,
													userdoc[i].value.rev,
													userdoc[i].value.username,
													"",
													userdoc[i].value.name,
													userdoc[i].value.surname,
													userdoc[i].value.boss_asm,
													userdoc[i].value.roles_admin,
													userdoc[i].value.roles_guest,
													userdoc[i].value.roles_asm,
													userdoc[i].value.roles_sr,
													userdoc[i].value.active
												]});
										}
										userstable.setUsersData(usersdata);
										callback(null,usersdata);
										
									}
								);
							}else{
								if (USERNAME.roles_asm){
									//Get own profile and subordinates
									var usersdata = {};
									usersdata.rows = [];
									usersdata.rows.push({
										id: USERNAME.id,
										data: [
											USERNAME.id,
											USERNAME.rev,
											USERNAME.username,
											"",
											USERNAME.name,
											USERNAME.surname,
											USERNAME.boss_asm,
											USERNAME.roles_admin,
											USERNAME.roles_guest,
											USERNAME.roles_asm,
											USERNAME.roles_sr,
											USERNAME.active
										]
									});
									window.dhx4.ajax.get(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/asm_tree?key=[\""+ USERNAME.username  +"\"]", 
										function(response){
											var userdoc = (JSON.parse(response.xmlDoc.responseText)).rows;
											for(var i = 0; i < userdoc.length; i++){
												usersdata.rows.push({
													id: userdoc[i].value.id,
													data: [
														userdoc[i].value.id,
														userdoc[i].value.rev,
														userdoc[i].value.username,
														"",
														userdoc[i].value.name,
														userdoc[i].value.surname,
														userdoc[i].value.boss_asm,
														userdoc[i].value.roles_admin,
														userdoc[i].value.roles_guest,
														userdoc[i].value.roles_asm,
														userdoc[i].value.roles_sr,
														userdoc[i].value.active
												]});
											}
											userstable.setUsersData(usersdata);
											callback(null,usersdata);
										}
									);
								}else{
									if(USERNAME.roles_guest || USERNAME.roles_sr){
										//Get own profile only
										var usersdata = {}
										usersdata.rows = [];
										usersdata.rows.push({
											id: USERNAME.id,
											data: [
												USERNAME.id,
												USERNAME.rev,
												USERNAME.username,
												"",
												USERNAME.name,
												USERNAME.surname,
												USERNAME.boss_asm,
												USERNAME.roles_admin,
												USERNAME.roles_guest,
												USERNAME.roles_asm,
												USERNAME.roles_sr,
												USERNAME.active
											]
										});
										userstable.setUsersData(usersdata);
										callback(null,usersdata);
						
										//Activate toolbar items
										//Load outlets
										//Load scheduler events
									}
								}
							}
						},
						//Get SR list
						function (callback) {
							var srlist = ["[>- NEALOCAT -<]"];
							window.dhx4.ajax.get(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_sr", 
								function(response){
									var userdoc = (JSON.parse(response.xmlDoc.responseText)).rows;
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
							var outletsdata = {};
							window.dhx4.ajax.get(CouchDB.protocol + CouchDB.host + "/loreal_app/OUTLETS", 
								function(response){
									outletsdata = (JSON.parse(response.xmlDoc.responseText));
									outletstable.setOutletsData(outletsdata);
									agenda.setOutlets(outletsdata);
									callback(null,outletsdata);
								}
							);
						},
						//Get SR Report Template
						function(callback){
							var sreporttemplate = {};
							window.dhx4.ajax.get(CouchDB.protocol + CouchDB.host + "/loreal_app/ACTIVITIES", 
								function(response){
									srreporttemplate = (JSON.parse(response.xmlDoc.responseText));
									activitytable.setFormularRaportSR(srreporttemplate);
									callback(null,srreporttemplate);
								}
							);	
						},
						
						function(callback){
							//load the interface
							dhtmlx.message(USERNAME.name + ", " + USERNAME.surname + "<br/>Bine aţi venit în aplicaţia SRM!");						
							
							//build user interface according to role(s)
							if(USERNAME.roles_admin){
								//TODO - set user interface
								userstable.setRoleToolbar("roles_admin");
								maintoolbar.setRoleToolbar("roles_admin");
							}else{
								if (USERNAME.roles_asm){
									userstable.setRoleToolbar("roles_asm");
									maintoolbar.setRoleToolbar("roles_asm");
									//TODO - set user interface
								}else{
									if(USERNAME.roles_guest || USERNAME.roles_sr){
										userstable.setRoleToolbar("roles_sr");
										maintoolbar.setToolbar("roles_sr");
										//TODO - set user interface
									}
								}
							}
							logic.main();
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
	
	login: function(){
		//Login
		var dhxWins = new dhtmlXWindows();
		var loginwindow = dhxWins.createWindow("loginwindow", 5, 5, 375, 270);
		loginwindow.setText("Welcome to SR Manager");
		loginwindow.button("close").hide();
		loginwindow.button("minmax1").hide();
		loginwindow.button("minmax2").hide();
		loginwindow.button("park").hide();
		
		dhxWins.window('loginwindow').centerOnScreen();
		dhxWins.window('loginwindow').setModal(true);
		dhxWins.window('loginwindow').denyMove();
		//dhxWins.window('loginwindow').hideHeader();
		
		var loginform = loginwindow.attachForm();
		loginform.loadStruct('loginform.json');
		loginform.enableLiveValidation(true);
		
		loginform.attachEvent("onButtonClick", function(name, command){
			
		    if(name=="login_user"){
				$.couch.login({
				    name: loginform.getItemValue('email'),
				    password: loginform.getItemValue('password'),
				    success: function(data) {
				        //console.log(data);

						window.dhx4.ajax.get(CouchDB.protocol + CouchDB.host + "/loreal_app/_design/users/_view/all_users?key=[\""+ data.name  +"\"]", 
							function(response){

								//Prepare data according to user roles
								var userdoc = (JSON.parse(response.xmlDoc.responseText)).rows[0].value;
								if(!userdoc.active){
									//Automatically log out inactive users
									logoutOnClick();
								}else{
									if (dhxWins != null && dhxWins.unload != null) {
										dhxWins.unload();
										dhxWins = loginwindow = loginform = null;
									}
									//Set session information
									sessionStorage.setItem('USERNAME', JSON.stringify(userdoc));
									logic.init_data();
								}
							}
						);								
				    },
				    error: function(status) {
						dhtmlx.message({type:"error", text:"E-mail sau parola nu sunt valide!"});
				        //console.log(status);
				    }
				});
		    }
			
			if(name == "password_reset"){
				//TODO - send message to all admin to reset the password
			}
			
			
		});
	},
	
	main : function(){
		//Already authenticated - Let's rock'n'roll
		
        layout = new dhtmlXLayoutObject(document.body,"1C"); 
		layout.cells("a").hideHeader();
		var m_toolbar = layout.attachToolbar(); 
		m_toolbar.setIconsPath("codebase/icons/");
		m_toolbar.loadStruct(maintoolbar.getToolbar(), function(){
			m_toolbar.addSpacer("messages");
		});
		//TODO - sync SR Report, user data
	}
	
};
