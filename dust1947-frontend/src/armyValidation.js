const HERO_TYPE = "H";
const INFANTRY_TYPE = "I";
const VEHICLE_TYPE = "V";
const AIRCRAFT_TYPE = "A";

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function normalizeRuleName(ruleName) {
  return String(ruleName || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function getRuleNames(unit) {
  const directRules = Array.isArray(unit?.rules)
    ? unit.rules
    : Array.isArray(unit?.unit_rules)
      ? unit.unit_rules
      : Array.isArray(unit?.rule_names)
        ? unit.rule_names
        : [];

  const specialRules = Array.isArray(unit?.special_rules) ? unit.special_rules : [];
  const serialized = typeof unit?.rule_names === "string" ? unit.rule_names.split("||") : [];

  return [...directRules, ...specialRules, ...serialized]
    .map((rule) => (typeof rule === "string" ? rule : rule?.name))
    .filter(Boolean)
    .map(normalizeRuleName);
}

function hasRule(unit, ...ruleNames) {
  const normalized = new Set(getRuleNames(unit));
  return ruleNames.some((ruleName) => normalized.has(normalizeRuleName(ruleName)));
}

function getArmorValue(unit) {
  if (Number.isFinite(Number(unit?.armor_value))) {
    return Number(unit.armor_value);
  }

  const armorRule = getRuleNames(unit).find((ruleName) => /^ARMOR\s+\d+$/i.test(ruleName));
  if (!armorRule) {
    return null;
  }

  return toInt(armorRule.replace(/\D+/g, ""), null);
}

function getQuantity(unit) {
  return Math.max(1, toInt(unit?.quantity, 1));
}

function getUnitBasePoints(unit) {
  return Math.max(0, toInt(unit?.unit_points ?? unit?.points, 0)) * getQuantity(unit);
}

function isCaptured(unit) {
  return unit?.is_captured === true || unit?.is_captured === 1 || unit?.is_captured === "1";
}

function getCapturedVehicleCount(unit) {
  if (!isCaptured(unit)) {
    return 0;
  }
  return getQuantity(unit);
}

function getUnitTotalPoints(unit) {
  return getUnitBasePoints(unit) + (isCaptured(unit) ? 2 * getQuantity(unit) : 0);
}

function isHero(unit) {
  return String(unit?.type || "").toUpperCase() === HERO_TYPE;
}

function isInfantry(unit) {
  return String(unit?.type || "").toUpperCase() === INFANTRY_TYPE;
}

function isVehicle(unit) {
  return String(unit?.type || "").toUpperCase() === VEHICLE_TYPE;
}


function getBasicUnitType(unit) {
  const type = String(unit?.type || "").toUpperCase();
  if ([INFANTRY_TYPE, VEHICLE_TYPE, AIRCRAFT_TYPE, HERO_TYPE].includes(type)) {
    return type;
  }
  return type || "UNKNOWN";
}

function isMercenary(unit) {
  return (
    unit?.is_mercenary === true ||
    unit?.is_mercenary === 1 ||
    unit?.is_mercenary === "1" ||
    hasRule(unit, "MERCENARY")
  );
}

function isCommissar(unit) {
  return hasRule(unit, "COMMISSAR");
}

function hasPilotSkill(unit) {
  return hasRule(unit, "PILOT", "ACE PILOT");
}

function hasSiblingsRule(unit) {
  return hasRule(unit, "SIBLINGS", "SIBLINGS");
}

function getUnitDisplayName(unit) {
  return unit?.unit_name || unit?.name || `Unit ${unit?.unit_id || unit?.id || "?"}`;
}

function getUnitFactionId(unit) {
  return unit?.faction_id == null ? null : toInt(unit.faction_id, null);
}

function getUnitBlocId(unit) {
  return unit?.bloc_id == null ? null : toInt(unit.bloc_id, null);
}

function getUnitIdentityKey(unit) {
  if (unit?.unique_key) {
    return String(unit.unique_key);
  }
  return String(unit?.unit_id ?? unit?.id ?? getUnitDisplayName(unit));
}

function buildTemplatesByPlatoon(platoonTemplates) {
  const templatesByPlatoon = new Map();

  for (const template of platoonTemplates || []) {
    const armyPlatoonId = toInt(template?.army_platoon_id, null);
    if (!armyPlatoonId) continue;

    const slot = String(template?.slot || template?.platoon_slot || "");
    if (!slot) continue;

    if (!templatesByPlatoon.has(armyPlatoonId)) {
      templatesByPlatoon.set(armyPlatoonId, new Map());
    }

    const slots = templatesByPlatoon.get(armyPlatoonId);
    if (!slots.has(slot)) {
      slots.set(slot, []);
    }
    slots.get(slot).push(template);
  }

  return templatesByPlatoon;
}

function createMessage(kind, rule, message, details = {}) {
  return { kind, rule, message, details };
}

export function validateArmyComposition(input = {}) {
  const army = input?.army || {};
  const units = Array.isArray(input?.units) ? input.units : [];
  const platoons = Array.isArray(input?.platoons) ? input.platoons : [];
  const platoonTemplates = Array.isArray(input?.platoon_templates) ? input.platoon_templates : [];

  const pointsLimit = Math.max(0, toInt(army?.points_limit, 0));
  const armyBlocId = army?.bloc_id == null ? null : toInt(army.bloc_id, null);

  const violations = [];
  const warnings = [];
  const dataModelGaps = [];

  const pointsUsed = units.reduce((sum, unit) => sum + getUnitTotalPoints(unit), 0);
  const pureMercenaryForce =
    units.length > 0 &&
    units.every((unit) => isMercenary(unit) || isCaptured(unit));

  const capturedUnits = units.filter(isCaptured);
  const capturedVehicleCount = capturedUnits.reduce((sum, unit) => sum + getCapturedVehicleCount(unit), 0);
  if (capturedVehicleCount > 1) {
    violations.push(
      createMessage(
        "violation",
        12,
        "Eine Armee darf höchstens ein erbeutetes Fahrzeug enthalten.",
        { capturedVehicleCount }
      )
    );
  }

  for (const unit of capturedUnits) {
    if (!isVehicle(unit)) {
      violations.push(
        createMessage(
          "violation",
          12,
          `${getUnitDisplayName(unit)} ist als erbeutet markiert, ist aber kein Fahrzeug.`,
          { unitId: unit.army_unit_id ?? unit.id ?? unit.unit_id }
        )
      );
    }

    if (hasOwn(unit, "can_be_captured") && !unit.can_be_captured) {
      violations.push(
        createMessage(
          "violation",
          14,
          `${getUnitDisplayName(unit)} ist laut Datenmodell nicht als erbeutbares Fahrzeug freigegeben.`,
          { unitId: unit.army_unit_id ?? unit.id ?? unit.unit_id }
        )
      );
    }
  }

  if (!capturedUnits.length && units.some((unit) => hasOwn(unit, "can_be_captured"))) {
    // no-op: data available and army uses none
  } else if (!units.some((unit) => hasOwn(unit, "can_be_captured"))) {
    dataModelGaps.push(
      createMessage(
        "data-gap",
        14,
        "Die Daten enthalten derzeit keine belastbare Kennzeichnung, welche Fahrzeuge explizit als erbeutbar erlaubt sind."
      )
    );
  }

  const offBlocUnits = units.filter((unit) => {
    if (armyBlocId == null) return false;
    if (isMercenary(unit) || isCaptured(unit)) return false;
    const unitBlocId = getUnitBlocId(unit);
    return unitBlocId != null && unitBlocId !== armyBlocId;
  });

  if (offBlocUnits.length > 0) {
    violations.push(
      createMessage(
        "violation",
        1,
        `Die Armee enthält Einheiten aus einem anderen Bloc: ${offBlocUnits
          .map(getUnitDisplayName)
          .join(", ")}.`,
        { unitIds: offBlocUnits.map((unit) => unit.army_unit_id ?? unit.id ?? unit.unit_id) }
      )
    );
  }

  const factionPointMap = new Map();
  let countedFactionPoints = 0;
  for (const unit of units) {
    if (isMercenary(unit) || isCaptured(unit)) continue;
    const factionId = getUnitFactionId(unit);
    if (factionId == null) continue;
    const unitPoints = getUnitTotalPoints(unit);
    factionPointMap.set(factionId, (factionPointMap.get(factionId) || 0) + unitPoints);
    countedFactionPoints += unitPoints;
  }

  const factionEntries = Array.from(factionPointMap.entries()).sort((a, b) => b[1] - a[1]);
  const [selectedFactionId, selectedFactionPoints] = factionEntries[0] || [null, 0];
  const factionShare = pointsUsed > 0 ? selectedFactionPoints / pointsUsed : 0;

  const nonMercFactionUnits = units.filter((unit) => !isMercenary(unit) && !isCaptured(unit));
  const otherFactionUnits = selectedFactionId == null
    ? []
    : nonMercFactionUnits.filter((unit) => getUnitFactionId(unit) !== selectedFactionId);

  const qualifiesFactionForce =
    pureMercenaryForce ||
    (selectedFactionId != null && factionShare >= 0.75 && otherFactionUnits.length === 0);

  const forceType = pureMercenaryForce
    ? "Pure Mercenary Force"
    : qualifiesFactionForce
      ? "Faction Force"
      : "Bloc Force";

  if (!qualifiesFactionForce && selectedFactionId != null && factionShare >= 0.75 && otherFactionUnits.length > 0) {
    warnings.push(
      createMessage(
        "warning",
        4,
        "Die 75%-Schwelle ist erreicht, aber andere Fraktionen verhindern den Faction-Bonus.",
        { selectedFactionId, factionShare }
      )
    );
  }

  if (!pureMercenaryForce && selectedFactionId != null && countedFactionPoints > 0 && factionShare < 0.75) {
    warnings.push(
      createMessage(
        "warning",
        3,
        `Die Armee erreicht nur ${Math.round(factionShare * 100)}% Fraktions-AP und qualifiziert sich daher nicht als Faction Force.`,
        { selectedFactionId, factionShare }
      )
    );
  }

  const bonusApAvailable = qualifiesFactionForce ? Math.floor(pointsLimit * 0.1) : 0;
  const effectivePointsLimit = pointsLimit + bonusApAvailable;
  const bonusApUsed = Math.max(0, pointsUsed - pointsLimit);

  if (pointsUsed > pointsLimit && !qualifiesFactionForce) {
    violations.push(
      createMessage(
        "violation",
        6,
        `Die Armee überschreitet das Punktelimit von ${pointsLimit} AP und hat keinen gültigen Faction-Bonus.`,
        { pointsUsed, pointsLimit }
      )
    );
  }

  if (pointsUsed > effectivePointsLimit) {
    violations.push(
      createMessage(
        "violation",
        6,
        `Die Armee überschreitet selbst mit Faction-Bonus das maximale Limit von ${effectivePointsLimit} AP.`,
        { pointsUsed, effectivePointsLimit, bonusApAvailable }
      )
    );
  }

  if (bonusApUsed > 0) {
    const eligibleBonusHeroPoints = units
      .filter((unit) => isHero(unit))
      .filter((unit) => {
        if (pureMercenaryForce) {
          return isMercenary(unit);
        }
        if (selectedFactionId != null && getUnitFactionId(unit) === selectedFactionId) {
          return true;
        }
        return armyBlocId != null && getUnitBlocId(unit) === armyBlocId;
      })
      .reduce((sum, unit) => sum + getUnitTotalPoints(unit), 0);

    if (bonusApUsed > eligibleBonusHeroPoints) {
      violations.push(
        createMessage(
          "violation",
          7,
          `Es werden ${bonusApUsed} Bonus-AP benötigt, aber nur ${eligibleBonusHeroPoints} AP davon liegen auf erlaubten Helden des gewählten Faction/Bloc-Kontexts.`,
          { bonusApUsed, eligibleBonusHeroPoints }
        )
      );
    }
  }

  const heroDuplicates = new Map();
  for (const unit of units.filter(isHero)) {
    const key = getUnitIdentityKey(unit);
    heroDuplicates.set(key, [...(heroDuplicates.get(key) || []), unit]);
  }

  for (const [key, heroUnits] of heroDuplicates.entries()) {
    const totalCopies = heroUnits.reduce((sum, unit) => sum + getQuantity(unit), 0);
    if (totalCopies > 1) {
      violations.push(
        createMessage(
          "violation",
          15,
          `${getUnitDisplayName(heroUnits[0])} darf als einzigartiger Held nur einmal in der Armee vorkommen.`,
          { key, totalCopies }
        )
      );
    }
  }

  const attachmentFieldsAvailable = units.some(
    (unit) => hasOwn(unit, "attached_to_army_unit_id") || hasOwn(unit, "attachment_role")
  );

  const armyUnitsById = new Map(
    units.map((unit) => [toInt(unit.army_unit_id ?? unit.id ?? unit.unit_id, 0), unit])
  );

  if (!attachmentFieldsAvailable) {
    dataModelGaps.push(
      createMessage(
        "data-gap",
        16,
        "Für Held-/Kommissar-/Pilot-Zuordnungen fehlen in den aktuellen API-Daten Verknüpfungsfelder. Diese Regeln können live nur geprüft werden, wenn solche Felder geliefert werden."
      )
    );
  }

  const attachedHeroesByTarget = new Map();
  const commissarsByTarget = new Map();
  const pilotsByTarget = new Map();

  for (const unit of units) {
    const attachedToId = toInt(unit?.attached_to_army_unit_id, 0);
    const attachmentRole = String(unit?.attachment_role || "").toLowerCase();
    if (!attachedToId) continue;

    const target = armyUnitsById.get(attachedToId);
    if (!target) {
      violations.push(
        createMessage(
          "violation",
          28,
          `${getUnitDisplayName(unit)} verweist auf eine nicht vorhandene Ziel-Einheit.`,
          { attachedToId }
        )
      );
      continue;
    }

    if (isHero(unit) && attachmentRole !== "pilot") {
      const list = attachedHeroesByTarget.get(attachedToId) || [];
      list.push(unit);
      attachedHeroesByTarget.set(attachedToId, list);

      if (!isInfantry(target)) {
        violations.push(
          createMessage(
            "violation",
            16,
            `${getUnitDisplayName(unit)} darf nur einer Infanterie-Einheit zugeordnet werden.`,
            { heroId: unit.army_unit_id, targetId: attachedToId }
          )
        );
      }

      if (getArmorValue(unit) != null && getArmorValue(target) != null && getArmorValue(unit) !== getArmorValue(target)) {
        violations.push(
          createMessage(
            "violation",
            16,
            `${getUnitDisplayName(unit)} und ${getUnitDisplayName(target)} haben unterschiedliche Armor-Werte.`,
            { heroId: unit.army_unit_id, targetId: attachedToId }
          )
        );
      }
    }

    if (attachmentRole === "pilot") {
      const list = pilotsByTarget.get(attachedToId) || [];
      list.push(unit);
      pilotsByTarget.set(attachedToId, list);

      if (!isVehicle(target)) {
        violations.push(
          createMessage(
            "violation",
            19,
            `${getUnitDisplayName(unit)} ist als Pilot zugeordnet, das Ziel ist aber kein Fahrzeug.`,
            { pilotId: unit.army_unit_id, targetId: attachedToId }
          )
        );
      }

      if (!isHero(unit) || !hasPilotSkill(unit)) {
        violations.push(
          createMessage(
            "violation",
            20,
            `${getUnitDisplayName(unit)} darf ohne Pilot oder Ace Pilot kein Fahrzeug steuern.`,
            { pilotId: unit.army_unit_id, targetId: attachedToId }
          )
        );
      }
    }

    if (isCommissar(unit) || attachmentRole === "commissar") {
      const list = commissarsByTarget.get(attachedToId) || [];
      list.push(unit);
      commissarsByTarget.set(attachedToId, list);

      if (!isInfantry(target)) {
        violations.push(
          createMessage(
            "violation",
            21,
            `${getUnitDisplayName(unit)} muss einer Infanterie-Einheit zugewiesen werden.`,
            { commissarId: unit.army_unit_id, targetId: attachedToId }
          )
        );
      }

      if (getArmorValue(unit) != null && getArmorValue(target) != null && getArmorValue(unit) !== getArmorValue(target)) {
        violations.push(
          createMessage(
            "violation",
            22,
            `${getUnitDisplayName(unit)} und ${getUnitDisplayName(target)} haben unterschiedliche Armor-Werte.`,
            { commissarId: unit.army_unit_id, targetId: attachedToId }
          )
        );
      }
    }
  }

  for (const unit of units.filter(isCommissar)) {
    const attachedToId = toInt(unit?.attached_to_army_unit_id, 0);
    if (!attachedToId) {
      violations.push(
        createMessage(
          "violation",
          21,
          `${getUnitDisplayName(unit)} muss zu Spielbeginn einer Infanterie-Einheit zugewiesen sein.`,
          { commissarId: unit.army_unit_id ?? unit.id ?? unit.unit_id }
        )
      );
    }
  }

  for (const [targetId, attachedHeroes] of attachedHeroesByTarget.entries()) {
    if (attachedHeroes.length <= 1) continue;
    const allSiblings = attachedHeroes.every(hasSiblingsRule);
    if (!allSiblings) {
      violations.push(
        createMessage(
          "violation",
          17,
          `${getUnitDisplayName(armyUnitsById.get(targetId))} hat mehr als einen Held ohne Siblings-Ausnahme zugewiesen.`,
          { targetId, heroIds: attachedHeroes.map((unit) => unit.army_unit_id ?? unit.id ?? unit.unit_id) }
        )
      );
    }
  }

  for (const [targetId, pilotUnits] of pilotsByTarget.entries()) {
    const pilotCount = pilotUnits.reduce((sum, unit) => sum + getQuantity(unit), 0);
    if (pilotCount > 1) {
      violations.push(
        createMessage(
          "violation",
          19,
          `${getUnitDisplayName(armyUnitsById.get(targetId))} hat mehr als einen Piloten.`,
          { targetId, pilotCount }
        )
      );
    }
  }

  for (const [targetId, commissarUnits] of commissarsByTarget.entries()) {
    const commissarCount = commissarUnits.reduce((sum, unit) => sum + getQuantity(unit), 0);
    if (commissarCount > 1) {
      violations.push(
        createMessage(
          "violation",
          23,
          `${getUnitDisplayName(armyUnitsById.get(targetId))} hat mehr als einen Kommissar.`,
          { targetId, commissarCount }
        )
      );
    }
  }

  const templatesByPlatoon = buildTemplatesByPlatoon(platoonTemplates);
  const unitsByArmyPlatoon = new Map();
  for (const unit of units) {
    const armyPlatoonId = toInt(unit?.army_platoon_id, 0);
    if (!armyPlatoonId) continue;
    const list = unitsByArmyPlatoon.get(armyPlatoonId) || [];
    list.push(unit);
    unitsByArmyPlatoon.set(armyPlatoonId, list);
  }

  for (const platoon of platoons) {
    const armyPlatoonId = toInt(platoon?.army_platoon_id, 0);
    if (!armyPlatoonId) continue;

    const slotMap = templatesByPlatoon.get(armyPlatoonId) || new Map();
    const assignedUnits = unitsByArmyPlatoon.get(armyPlatoonId) || [];
    let mercenaryReplacementCount = 0;

    for (const [slot, slotTemplates] of slotMap.entries()) {
      const matchingAssignments = assignedUnits.filter((unit) => {
        if (String(unit?.platoon_slot || "") === slot) {
          return true;
        }
        const assignedTemplateId = toInt(unit?.platoon_unit_id, 0);
        return slotTemplates.some(
          (template) => toInt(template?.platoon_unit_id ?? template?.id, 0) === assignedTemplateId
        );
      });

      if (matchingAssignments.length === 0) {
        violations.push(
          createMessage(
            "violation",
            25,
            `${platoon.name || `Platoon ${armyPlatoonId}`} fehlt die Pflicht-Einheit für Slot ${slot}.`,
            { armyPlatoonId, slot }
          )
        );
        continue;
      }

      if (matchingAssignments.length > 1) {
        violations.push(
          createMessage(
            "violation",
            28,
            `${platoon.name || `Platoon ${armyPlatoonId}`} hat mehrere Zuweisungen für Slot ${slot}.`,
            { armyPlatoonId, slot }
          )
        );
        continue;
      }

      const assignedUnit = matchingAssignments[0];
      const assignedTemplateId = toInt(assignedUnit?.platoon_unit_id, 0);
      const matchesExplicitTemplate = slotTemplates.some(
        (template) => toInt(template?.platoon_unit_id ?? template?.id, 0) === assignedTemplateId
      );

      if (matchesExplicitTemplate) {
        continue;
      }

      const isCombatSlot = /^COMBAT_/i.test(slot);
      if (!isCombatSlot || !isMercenary(assignedUnit)) {
        violations.push(
          createMessage(
            "violation",
            28,
            `${getUnitDisplayName(assignedUnit)} ist im Platoon-Slot ${slot} keiner gültigen TO&E-Vorlage zugeordnet.`,
            { armyPlatoonId, slot, armyUnitId: assignedUnit.army_unit_id }
          )
        );
        continue;
      }

      mercenaryReplacementCount += 1;

      const replacementType = getBasicUnitType(assignedUnit);
      const replacementArmor = getArmorValue(assignedUnit);
      const sameTypeTemplates = slotTemplates.filter(
        (template) => getBasicUnitType(template) === replacementType
      );

      if (sameTypeTemplates.length === 0) {
        violations.push(
          createMessage(
            "violation",
            32,
            `${getUnitDisplayName(assignedUnit)} ist kein gültiger Söldner-Ersatz für Slot ${slot}.`,
            { armyPlatoonId, slot, armyUnitId: assignedUnit.army_unit_id }
          )
        );
        continue;
      }

      const hasMatchingArmor = sameTypeTemplates.some((template) => {
        const templateArmor = getArmorValue(template);
        return replacementArmor == null || templateArmor == null || replacementArmor >= templateArmor;
      });

      if (!hasMatchingArmor) {
        violations.push(
          createMessage(
            "violation",
            33,
            `${getUnitDisplayName(assignedUnit)} ist kein gültiger Söldner-Ersatz für Slot ${slot}.`,
            { armyPlatoonId, slot, armyUnitId: assignedUnit.army_unit_id }
          )
        );
      }
    }

    if (mercenaryReplacementCount > 1) {
      violations.push(
        createMessage(
          "violation",
          31,
          `${platoon.name || `Platoon ${armyPlatoonId}`} verwendet mehr als einen Söldner als Combat-Ersatz.`,
          { armyPlatoonId, mercenaryReplacementCount }
        )
      );
    }
  }

  if (!platoonTemplates.length && platoons.length > 0) {
    dataModelGaps.push(
      createMessage(
        "data-gap",
        25,
        "Für mindestens ein ausgewähltes Platoon fehlen TO&E-Slotdaten, daher kann die Vollständigkeit des Platoons nicht sicher validiert werden."
      )
    );
  }

  if (platoons.length > 0) {
    warnings.push(
      createMessage(
        "warning",
        30,
        "Platoon-Vorteile gelten nur für zugewiesene Platoon-/Support-Einheiten; diese Regel wird als Hinweis ausgegeben, beeinflusst aber nicht die AP-Gültigkeit."
      )
    );
  }

  if (platoons.length > 0 && !platoonTemplates.some((template) => hasOwn(template, "is_required"))) {
    dataModelGaps.push(
      createMessage(
        "data-gap",
        26,
        "Das aktuelle TO&E-Modell kennt keine explizite Kennzeichnung für verpflichtende Support-Einheiten. Support-Einheiten werden daher standardmäßig als optional behandelt."
      )
    );
  }

  return {
    isValid: violations.length === 0,
    forceType,
    pureMercenaryForce,
    pointsUsed,
    pointsLimit,
    bonusApAvailable,
    bonusApUsed,
    effectivePointsLimit,
    factionShare,
    selectedFactionId,
    violations,
    warnings,
    dataModelGaps,
  };
}

export default validateArmyComposition;

