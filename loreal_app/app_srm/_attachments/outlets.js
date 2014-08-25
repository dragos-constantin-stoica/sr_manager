//outlets
var outletstable = {
	
	outletsdata: {},
	srlist: ["[>- NEALOCAT -<]"],
	outletsgrid : {},

	mytoolbar: [
		{ id: "newoutlet", type: "button", text: "Înregisrare nouă", action:"newoutletOnClick" },
		{ id: "saveoutlet", type: "button",  text: "Salvează Datele", action:"saveoutletOnClick" }
	],
	
	setSRList: function(srlist){
		this.srlist = srlist;
	},
	
	setOutletsData: function(outletsdata){
		this.outletsdata = outletsdata;
	},
	
	getOutletsData: function(){
		return this.outletsdata;
	},

	showGrid: function(){

		var mygrid = layout.cells("a").attachGrid();
		mygrid.setImagePath("codebase/imgs/");
		mygrid.setColumnIds("channel,client,outlet,sr");
		mygrid.setHeader("Canal de distribuţie, Client, Magazin, SR Alocat");
		mygrid.attachHeader("#select_filter,#select_filter,#select_filter,#select_filter");
		mygrid.setColSorting("str,str,str,str");
		mygrid.setInitWidths("*,*,*,*");
		mygrid.setColTypes("ed,ed,ed,coro");
		mygrid.init();
		mygrid.setSkin("dhx_terrace");
		mygrid.parse(this.outletsdata,"js");	

		var combo = mygrid.getCombo(3);
	
		combo.save();
		combo.clear();
		for(i=0; i < this.srlist.length; i++){
			combo.put(this.srlist[i], this.srlist[i]);
		}
		mygrid.getCombo(3).restore();	
		
		this.outletsgrid = mygrid;	

		var tlb = layout.cells("a").attachToolbar();
		tlb.loadStruct(this.mytoolbar);
	}


};

function newoutletOnClick () {
	// body...
};

function saveoutletOnClick () {
	// body...
}