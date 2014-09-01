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
		
	setFormularRaportSR: function(activities){
		this.formular_raport_SR = activities;
	},
	
	getFromularRaportSR: function(){
		return webix.copy(this.formular_raport_SR);
	}
};


function srreportOnClick () {

	if(webix.isUndefined($$('reportSR'))) $$('views').addView(displaySRReport());	
	$$('viewstoolbar').hide();
	$$('reportSR').show();
};

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
				{view:"template", template:"Antet Raport", type:"section"},
				{view:"label", label:"Nume utilizator: " + USERNAME.username},
				{view:"label", label:"Data utimei salvări: " + window.date},
				{view:"label", label:"Canal: " + window.channel},
				{view:"label", label:"Client: " + window.client},
				{view:"label", label:"Magazin: " + window.outlet}
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
					reportSR.elements.push({view:"template", template:crtItem.value, type:"section"});
					var itemControls = crtItem.data;
					var ITEMS = itemControls.length;
					var j = 0;
					for (j = 0; j < ITEMS; j++){
						//controls
						if( itemControls[j].control_type !== "fieldset"){
							switch(itemControls[j].control_type){
								case "textarea":
									reportSR.elements.push({"view":itemControls[j].control_type, "label":itemControls[j].value, labelPosition:"top", height:150});
									break;
								case "uploader":
									reportSR.elements.push({"view":itemControls[j].control_type, "value":itemControls[j].value, "autosend":false, "link":"doclist", "id":"files", "name":"files" });
									reportSR.elements.push({"view":"list", "type":itemControls[j].control_type, "scroll":false, "id":"doclist", "autoheight":true});
									break;
								case "counter":
									reportSR.elements.push({"view":itemControls[j].control_type, "label":itemControls[j].value,labelWidth:220});
									break;
								default:
									reportSR.elements.push({"view":itemControls[j].control_type, "label":itemControls[j].value,labelWidth:300});
							}
							//TODO use control_data for intial value
						}else{
						//fieldset
							reportSR.elements.push({ view:"label", label: itemControls[j].value, align:"center"});
							var CONTROLS = itemControls[j].data.length;
							var fieldsetControls = itemControls[j].data;
							var k = 0;
							for (k = 0; k < CONTROLS; k++){
								//controls
								switch(fieldsetControls[k].control_type){
								case "counter":
									reportSR.elements.push({"view":fieldsetControls[k].control_type, "label":fieldsetControls[k].value, labelWidth:220});
									break;
								default:
									reportSR.elements.push({"view":fieldsetControls[k].control_type, "label":fieldsetControls[k].value, labelWidth:300});
								}
							}
						}
					}
					//add row to form
				}
			}
			
		}
		//add save button
		reportSR.elements.push({"view":"button", "inputWidth":168, "align":"center", "type":"danger", "label":"Salvează datele"});
		return reportSR;
	}
};

//TODO build a real SR Report with submit and upload

