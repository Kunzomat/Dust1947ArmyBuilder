export function getGameSystems(gameSystems = [], blocs = []) {
  const systemsById = new Map(
    gameSystems.map((system) => [String(system.id), system])
  );

  // Older API deployments may not yet expose game_systems.list. Include
  // systems referenced by blocs so filtering remains useful in that case.
  blocs.forEach((bloc) => {
    if (
      bloc.game_system_id !== null &&
      bloc.game_system_id !== undefined &&
      !systemsById.has(String(bloc.game_system_id))
    ) {
      systemsById.set(String(bloc.game_system_id), {
        id: bloc.game_system_id,
        name: bloc.game_system_name || `Game System ${bloc.game_system_id}`,
      });
    }
  });

  return Array.from(systemsById.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );
}

export function getBlocsForGameSystem(blocs = [], gameSystemId = "") {
  if (gameSystemId === "" || gameSystemId === null) return blocs;
  return blocs.filter(
    (bloc) => String(bloc.game_system_id) === String(gameSystemId)
  );
}

export function filterArmies(armies = [], blocs = [], gameSystemId = "", blocId = "") {
  const blocById = new Map(blocs.map((bloc) => [String(bloc.id), bloc]));

  return armies.filter((army) => {
    if (blocId !== "" && String(army.bloc_id) !== String(blocId)) {
      return false;
    }
    if (gameSystemId === "" || gameSystemId === null) return true;
    return (
      String(blocById.get(String(army.bloc_id))?.game_system_id) ===
      String(gameSystemId)
    );
  });
}
