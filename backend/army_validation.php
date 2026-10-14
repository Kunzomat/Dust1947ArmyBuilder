<?php

/**
 * Server-side army composition validation.
 *
 * This is a faithful PHP port of the rule engine that used to live only in
 * `dust1947-frontend/src/armyValidation.js`. The goal is a single
 * authoritative source of truth: the backend now computes the validation
 * result and ships it as part of `armies.get`, so the frontend no longer has
 * to re-implement the rules to get a correct result. `armyValidation.js` is
 * kept in the frontend as a fallback (used only if the API response does not
 * contain a `validation` block) so the UI still has something to show while
 * offline or against an older cached response.
 *
 * Input shape matches what `army_api.php`'s `armies.get` action already
 * builds (army row, merged army units, army platoons, platoon templates), so
 * no extra queries are required to compute this.
 */

const DUST1947_HERO_TYPE = "H";
const DUST1947_INFANTRY_TYPE = "I";
const DUST1947_VEHICLE_TYPE = "V";
const DUST1947_AIRCRAFT_TYPE = "A";

function dust1947_to_int($value, $fallback = 0) {
    if ($value === null || $value === '') return $fallback;
    if (!is_numeric($value)) return $fallback;
    return (int)$value;
}

function dust1947_normalize_rule_name($ruleName) {
    $value = trim((string)$ruleName);
    $value = preg_replace('/\s+/', ' ', $value);
    return strtoupper($value);
}

function dust1947_get_rule_names($unit) {
    $directRules = [];
    if (isset($unit['rules']) && is_array($unit['rules'])) {
        $directRules = $unit['rules'];
    } elseif (isset($unit['unit_rules']) && is_array($unit['unit_rules'])) {
        $directRules = $unit['unit_rules'];
    } elseif (isset($unit['rule_names']) && is_array($unit['rule_names'])) {
        $directRules = $unit['rule_names'];
    }

    $specialRules = (isset($unit['special_rules']) && is_array($unit['special_rules'])) ? $unit['special_rules'] : [];

    $serialized = [];
    if (isset($unit['rule_names']) && is_string($unit['rule_names']) && $unit['rule_names'] !== '') {
        $serialized = explode('||', $unit['rule_names']);
    }

    $combined = array_merge($directRules, $specialRules, $serialized);

    $names = [];
    foreach ($combined as $rule) {
        $name = is_string($rule) ? $rule : ($rule['name'] ?? null);
        if ($name) {
            $names[] = dust1947_normalize_rule_name($name);
        }
    }
    return $names;
}

function dust1947_has_rule($unit, ...$ruleNames) {
    $normalized = dust1947_get_rule_names($unit);
    foreach ($ruleNames as $ruleName) {
        if (in_array(dust1947_normalize_rule_name($ruleName), $normalized, true)) {
            return true;
        }
    }
    return false;
}

function dust1947_get_armor_value($unit) {
    if (isset($unit['armor_value']) && is_numeric($unit['armor_value'])) {
        return (int)$unit['armor_value'];
    }

    foreach (dust1947_get_rule_names($unit) as $ruleName) {
        if (preg_match('/^ARMOR\s+\d+$/i', $ruleName)) {
            return dust1947_to_int(preg_replace('/\D+/', '', $ruleName), null);
        }
    }
    return null;
}

function dust1947_get_quantity($unit) {
    return max(1, dust1947_to_int($unit['quantity'] ?? null, 1));
}

function dust1947_get_unit_base_points($unit) {
    $points = $unit['unit_points'] ?? ($unit['points'] ?? 0);
    return max(0, dust1947_to_int($points, 0)) * dust1947_get_quantity($unit);
}

function dust1947_is_captured($unit) {
    $value = $unit['is_captured'] ?? null;
    return $value === true || $value === 1 || $value === '1';
}

function dust1947_get_captured_vehicle_count($unit) {
    if (!dust1947_is_captured($unit)) return 0;
    return dust1947_get_quantity($unit);
}

function dust1947_get_unit_total_points($unit) {
    $base = dust1947_get_unit_base_points($unit);
    return $base + (dust1947_is_captured($unit) ? 2 * dust1947_get_quantity($unit) : 0);
}

function dust1947_is_hero($unit) {
    return strtoupper((string)($unit['type'] ?? '')) === DUST1947_HERO_TYPE;
}

function dust1947_is_infantry($unit) {
    return strtoupper((string)($unit['type'] ?? '')) === DUST1947_INFANTRY_TYPE;
}

function dust1947_is_vehicle($unit) {
    return strtoupper((string)($unit['type'] ?? '')) === DUST1947_VEHICLE_TYPE;
}

function dust1947_get_basic_unit_type($unit) {
    $type = strtoupper((string)($unit['type'] ?? ''));
    if (in_array($type, [DUST1947_INFANTRY_TYPE, DUST1947_VEHICLE_TYPE, DUST1947_AIRCRAFT_TYPE, DUST1947_HERO_TYPE], true)) {
        return $type;
    }
    return $type !== '' ? $type : "UNKNOWN";
}

function dust1947_is_mercenary($unit) {
    $value = $unit['is_mercenary'] ?? null;
    return $value === true || $value === 1 || $value === '1' || dust1947_has_rule($unit, "MERCENARY");
}

function dust1947_is_commissar($unit) {
    return dust1947_has_rule($unit, "COMMISSAR");
}

function dust1947_has_pilot_skill($unit) {
    return dust1947_has_rule($unit, "PILOT", "ACE PILOT");
}

function dust1947_has_siblings_rule($unit) {
    return dust1947_has_rule($unit, "SIBLINGS");
}

function dust1947_get_unit_display_name($unit) {
    return $unit['unit_name'] ?? ($unit['name'] ?? ("Unit " . ($unit['unit_id'] ?? ($unit['id'] ?? "?"))));
}

function dust1947_get_unit_faction_id($unit) {
    $value = $unit['faction_id'] ?? null;
    return $value === null ? null : dust1947_to_int($value, null);
}

function dust1947_get_unit_bloc_id($unit) {
    $value = $unit['bloc_id'] ?? null;
    return $value === null ? null : dust1947_to_int($value, null);
}

function dust1947_get_unit_identity_key($unit) {
    if (!empty($unit['unique_key'])) {
        return (string)$unit['unique_key'];
    }
    $fallback = $unit['unit_id'] ?? ($unit['id'] ?? dust1947_get_unit_display_name($unit));
    return (string)$fallback;
}

function dust1947_build_templates_by_platoon($platoonTemplates) {
    $templatesByPlatoon = [];

    foreach ($platoonTemplates ?: [] as $template) {
        $armyPlatoonId = dust1947_to_int($template['army_platoon_id'] ?? null, null);
        if (!$armyPlatoonId) continue;

        $slot = (string)($template['slot'] ?? ($template['platoon_slot'] ?? ''));
        if ($slot === '') continue;

        if (!isset($templatesByPlatoon[$armyPlatoonId])) {
            $templatesByPlatoon[$armyPlatoonId] = [];
        }
        if (!isset($templatesByPlatoon[$armyPlatoonId][$slot])) {
            $templatesByPlatoon[$armyPlatoonId][$slot] = [];
        }
        $templatesByPlatoon[$armyPlatoonId][$slot][] = $template;
    }

    return $templatesByPlatoon;
}

function dust1947_create_message($kind, $rule, $message, $details = []) {
    return ["kind" => $kind, "rule" => $rule, "message" => $message, "details" => $details];
}

/**
 * @param array $army Army row (expects bloc_id, points_limit)
 * @param array $units Army units (merged with unit definition fields)
 * @param array $platoons Army platoons
 * @param array $platoonTemplates Platoon slot templates for the army's platoons
 * @return array Same shape as armyValidation.js's validateArmyComposition()
 */
function dust1947_validate_army_composition(array $army, array $units, array $platoons, array $platoonTemplates): array {
    $pointsLimit = max(0, dust1947_to_int($army['points_limit'] ?? null, 0));
    $armyBlocIdRaw = $army['bloc_id'] ?? null;
    $armyBlocId = $armyBlocIdRaw === null ? null : dust1947_to_int($armyBlocIdRaw, null);

    $violations = [];
    $warnings = [];
    $dataModelGaps = [];

    $pointsUsed = 0;
    foreach ($units as $unit) {
        $pointsUsed += dust1947_get_unit_total_points($unit);
    }

    $pureMercenaryForce = count($units) > 0;
    foreach ($units as $unit) {
        if (!(dust1947_is_mercenary($unit) || dust1947_is_captured($unit))) {
            $pureMercenaryForce = false;
            break;
        }
    }

    $capturedUnits = array_values(array_filter($units, 'dust1947_is_captured'));
    $capturedVehicleCount = 0;
    foreach ($capturedUnits as $unit) {
        $capturedVehicleCount += dust1947_get_captured_vehicle_count($unit);
    }
    if ($capturedVehicleCount > 1) {
        $violations[] = dust1947_create_message(
            "violation",
            12,
            "Eine Armee darf höchstens ein erbeutetes Fahrzeug enthalten.",
            ["capturedVehicleCount" => $capturedVehicleCount]
        );
    }

    foreach ($capturedUnits as $unit) {
        if (!dust1947_is_vehicle($unit)) {
            $violations[] = dust1947_create_message(
                "violation",
                12,
                dust1947_get_unit_display_name($unit) . " ist als erbeutet markiert, ist aber kein Fahrzeug.",
                ["unitId" => $unit['army_unit_id'] ?? ($unit['id'] ?? ($unit['unit_id'] ?? null))]
            );
        }

        if (array_key_exists('can_be_captured', $unit) && !$unit['can_be_captured']) {
            $violations[] = dust1947_create_message(
                "violation",
                14,
                dust1947_get_unit_display_name($unit) . " ist laut Datenmodell nicht als erbeutbares Fahrzeug freigegeben.",
                ["unitId" => $unit['army_unit_id'] ?? ($unit['id'] ?? ($unit['unit_id'] ?? null))]
            );
        }
    }

    $anyUnitHasCapturedFlag = false;
    foreach ($units as $unit) {
        if (array_key_exists('can_be_captured', $unit)) {
            $anyUnitHasCapturedFlag = true;
            break;
        }
    }
    if (!$anyUnitHasCapturedFlag) {
        $dataModelGaps[] = dust1947_create_message(
            "data-gap",
            14,
            "Die Daten enthalten derzeit keine belastbare Kennzeichnung, welche Fahrzeuge explizit als erbeutbar erlaubt sind."
        );
    }

    $offBlocUnits = array_values(array_filter($units, function ($unit) use ($armyBlocId) {
        if ($armyBlocId === null) return false;
        if (dust1947_is_mercenary($unit) || dust1947_is_captured($unit)) return false;
        $unitBlocId = dust1947_get_unit_bloc_id($unit);
        return $unitBlocId !== null && $unitBlocId !== $armyBlocId;
    }));

    if (count($offBlocUnits) > 0) {
        $names = array_map('dust1947_get_unit_display_name', $offBlocUnits);
        $ids = array_map(function ($unit) {
            return $unit['army_unit_id'] ?? ($unit['id'] ?? ($unit['unit_id'] ?? null));
        }, $offBlocUnits);
        $violations[] = dust1947_create_message(
            "violation",
            1,
            "Die Armee enthält Einheiten aus einem anderen Bloc: " . implode(", ", $names) . ".",
            ["unitIds" => $ids]
        );
    }

    $factionPointMap = [];
    $countedFactionPoints = 0;
    foreach ($units as $unit) {
        if (dust1947_is_mercenary($unit) || dust1947_is_captured($unit)) continue;
        $factionId = dust1947_get_unit_faction_id($unit);
        if ($factionId === null) continue;
        $unitPoints = dust1947_get_unit_total_points($unit);
        $factionPointMap[$factionId] = ($factionPointMap[$factionId] ?? 0) + $unitPoints;
        $countedFactionPoints += $unitPoints;
    }

    arsort($factionPointMap);
    $selectedFactionId = null;
    $selectedFactionPoints = 0;
    foreach ($factionPointMap as $factionId => $points) {
        $selectedFactionId = $factionId;
        $selectedFactionPoints = $points;
        break;
    }

    $factionShare = $pointsUsed > 0 ? $selectedFactionPoints / $pointsUsed : 0;

    $nonMercFactionUnits = array_values(array_filter($units, function ($unit) {
        return !dust1947_is_mercenary($unit) && !dust1947_is_captured($unit);
    }));
    $otherFactionUnits = $selectedFactionId === null
        ? []
        : array_values(array_filter($nonMercFactionUnits, function ($unit) use ($selectedFactionId) {
            return dust1947_get_unit_faction_id($unit) !== $selectedFactionId;
        }));

    $qualifiesFactionForce = $pureMercenaryForce ||
        ($selectedFactionId !== null && $factionShare >= 0.75 && count($otherFactionUnits) === 0);

    $forceType = $pureMercenaryForce
        ? "Pure Mercenary Force"
        : ($qualifiesFactionForce ? "Faction Force" : "Bloc Force");

    if (!$qualifiesFactionForce && $selectedFactionId !== null && $factionShare >= 0.75 && count($otherFactionUnits) > 0) {
        $warnings[] = dust1947_create_message(
            "warning",
            4,
            "Die 75%-Schwelle ist erreicht, aber andere Fraktionen verhindern den Faction-Bonus.",
            ["selectedFactionId" => $selectedFactionId, "factionShare" => $factionShare]
        );
    }

    if (!$pureMercenaryForce && $selectedFactionId !== null && $countedFactionPoints > 0 && $factionShare < 0.75) {
        $warnings[] = dust1947_create_message(
            "warning",
            3,
            "Die Armee erreicht nur " . round($factionShare * 100) . "% Fraktions-AP und qualifiziert sich daher nicht als Faction Force.",
            ["selectedFactionId" => $selectedFactionId, "factionShare" => $factionShare]
        );
    }

    $bonusApAvailable = $qualifiesFactionForce ? (int)floor($pointsLimit * 0.1) : 0;
    $effectivePointsLimit = $pointsLimit + $bonusApAvailable;
    $bonusApUsed = max(0, $pointsUsed - $pointsLimit);

    if ($pointsUsed > $pointsLimit && !$qualifiesFactionForce) {
        $violations[] = dust1947_create_message(
            "violation",
            6,
            "Die Armee überschreitet das Punktelimit von {$pointsLimit} AP und hat keinen gültigen Faction-Bonus.",
            ["pointsUsed" => $pointsUsed, "pointsLimit" => $pointsLimit]
        );
    }

    if ($pointsUsed > $effectivePointsLimit) {
        $violations[] = dust1947_create_message(
            "violation",
            6,
            "Die Armee überschreitet selbst mit Faction-Bonus das maximale Limit von {$effectivePointsLimit} AP.",
            ["pointsUsed" => $pointsUsed, "effectivePointsLimit" => $effectivePointsLimit, "bonusApAvailable" => $bonusApAvailable]
        );
    }

    if ($bonusApUsed > 0) {
        $eligibleBonusHeroPoints = 0;
        foreach ($units as $unit) {
            if (!dust1947_is_hero($unit)) continue;
            $eligible = $pureMercenaryForce
                ? dust1947_is_mercenary($unit)
                : (($selectedFactionId !== null && dust1947_get_unit_faction_id($unit) === $selectedFactionId)
                    || ($armyBlocId !== null && dust1947_get_unit_bloc_id($unit) === $armyBlocId));
            if ($eligible) {
                $eligibleBonusHeroPoints += dust1947_get_unit_total_points($unit);
            }
        }

        if ($bonusApUsed > $eligibleBonusHeroPoints) {
            $violations[] = dust1947_create_message(
                "violation",
                7,
                "Es werden {$bonusApUsed} Bonus-AP benötigt, aber nur {$eligibleBonusHeroPoints} AP davon liegen auf erlaubten Helden des gewählten Faction/Bloc-Kontexts.",
                ["bonusApUsed" => $bonusApUsed, "eligibleBonusHeroPoints" => $eligibleBonusHeroPoints]
            );
        }
    }

    $heroDuplicates = [];
    foreach (array_filter($units, 'dust1947_is_hero') as $unit) {
        $key = dust1947_get_unit_identity_key($unit);
        if (!isset($heroDuplicates[$key])) $heroDuplicates[$key] = [];
        $heroDuplicates[$key][] = $unit;
    }

    foreach ($heroDuplicates as $heroUnits) {
        $totalCopies = 0;
        foreach ($heroUnits as $unit) {
            $totalCopies += dust1947_get_quantity($unit);
        }
        if ($totalCopies > 1) {
            $violations[] = dust1947_create_message(
                "violation",
                15,
                dust1947_get_unit_display_name($heroUnits[0]) . " darf als einzigartiger Held nur einmal in der Armee vorkommen.",
                ["totalCopies" => $totalCopies]
            );
        }
    }

    $attachmentFieldsAvailable = false;
    foreach ($units as $unit) {
        if (array_key_exists('attached_to_army_unit_id', $unit) || array_key_exists('attachment_role', $unit)) {
            $attachmentFieldsAvailable = true;
            break;
        }
    }

    $armyUnitsById = [];
    foreach ($units as $unit) {
        $key = dust1947_to_int($unit['army_unit_id'] ?? ($unit['id'] ?? ($unit['unit_id'] ?? null)), 0);
        $armyUnitsById[$key] = $unit;
    }

    if (!$attachmentFieldsAvailable) {
        $dataModelGaps[] = dust1947_create_message(
            "data-gap",
            16,
            "Für Held-/Kommissar-/Pilot-Zuordnungen fehlen in den aktuellen API-Daten Verknüpfungsfelder. Diese Regeln können live nur geprüft werden, wenn solche Felder geliefert werden."
        );
    }

    $attachedHeroesByTarget = [];
    $commissarsByTarget = [];
    $pilotsByTarget = [];

    foreach ($units as $unit) {
        $attachedToId = dust1947_to_int($unit['attached_to_army_unit_id'] ?? null, 0);
        $attachmentRole = strtolower((string)($unit['attachment_role'] ?? ''));
        if (!$attachedToId) continue;

        $target = $armyUnitsById[$attachedToId] ?? null;
        if (!$target) {
            $violations[] = dust1947_create_message(
                "violation",
                28,
                dust1947_get_unit_display_name($unit) . " verweist auf eine nicht vorhandene Ziel-Einheit.",
                ["attachedToId" => $attachedToId]
            );
            continue;
        }

        if (dust1947_is_hero($unit) && $attachmentRole !== "pilot") {
            $attachedHeroesByTarget[$attachedToId][] = $unit;

            if (!dust1947_is_infantry($target)) {
                $violations[] = dust1947_create_message(
                    "violation",
                    16,
                    dust1947_get_unit_display_name($unit) . " darf nur einer Infanterie-Einheit zugeordnet werden.",
                    ["heroId" => $unit['army_unit_id'] ?? null, "targetId" => $attachedToId]
                );
            }

            $unitArmor = dust1947_get_armor_value($unit);
            $targetArmor = dust1947_get_armor_value($target);
            if ($unitArmor !== null && $targetArmor !== null && $unitArmor !== $targetArmor) {
                $violations[] = dust1947_create_message(
                    "violation",
                    16,
                    dust1947_get_unit_display_name($unit) . " und " . dust1947_get_unit_display_name($target) . " haben unterschiedliche Armor-Werte.",
                    ["heroId" => $unit['army_unit_id'] ?? null, "targetId" => $attachedToId]
                );
            }
        }

        if ($attachmentRole === "pilot") {
            $pilotsByTarget[$attachedToId][] = $unit;

            if (!dust1947_is_vehicle($target)) {
                $violations[] = dust1947_create_message(
                    "violation",
                    19,
                    dust1947_get_unit_display_name($unit) . " ist als Pilot zugeordnet, das Ziel ist aber kein Fahrzeug.",
                    ["pilotId" => $unit['army_unit_id'] ?? null, "targetId" => $attachedToId]
                );
            }

            if (!dust1947_is_hero($unit) || !dust1947_has_pilot_skill($unit)) {
                $violations[] = dust1947_create_message(
                    "violation",
                    20,
                    dust1947_get_unit_display_name($unit) . " darf ohne Pilot oder Ace Pilot kein Fahrzeug steuern.",
                    ["pilotId" => $unit['army_unit_id'] ?? null, "targetId" => $attachedToId]
                );
            }
        }

        if (dust1947_is_commissar($unit) || $attachmentRole === "commissar") {
            $commissarsByTarget[$attachedToId][] = $unit;

            if (!dust1947_is_infantry($target)) {
                $violations[] = dust1947_create_message(
                    "violation",
                    21,
                    dust1947_get_unit_display_name($unit) . " muss einer Infanterie-Einheit zugewiesen werden.",
                    ["commissarId" => $unit['army_unit_id'] ?? null, "targetId" => $attachedToId]
                );
            }

            $unitArmor = dust1947_get_armor_value($unit);
            $targetArmor = dust1947_get_armor_value($target);
            if ($unitArmor !== null && $targetArmor !== null && $unitArmor !== $targetArmor) {
                $violations[] = dust1947_create_message(
                    "violation",
                    22,
                    dust1947_get_unit_display_name($unit) . " und " . dust1947_get_unit_display_name($target) . " haben unterschiedliche Armor-Werte.",
                    ["commissarId" => $unit['army_unit_id'] ?? null, "targetId" => $attachedToId]
                );
            }
        }
    }

    foreach (array_filter($units, 'dust1947_is_commissar') as $unit) {
        $attachedToId = dust1947_to_int($unit['attached_to_army_unit_id'] ?? null, 0);
        if (!$attachedToId) {
            $violations[] = dust1947_create_message(
                "violation",
                21,
                dust1947_get_unit_display_name($unit) . " muss zu Spielbeginn einer Infanterie-Einheit zugewiesen sein.",
                ["commissarId" => $unit['army_unit_id'] ?? ($unit['id'] ?? ($unit['unit_id'] ?? null))]
            );
        }
    }

    foreach ($attachedHeroesByTarget as $targetId => $attachedHeroes) {
        if (count($attachedHeroes) <= 1) continue;
        $allSiblings = true;
        foreach ($attachedHeroes as $unit) {
            if (!dust1947_has_siblings_rule($unit)) { $allSiblings = false; break; }
        }
        if (!$allSiblings) {
            $heroIds = array_map(function ($unit) {
                return $unit['army_unit_id'] ?? ($unit['id'] ?? ($unit['unit_id'] ?? null));
            }, $attachedHeroes);
            $violations[] = dust1947_create_message(
                "violation",
                17,
                dust1947_get_unit_display_name($armyUnitsById[$targetId] ?? []) . " hat mehr als einen Held ohne Siblings-Ausnahme zugewiesen.",
                ["targetId" => $targetId, "heroIds" => $heroIds]
            );
        }
    }

    foreach ($pilotsByTarget as $targetId => $pilotUnits) {
        $pilotCount = 0;
        foreach ($pilotUnits as $unit) { $pilotCount += dust1947_get_quantity($unit); }
        if ($pilotCount > 1) {
            $violations[] = dust1947_create_message(
                "violation",
                19,
                dust1947_get_unit_display_name($armyUnitsById[$targetId] ?? []) . " hat mehr als einen Piloten.",
                ["targetId" => $targetId, "pilotCount" => $pilotCount]
            );
        }
    }

    foreach ($commissarsByTarget as $targetId => $commissarUnits) {
        $commissarCount = 0;
        foreach ($commissarUnits as $unit) { $commissarCount += dust1947_get_quantity($unit); }
        if ($commissarCount > 1) {
            $violations[] = dust1947_create_message(
                "violation",
                23,
                dust1947_get_unit_display_name($armyUnitsById[$targetId] ?? []) . " hat mehr als einen Kommissar.",
                ["targetId" => $targetId, "commissarCount" => $commissarCount]
            );
        }
    }

    $templatesByPlatoon = dust1947_build_templates_by_platoon($platoonTemplates);
    $unitsByArmyPlatoon = [];
    foreach ($units as $unit) {
        $armyPlatoonId = dust1947_to_int($unit['army_platoon_id'] ?? null, 0);
        if (!$armyPlatoonId) continue;
        $unitsByArmyPlatoon[$armyPlatoonId][] = $unit;
    }

    foreach ($platoons ?: [] as $platoon) {
        $armyPlatoonId = dust1947_to_int($platoon['army_platoon_id'] ?? null, 0);
        if (!$armyPlatoonId) continue;

        $slotMap = $templatesByPlatoon[$armyPlatoonId] ?? [];
        $assignedUnits = $unitsByArmyPlatoon[$armyPlatoonId] ?? [];
        $mercenaryReplacementCount = 0;

        foreach ($slotMap as $slot => $slotTemplates) {
            $matchingAssignments = array_values(array_filter($assignedUnits, function ($unit) use ($slot, $slotTemplates) {
                if ((string)($unit['platoon_slot'] ?? '') === $slot) {
                    return true;
                }
                $assignedTemplateId = dust1947_to_int($unit['platoon_unit_id'] ?? null, 0);
                foreach ($slotTemplates as $template) {
                    if (dust1947_to_int($template['platoon_unit_id'] ?? ($template['id'] ?? null), 0) === $assignedTemplateId) {
                        return true;
                    }
                }
                return false;
            }));

            if (count($matchingAssignments) === 0) {
                $violations[] = dust1947_create_message(
                    "violation",
                    25,
                    ($platoon['name'] ?? "Platoon {$armyPlatoonId}") . " fehlt die Pflicht-Einheit für Slot {$slot}.",
                    ["armyPlatoonId" => $armyPlatoonId, "slot" => $slot]
                );
                continue;
            }

            if (count($matchingAssignments) > 1) {
                $violations[] = dust1947_create_message(
                    "violation",
                    28,
                    ($platoon['name'] ?? "Platoon {$armyPlatoonId}") . " hat mehrere Zuweisungen für Slot {$slot}.",
                    ["armyPlatoonId" => $armyPlatoonId, "slot" => $slot]
                );
                continue;
            }

            $assignedUnit = $matchingAssignments[0];
            $assignedTemplateId = dust1947_to_int($assignedUnit['platoon_unit_id'] ?? null, 0);
            $matchesExplicitTemplate = false;
            foreach ($slotTemplates as $template) {
                if (dust1947_to_int($template['platoon_unit_id'] ?? ($template['id'] ?? null), 0) === $assignedTemplateId) {
                    $matchesExplicitTemplate = true;
                    break;
                }
            }

            if ($matchesExplicitTemplate) {
                continue;
            }

            $isCombatSlot = preg_match('/^COMBAT_/i', $slot) === 1;
            if (!$isCombatSlot || !dust1947_is_mercenary($assignedUnit)) {
                $violations[] = dust1947_create_message(
                    "violation",
                    28,
                    dust1947_get_unit_display_name($assignedUnit) . " ist im Platoon-Slot {$slot} keiner gültigen TO&E-Vorlage zugeordnet.",
                    ["armyPlatoonId" => $armyPlatoonId, "slot" => $slot, "armyUnitId" => $assignedUnit['army_unit_id'] ?? null]
                );
                continue;
            }

            $mercenaryReplacementCount += 1;

            $replacementType = dust1947_get_basic_unit_type($assignedUnit);
            $replacementArmor = dust1947_get_armor_value($assignedUnit);
            $sameTypeTemplates = array_values(array_filter($slotTemplates, function ($template) use ($replacementType) {
                return dust1947_get_basic_unit_type($template) === $replacementType;
            }));

            if (count($sameTypeTemplates) === 0) {
                $violations[] = dust1947_create_message(
                    "violation",
                    32,
                    dust1947_get_unit_display_name($assignedUnit) . " ist kein gültiger Söldner-Ersatz für Slot {$slot}.",
                    ["armyPlatoonId" => $armyPlatoonId, "slot" => $slot, "armyUnitId" => $assignedUnit['army_unit_id'] ?? null]
                );
                continue;
            }

            $hasMatchingArmor = false;
            foreach ($sameTypeTemplates as $template) {
                $templateArmor = dust1947_get_armor_value($template);
                if ($replacementArmor === null || $templateArmor === null || $replacementArmor >= $templateArmor) {
                    $hasMatchingArmor = true;
                    break;
                }
            }

            if (!$hasMatchingArmor) {
                $violations[] = dust1947_create_message(
                    "violation",
                    33,
                    dust1947_get_unit_display_name($assignedUnit) . " ist kein gültiger Söldner-Ersatz für Slot {$slot}.",
                    ["armyPlatoonId" => $armyPlatoonId, "slot" => $slot, "armyUnitId" => $assignedUnit['army_unit_id'] ?? null]
                );
            }
        }

        if ($mercenaryReplacementCount > 1) {
            $violations[] = dust1947_create_message(
                "violation",
                31,
                ($platoon['name'] ?? "Platoon {$armyPlatoonId}") . " verwendet mehr als einen Söldner als Combat-Ersatz.",
                ["armyPlatoonId" => $armyPlatoonId, "mercenaryReplacementCount" => $mercenaryReplacementCount]
            );
        }
    }

    if (count($platoonTemplates ?: []) === 0 && count($platoons ?: []) > 0) {
        $dataModelGaps[] = dust1947_create_message(
            "data-gap",
            25,
            "Für mindestens ein ausgewähltes Platoon fehlen TO&E-Slotdaten, daher kann die Vollständigkeit des Platoons nicht sicher validiert werden."
        );
    }

    if (count($platoons ?: []) > 0) {
        $warnings[] = dust1947_create_message(
            "warning",
            30,
            "Platoon-Vorteile gelten nur für zugewiesene Platoon-/Support-Einheiten; diese Regel wird als Hinweis ausgegeben, beeinflusst aber nicht die AP-Gültigkeit."
        );
    }

    $anyTemplateHasIsRequired = false;
    foreach ($platoonTemplates ?: [] as $template) {
        if (array_key_exists('is_required', $template)) { $anyTemplateHasIsRequired = true; break; }
    }
    if (count($platoons ?: []) > 0 && !$anyTemplateHasIsRequired) {
        $dataModelGaps[] = dust1947_create_message(
            "data-gap",
            26,
            "Das aktuelle TO&E-Modell kennt keine explizite Kennzeichnung für verpflichtende Support-Einheiten. Support-Einheiten werden daher standardmäßig als optional behandelt."
        );
    }

    return [
        "isValid" => count($violations) === 0,
        "forceType" => $forceType,
        "pureMercenaryForce" => $pureMercenaryForce,
        "pointsUsed" => $pointsUsed,
        "pointsLimit" => $pointsLimit,
        "bonusApAvailable" => $bonusApAvailable,
        "bonusApUsed" => $bonusApUsed,
        "effectivePointsLimit" => $effectivePointsLimit,
        "factionShare" => $factionShare,
        "selectedFactionId" => $selectedFactionId,
        "violations" => $violations,
        "warnings" => $warnings,
        "dataModelGaps" => $dataModelGaps,
    ];
}
