//activitytable	

//the structure of the report may be
//section -> controls
//section -> fieldset -> controls		

var activitytable = {
	
	formular_raport_SR : [],
	mygrid: {},
	mytoolbar: [
		{ id: "newactivity",    type: "button", text: "Adaugă activitate", action:"newacrivityOnClick" },
		{ id: "delactivity",    type: "button", text: "Şterge activitate", action:"delacrivityOnClick" },
		{ id: "saveactivities", type: "button",  text: "Salvează Datele", action:"saveactivitiesOnClick" },
		{ id: "no.1", type:"separator"},
		{ id: "upactivity",    type: "button", text: "Mută un rând mai sus", action:"upacrivityOnClick" },
		{ id: "downactivity",    type: "button", text: "Mută un rând mai jos", action:"downacrivityOnClick" },
		{ id: "previewreport", type: "button",  text: "Vizualizează Fromular SR", action:"previewreportOnClick" },
	],
	
	setFormularRaportSR: function(activities){
		this.formular_raport_SR = activities;
	},
	
	getFromularRaportSR: function(){
		return this.formular_raport_SR;
	},

	showGrid: function () {
		var mygrid = layout.cells("a").attachGrid();
		mygrid.setImagePath("codebase/imgs/");
		mygrid.setColumnIds("activity,control_type,control_data");
		mygrid.setHeader("Activităţi,Tip control,Sursă date");
		mygrid.setInitWidths("*,150,150");
		mygrid.setColAlign("left,left,left");
		mygrid.setColTypes("ed,coro,coro");

		mygrid.init();
		mygrid.setSkin("dhx_terrace");
		mygrid.parse(this.formular_raport_SR,"js");

		//format rows for section and fieldset
		mygrid.forEachRow(function(id) {
			if(mygrid.cells(id,1).getValue() == "section"){
				mygrid.setRowTextStyle(id, "background-color: #F4A460; font-family: sans-serif; font-weight: bold; text-decoration: underline;");
			}
			if(mygrid.cells(id,1).getValue() == "fieldset"){
				mygrid.setRowTextStyle(id, "background-color: #DAA520; font-family: sans-serif;");
			}
		});


		this.mygrid = mygrid;

		var tlb = layout.cells("a").attachToolbar();
		tlb.loadStruct(this.mytoolbar);
	}
};


//TODO define form control section

//TODO define from control spinner

function previewreportOnClick () {
	//TODO build JSON from formular_raport_SR and display it
	//The expected structure is:
	//section -> controls
	//section -> fieldset -> controls
	var reportSR = [
		{type: "settings", position: "label-left", offsetLeft: 3}
	];

	var formular_raport_SR = activitytable.getFromularRaportSR();

	var REPORT_SECTIONS = formular_raport_SR.data.length;
	var i = 0;
	var ctrlList = [];

	for (i = 0; i < REPORT_SECTIONS; i++ ){
		//inspect eact element of the SR report
		var crtItem = formular_raport_SR.data[i];
		//construct the report
		switch (crtItem.control_type){
			case "section":
				//push controls to the last fieldset or section
				if(ctrlList.length>0){
					reportSR[reportSR.length-1].list = ctrlList;
				}
				ctrlList = [];
				//add section control
				reportSR.push({type: "template", name:crtItem.activity, value: crtItem.activity, format:renderSection});

				break;
			case "fieldset":
				//push controls to the last fieldset or section
				if(ctrlList.length>0){
					reportSR[reportSR.length-1].list = ctrlList;
				}

				ctrlList = [];

				//add fieldset with empty control list
				reportSR.push({type: "fieldset", label: crtItem.activity, list:[]});
				break;
			case "label":
				ctrlList.push({type: "label", label: crtItem.activity, labelWidth:375});
				break;
			case "checkbox":
				ctrlList.push({type: "checkbox", position: "label-right", label: crtItem.activity, checked: false, name:crtItem.activity});
				break;
			case "textarea":
				ctrlList.push({type: "input", label: crtItem.activity, position:'label-top', rows:3, style:"width:410px;height:200px;"});
				break;
			case "uploader":
				ctrlList.push({type: "upload", name: crtItem.activity, inputWidth: 375, url:"codebase/php/dhtmlxform_item_upload.php", swfPath: "codebase/ext/uploader.swf", swfUrl: "codebase/php/dhtmlxform_item_upload.php"});
				break;
			case "counter":
				ctrlList.push({type: "template", position: "label-right", name: crtItem.activity, label: crtItem.activity, value:0, format:renderCounter});
				break;			
			default:
				console.log("Unknown control type: " + crtItem.control_type);
				break;
		}
	}

	//push controls to the last fieldset or section
	if(ctrlList.length>0){
		reportSR[reportSR.length-1].list = ctrlList;
	}

	//add save button
	reportSR.push({type: "button", name:"saveSRRepor",  value: "Salvează datele"});

	//show in a new window the form
	//Login
	var dhxWins = new dhtmlXWindows();
	var SRReportwindow = dhxWins.createWindow("SRReportwindow", 0, 0, 450, 400);
	SRReportwindow.setText("SR Report");
	dhxWins.window('SRReportwindow').maximize();
	dhxWins.window('SRReportwindow').centerOnScreen();
	
	var SRReportform = SRReportwindow.attachForm();
	SRReportform.loadStruct(reportSR,'json');

}

function renderSection (name, value) {
	return "<div>SECTION - <em>"+value+"</em><br/><hr width='100%'/></div>";
}

function renderCounter (name, value) {
	return "<div><input type='number' name='"+name+"' min='0' maxlength='3' size='2'>"+name+"</div>";
}