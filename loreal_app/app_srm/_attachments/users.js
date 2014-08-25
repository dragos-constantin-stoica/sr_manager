//users		
var userstable = {	
	usersgrid : {},
	usersdata : {},	
	asmuserslist: [""],
	
	mytoolbar : [
		{ id: "newpassword", type: "button", text: "Schimbă Parola", action:"newpasswordOnClick" },
		{ id: "newuser", type: "button", text: "Crează Utilizator", action: "newuserOnClick"},
		{ id: "saveuser", type: "button",  text: "Salvează Datele", action:"saveuserOnClick" }
	],
	
	setToolbar: function(toolbar) {
		this.mytoolbar = toolbar;
	},

	setRoleToolbar: function(role){
		if(role =="roles_asm"){
			this.mytoolbar = [
				{ id: "newpassword", type: "button", text: "Schimbă Parola", action:"newpasswordOnClick" },
				{ id: "saveuser", type: "button",  text: "Salvează Datele", action:"saveuserOnClick" }
			];
		}

		if(role =="roles_sr"){
			this.mytoolbar = [
				{ id: "newpassword", type: "button", text: "Schimbă Parola", action:"newpasswordOnClick" },
				{ id: "saveuser", type: "button",  text: "Salvează Datele", action:"saveuserOnClick" }
			];
		}

		if(role == "roles_admin"){
			this.mytoolbar = [
				{ id: "newpassword", type: "button", text: "Schimbă Parola", action:"newpasswordOnClick" },
				{ id: "newuser", type: "button", text: "Crează Utilizator", action: "newuserOnClick"},
				{ id: "saveuser", type: "button",  text: "Salvează Datele", action:"saveuserOnClick" }
			];
		}

	},
		
	setASMList: function(asmuserslist){
		this.asmuserslist = asmuserslist;
	},
	
	getASMList: function () {
		return this.asmuserslist;
	},
	
	setUsersData: function(usersdata){
		this.usersdata = usersdata;
	},
	
	getUsersData: function(){
		return this.usersdata;
	},
	
	setUsersGrid: function(grid){
		this.usersgrid = grid;
	},
	
	getUsersGrid: function() {
		return this.usersgrid;
	},
	
	showGrid: function(){

		var mygrid = layout.cells("a").attachGrid();
		mygrid.setImagePath("codebase/imgs/");
		mygrid.setColumnIds("_id,_rev,username,password,name,surname,boss_asm,roles_admin,roles_guest,roles_asm,roles_sr,active");
		mygrid.setHeader("id, rev, Nume Utilizator, Parola, Prenume, Nume, Nume şef SR (e un ASM), ADMIN, Guest, ASM, SR, Activ");
		mygrid.attachHeader("&nbsp;,&nbsp;,#select_filter,&nbsp;,#cspan,#cspan,#select_filter,&nbsp;,#cspan,#cspan,#cspan,#cspan");
		mygrid.setColSorting("na,na,str,str,str,str,str,str,str,str,str,str");

		//show columns according to user role
		if(USERNAME.roles_admin){
			mygrid.setInitWidths("0,0,*,0,200,200,*,60,60,60,60,60");
		}else{
			if(USERNAME.roles_asm || USERNAME.roles_sr || USERNAME.roles_guest){
				mygrid.setInitWidths("0,0,*,0,200,200,*,0,0,0,0,0");
			}
		}
		mygrid.setColTypes("ro,ro,ro,ro,ed,ed,coro,ch,ch,ch,ch,ch");
		mygrid.init();
		mygrid.setSkin("dhx_terrace");
		mygrid.parse(this.usersdata,"json");
	
		//allow user to edit only the first row - hers/his own data
		if(!USERNAME.roles_admin){
			for (var i=0; i < mygrid.getRowsNum(); i++){
    			mygrid.lockRow(mygrid.getRowId(i),true);
			}
			mygrid.lockRow(mygrid.getRowId(0),false);
		}
	
		var combo = mygrid.getCombo(6);
	
		var asm_list = userstable.getASMList();
		combo.save();
		combo.clear();
		for(i=0; i < asm_list.length; i++){
			combo.put(asm_list[i], asm_list[i]);
		}
		mygrid.getCombo(6).restore();	
		
		this.usersgrid = mygrid;

		var tlb = layout.cells("a").attachToolbar();
		tlb.loadStruct(this.mytoolbar);
	}
	
}

function newpasswordOnClick() {
	//check if one row is selected
	var mygrid = userstable.getUsersGrid();
	var selectedId=mygrid.getSelectedRowId();

	if(selectedId){
		//TODO - check if the user is admin or ASM/SR 
		if(mygrid.cells(selectedId,2).getValue() != USERNAME.username && !USERNAME.roles_admin){
			dhtmlx.message({ 
			    type:"error", 
			    text:"Nu aveţi drepturi suficiente pentru a finaliza operaţia!"
			});
			return;
		}
		//show window
		var dhxWins = new dhtmlXWindows();
		var passwordwindow = dhxWins.createWindow("passwordwindow", 5, 5, 375, 200);
		passwordwindow.setText("Schimbă parola");
		passwordwindow.button("close").hide();
		passwordwindow.button("minmax1").hide();
		passwordwindow.button("minmax2").hide();
		passwordwindow.button("park").hide();
		
		dhxWins.window('passwordwindow').centerOnScreen();
		dhxWins.window('passwordwindow').setModal(true);
		dhxWins.window('passwordwindow').denyMove();

		var passwordform = passwordwindow.attachForm();
		passwordform.loadStruct('passwordform.json');
		passwordform.enableLiveValidation(true);
		
		passwordform.attachEvent("onButtonClick", function(name, command){
			
		    if(name=="new_password"){
		    	//save password
		    	mygrid.cells(selectedId,3).setValue(passwordform.getItemValue('newpassword'));
		    	if (dhxWins != null && dhxWins.unload != null) {
					dhxWins.unload();
					dhxWins = passwordwindow = passwordform = null;
				}
		    }

		    if(name == "cancel_password"){
		    	if (dhxWins != null && dhxWins.unload != null) {
					dhxWins.unload();
					dhxWins = passwordwindow = passwordform = null;
				}
		    }
		});

	}else{
		dhtmlx.message({ 
		    type:"error", 
		    text:"Selectaţi o înregistrare!"
		});
	}

}

function newuserOnClick() {
	var mygrid = userstable.getUsersGrid();
	var dhxWins = new dhtmlXWindows();
	var userwindow = dhxWins.createWindow("userwindow", 5, 5, 375, 200);
	userwindow.setText("Crează utilizator nou");
	userwindow.button("close").hide();
	userwindow.button("minmax1").hide();
	userwindow.button("minmax2").hide();
	userwindow.button("park").hide();
	
	dhxWins.window('userwindow').centerOnScreen();
	dhxWins.window('userwindow').setModal(true);
	dhxWins.window('userwindow').denyMove();

	var userform = userwindow.attachForm();
	userform.loadStruct('userform.json');
	userform.enableLiveValidation(true);
	
	userform.attachEvent("onButtonClick", function(name, command){
		
	    if(name=="new_user"){
	    	//save password
	    	mygrid.addRow((new Date()).valueOf(),["", "new", userform.getItemValue('newemail'), userform.getItemValue('newpassword'), "", "", "", false, false, false, true, true]);

	    	if (dhxWins != null && dhxWins.unload != null) {
				dhxWins.unload();
				dhxWins = userwindow = userform = null;
			}
	    }

	    if(name == "cancel_user"){
	    	if (dhxWins != null && dhxWins.unload != null) {
				dhxWins.unload();
				dhxWins = userwindow = userform = null;
			}
	    }
	});
}

function saveuserOnClick() {
	
	var FORCE_LOGOUT = false;
	var mygrid = userstable.getUsersGrid();
	
	//console.log(mygrid.getChangedRows(true));	
	
	var commit_list = mygrid.getChangedRows(true).split(",");

	if(commit_list[0]=="") commit_list = [];

	for(var k = 0; k < commit_list.length; k++){
		var user = {};
		user.doc_type = "user";

		mygrid.forEachCell(commit_list[k],function(cellObj,ind){
			if (mygrid.getColTypeById(mygrid.getColumnId(ind)) == "ch" ){
				user[mygrid.getColumnId(ind)] = (cellObj.getValue() == 1);
			}else{
				user[mygrid.getColumnId(ind)] = cellObj.getValue();
			}
		});
		console.log(user);

		//new user
		if (user._rev == "new"){
			//new user in loreal_app
			delete user._id
			delete user._rev;
			$.couch.db("loreal_app").saveDoc(user, {
			    success: function(data) {
			        //console.log(data);
			    },
			    error: function(status) {
			        console.log(status);
			    }
			});

			//create user in _users
			worker.postMessage({'cmd': 'newUser', 'msg': user});
			
		}else{
			//existing user, update
			//user auto/self deactivated - it may be the case ?!?
			if(!user.active && user.username == USERNAME.username) FORCE_LOGOUT = true;
			
			//update _users if password changed
			if(user.password != ""){
				worker.postMessage({'cmd':'setPassword', 'msg':user});
				//check if the logged user changed the password then force logout
				if(user.username == USERNAME.username) FORCE_LOGOUT = true;
			}

			//update loreal_app document
			delete user.password;
			$.couch.db("loreal_app").saveDoc(user, {
			    success: function(data) {
			        console.log(data);
			    },
			    error: function(status) {
			        console.log(status);
			    }
			});
			
		};
		
	}
	
	//set admin users for loreal_app
	var security_obj = {
		admins: {
		    names: [],
		    roles: []
		},
	    members: {
	       names: [],
	       roles: []
	    }
	};

	mygrid.forEachRow(function(id) {
		var user = {};
		mygrid.forEachCell(id,function(cellObj,ind){
			if (mygrid.getColTypeById(mygrid.getColumnId(ind)) == "ch" ){
				user[mygrid.getColumnId(ind)] = (cellObj.getValue() == 1);
			}else{
				user[mygrid.getColumnId(ind)] = cellObj.getValue();
			}
		});

		//update _users only password changed
		if(user.password != "" && user._rev != "new"){
			worker.postMessage({'cmd':'setPassword', 'msg':user});
			//check if the logged user changed the password then force logout
			if(user.username == USERNAME.username) FORCE_LOGOUT = true;
		}

		//add admins to _security on loreal_app
		if(user.roles_admin && user.active){
			security_obj.admins.names.push(user.username);
		}


	});
	//update _security from loreal_app
	if(USERNAME.roles_admin)
		worker.postMessage({'cmd': 'setSecurity', 'msg': security_obj});

	if(FORCE_LOGOUT){
		logoutOnClick();
	}else{
		//TODO refresh user data
		async.series([
			function(callback){
				logic.init();
				callback(null,"init done!");
			},
			function(callback){
				userstable.showGrid();
				callback(null,"interface users done!");
			}],
			// optional callback
			function(err, results){
				//console.log(results);
				if(err) console.log("Error: " + err);
			}
		);

	}

}