/**
 * Created by p.florian91 on 8/26/2014.
 */



//users
var testpouch = {



    usersgrid : {},
    usersdata : {},
    asmuserslist: [""],

    mytoolbar : [
        { id: "newpassword", type: "button", text: "Schimbă Parola", action:"newpasswordOnClick" },
        { id: "newuser", type: "button", text: "Crează Utilizator", action: "newuserOnClick"},
        { id: "saveuser", type: "button",  text: "Salvează Datele", action:"saveuserOnClick" }
    ],

    setToolbar: function(toolbar) {
        this.mytoolbar = toolbar;
    },

    setRoleToolbar: function(role){
        if(role =="roles_asm"){
            this.mytoolbar = [
                { id: "newpassword", type: "button", text: "Schimbă Parola", action:"newpasswordOnClick" },
                { id: "saveuser", type: "button",  text: "Salvează Datele", action:"saveuserOnClick" }
            ];
        }

        if(role =="roles_sr"){
            this.mytoolbar = [
                { id: "newpassword", type: "button", text: "Schimbă Parola", action:"newpasswordOnClick" },
                { id: "saveuser", type: "button",  text: "Salvează Datele", action:"saveuserOnClick" }
            ];
        }

        if(role == "roles_admin"){
            this.mytoolbar = [
                { id: "newpassword", type: "button", text: "Schimbă Parola", action:"newpasswordOnClick" },
                { id: "newuser", type: "button", text: "Crează Utilizator", action: "newuserOnClick"},
                { id: "saveuser", type: "button",  text: "Salvează Datele", action:"saveuserOnClick" }
            ];
        }

    },

    setASMList: function(asmuserslist){
        this.asmuserslist = asmuserslist;
    },

    getASMList: function () {
        return this.asmuserslist;
    },

    setUsersData: function(usersdata){
        this.usersdata = usersdata;
    },

    getUsersData: function(){
        return this.usersdata;
    },

    setUsersGrid: function(grid){
        this.usersgrid = grid;
    },

    getUsersGrid: function() {
        return this.usersgrid;
    },

    showGrid: function(){

        var mygrid = layout.cells("a").attachGrid();
        mygrid.setImagePath("codebase/imgs/");
        mygrid.setColumnIds("_id,_rev,username,password,name,surname,boss_asm,roles_admin,roles_guest,roles_asm,roles_sr,active");
        mygrid.setHeader("id, rev, Nume Utilizator, Parola, Prenume, Nume, Nume şef SR (e un ASM), ADMIN, Guest, ASM, SR, Activ");
        mygrid.attachHeader("&nbsp;,&nbsp;,#select_filter,&nbsp;,#cspan,#cspan,#select_filter,&nbsp;,#cspan,#cspan,#cspan,#cspan");
        mygrid.setColSorting("na,na,str,str,str,str,str,str,str,str,str,str");

        //show columns according to user role
        if(USERNAME.roles_admin){
            mygrid.setInitWidths("0,0,*,0,200,200,*,60,60,60,60,60");
        }else{
            if(USERNAME.roles_asm || USERNAME.roles_sr || USERNAME.roles_guest){
                mygrid.setInitWidths("0,0,*,0,200,200,*,0,0,0,0,0");
            }
        }
        mygrid.setColTypes("ro,ro,ro,ro,ed,ed,coro,ch,ch,ch,ch,ch");
        mygrid.init();
        mygrid.setSkin("dhx_terrace");
        mygrid.parse(this.usersdata,"json");

        //allow user to edit only the first row - hers/his own data
        if(!USERNAME.roles_admin){
            for (var i=0; i < mygrid.getRowsNum(); i++){
                mygrid.lockRow(mygrid.getRowId(i),true);
            }
            mygrid.lockRow(mygrid.getRowId(0),false);
        }

        var combo = mygrid.getCombo(6);

        var asm_list = userstable.getASMList();
        combo.save();
        combo.clear();
        for(i=0; i < asm_list.length; i++){
            combo.put(asm_list[i], asm_list[i]);
        }
        mygrid.getCombo(6).restore();

        this.usersgrid = mygrid;

        var tlb = layout.cells("a").attachToolbar();
        tlb.loadStruct(this.mytoolbar);
    }

}