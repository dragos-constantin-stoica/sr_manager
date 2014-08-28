//outlets
//visible only to admin roles
var FLAG_CHANNEL = false, FLAG_CLIENT = false;
var outletstable = {
	
	outletsdata: [],
	
	layout : {
		view:"treetable", 
		id: "outletstable",
		columns:[
		{id:"id", header:"#", hidden:true, width:50},
		{id:"channel", header:["Canal de distribuţie", {content:"textFilter"}], editor:"text", 
			template:function(obj, common){
						if (obj.$group && FLAG_CHANNEL) return common.treetable(obj, common) + obj.value;
						if(! webix.isUndefined(obj.channel))return obj.channel;
						return "-";
					}, width:200},
		{id:"client", header:["Client", {content:"textFilter"}], editor:"text", 
			template:function(obj, common){
						if (obj.$group && FLAG_CLIENT) return common.treetable(obj, common) + obj.value;
						if (! webix.isUndefined(obj.client)) return obj.client;
						return "-";
					}, width:200},
		{id:"outlet", header:["Magazin", {content:"textFilter"}], editor:"text", width:200},
		{id:"sr", header:["SR alocat", {content:"selectFilter"}], editor:"select", editValue:"value", options:[], fillspace:true, width:300}
		],
		select:"row",
		editable:"true",
		navigation:true,
		drag:"row"	
	},
	
	getOutletsTable: function(){
		return this.layout;
	},
	
	setSRList: function(srlist){
		this.layout = {
			view:"treetable", 
			id: "outletstable",
			columns:[
			{id:"id", header:"#", hidden:true, width:50},
			{id:"channel", header:["Canal de distribuţie", {content:"textFilter"}], editor:"text", 
				template:function(obj, common){
							if (obj.$group && FLAG_CHANNEL) return common.treetable(obj, common) + obj.value;
							if(! webix.isUndefined(obj.channel))return obj.channel;
							return "-";
						}, width:200},
			{id:"client", header:["Client", {content:"textFilter"}], editor:"text", 
				template:function(obj, common){
							if (obj.$group && FLAG_CLIENT) return common.treetable(obj, common) + obj.value;
							if (! webix.isUndefined(obj.client)) return obj.client;
							return "-";
						}, width:200},
			{id:"outlet", header:["Magazin", {content:"textFilter"}], editor:"text", width:200},
			{id:"sr", header:["SR alocat", {content:"selectFilter"}], editor:"select", editValue:"value", options:srlist, fillspace:true, width:300}
			],
			select:"row",
			editable:"true",
			navigation:true,
			drag:"row"	
		}
	},
	
	setOutletsData: function(outletsdata){
		this.outletsdata = outletsdata;
	},
	
	getOutletsData: function(){
		return this.outletsdata;
	}
};

var outletsmenu = {
	view:"toolbar",
	id:"outletstoolbar",
	cols:[
	{ view:"button", id:"newoutlet", type:"iconButton", icon:"plus", label:"Crează magazin", width:150, click:"new_outlet();" },
	{ view:"button", id:"groupbychannel", type:"iconButton", icon:"indent",  label:"Grupează Canal",      width:150, click:"group_by_outlet('channel');" },
	{ view:"button", id:"groupbyclient", type:"iconButton", icon:"indent",  label:"Grupează Client",      width:150, click:"group_by_outlet('client');" },
	{ view:"button", id:"ungroup",    type:"iconButton", icon:"outdent", label:"Afişează normal",   width:150, click:"ungroup_outlet();" },
	{ view:"button", id:"saveoutlet" , type:"iconButton", icon:"save", label:"Salvează datele", width:150, click:"save_outlet();" }
	]
	
};

function new_outlet(){
	$$('outletstable').add({sr:"[- NEALOCAT -]"});
};
function group_by_outlet(column){
	if(column == 'channel'){
		FLAG_CHANNEL = true;
		FLAG_CLIENT = false;
	};
	if(column == 'client'){
		FLAG_CHANNEL = false;
		FLAG_CLIENT = true;
	};
	
	$$('outletstable').ungroup();
	$$('outletstable').group({
		by:column
	});
};
function ungroup_outlet(){
	FLAG_CHANNEL = false;
	FLAG_CLIENT  = false;
	$$('outletstable').filter();
	$$('outletstable').getFilter("channel").value="";
	$$('outletstable').getFilter("client").value="";
	$$('outletstable').getFilter("outlet").value="";			
	$$('outletstable').ungroup();
};		
function save_outlet(){
	var outlets_doc = { "doctype" : "outlets", "data":[]};
	$$('outletstable').eachRow( 
	    function (row){ 
			var outlet_row = $$('outletstable').getItem(row);
			outlets_doc.data.push({"channel":outlet_row.channel, 
								   "client":outlet_row.client,
							       "outlet":outlet_row.outlet,
							       "sr":outlet_row.sr});
		}
	)
	$.couch.db("loreal_app").openDoc("OUTLETS", {
	    success: function(data) {
	        console.log(data);
			//upadate the document
			outlets_doc._id = data._id;
			outlets_doc._rev = data._rev;
			$.couch.db("loreal_app").saveDoc(outlets_doc, {
			    success: function(data) {
			        console.log(data);
					outletstable.setOutletsData(outlets_doc.data);
			    },
			    error: function(status) {
			        console.log(status);
			    }
			});
	    },
	    error: function(status) {
	        console.log(status);
			//create the document
			$.couch.db("loreal_app").saveDoc(outlets_doc, {
			    success: function(data) {
			        console.log(data);
					outletstable.setOutletsData(outlets_doc.data);
			    },
			    error: function(status) {
			        console.log(status);
			    }
			});
	    }
	});
	
};