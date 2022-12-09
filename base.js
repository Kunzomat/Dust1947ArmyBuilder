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
      var faction = alasql("SELECT * FROM factions WHERE id='"+jQuery(this).attr("id")+"'");
      var army_name = faction[0].name;
    	alasql("INSERT INTO gamesystem_db.armys VALUES ('"+current_army+"', '"+army_name+"', '"+faction[0].block_id+"','"+faction[0].id+"')");
      current_platoon = generateUUID();
      alasql("INSERT INTO gamesystem_db.army_platoons VALUES ('"+current_platoon+"', '"+current_army+"', 'STANDARD')");
    	updateArmyList();
      updateUnitList();
      updatePlatoonList();
    	//switchToArmyView(current_army);
    });
}

function updateUnitMenu() {
    $('#submenu-new-unit').empty();
    var army = getArmy(current_army);
    var units = alasql("SELECT * FROM units WHERE faction_id='"+army.faction_id+"' ORDER BY name DESC");
    for (var unit of units) { $('#submenu-new-unit').prepend('<div id="'+unit.id+'" class="unit">'+unit.name+'</div>'); }
    $(".unit").on("click", function(){
        $("#submenu-new-unit").slideUp();
        $("#nenuitem-new-unit").removeClass("active");
        current_unit = generateUUID();
        var army = getArmy(current_army);
        alasql("INSERT INTO gamesystem_db.army_units VALUES ('"+current_unit+"',  '"+jQuery(this).attr("id")+"', '"+current_army+"','PLATOON')");
        updateUnitList();
        //switchToArmyView(current_army);
    });
}

function updatePlatoonMenu() {
  $('#submenu-new-platoon').empty();
  var army = getArmy(current_army);
  var platoons = alasql("SELECT * FROM platoons WHERE block_id='"+army.block_id+"' ORDER BY name DESC");
  for (var platoon of platoons) { $('#submenu-new-platoon').prepend('<div id="'+platoon.id+'" class="platoon">'+platoon.name+'</div>'); }
  $(".platoon").on("click", function(){
      $("#submenu-new-platoon").slideUp();
      $("#nenuitem-new-platoon").removeClass("active");
      current_platoon = generateUUID();
      var army = getArmy(current_army);
      alasql("INSERT INTO gamesystem_db.army_platoons VALUES ('"+current_platoon+"', '"+current_army+"', '"+jQuery(this).attr("id")+"')");
      updatePlatoonList();
      //switchToArmyView(current_army);
  });
}

function updateArmyList() {
    $('#army_list').empty();
    var res = alasql("SELECT * FROM gamesystem_db.armys ORDER BY name");
    for (var item of res) {
        var army = getArmy(item.id);
        $('#army_list').prepend('<li id="army_'+army.id+'"><div class="list-item"><div class="list-item-removeicon"><img class="removeicon" id="'+army.id+'" src="removeicon.png" width="36" height="36" alt="" border="0"></div><div class="list-item-body" id="open_army_'+army.id+'"><div class="list-item-desc"><div><b>'+army.name+'</b></div><div>'+army.faction_name+'</div></div><div class="list-item-cost"><div>Points</div><div class="cost-number">'+army.cost+'</div></div></div></div></li>');
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

function updateUnitList() {
    $('#unit_list').empty();
    var res = alasql("SELECT * FROM gamesystem_db.army_platoons WHERE army_id='"+current_army+"' ORDER BY id");
    for (var item of res) {
      var platoon = getPlatoon(item);
      $('#unit_list').prepend('<li id="platoon_'+platoon.id+'" class="platoon"><div class="list-item"><div class="list-item-removeicon"><img class="removeicon" id="'+platoon.id+'" src="removeicon.png" width="36" height="36" alt="" border="0"></div><div class="list-item-body" id="open_unit_'+platoon.id+'"><div class="list-item-desc"><div><b>'+platoon.name+'</b></div><div>add unit</div></div><div class="list-item-cost"><div>Points</div><div class="cost-number">'+platoon.cost+'</div></div></div></div></li>');
      $(".removeicon#"+item.id).on("click", function() { removeArmy(jQuery(this).attr("id"));	});
      var item =$("#platoon_"+item.id);
      item.on("click", function() {
          var platoon_id = jQuery(this).attr("id").replace("platoon_","");
          switchToArmyView(current_army);
          $("#army_list li").removeClass("active");
          $("#army_"+army_id).toggleClass("active");
      });
    }

    var res = alasql("SELECT * FROM gamesystem_db.army_units WHERE army_id='"+current_army+"' ORDER BY id");
    for (var item of res) {
        var unit = getUnit(item);
        $('#unit_list').prepend('<li id="unit_'+unit.id+'"><div class="list-item"><div class="list-item-removeicon"><img class="removeicon" id="'+unit.id+'" src="removeicon.png" width="36" height="36" alt="" border="0"></div><div class="list-item-body" id="open_unit_'+unit.id+'"><div class="list-item-desc"><div><b>'+unit.name+'</b></div><div></div></div><div class="list-item-cost"><div>Points</div><div class="cost-number">'+unit.cost+'</div></div></div></div></li>');
        $(".removeicon#"+item.id).on("click", function() { removeArmy(jQuery(this).attr("id"));	});
        var item =$("#unit_"+item.id);
        item.on("click", function() {
            var unit_id = jQuery(this).attr("id").replace("unit_","");
            switchToArmyView(current_army);
            $("#army_list li").removeClass("active");
            $("#army_"+army_id).toggleClass("active");
        });
    }
    $("#army_"+current_army).toggleClass("active");
}

function getArmy(army_id) {
    var res = alasql("SELECT * FROM gamesystem_db.armys WHERE id='"+army_id+"'");
    var item = res[0];
    var faction = alasql("SELECT * FROM factions WHERE id='"+item.faction_id+"'");
    if (faction.length > 0) {
      item.faction_name = faction[0].name;
      item.faction_id = faction[0].id;
    }
    var units = alasql("SELECT * FROM gamesystem_db.army_units WHERE army_id='"+army_id+"' ORDER BY id");
    var cost = 0;
    for (var unit of units) {
      getUnit(unit);
      cost += unit.cost;
    }
    item.cost = cost;

    return item;
}

function getUnit(item) {
    var unit = alasql("SELECT * FROM units WHERE id='"+item.unit_id+"'");
    if (unit.length > 0) {
      item.name = unit[0].name;
      item.cost = unit[0].ap_cost;
    }
    var faction = alasql("SELECT * FROM factions WHERE id='"+item.faction_id+"'");
    if (faction.length > 0) { item.faction_name = faction[0].name; }

    return item;
}

function getPlatoon(item) {
    var platoon = alasql("SELECT * FROM platoons WHERE id='"+item.platoon_id+"'");
    if (platoon.length > 0) {
      item.name = platoon[0].name;
    }
    //var faction = alasql("SELECT * FROM factions WHERE id='"+item.faction_id+"'");
    //if (faction.length > 0) { item.faction_name = faction[0].name; }

    return item;
}

function removeArmy(army_id){
    alasql("DELETE FROM gamesystem_db.army_datasheets WHERE army_id='"+army_id+"'");
    alasql("DELETE FROM gamesystem_db.armys WHERE id='"+army_id+"'");
    $("#army_"+army_id).remove();
}

function switchToArmyView(army_id) {
    current_army = army_id;
    $('#nenuitem-new-unit').show();
    $('#submenu-new-unit').hide();
    $('#unit_list').show();
    updateUnitMenu();
    updateUnitList();
    updatePlatoonMenu();
    updatePlatoonList();
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
