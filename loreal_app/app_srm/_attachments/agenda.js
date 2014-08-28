//agenda
//the object is linked to dhtmlxScheduler

//auxiliary function to show minicalendar in light box date
function show_minical(){
    if (scheduler.isCalendarVisible()){
        scheduler.destroyCalendar();
    } else {
        scheduler.renderCalendar({
            position:"dhx_minical_icon",
            date:scheduler._date,
            navigation:true,
            handler:function(date,calendar){
                scheduler.setCurrentView(date);
                scheduler.destroyCalendar()
            }
        });
    }
}

var channel_select_options = [
			{ key: 'p1', label: "Parent option 1"},
			{ key: 'p2', label: "Parent option 2"},
			{ key: 'p3', label: "Parent option 3"}
];
var client_select_options = {
	p1: [
		{ key: 1, label: "Child select 1-1" },
		{ key: 2, label: "Child select 1-2" }
	],
	p2: [
		{ key: 3, label: "Child select 2-1" },
		{ key: 1, label: "Child select 2-2" },
		{ key: 2, label: "Child select 2-3" }
	],
	p3: [
		{ key: 1, label: "Child select 3-1" },
		{ key: 3, label: "Child select 3-2" }
	]
};
var outlet_select_options = {
	1: [
		{ key: 1, label: "Child select 1-1" },
		{ key: 2, label: "Child select 1-2" }
	],
	2: [
		{ key: 3, label: "Child select 2-1" },
		{ key: 4, label: "Child select 2-2" },
		{ key: 5, label: "Child select 2-3" }
	],
	3: [
		{ key: 6, label: "Child select 3-1" },
		{ key: 7, label: "Child select 3-2" }
	]
};

//agenda
var agenda = {
	myagenda: 
	{
		id: "planner",
		//autoConfig:true,
		//autoheight:true,
	
		view:"dhx-scheduler",
		date:new Date(2012,2,27),
		mode:"week",
		tabs:["day", "week", "month", "year","week_agenda","timeline","unit"],
		init:function(){
			scheduler.config.xml_date="%Y-%m-%d %H:%i";
			scheduler.config.first_hour = 7;
			scheduler.config.last_hour = 20;
			scheduler.config.time_step = 30;
			scheduler.config.start_on_monday = true;
			scheduler.config.multi_day = false;
			scheduler.config.buttons_left=["dhx_save_btn","dhx_cancel_btn","report_button"];
			scheduler.locale.labels["report_button"] = "Raport Vizită";
			scheduler.locale.labels.section_channel_list = "Canalul de distribuţie";
			scheduler.locale.labels.section_client_list = "Client";
			scheduler.locale.labels.section_outlet_list = "Magazin";

			//Open detail edit, no menubar
			scheduler.xy.menu_width = 0;
			scheduler.config.details_on_dblclick = true;
			scheduler.config.details_on_create = true;
			scheduler.attachEvent("onClick",function(){ return false; });
			
			scheduler.ignore_week = function(date){
			    if (date.getDay() == 6 || date.getDay() == 0) //hides Saturdays and Sundays
			        return true;
			};
			//TODO - Add 60 min time interval for a visit
			scheduler.config.auto_end_date = true;

			var update_select_options = function(select, options) { // helper function
				select.options.length = 0;
				for (var i=0; i<options.length; i++) {
					var option = options[i];
					select[i] = new Option(option.label, option.key);
				}
			};
			
			var channel_onchange = function(event) {
				var new_child_options = client_select_options[this.value];
				update_select_options(scheduler.formSection('client_list').control, new_child_options);
			};

			var client_onchange = function(event) {
				var new_child_options = client_select_options[this.value];
				update_select_options(scheduler.formSection('outlet_list').control, new_child_options);
			};
			
			//initialize from scratch
	
			scheduler.config.lightbox.sections=[
						{name:"description", height:32, map_to:"text", type:"textarea" , focus:false},
						{name:"channel_list", height:32, type:"select", options: []/*agenda.getChannel()*/, map_to:"channel", onchange:channel_onchange, focus:true },
						{name:"client_list", height:32, type:"select", options:[] /*agenda.getClient()*/, map_to:"client", onchange:client_onchange },
						{name:"outlet_list", height:32, type:"select", options:[] /*agenda.getOutlet()*/, map_to:"outlet" },
						{name:"recurring", height:115, type:"recurring", map_to:"rec_type", button:"recurring"},
	  					{name:"time", height:72, type:"calendar_time", map_to:"auto" }
			];	
	
			scheduler.form_blocks.textarea.set_value = function(node,value,ev){
			    node.firstChild.value=value||"";
			    node.firstChild.disabled = true;//ev.disabled; //or just '= true' to disable all events
			};			

			scheduler.attachEvent("onLightbox", function(id){
				var ev = scheduler.getEvent(id);
				if (!ev.client) {
					var channel = ev.channel||channel_select_options[0].key;
					var new_child_options = client_select_options[channel];
					update_select_options(scheduler.formSection('client_list').control, new_child_options);
				}
				return true;
			});
	
			scheduler.attachEvent("onLightboxButton", function(button_id, node, e){
				if(button_id == "report_button"){
					scheduler.endLightbox(false,scheduler.getLightbox());
					//scheduler.cancel_lightbox();
					srreportOnClick();
				}
				return true;
			});
		
			//scheduler.config.fix_tab_position = false;
			scheduler.locale.labels.year_tab ="Year";
			scheduler.locale.labels.week_agenda_tab ="Agenda";
			scheduler.locale.labels.timeline_tab ="Timeline";
			scheduler.locale.labels.unit_tab = "Unit"

			scheduler.createTimelineView({
			     name:"timeline",
			     second_scale:{
			        x_unit: "day", // the measuring unit of the axis (by default, 'minute')
			        x_date: "%F %d" //the date format of the axis ("July 01")
			    },
			     x_unit:"minute",//measuring unit of the X-Axis.
			     x_date:"%H:%i", //date format of the X-Axis
			     x_step:30,      //X-Axis step in 'x_unit's
			     x_size:24,      //X-Axis length specified as the total number of 'x_step's
			     x_start:16,     //X-Axis offset in 'x_unit's
			     x_length:48,    //number of 'x_step's that will be scrolled at a time
			     y_unit:         //sections of the view (titles of Y-Axis)
			     //TODO - load asm, sr list
			        [
					 {key:1, label:"Section A"},
			         {key:2, label:"Section B"},
			         {key:3, label:"Section C"},
			         {key:4, label:"Section D"},
					 {key:5, label:"Section E"},
					 {key:6, label:"Section F"},
					 {key:7, label:"Section G"},
					 {key:8, label:"Section H"},
					 {key:9, label:"Section I"},
					 {key:10, label:"Section J"},
					 {key:11, label:"Section K"},
					 {key:12, label:"Section L"},
					 {key:13, label:"Section M"}
					 ],
			     y_property:"username", //mapped data property
			     render:"bar"             //view mode
			});

			scheduler.createUnitsView({
			    name:"unit",
			    property:"username", //the mapped data property
			    list:[              //defines the units of the view
			        {key:1, label:"Section A"},
			        {key:2, label:"Section B"},
			        {key:3, label:"Section C"}  
			    ],
			    size:10,//the number of units that should be shown in the view 
	    		step:5  //the number of units that will be scrolled at once
			});

		},

		ready:function(){ 
			scheduler.parse([
				{ id: 1, start_date: "2012-03-27 09:00", end_date: "2012-03-27 12:00", text:"Task A-12458", channel: 'p3' },
				{ id: 2, start_date: "2012-03-28 09:00", end_date: "2012-03-28 12:00", text:"Task C-788", channel: 'p1' }
			],"json");
		}

	},
	
	getAgenda: function () {
		return this.myagenda;
	},
	
	setAgenda: function (role) {
		switch(role){
		case 'roles_admin':
			break;
		case 'roles_asm':
			break;
		case 'roles_sr':
			break;		
		default:
		}
	}
};