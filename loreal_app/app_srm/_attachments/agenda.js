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
	
	setOutlets: function (outlet_data) {
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
	
	setUsers: function (users) {
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
				scheduler.locale.labels.section_user_list = "Utilizator";

				//Open detail edit, no menubar
				scheduler.xy.menu_width = 0;
				scheduler.config.details_on_dblclick = true;
				scheduler.config.details_on_create = true;
				scheduler.attachEvent("onClick",function(){ return false; });
			
				scheduler.ignore_week = function(date){
				    if (date.getDay() == 6 || date.getDay() == 0) //hides Saturdays and Sundays
				        return true;
				};
				/*
				scheduler.ignore_month = function(date){
					if (date.getDay() == 6 || date.getDay() == 0)
						return true;
				};
				*/
				//Add 60 min time interval for a visit
				scheduler.config.event_duration = 60; //specify event duration in minutes for auto end time
				scheduler.config.auto_end_date = true;

				var update_select_options = function(select, options) { // helper function
					select.options.length = 0;
					for (var i=0; i<options.length; i++) {
						var option = options[i];
						select[i] = new Option(option.label, option.key);
					}
				};
			
				var channel_onchange = function(event) {
					var new_child_options = agenda.getClient()[this.value];
					update_select_options(scheduler.formSection('client_list').control, new_child_options);
					update_select_options(scheduler.formSection('outlet_list').control, agenda.getOutlet()[new_child_options[0].key]);
					scheduler.formSection('description').setValue(scheduler.formSection('client_list').getValue());
					
				};
				var client_onchange = function(event) {
					var new_child_options = agenda.getOutlet()[this.value];
					update_select_options(scheduler.formSection('outlet_list').control, new_child_options);
					scheduler.formSection('description').setValue(scheduler.formSection('client_list').getValue());
				};	
			
				//initialize from scratch
	
				scheduler.config.lightbox.sections=[
							{name:"description", height:32, map_to:"text", type:"textarea" , focus:false},
							{name:"channel_list", height:32, type:"select", options: agenda.getChannel(), map_to:"channel", onchange:channel_onchange, focus:true },
							{name:"client_list", height:32, type:"select", options:agenda.getClient(), map_to:"client", onchange:client_onchange },
							{name:"outlet_list", height:32, type:"select", options:agenda.getOutlet(), map_to:"outlet" },
							{name:"user_list", height:32, type:"select", options:agenda.getUsers(), map_to:"username" },
							{name:"recurring", height:115, type:"recurring", map_to:"rec_type", button:"recurring"},
		  					{name:"time", height:72, type:"calendar_time", map_to:"auto" }
				];	
	
				scheduler.form_blocks.textarea.set_value = function(node,value,ev){
				    node.firstChild.value=value||"";
				    node.firstChild.disabled = true;//ev.disabled; //or just '= true' to disable all events
				};			

				scheduler.config.wide_form = false;

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
					
					scheduler.formSection('description').setValue(scheduler.formSection('client_list').getValue());
					
					
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
				
				//when save button on lightbox is clicked
				//is_new = true if event is created
				scheduler.attachEvent("onEventSave",function(id,ev,is_new){
			        var eventDoc = ev;
					if (typeof eventDoc.event === 'undefined') eventDoc.doctype = "event";
					if (typeof eventDoc.sr_report === 'undefined') eventDoc.sr_report = {};
					console.log("I got:" + id + " >>> " + JSON.stringify(ev) );
					console.log("Created: " + JSON.stringify(eventDoc) );
					
				    if (is_new) {
				        console.log("New event!!!");
				        return true;
				    }
				    return true;
				})		
		
				//scheduler.config.fix_tab_position = false;
				scheduler.locale.labels.year_tab ="An";
				scheduler.locale.labels.week_agenda_tab ="Agenda";
				scheduler.locale.labels.timeline_tab ="Plan";
				scheduler.locale.labels.unit_tab = "SR"

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
					//non-work hours
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
				scheduler.parse([
					{ id: 1, start_date: "2012-03-27 09:00", end_date: "2012-03-27 12:00", text:"Task A-12458" },
					{ id: 2, start_date: "2012-03-28 12:00", end_date: "2012-03-28 16:00", text:"Task C-788" }
				],"json");
			}

		};
	}
};