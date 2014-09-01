webix.protoUI({
	name:"dhx-scheduler",
	defaults:{
		tabs:["day", "week", "month"]
	},
	getScheduler:function(){
		return this._scheduler;
	},
	$init:function(config){
		this.$ready.push(function(){
			var tabs = this.config.tabs;

			var html = ["<div class='dhx_cal_container' style='width:100%; height:100%;'>" +
			            "<div class='dhx_cal_navline'>" +
						"<div class='dhx_cal_prev_button'>&nbsp;</div>" +
						"<div class='dhx_cal_next_button'>&nbsp;</div>" +
						"<div class='dhx_cal_today_button'></div>" +
						"<div class='dhx_cal_date'></div>"];
			if (tabs)
				for (var i=0; i<tabs.length; i++)
					html.push("<div class='dhx_cal_tab' name='"+tabs[i]+"_tab' style='right:20px;' ></div>");
			html.push("<div class='dhx_minical_icon' id='dhx_minical_icon' onclick='show_minical()'>&nbsp;</div>"); 
			html.push("</div><div class='dhx_cal_header'></div><div class='dhx_cal_data'></div></div>");

			this.$view.innerHTML = html.join("");

			//because we are not messing with resize model
			//if setSize will be implemented - below line can be replaced with webix.ready
			webix.delay(webix.bind(this._render_once, this));
		});
	},
	_render_once:function(){
		webix.require("scheduler/dhtmlxscheduler.css");
		webix.require([
			"scheduler/dhtmlxscheduler.js",
			"scheduler/ext/dhtmlxscheduler_recurring.js",
			"scheduler/ext/dhtmlxscheduler_minical.js",
			"scheduler/ext/dhtmlxscheduler_editors.js",
			"scheduler/ext/dhtmlxscheduler_quick_info.js",
			"scheduler/ext/dhtmlxscheduler_readonly.js",
			"scheduler/ext/dhtmlxscheduler_serialize.js",
			"scheduler/ext/dhtmlxscheduler_units.js",
			"scheduler/ext/dhtmlxscheduler_timeline.js",
			"scheduler/ext/dhtmlxscheduler_treetimeline.js",
			"scheduler/ext/dhtmlxscheduler_tooltip.js",
			"scheduler/ext/dhtmlxscheduler_week_agenda.js",
			"scheduler/ext/dhtmlxscheduler_year_view.js",
			"scheduler/locale/locale_ro.js",
			"scheduler/locale/recurring/locale_recurring_ro.js"
		], function(){
			var scheduler = this._scheduler = window.Scheduler ? Scheduler.getSchedulerInstance() : window.scheduler;

			if (this.config.init)
				this.config.init.call(this);

			scheduler.init(this.$view.firstChild, (this.config.date||new Date()), (this.config.mode||"week"));
			if (this.config.ready)
				this.config.ready.call(this);

		}, this);
	}
}, webix.ui.view);