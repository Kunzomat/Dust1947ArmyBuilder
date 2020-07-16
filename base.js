function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c==='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

function updateFactionMenu() {
    $('#submenu-new-army').empty();
    var factions = alasql("SELECT * FROM factions ORDER BY name DESC");
    for (var faction of factions) { $('#submenu-new-army').prepend('<div id="'+faction.id+'" class="faction">'+faction.name+'</div>'); }
    $(".faction").on("click", function(){
	$("#submenu-new-army").slideUp();
	$("#nenuitem-new-army").removeClass("active");
        current_army = generateUUID();
    	alasql("INSERT INTO gamesystem_db.armys VALUES ('"+current_army+"', '', '"+jQuery(this).attr("id")+"')");
    	updateArmyList();
    	//switchToArmyView(current_army);
    });
}

function updateDetachmentMenu() {
    $('#submenu-new-detachment').empty();
    var detachments = alasql("SELECT * FROM detachments ORDER BY name DESC");
    for (var detachment of detachments) { $('#submenu-new-detachment').prepend('<div id="'+detachment.id+'" class="detachment">'+detachment.name+'</div>'); }
    $(".detachment").on("click", function(){
        $("#submenu-new-detachment").slideUp();
        $("#nenuitem-new-detachment").removeClass("active");
        current_detachment = generateUUID();
        var res = alasql("SELECT * FROM gamesystem_db.armys WHERE id='"+current_army+"'");
        var army = getArmy(res[0]);
        alasql("INSERT INTO gamesystem_db.army_detachments VALUES ('"+current_detachment+"', '"+current_army+"', '"+jQuery(this).attr("id")+"', '"+army.faction_id+"')");
        updateDetachmentList();
        //switchToArmyView(current_army);
    });
}

function updateArmyList() {
    $('#army_list').empty();
    var res = alasql("SELECT * FROM gamesystem_db.armys ORDER BY name");
    for (var item of res) {
        var army = getArmy(item);
        $('#army_list').prepend('<li id="army_'+army.id+'"><div class="list-item"><div class="list-item-removeicon"><img class="removeicon" id="'+army.id+'" src="removeicon.png" width="36" height="36" alt="" border="0"></div><div class="list-item-body" id="open_army_'+army.id+'"><div class="list-item-desc"><div><b>'+army.name+'['+army.faction_name+']</b></div><div></div></div><div class="list-item-cost"><div>Points</div><div class="cost-number">'+army.cost+'</div></div></div></div></li>');
        $(".removeicon#"+item.id).on("click", function() { removeArmy(jQuery(this).attr("id"));	});
        var item =$("#army_"+item.id);
        item.on("click", function() {
            var army_id = jQuery(this).attr("id").replace("army_","");
            switchToArmyView(army_id);
            $("#army_list li").removeClass("active");
            $("#army_"+army_id).toggleClass("active");
        });
    }
    $("#army_"+current_army).toggleClass("active");
}

function updateDetachmentList() {
    $('#detachment_list').empty();
    var res = alasql("SELECT * FROM gamesystem_db.army_detachments WHERE army_id='"+current_army+"' ORDER BY id");
    for (var item of res) {
        var detachment = getDetachment(item);
        $('#detachment_list').prepend('<li id="detachment_'+detachment.id+'"><div class="list-item"><div class="list-item-removeicon"><img class="removeicon" id="'+detachment.id+'" src="removeicon.png" width="36" height="36" alt="" border="0"></div><div class="list-item-body" id="open_detachment_'+detachment.id+'"><div class="list-item-desc"><div><b>'+detachment.name+' ['+detachment.faction_name+']</b></div><div></div></div><div class="list-item-cost"><div>Points</div><div class="cost-number">'+detachment.cost+'</div></div></div></div></li>');
        $(".removeicon#"+item.id).on("click", function() { removeArmy(jQuery(this).attr("id"));	});
        var item =$("#detachment_"+item.id);
        item.on("click", function() {
            var detachment_id = jQuery(this).attr("id").replace("detachment_","");
            switchToArmyView(current_army);
            $("#army_list li").removeClass("active");
            $("#army_"+army_id).toggleClass("active");
        });
    }
    $("#army_"+current_army).toggleClass("active");
}

function getArmy(item) {
    var faction = alasql("SELECT * FROM factions WHERE id='"+item.faction_id+"'");
    if (faction.length > 0) { item.faction_name = faction[0].name; }
    item.cost = 0;
    
    return item;
}

function getDetachment(item) {
    var detachment = alasql("SELECT * FROM detachments WHERE id='"+item.detachment_id+"'");
    if (detachment.length > 0) { item.name = detachment[0].name; }
    var faction = alasql("SELECT * FROM factions WHERE id='"+item.faction_id+"'");
    if (faction.length > 0) { item.faction_name = faction[0].name; }
    item.cost = 0;
    
    return item;
}

function removeArmy(army_id){
    alasql("DELETE FROM gamesystem_db.army_datasheets WHERE army_id='"+army_id+"'");
    alasql("DELETE FROM gamesystem_db.armys WHERE id='"+army_id+"'"); 
    $("#army_"+army_id).remove();
}

function switchToArmyView(army_id) {
    current_army = army_id;
    $('#nenuitem-new-detachment').show();
    $('#submenu-new-detachment').hide();
    $('#detachment_list').show();
    updateDetachmentMenu();
    updateDetachmentList();
    if (!$('#team_page').hasClass("center")) {
            $('#army_page').switchClass("left", "right", 0);
            $('#main_page').switchClass("center", "left", 1000, "easeOutExpo");
            $('#army_page').switchClass("right", "center", 1000, "easeOutExpo");
    }
}

function switchToMainView() {
    current_army = "";
    $('#nenuitem-new-army').show();
    $('#submenu-new-army').hide();
    $('#army_list').show();
    $('#army-overview').show();
    updateArmyList();	
    if (!$('#main_page').hasClass("center")) {
	//$('#main_page').switchClass("left", "right", 0);
	$('#army_page').switchClass("center", "right", 1000, "easeOutExpo", function() {$('#army_page').switchClass("right", "left", 0); } );
	$('#main_page').switchClass("left", "center", 1000, "easeOutExpo");
    }
}