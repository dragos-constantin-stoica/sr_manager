//agenda
//the event object is produced by dhtmlxScheduler

//multiple display modes
//SR and Guest will use this application
//asm will see own and SR subordinates agendas
//sr and guest will see only personal agenda


var events = [
  	{ id: 2, start_date: "2012-03-28 12:00", end_date: "2012-03-28 16:00", text:"Task C-788" },
	{ id: 1, start_date: "2012-03-27 09:00", end_date: "2012-03-27 12:00", text:"Task A-12458" }
];

function my_sorting(a,b){
    //a, b - data objects
    return a.start_date > b.start_date ? 1 : -1;
}
events.sort(my_sorting);

webix.Date.startOnMonday = true;

//main agenda
var agenda = {
	user_list: [],
	
	layout:{
		rows:[
			{
				view:"multiview", 
				fitBiggest:true,
				id:"views",
				cells:[
				{ 
					id:"z", 
					view:"unitlist", 
					template:function(obj){
						return "<span>"+obj.start_date.substr(11,5)+" - "+
						obj.end_date.substr(11,5)+ " <b>" + obj.text +"</b></span>";
					},
					uniteBy:function(obj){
						return obj.start_date.substr(8,2) +"."+ obj.start_date.substr(5,2); 
					},
					data:events,
					on:{
					        'onItemClick': function(id){ 
								srreportOnClick();
							}
					    }
				},
				{ 
					id:"s", 
					view:"template", 
					template:"2" 
				},
				{
					id:"m", 
					rows:[
					{
						view:"calendar",
						weekHeader:true,
						weekNumber:true,
						events:webix.Date.isHoliday, 
						calendarDateFormat: "%Y-%m-%d"
					},
					{
						view:"list", 
						data:events
					}
					]
				}
				]
			},
			{
				id:"viewstoolbar",
				rows:[
				{
					view:"toolbar",
					elements: [
					{ view:"button", width:100, label:"Azi"},
					{ view:"segmented", multiview:true, options:[
						{id:"z", value:"Zi"},
						{id:"s", value:"Săpt."},
						{id:"m", value:"Lună"}
						] 
					}
					]
				}
				]
			}
		]
	},
	
	getAgenda: function () {
		return this.layout;
	}
};
