//users		

var changed_id = [];

var userstable = {	
	usersdata : [],	
	asmuserslist: [""],
					
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