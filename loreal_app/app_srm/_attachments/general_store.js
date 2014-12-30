//Data storage for all componenets

//users
//this is used in
// - user list from Agenda LightBox
// - user list from Utilizatori ASM list

var userDataStore = {
	url: "",
	userData: [],

	setURL: function(url){
		userDataStore.url = url;
	},
	
	loadData: function(callback){
		var promise = webix.ajax().get(userDataStore.url);
		promise.then(function(realdata){
		    //success
		    var data = realdata.json();
		    userDataStore.userData = data;
		    console.log(data);
		    callback(null,data);
		}).fail(function(err){
		    //error
		    err.where = "userData";
		    callback(err,null);
		    webix.message({type:"error", text:"Datele nu au fost încărcate corect - userDataStore!"});
		});
	},

	getASMUserList: function(){
		var result = [];
		for(var i = 0; i < userDataStore.userData.length; i ++){
			if(userDataStore.userData[i].roles_asm && userDataStore.userData[i].active){
				result.push(userDataStore.userData[i].username);
			}
		}
		return result;
	},

	getSRUserList: function(){
		var result = ["[- NEALOCAT -]"];
		for(var i = 0; i < userDataStore.userData.length; i ++){
			if(userDataStore.userData[i].roles_sr && userDataStore.userData[i].active){
				result.push(userDataStore.userData[i].username);
			}
		}
		return result;
	},

	getUserList: function(){
		var result = [];
		for(var i = 0; i < userDataStore.userData.length; i ++){
			if(USERNAME.roles_admin 
			   && (userDataStore.userData[i].roles_sr || userDataStore.userData[i].roles_guest)
			   && userDataStore.userData[i].active){
				result.push(userDataStore.userData[i]);
			}

			if(USERNAME.roles_asm 
			   && userDataStore.userData[i].roles_sr 
			   && (userDataStore.userData[i].boss_asm == USENAME.username)
			   && userDataStore.userData[i].active){
				result.push(userDataStore.userData[i]);
			}

			if(USERNAME.roles_sr 
			   && userDataStore.userData[i].roles_sr 
			   && (userDataStore.userData[i].username == USENAME.username)
			   && userDataStore.userData[i].active){
				result.push(userDataStore.userData[i]);
			}			

			if(USERNAME.roles_guest 
			   && userDataStore.userData[i].roles_guest 
			   && (userDataStore.userData[i].username == USENAME.username)
			   && userDataStore.userData[i].active){
				result.push(userDataStore.userData[i]);
			}

		}
		return result;
	}
};

//outlets
//this is used in
// - channel, client, outlet from Agenda LighBox
// - client from Activitati
var outletsDataStore = {
	
};