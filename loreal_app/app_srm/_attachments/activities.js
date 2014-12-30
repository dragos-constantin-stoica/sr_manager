//activitytable	

//visible only to admin role

//the structure of the report may be
//section -> controls
//section -> fieldset -> controls		
/*
var formular_raport_SR = 
[
	{ "id":"1", "value":"Antet raport SR", "control_type":"section", "open":true, "data":[
		{ "id":"1.1", "value":"Nume utilizator", "control_data":"window.username", "control_type":"label"},
		{ "id":"1.2", "value":"Canal de distribuţie", "control_data":"window.outletchannel", "control_type":"label"},
		{ "id":"1.3", "value":"Magazin", "control_data":"window.outletname", "control_type":"label"}
	]},
	{ "id":"2", "value":"Disponibilitate", "control_type":"section", "open":true, "data":[
		{ "id":"2.1", "value":"Produs", "control_type":"fieldset", "open":true, "data":[
			{ "id": "2.1.0", "value":"Daca toate cele 3 criterii sunt indeplinite= DA\n-Verificare stoc raft\n-Eticheta pret prezenta\n- Planograma implementata", "control_data":"","control_type":"label"},
			{ "id": "2.1.1", "value":"Elseve Arginine Sh", "control_data":"","control_type":"checkbox"},
			{ "id": "2.1.2", "value":"Elseve Fibralogy Sh", "control_data":"","control_type":"checkbox"},
			{ "id": "2.1.3", "value":"Elseve Color Vive Sh", "control_data":"","control_type":"checkbox"},
			{ "id": "2.1.4", "value":"Elseve Color Vive balsam", "control_data":"","control_type":"checkbox"},
			{ "id": "2.1.5", "value":"Color Nat 7.1", "control_data":"","control_type":"checkbox"},
			{ "id": "2.1.6", "value":"Color Nat 2.1", "control_data":"","control_type":"checkbox"}
			] 
		},
		{ "id":"2.2", "value":"Comandă", "control_type":"fieldset", "open":true, "data":[
			{ "id": "2.2.0", "value":"- categorie clasica / make up\n- promotii\n-lansari", "control_data":"","control_type":"label"},
			{ "id": "2.2.1", "value":"Propunere comanda", "control_data":"","control_type":"checkbox"},
			{ "id": "2.2.2", "value":"Preluarea comenzii", "control_data":"","control_type":"checkbox"}
			] 
		}
	]},
	{ "id":"3", "value":"Extra vizibilitate", "control_type":"section", "open":true, "data":[
		{ "id":"3.1", "value":"Priorităţi luna [completează luna]", "control_type":"fieldset", "open":true, "data":[
			{ "id": "3.1.0", "value":"- Pret promo semnalizat\n- Plasare secundara cf ghid\n- Materiale promo implementate", "control_data":"","control_type":"label"},
			{ "id": "3.1.1", "value":"Color Naturals", "control_data":"","control_type":"checkbox"},
			{ "id": "3.1.2", "value":"Elseve (incl. Uleiuri)", "control_data":"","control_type":"checkbox"},
			{ "id": "3.1.3", "value":"Deo Mineral", "control_data":"","control_type":"checkbox"}
			] 
		},
		{ "id":"3.2", "value":"Negociere locală", "control_type":"fieldset", "open":true, "data":[
			{ "id": "3.2.1", "value":"Display clasic", "control_data":"","control_type":"counter"},
			{ "id": "3.2.2", "value":"Display Make up", "control_data":"","control_type":"counter"},
			{ "id": "3.2.3", "value":"Insula clasica", "control_data":"","control_type":"counter"},
			{ "id": "3.2.4", "value":"TG", "control_data":"","control_type":"counter"},
			{ "id": "3.2.2", "value":"Element promo", "control_data":"","control_type":"counter"}
			] 
		},
		{ "id":"3.3", "value":"Lansări", "control_type":"fieldset", "open":true, "data":[
			{ "id": "3.3.0", "value":"- Prezenta raft cf info listare\n- Implementare cf reco Cat Man\n- PLV lansare implementare\n- Make up: barcheta tester si casete in mobila", "control_data":"","control_type":"label"},
			{ "id": "3.3.1", "value":"UD Tresor Miel", "control_data":"","control_type":"checkbox"},
			{ "id": "3.3.2", "value":"Casting Caramel Mania", "control_data":"","control_type":"checkbox"},
			{ "id": "3.3.3", "value":"Miss Rebel collection", "control_data":"","control_type":"checkbox"}
			] 
		}
	]},
	{ "id":"4", "value":"Resurse", "control_type":"section", "open":true, "data":[
		{ "id":"4.1", "value":"BA", "control_type":"fieldset", "open":true, "data":[
			{ "id": "4.1.1", "value":"Prezenta program", "control_data":"","control_type":"checkbox"},
			{ "id": "4.1.2", "value":"Echipament (incl. ecuson)", "control_data":"","control_type":"checkbox"},
			{ "id": "4.1.3", "value":"Abordare proactiva a clientilor", "control_data":"","control_type":"checkbox"},
			{ "id": "4.1.4", "value":"Cunoaste targetul si realizatul ", "control_data":"","control_type":"checkbox"},
			{ "id": "4.1.5", "value":"Cunoaste promotiile in curs si lansarile", "control_data":"","control_type":"checkbox"}
			] 
		},
		{ "id":"4.2", "value":"Merchendiseri", "control_type":"fieldset", "open":true, "data":[
			{ "id": "4.2.1", "value":"Prezenta program", "control_data":"","control_type":"checkbox"}
			] 
		}
	]},
	{ "id":"5", "value":"General", "control_type":"section", "open":true, "data":[
		{ "id":"5.1", "value":"Observaţii/Alete activităţi", "control_data":"", "control_type":"textarea"}
	]},
	{ "id":"6", "value":"Încărcare poze", "control_type":"section", "open":true, "data":[
		{"id":"6.1", "value":"Alege fişierul", "control_data":"", "control_type":"uploader"}
	]}
];

*/

var activitytable = {
	
	formular_raport_SR : [],
	
	layout : {
		id:"activitytable",
		view:"treetable",
		editable:true,
		columns:[
		{ id:"id",  header:"#", hidden:true, width:50},
		{ id:"value", header:"Activităţi", template:"{common.treetable()} #value#", editor:"popup", editValue:"value", fillspace:true},
		{ id:"control_type", header:"Tip control",  width:200, editor:"select", editValue:"value", options:["section", "fieldset", "label", "checkbox", "numeric", "counter", "textarea", "uploader"]},
		{ id:"control_data", header:"Sursă date",  width:200}
		],
		select:"row",
		navigation:true,
	    tooltip:true,
		drag:true,
	    datatype:"json",
		on:{
			onBeforeDrop:function(context){
				//drag a section --- keep the same level and drop next
				if(this.getItem(context.source).control_type == "section"){
					context.index++;
				}else{
					//this is a fieldset or a control --- drop it under the section or fieldset
					if ((this.getItem(context.target).control_type == "section" || this.getItem(context.target).control_type == "fieldset")
						|| this.getItem(context.target).open){
							//drop as first child
							context.parent = context.target;
							context.index = 0;
					} else {
						//drop next
						context.index++;
					}
				}
			}
		}
	},
	
	getActivityTable: function(){
		return this.layout;
	},
	
	setFormularRaportSR: function(activities){
		this.formular_raport_SR = activities;
	},
	
	getFromularRaportSR: function(){
		return webix.copy(this.formular_raport_SR);
	}
};

var activitymenu = {
	view:"toolbar",
	    id:"activitytoolbar",
	    cols:[
			{ view:"button", id:"newactivity", type:"iconButton", icon:"plus",         label:"Crează activitate", width:150, click:"new_activity();" },
			{ view:"button", id:"deleteactivity", type:"iconButton", icon:"minus",     label:"Şterge activitate", width:150, click:"delete_activity();" },
			{ view:"button", id:"addoutlet" , type:"iconButton", icon:"shopping-cart", label:"Specifică Client", width:150, click:"outlet_activity();" },
			{ view:"button", id:"srreport", type:"iconButton", icon:"magic",           label:"Afişează Raport", width:150, click:"srreportOnClick();" },
			{ view:"button", id:"saveactivity" , type:"iconButton", icon:"save",       label:"Salvează datele", width:150, click:"save_activity();" },	
		]
	
};

function new_activity(){
	$$('activitytable').add({});
};
function delete_activity(){
	if(!$$('activitytable').getSelectedId()){
        webix.message("Vă rog să alegeţi o activitate!");
        return;
    }
	$$('activitytable').remove($$('activitytable').getSelectedId());	
};
function save_activity (){
	//TODO - save data and sync
	var activity_doc = {"doctype":"activities", "data":[]};
	activity_doc.data = $$('activitytable').serialize();
	$.couch.db("loreal_app").openDoc("ACTIVITIES", {
	    success: function(data) {
	        console.log(data);
			//upadate the document
			activity_doc._id = data._id;
			activity_doc._rev = data._rev;
			$.couch.db("loreal_app").saveDoc(activity_doc, {
			    success: function(data) {
			        console.log(data);
					activitytable.setFormularRaportSR(activity_doc.data);
					webix.message("Datele au fost salvate cu succes!");
			    },
			    error: function(status) {
			        console.log(status);
			    }
			});
	    },
	    error: function(status) {
	        console.log(status);
			//create the document
			$.couch.db("loreal_app").saveDoc(activity_doc, {
			    success: function(data) {
			        console.log(data);
					activitytable.setFormularRaportSR(activity_doc.data);
					webix.message("Datele au fost salvate cu succes!");
			    },
			    error: function(status) {
			        console.log(status);
			    }
			});
	    }
	});	

};
function srreportOnClick () {
	if(webix.isUndefined($$('reportSR'))) $$('mainpage').addView(displaySRReport());	
	$$('reportSR').show();
};

function outlet_activity() {
	if(!$$('activitytable').getSelectedId()){
        webix.message("Vă rog să alegeţi o activitate!");
        return;
    }	
	//get the client list from control_data
	//they are all checked
	var sel = $$('activitytable').getSelectedId();
	var row = $$('activitytable').getItem(sel.row);
	var control_data = (webix.isUndefined(row["control_data"]))?([]):row["control_data"];
	
	//biuld client list
	var client_list = [];
	if(control_data != ""){
		var tmp = control_data.split(",");
		for(var k = 0; k < tmp.length; k++)
			client_list.push({ch1:true, client:tmp[k]}) ;
	}
	//get all clients list from outletstable
	var tmp = outletstable.getOutletsData();
	for(var k = 0; k < tmp.length; k++){
		if(control_data.indexOf(tmp[k].client) == -1){
			client_list.push({ch1:false, client:tmp[k].client});
			control_data = control_data + "," + tmp[k].client;
		}
	};	
	
	webix.ui({
		id: "outletswindow",
		view:"window", 
		move:true,
	    head:"Lista Clienţilor", 
		width:400,
		height: 600,
		position:"top",
		body:{
			rows:[
			{
				id: "outlets_list",
				view:"datatable",
				columns:[
					{ id:"ch1", header:{ content:"masterCheckbox" }, checkValue:true, uncheckValue:false, template:"{common.checkbox()}", width:40},
					{ id:"client",	sort:"string", header:["Client", {content:"textFilter"}],width:350}
				],
				//autoheight:true,
				autowidth:true,
				data: webix.copy(client_list)
			},
			
			{ view:"button", id:"ok_button", value:"Validează selecţia", type:"form", align:"center", inputWidth:200, click:"ok_button();" }
			
			]
		}
	}).show();
	
	
};

function ok_button() {

	var control_data = [];
	
	$$('outlets_list').eachRow( 
	    function (row){ 
			var outlet_row = $$('outlets_list').getItem(row);
			if(outlet_row.ch1){
				control_data.push(outlet_row.client);
			}
		}
	)
	//if all outlets are selected then clear selection
	if($$('outlets_list').count() == control_data.length) control_data = [];

	var sel = $$('activitytable').getSelectedId();
	var row = $$('activitytable').getItem(sel.row);
	//set control_data
	row["control_data"] = control_data.join();
	$$('activitytable').updateItem(sel.row, row);
	
	//clear window
	if(!webix.isUndefined($$('outletswindow'))) $$('outletswindow').destructor();
}

//show SR report
function displaySRReport () {
	var formular_raport_SR = activitytable.getFromularRaportSR();
	if (!webix.isUndefined(formular_raport_SR) && webix.isArray(formular_raport_SR)){
		var reportSR = {
			id:"reportSR",
			view:"form",
		    //autoConfig:true,
			//autoheight:true,
			scroll: "y",
			//antent predeinit
			elements: [
				{
					rows:[
						{template:"Antet Raport", type:"section"},
						{view:"label", label:"Nume utilizator: " + USERNAME.username, labelWidth:300},
						{view:"label", label:"Data utimei salvări: " + window.date, labelWidth:300},
						{view:"label", label:"Canal: " + window.channel, labelWidth:300},
						{view:"label", label:"Client: " + window.client, labelWidth:300},
						{view:"label", label:"Magazin: " + window.outlet, labelWidth:300}
					]
				}
			]
		};
		
		var REPORT_SECTIONS = formular_raport_SR.length;
		var i = 0;
		
		for (i = 0; i < REPORT_SECTIONS; i++ ){
			//inspect eact element of the SR report
			var crtItem = formular_raport_SR[i];
			//construct the report in elements field
			if (!webix.isUndefined(crtItem.control_type)){
				if (crtItem.control_type == "section"){
					//add new section
					var rows = {"rows":[{ template:crtItem.value, type:"section"}]};
					var itemControls = crtItem.data;
					var ITEMS = itemControls.length;
					var j = 0;
					for (j = 0; j < ITEMS; j++){
						//controls
						if( itemControls[j].control_type !== "fieldset"){
							switch(itemControls[j].control_type){
								case "textarea":
									rows.rows.push({"view":itemControls[j].control_type, "label":itemControls[j].value, labelPosition:"top", height:168});
									break;
								case "uploader":
									rows.rows.push({"view":itemControls[j].control_type, "value":itemControls[j].value, "autosend":false, "link":"doclist", "id":"files", "name":"files" });
									rows.rows.push({"view":"list", "type":itemControls[j].control_type, "scroll":false, "id":"doclist", "autoheight":true});
									break;
								case "numeric":
									rows.rows.push({"view":"text", "label":itemControls[j].value, validate:"isNumber", labelWidth:300});
									break;
								default:
									rows.rows.push({"view":itemControls[j].control_type, "label":itemControls[j].value, labelWidth:300});
							}
							//TODO use control_data for intial value
						}else{
						//fieldset
							var fieldset = {"view":"fieldset", "label": itemControls[j].value, "body":{"rows":[]}};
							var CONTROLS = itemControls[j].data.length;
							var fieldsetControls = itemControls[j].data;
							var k = 0;
							for (k = 0; k < CONTROLS; k++){
								switch(fieldsetControls[k].control_type){
									case "numeric":
										//controls
										fieldset.body.rows.push({"view":"text", "label":fieldsetControls[k].value, validate:"isNumber", labelWidth:300});
										break;
									default:
										//controls
										fieldset.body.rows.push({"view":fieldsetControls[k].control_type, "label":fieldsetControls[k].value, labelWidth:300});
								}
								
							}
							rows.rows.push(fieldset); 
						}
					}
					//add row to form
					reportSR.elements.push(rows);
				}
			}
			
		}
		//add save button
		reportSR.elements.push({"view":"button", "inputWidth":168, "align":"center", "type":"danger", "label":"Salvează datele"});
		return reportSR;
	}
};

//TODO build a real SR Report with submit and upload

