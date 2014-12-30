//agenda
//the object is linked to dhtmlxScheduler

//this has multiple display modes
//admin will see everyone's agenda
//asm will see own and SR subordinates agendas
//sr and guest will see only personal agenda

function arrayContains(obj,key,label){
	for(var i=0; i<obj.length; i++){
		if(obj[i].key == key && obj[i].label == label) return true;
	}
	return false;
}

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

//main agenda
var agenda = {
	channel_select_options : [],
	client_select_options: {},
	outlet_select_options: {},
	user_list: [],
	events_data: [],

	setEventsData: function(events_data){
		this.events_data = events_data;
		//if(!webix.isUndefined(scheduler)) scheduler.parse(this.events_data, "json");

	},

	getEventsData: function(){
		return this.events_data;
	},
	
	setOutlets: function(outlet_data) {
		for(var i=0; i<outlet_data.length; i++){
			//add new channel to option list
			if(! arrayContains(this.channel_select_options, outlet_data[i].channel, outlet_data[i].channel)){
				this.channel_select_options.push({
					key: outlet_data[i].channel, 
					label:outlet_data[i].channel
				});

			}
			//add new channel -> client to option list
			if(typeof this.client_select_options[outlet_data[i].channel] === 'undefined'){
				this.client_select_options[outlet_data[i].channel] = [];
				this.client_select_options[outlet_data[i].channel].push({
					key:outlet_data[i].client, 
					label:outlet_data[i].client
				});
			}else{
				if(! arrayContains(this.client_select_options[outlet_data[i].channel], outlet_data[i].client, outlet_data[i].client)){
					this.client_select_options[outlet_data[i].channel].push({
						key:outlet_data[i].client, 
						label:outlet_data[i].client
					});
				}
			}
			//add new client -> outlet to option list
			if(typeof this.outlet_select_options[outlet_data[i].client] === 'undefined'){
				this.outlet_select_options[outlet_data[i].client] = [];
				this.outlet_select_options[outlet_data[i].client].push({
					key:outlet_data[i].outlet, 
					label:outlet_data[i].outlet
				});
			}else{
				if(! arrayContains(this.outlet_select_options[outlet_data[i].client], outlet_data[i].outlet, outlet_data[i].outlet )){
					this.outlet_select_options[outlet_data[i].client].push({
						key: outlet_data[i].outlet, 
						label:outlet_data[i].outlet
					});
				}
			}
			
		}
	},

	getChannel: function () {
		return this.channel_select_options;
	},

	getClient: function  () {
		return this.client_select_options;
	},

	getOutlet: function  () {
		return this.outlet_select_options;
	},
	
	setUsers: function(users) {
		for(var i = 0; i < users.length; i++){
			this.user_list.push({
				key: users[i].username,
				label: (users[i].name + " " + users[i].surname)
			});
		};
	},
	
	getUsers: function () {
		return this.user_list;
	},
	
	getAgenda: function () {
		return {
			id: "planner",
			view: "dhx-scheduler",
			date: new Date(),
			mode: "week",
			tabs: ["day", "week", "month", "year","week_agenda","timeline","unit"],
			init:function(){
				scheduler.config.xml_date="%Y-%m-%d %H:%i";
				scheduler.config.api_date="%Y-%m-%d %H:%i";
				//limit the start date for creating new events
				scheduler.config.limit_start = new Date(scheduler.date.week_start(new Date()).getFullYear(),
					                                    scheduler.date.week_start(new Date()).getMonth(),
					                                    scheduler.date.week_start(new Date()).getDate());
				scheduler.config.limit_end = scheduler.date.add(new Date(), 1, 'year');
				scheduler.config.first_hour = 7;
				scheduler.config.last_hour = 20;
				scheduler.config.time_step = 30;
				scheduler.config.start_on_monday = true;
				scheduler.config.multi_day = false;
				//disable resize of events in month view
				scheduler.config.resize_month_events = false; 
				scheduler.config.resize_month_timed = false; 
				
				scheduler.config.buttons_left=["dhx_save_btn","dhx_cancel_btn","report_button"];
				scheduler.locale.labels["report_button"] = "Raport Vizită";

				scheduler.locale.labels.section_user_list = "Utilizator";				
				scheduler.locale.labels.section_channel_list = "Canalul de distribuţie";
				scheduler.locale.labels.section_client_list = "Client";
				scheduler.locale.labels.section_outlet_list = "Magazin";

				//Open detail edit, no menubar
				scheduler.xy.menu_width = 0;
				scheduler.config.details_on_dblclick = true;
				scheduler.config.details_on_create = true;
				//do not show details box on click
				//display lightbox for editing if event exists
				scheduler.attachEvent("onClick",function(id, e){
					if(id) scheduler.showLightbox(id);
					return false;
				});
			
				scheduler.ignore_week = function(date){
				    if (date.getDay() == 6 || date.getDay() == 0) //hides Saturdays and Sundays
				        return true;
				};
				
				//Add 60 min time interval for a visit
				scheduler.config.event_duration = 60; //specify event duration in minutes for auto end time
				scheduler.config.auto_end_date = true;

				// helper function to update select options from LighBox
				var update_select_options = function(select, options) { 
					select.options.length = 0;
					for (var i=0; i<options.length; i++) {
						var option = options[i];
						select[i] = new Option(option.label, option.key);
					}
				};
			
				var user_onchange = function(event){

				};
				var channel_onchange = function(event) {
					var new_child_options = agenda.getClient()[this.value];
					update_select_options(scheduler.formSection('client_list').control, new_child_options);
					update_select_options(scheduler.formSection('outlet_list').control, agenda.getOutlet()[new_child_options[0].key]);
					scheduler.formSection('description').setValue(scheduler.formSection('outlet_list').getValue());
					
				};
				var client_onchange = function(event) {
					var new_child_options = agenda.getOutlet()[this.value];
					update_select_options(scheduler.formSection('outlet_list').control, new_child_options);
					scheduler.formSection('description').setValue(scheduler.formSection('outlet_list').getValue());
				};	
				var outlet_onchange = function(event) {
					scheduler.formSection('description').setValue(scheduler.formSection('outlet_list').getValue());
				};
			
				//initialize from scratch
	
				scheduler.config.lightbox.sections=[
							{name:"description", height:32, map_to:"text", type:"textarea" , focus:false},
							{name:"user_list", height:32, type:"select", options:agenda.getUsers(), map_to:"username", onchange:user_onchange, focus:true },
							{name:"channel_list", height:32, type:"select", options: agenda.getChannel(), map_to:"channel", onchange:channel_onchange },
							{name:"client_list", height:32, type:"select", options:agenda.getClient(), map_to:"client", onchange:client_onchange },
							{name:"outlet_list", height:32, type:"select", options:agenda.getOutlet(), map_to:"outlet", onchange:outlet_onchange },
							{name:"recurring", height:115, type:"recurring", map_to:"rec_type", button:"recurring"},
		  					{name:"time", height:72, type:"calendar_time", map_to:"auto" }
				];	
	
				scheduler.form_blocks.textarea.set_value = function(node,value,ev){
				    node.firstChild.value=value||"";
				    node.firstChild.disabled = true;//ev.disabled; //or just '= true' to disable all events
				};			

				scheduler.config.wide_form = false;

				scheduler.config.repeat_date = "%Y-%m-%d";
				scheduler.config.occurrence_timestamp_in_utc = false;
				scheduler.config.include_end_by = true;
				scheduler.config.repeat_precise = true;
				
				scheduler.templates.tooltip_date_format=function (date){
				    var formatFunc = scheduler.date.date_to_str("%H:%i");
				    return formatFunc(date);
				}
				
				scheduler.templates.tooltip_text = function(start,end,ev){
				    return "<b>Vizită:</b> "+ev.text+"<br/><b>Ora:</b> " + 
				    scheduler.templates.tooltip_date_format(start)+ " - " + scheduler.templates.tooltip_date_format(end)+
				    "<br/><b>SR:</b> " + ev.username;
				};

				scheduler.attachEvent("onLightbox", function(id){
					var ev = scheduler.getEvent(id);
					if (!ev.channel){
						var channel = agenda.getChannel()[0].key;
						update_select_options(scheduler.formSection('client_list').control, agenda.getClient()[channel]);
						update_select_options(scheduler.formSection('outlet_list').control, agenda.getOutlet()[agenda.getClient()[channel][0].key]);
						scheduler.formSection('channel_list').setValue(channel);	
					}else{
						//channel is present
						var channel = ev.channel;
						scheduler.formSection('channel_list').setValue(channel);

						if(!ev.client){
							update_select_options(scheduler.formSection('client_list').control, agenda.getClient()[channel]);
							update_select_options(scheduler.formSection('outlet_list').control, agenda.getOutlet()[agenda.getClient()[channel][0].key]);
						}else{
							//client is also present
							var client = ev.client;
							update_select_options(scheduler.formSection('client_list').control, agenda.getClient()[channel]);
							scheduler.formSection('client_list').setValue(client);
							update_select_options(scheduler.formSection('outlet_list').control, agenda.getOutlet()[client]);

							if(ev.outlet){
								//outlet is also present
								var outlet = ev.outlet;
								scheduler.formSection('outlet_list').setValue(outlet);
							}
						}
					}
					
					scheduler.formSection('description').setValue(scheduler.formSection('outlet_list').getValue());
					
					
					var lightbox_form = scheduler.getLightbox(); // this will generate lightbox form
					var inputs = lightbox_form.getElementsByTagName('input');
					var date_of_end = null;
					for (var i=0; i<inputs.length; i++) {
						if (inputs[i].name == "date_of_end") {
							date_of_end = inputs[i];
							break;
						}
					}

					var repeat_end_date_format = scheduler.date.date_to_str(scheduler.config.repeat_date);
					var show_minical = function(){
						if (scheduler.isCalendarVisible())
							scheduler.destroyCalendar();
						else {
							scheduler.renderCalendar({
								position:date_of_end,
								date: scheduler.getState().date,
								navigation:true,
								handler:function(date,calendar) {
									date_of_end.value = repeat_end_date_format(date);
									scheduler.destroyCalendar()
								}
							});
						}
					};
					date_of_end.onclick = show_minical;
					
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
				

				//-----------------------------------------
				// Deal with event opretations
				// creation: double-click
				// editing: via lighbox
				// deleting: via ligtbox
				//-----------------------------------------

				//when save button on lightbox is clicked
				//when creating a new event
				scheduler.attachEvent("onEventAdded",function(id,ev){
					if (webix.isUndefined(ev.sr_report)) {
						ev.sr_report = JSON.stringify({});
					}
					if(typeof ev.sr_report === "object"){
						ev.sr_report = JSON.stringify(ev.sr_report);
					}
					if (webix.isUndefined(ev.doctype)) ev.doctype = "event";

					if(ev.rec_type.length > 0 && ev.rec_pattern.length > 0 && ev.event_pid == "") ev.event_pid = "0";

					webix.message("Eveniment creat cu succes!");
					return true;
				});	

				scheduler.attachEvent("onEventChanged",function(id,ev){
					if (webix.isUndefined(ev.sr_report)) {
						ev.sr_report = JSON.stringify({});
					}
					if(typeof ev.sr_report === "object") ev.sr_report = JSON.stringify(ev.sr_report);
					if (webix.isUndefined(ev.doctype)) ev.doctype = "event";
					webix.message("Evenimentul a fost salvat cu succes!");
					return true;
				});	

				scheduler.attachEvent("onBeforeEventDelete", function(id,e){
					//something is wrong with this event
					if(webix.isUndefined(e)){
						webix.message({type:"error", text:"Selectaţi evenimentul, nu seria!!!"});
						return false;
					}
					//do not delete events with SR Report
					if(!webix.isUndefined(e.sr_report) && !webix.isUndefined(e.sr_report.report)){
				    	webix.message({type:"error", text:"Evenimentul conţine Raport SR şi nu poate fi şters!!"});
				    	return false;
				    }
				    if(typeof e.sr_report === "object")  e.sr_report =  JSON.stringify(e.sr_report);
				    webix.message("Evenimentul a fost şters cu succes!");
				    return true;
				});

				scheduler.attachEvent("onEventDeleted", function(id){
				    scheduler.load("../events/_list/events_list/all_events","json");
				});

				//deal with dragging the event
				//disable dragging
				scheduler.attachEvent("onBeforeDrag", function (id, mode, e){
				    return false;
				});
				 

				//-----------------------------------------
				// End of event operations
				//-----------------------------------------
				
		
				//scheduler.config.fix_tab_position = false;
				scheduler.locale.labels.year_tab ="An";
				scheduler.locale.labels.week_agenda_tab ="Agenda";
				scheduler.locale.labels.timeline_tab ="Plan";
				scheduler.locale.labels.unit_tab = "SR";

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
				     x_start:14,     //X-Axis offset in 'x_unit's
				     x_length:48,    //number of 'x_step's that will be scrolled at a time
				     y_unit: agenda.getUsers(),        //sections of the view (titles of Y-Axis)
				     y_property:"username", //mapped data property
				     render:"bar"             //view mode
				});
				
				scheduler.ignore_timeline = function(date){
					//non-working hours
					if (date.getHours() < 7 || date.getHours() > 20) return true;
				};

				scheduler.createUnitsView({
				    name:"unit",
				    property:"username", //the mapped data property
				    list: agenda.getUsers(), //defines the units of the view
				    size:10,//the number of units that should be shown in the view 
		    		step:5  //the number of units that will be scrolled at once
				});

			},

			ready:function(){ 
				scheduler.load("../events/_list/events_list/all_events","json");
				var dp = new dataProcessor("../events/_update/events_update/");
				dp.init(scheduler);
				dp.setTransactionMode("REST");
			}

		};
	}
};