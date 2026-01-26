/**
 * ===========================================
 * 언데드 사냥꾼 좀비 소환 애드온
 * ===========================================
 *
 * [사용법]
 * 1. 모루에서 뼈(Bone) 아이템의 이름을 "강령술사의 뼈"로 변경합니다.
 * 2. 이름이 변경된 뼈를 손에 들고 사용(우클릭)합니다.
 * 3. 플레이어 앞에 아군 좀비 2마리가 소환됩니다.
 *
 * [아군 좀비 특징]
 * - 언데드 몹(좀비, 스켈레톤 등)만 공격합니다.
 * - 플레이어를 공격하지 않습니다.
 * - 초록색 이름표 "아군 좀비"가 표시됩니다.
 *
 * [설정 변경]
 * - SUMMON_ITEM: 소환에 사용할 아이템 ID
 * - SUMMON_ITEM_NAME: 소환에 필요한 아이템 이름
 *
 * ===========================================
 * [필수 파일] - 이 스크립트를 사용하려면 아래 파일들이 필요합니다.
 * ===========================================
 *
 * 1. Behavior Pack - 엔티티 정의 파일
 *    경로: behavior_pack/entities/friendly_zombie.json
 *    내용: 아군 좀비의 행동(AI), 공격 대상, 체력 등을 정의
 *
 * 2. Resource Pack - 엔티티 클라이언트 파일
 *    경로: resource_pack/entity/friendly_zombie.entity.json
 *    내용: 아군 좀비의 외형(텍스처, 모델, 애니메이션)을 정의
 *
 * 3. Resource Pack - 애니메이션 파일
 *    경로: resource_pack/animations/friendly_zombie.animation.json
 *    내용: 아군 좀비의 걷기, 공격, 대기 애니메이션 정의
 *
 * ===========================================
 * [파일 내용 상세]
 * ===========================================
 *
 * --- behavior_pack/entities/friendly_zombie.json ---
 * {
 *     "format_version": "1.21.0",
 *     "minecraft:entity": {
 *         "description": {
 *             "identifier": "custom:friendly_zombie",
 *             "is_spawnable": true,
 *             "is_summonable": true,
 *             "is_experimental": false
 *         },
 *         "components": {
 *             "minecraft:type_family": {
 *                 "family": ["friendly_zombie", "monster", "mob"]
 *             },
 *             "minecraft:health": { "value": 30, "max": 30 },
 *             "minecraft:attack": { "damage": 5 },
 *             "minecraft:movement.basic": {},
 *             "minecraft:jump.static": {},
 *             "minecraft:navigation.walk": {
 *                 "can_pass_doors": true,
 *                 "can_walk": true
 *             },
 *             "minecraft:behavior.melee_attack": { "priority": 2 },
 *             "minecraft:behavior.random_stroll": { "priority": 6 },
 *             "minecraft:behavior.nearest_attackable_target": {
 *                 "priority": 1,
 *                 "entity_types": [{
 *                     "filters": {
 *                         "any_of": [
 *                             {"test": "is_family", "value": "zombie"},
 *                             {"test": "is_family", "value": "skeleton"},
 *                             {"test": "is_family", "value": "undead"}
 *                         ]
 *                     },
 *                     "max_dist": 25
 *                 }]
 *             }
 *         }
 *     }
 * }
 *
 * --- resource_pack/entity/friendly_zombie.entity.json ---
 * {
 *     "format_version": "1.10.0",
 *     "minecraft:client_entity": {
 *         "description": {
 *             "identifier": "custom:friendly_zombie",
 *             "materials": { "default": "zombie" },
 *             "textures": { "default": "textures/entity/zombie/zombie" },
 *             "geometry": { "default": "geometry.zombie" },
 *             "animations": {
 *                 "move": "animation.friendly_zombie.move",
 *                 "attack": "animation.friendly_zombie.attack",
 *                 "idle": "animation.friendly_zombie.idle"
 *             },
 *             "scripts": {
 *                 "animate": [
 *                     "idle",
 *                     { "move": "query.modified_move_speed > 0.0" },
 *                     { "attack": "query.is_delayed_attacking" }
 *                 ]
 *             },
 *             "render_controllers": ["controller.render.zombie"]
 *         }
 *     }
 * }
 *
 * --- resource_pack/animations/friendly_zombie.animation.json ---
 * {
 *     "format_version": "1.8.0",
 *     "animations": {
 *         "animation.friendly_zombie.move": {
 *             "loop": true,
 *             "bones": {
 *                 "leftarm": { "rotation": ["math.cos(query.modified_distance_moved * 67.5) * 45", 0, 0] },
 *                 "rightarm": { "rotation": ["-math.cos(query.modified_distance_moved * 67.5) * 45", 0, 0] },
 *                 "leftleg": { "rotation": ["-math.cos(query.modified_distance_moved * 67.5) * 45", 0, 0] },
 *                 "rightleg": { "rotation": ["math.cos(query.modified_distance_moved * 67.5) * 45", 0, 0] }
 *             }
 *         },
 *         "animation.friendly_zombie.attack": {
 *             "loop": false,
 *             "bones": {
 *                 "leftarm": { "rotation": ["-90 - math.sin(query.life_time * 500) * 20", 30, 0] },
 *                 "rightarm": { "rotation": ["-90 - math.sin(query.life_time * 500) * 20", -30, 0] }
 *             }
 *         },
 *         "animation.friendly_zombie.idle": {
 *             "loop": true,
 *             "bones": {
 *                 "leftarm": { "rotation": ["-90", 0, 0] },
 *                 "rightarm": { "rotation": ["-90", 0, 0] }
 *             }
 *         }
 *     }
 * }
 *
 * ===========================================
 */

import { world } from "@minecraft/server";

// 소환 아이템 설정
const SUMMON_ITEM = "minecraft:bone";
const SUMMON_ITEM_NAME = "강령술사의 뼈";

// 아이템 사용 이벤트
world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;

    // 아이템 타입과 이름 확인
    if (item.typeId === SUMMON_ITEM && item.nameTag === SUMMON_ITEM_NAME) {
        const dimension = player.dimension;
        const playerLocation = player.location;

        // 플레이어가 바라보는 방향 계산
        const viewDirection = player.getViewDirection();

        // 플레이어 앞에 좀비 두 마리 소환
        for (let i = 0; i < 2; i++) {
            const offsetX = (i === 0) ? -1 : 1;
            const spawnLocation = {
                x: playerLocation.x + (viewDirection.x * 2) + offsetX,
                y: playerLocation.y,
                z: playerLocation.z + (viewDirection.z * 2)
            };

            try {
                const zombie = dimension.spawnEntity("custom:friendly_zombie", spawnLocation);
                zombie.nameTag = "§a아군 좀비";
            } catch (e) {
                player.sendMessage("§c소환 실패: " + e);
            }
        }

        player.sendMessage("§a언데드 사냥꾼 좀비 2마리를 소환했습니다!");
    }
});
