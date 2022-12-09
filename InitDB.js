alasql('CREATE localStorage DATABASE IF NOT EXISTS gamesystem_db');
alasql('ATTACH localStorage DATABASE gamesystem_db');

//alasql("DROP TABLE gamesystem_db.armys;  ");
//alasql("DROP TABLE gamesystem_db.army_platoons;  ");
//alasql("DROP TABLE gamesystem_db.army_units;  ");
alasql("CREATE TABLE IF NOT EXISTS gamesystem_db.armys (id string, name string, block_id string, faction_id string)");
alasql("CREATE TABLE IF NOT EXISTS gamesystem_db.army_platoons (id string, army_id string, platoon_id string)");
alasql("CREATE TABLE IF NOT EXISTS gamesystem_db.army_units (id string, unit_id string, army_id string, platoon_id string)");

//alasql("DROP TABLE blocks;  ");
//alasql("DROP TABLE factions;  ");
//alasql("DROP TABLE platoons;  ");
//alasql("DROP TABLE units;  ");
//alasql("DROP TABLE platoon_units;  ");
alasql('CREATE TABLE blocks (id string, name string)');
alasql('CREATE TABLE factions (id string, name string, block_id string)');
alasql('CREATE TABLE platoons (id string, name string, block_id string)');
alasql('CREATE TABLE units (id string, name string, description string, type string, ap_cost string, block_id string, faction_id string)');
alasql('CREATE TABLE platoon_units (id string, platoon_id string, unit_id string, type string)');

alasql.promise([
    'SELECT * INTO blocks FROM CSV("data/blocks.csv")',
    'SELECT * INTO factions FROM CSV("data/factions.csv")',
    'SELECT * INTO platoons FROM CSV("data/platoons.csv")',
    'SELECT * INTO units FROM CSV("data/units.csv")',
    'SELECT * INTO platoon_units FROM CSV("data/platoon_units.csv")'
]).then( function(res) {
    console.log('Result from last query:',res);
    console.table(alasql("SELECT * FROM blocks"));
    console.table(alasql("SELECT * FROM factions"));
    console.table(alasql("SELECT * FROM platoons"));
    console.table(alasql("SELECT * FROM units"));
    console.table(alasql("SELECT * FROM platoon_units"));
    updateFactionMenu();
    switchToMainView();
}).catch(function(reason){
    console.log('type:',reason)
});
