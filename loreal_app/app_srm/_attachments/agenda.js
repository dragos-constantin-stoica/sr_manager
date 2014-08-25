//main agenda
//this has multiple display modes
//admin will see everyone's agenda
//asm will see own and SR subordinates agendas
//sr and guest will see only personal agenda

var agenda = {

	channel_select_options : [],
	client_select_options: [],
	outlet_select_options: [],

	setOutlets: function (outlet_data) {
		for(var i=0; i<outlet_data.data.length; i++){
			this.channel_select_options.push({key: outlet_data.data[i].channel, label:outlet_data.data[i].channel});
			if(typeof this.client_select_options[outlet_data.data[i].channel] === 'undefined'){
				this.client_select_options[outlet_data.data[i].channel] = [{key:outlet_data.data[i].client, label:outlet_data.data[i].client}];
			}else{
				this.client_select_options[outlet_data.data[i].channel].push({key:outlet_data.data[i].client, label:outlet_data.data[i].client});
			}
			if(typeof this.outlet_select_options[outlet_data.data[i].client] === 'undefined'){
				this.outlet_select_options[outlet_data.data[i].client] = [{key:outlet_data.data[i].outlet, label:outlet_data.data[i].outlet}];
			}else{
				this.outlet_select_options[outlet_data.data[i].client].push({key: outlet_data.data[i].outlet, label:outlet_data.data[i].outlet});
			}
			
		}

	},

	showAgenda: function () {
		scheduler.config.xml_date="%Y-%m-%d %H:%i";
		scheduler.config.first_hour = 8;
		scheduler.config.last_hour = 20;
		scheduler.config.time_step = 30;
		scheduler.config.start_on_monday = true;
		scheduler.config.multi_day = false;
		scheduler.config.buttons_left=["dhx_save_btn","dhx_cancel_btn","report_button"];
		scheduler.locale.labels["report_button"] = "Raport Vizită";
		scheduler.locale.labels.section_channel = "Canalul de distribuţie";
		scheduler.locale.labels.section_client = "Client";
		scheduler.locale.labels.section_outlet = "Magazin";
		/*
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
		*/
		var update_select_options = function(select, options) { // helper function
			select.options.length = 0;
			for (var i=0; i<options.length; i++) {
				var option = options[i];
				select[i] = new Option(option.label, option.key);
			}
		};

		var channel_onchange = function(event) {
			var new_child_options = this.client_select_options[this.value];
			this.update_select_options(scheduler.formSection('client').control, new_child_options);
		};
		scheduler.attachEvent("onBeforeLightbox", function(id){
			var ev = scheduler.getEvent(id);
			if (!ev.client) {
				var channel = ev.channel||channel_select_options[0].key;
				var new_child_options = client_select_options[channel];
				this.update_select_options(scheduler.formSection('client').control, new_child_options);
			}
			return true;
		});	

		scheduler.config.lightbox.sections=[
					{name:"description", height:130, map_to:"text", type:"textarea" , focus:true},
					{name:"channel", height:32, type:"select", options: channel_select_options, map_to:"channel", onchange:channel_onchange },
					{name:"client", height:32, type:"select", options: client_select_options, map_to:"client" },
					{name:"outlet", height:32, type:"select", options: outlet_select_options, map_to:"outlet" },
					{name:"recurring", height:115, type:"recurring", map_to:"rec_type", button:"recurring"},
  					{name:"time", height:72, type:"calendar_time", map_to:"auto" }
		];
		
		
		scheduler.attachEvent("onLightboxButton", function(button_id, node, e){
			if(button_id == "report_button"){
				scheduler.endLightbox(false,scheduler.getLightbox());
				//srreportOnClick();
			}
			return true;
		});	

		var sTabs = '<div class="dhx_cal_tab" name="day_tab"      style="right:204px;"></div>'+
		            '<div class="dhx_cal_tab" name="week_tab"     style="right:140px;"></div>'+
		            '<div class="dhx_cal_tab" name="month_tab"    style="right:280px;"></div>'+
       				'<div class="dhx_cal_tab" name="year_tab"     style="right:20px;"></div>' +
       				'<div class="dhx_cal_tab" name="week_agenda_tab" style="right:20px;"></div>' +
			        '<div class="dhx_cal_tab" name="unit_tab"     style="right:20px;"></div>' +
		            '<div class="dhx_cal_tab" name="timeline_tab" style="right:20px;"></div>'+
				    '<div class="dhx_minical_icon" id="dhx_minical_icon" onclick="show_minical()">&nbsp;</div>';

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
		        [{key:1, label:"Section A"},
		         {key:2, label:"Section B"},
		         {key:3, label:"Section C"},
		         {key:4, label:"Section D"}],
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
 
		layout.cells("a").attachScheduler(new Date(2012,3,27,0,0,0,0), "week",sTabs);
		//scheduler.load("../common/scheduler.xml");
		scheduler.parse([
			{ id: 1, start_date: "2012-03-27 09:00", end_date: "2012-03-27 12:00", text:"Task A-12458", channel: 'p3' },
			{ id: 2, start_date: "2012-03-28 09:00", end_date: "2012-03-28 12:00", text:"Task C-788", channel: 'p1' }
		],"json");

	}

}


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
