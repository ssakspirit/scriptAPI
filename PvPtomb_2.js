import { world, system } from "@minecraft/server";

/**
 * PvP Tombstone System - Multi-Dimension Support
 *
 * 사용법:
 * 1. PvP 서버에 이 애드온을 적용합니다.
 * 2. 플레이어가 사망하면 자동으로 묘비가 생성되고 관전자 모드로 변경됩니다.
 * 3. 다른 플레이어가 묘비를 파괴하면 사망한 플레이어가 부활합니다.
 * 4. 모든 차원(오버월드, 네더, 엔드)에서 작동합니다.
 *
 * 관리자 명령어:
 * - !부활 <플레이어명>: 지정한 플레이어를 강제로 부활시킵니다.
 * - 예시: !부활 Steve
 *
 * 주의사항:
 * - 관리자 명령어는 OP 권한이 있는 플레이어만 사용할 수 있습니다.
 * - 부활 시 플레이어는 묘비가 있던 위치로 텔레포트됩니다.
 * - 사망한 플레이어는 관전자 모드가 되어 다른 플레이어와 상호작용할 수 없습니다.
 * - 묘비는 사망한 차원에 생성되며, 모든 차원에서 검색 가능합니다.
 */

// 아머스탠드와 플레이어 매핑을 저장할 Map
const tombMap = new Map();
// 파티클 효과 인터벌을 저장할 Map
const particleMap = new Map();

// 채팅 명령어 처리
world.beforeEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    const message = event.message;

    // !부활 명령어 처리
    if (message.startsWith("!부활 ")) {
        event.cancel = true;  // 채팅 메시지 표시 취소

        // 관리자 권한 확인
        if (!player.isOp()) {
            player.sendMessage("§c이 명령어는 관리자만 사용할 수 있습니다!");
            return;
        }

        // 부활시킬 플레이어 이름 추출
        const targetName = message.substring(4).trim();
        const targetPlayer = world.getAllPlayers().find(p => p.name === targetName);

        if (!targetPlayer) {
            player.sendMessage(`§c플레이어 '${targetName}'를 찾을 수 없습니다!`);
            return;
        }

        // 해당 플레이어의 묘비 찾기
        const graveName = `§8† §7${targetName}의 묘비 §8†`;

        // 모든 차원에서 묘비 찾기
        const dimensions = ["overworld", "nether", "the_end"];
        let found = false;

        for (const dimId of dimensions) {
            const dimension = world.getDimension(dimId);
            const armorStands = [...dimension.getEntities({
                type: "armor_stand",
                name: graveName
            })];

            if (armorStands.length > 0) {
                found = true;
                const armorStand = armorStands[0];
                const location = armorStand.location;

                // 플레이어를 묘비 위치로 텔레포트
                targetPlayer.teleport(location, { dimension: dimension });

                // 묘비 제거
                dimension.runCommand(`kill @e[type=armor_stand,name="${graveName}"]`);

                // 플레이어 부활
                targetPlayer.runCommand("gamemode survival @s");
                targetPlayer.nameTag = targetName;
                targetPlayer.sendMessage("§a관리자에 의해 부활되었습니다!");

                // 모든 플레이어에게 알림
                world.getAllPlayers().forEach(p => {
                    p.sendMessage(`§e관리자가 ${targetName}님을 부활시켰습니다!`);
                });

                // 파티클 효과 제거
                if (particleMap.has(targetName)) {
                    system.clearRun(particleMap.get(targetName));
                    particleMap.delete(targetName);
                }

                // 인터벌 제거
                if (tombMap.has(targetName)) {
                    system.clearRun(tombMap.get(targetName).interval);
                    tombMap.delete(targetName);
                }

                break;
            }
        }

        if (!found) {
            player.sendMessage(`§c${targetName}님의 묘비를 찾을 수 없습니다!`);
        }
    }
});

// 플레이어 사망 이벤트
world.afterEvents.entityDie.subscribe((event) => {
    const entity = event.deadEntity;

    // 사망한 엔티티가 플레이어인지 확인
    if (entity.typeId === "minecraft:player") {
        // 관전자 모드로 변경
        entity.runCommand("gamemode spectator @s");

        // 사망한 플레이어의 이름 위에 표시
        entity.nameTag = "§c☠ §f" + entity.name + " §c☠";

        // 모든 플레이어에게 사망 메시지 표시
        world.getAllPlayers().forEach(player => {
            player.sendMessage(`§c${entity.name}님이 사망하셨습니다!`);
            player.runCommand(`title @s actionbar §c${entity.name}님이 사망하셨습니다!`);
        });

        // 사망한 플레이어에게 메시지
        entity.sendMessage("§c사망하여 관전자 모드로 변경되었습니다.");

        const location = entity.location;
        const playerName = entity.name;
        const dimension = entity.dimension;
        const dimensionId = dimension.id;

        // 묘비 이름 설정
        const graveName = `§8† §7${playerName}의 묘비 §8†`;

        // 묘비로 사용할 아머스탠드 소환
        dimension.runCommand(`summon armor_stand "${graveName}" ${location.x} ${location.y} ${location.z}`);

        // 아머스탠드와 플레이어 매핑 저장
        const armorStandCheck = system.runInterval(() => {
            try {
                // 플레이어가 여전히 온라인인지 확인
                const onlinePlayer = world.getAllPlayers().find(p => p.name === playerName);
                if (!onlinePlayer) {
                    system.clearRun(armorStandCheck);
                    tombMap.delete(playerName);
                    return;
                }

                // 해당 이름의 아머스탠드 찾기 (사망한 차원에서)
                const currentDimension = world.getDimension(dimensionId);
                const armorStands = [...currentDimension.getEntities({
                    type: "armor_stand",
                    name: graveName
                })];

                // 아머스탠드가 없다면 (부숴졌다면)
                if (armorStands.length === 0 && tombMap.has(playerName)) {
                    // 마지막 묘비 위치로 텔레포트
                    const tombData = tombMap.get(playerName);
                    const lastLocation = tombData.location;
                    const lastDimension = world.getDimension(tombData.dimensionId);

                    onlinePlayer.teleport(lastLocation, { dimension: lastDimension });

                    // 플레이어 권한 변경
                    onlinePlayer.runCommand("gamemode survival @s");
                    // 이름태그 원래대로
                    onlinePlayer.nameTag = playerName;
                    onlinePlayer.sendMessage("§a묘비가 파괴되어 다시 전투에 참여할 수 있습니다!");

                    // 모든 플레이어에게 알림
                    world.getAllPlayers().forEach(p => {
                        p.sendMessage(`§e${playerName}님이 다시 전투에 참여합니다!`);
                    });

                    // 인터벌 제거 및 매핑 제거
                    system.clearRun(armorStandCheck);
                    tombMap.delete(playerName);

                    // 파티클 효과 제거
                    if (particleMap.has(playerName)) {
                        system.clearRun(particleMap.get(playerName));
                        particleMap.delete(playerName);
                    }
                }
                // 아머스탠드가 있다면 매핑에 추가
                else if (armorStands.length > 0 && !tombMap.has(playerName)) {
                    // 위치 정보와 차원 정보를 포함하여 저장
                    tombMap.set(playerName, {
                        interval: armorStandCheck,
                        location: armorStands[0].location,
                        dimensionId: dimensionId
                    });
                }
            } catch (error) {
                // 오류 발생 시 인터벌 정리
                system.clearRun(armorStandCheck);
                tombMap.delete(playerName);
            }
        }, 10);

        // 파티클 효과
        const particleInterval = system.runInterval(() => {
            try {
                // 플레이어가 여전히 온라인인지 확인
                const onlinePlayer = world.getAllPlayers().find(p => p.name === playerName);
                if (!onlinePlayer) {
                    system.clearRun(particleInterval);
                    particleMap.delete(playerName);
                    return;
                }

                // 파티클 효과 적용
                onlinePlayer.runCommand(`execute at @s run particle minecraft:villager_angry ~ ~2 ~`)
                onlinePlayer.runCommand(`execute at @s run particle minecraft:dragon_breath_trail ~ ~1 ~`)

                // 묘비 주변에 여러 파티클 효과 (사망한 차원에서)
                const tombDimension = world.getDimension(dimensionId);
                tombDimension.runCommand(`execute as @e[type=armor_stand,name="${graveName}"] at @s run particle minecraft:endrod ~ ~0.5 ~`)
                tombDimension.runCommand(`execute as @e[type=armor_stand,name="${graveName}"] at @s run particle minecraft:basic_smoke_particle ~ ~0.3 ~`)
            } catch (error) {
                // 오류 발생 시 인터벌 정리
                system.clearRun(particleInterval);
                particleMap.delete(playerName);
            }
        }, 5);

        // 파티클 인터벌 저장
        particleMap.set(playerName, particleInterval);
    }
});

// 플레이어 퇴장 이벤트
world.afterEvents.playerLeave.subscribe((event) => {
    const player = event.playerName;

    // 파티클 효과 제거
    if (particleMap.has(player)) {
        system.clearRun(particleMap.get(player));
        particleMap.delete(player);
    }

    // 인터벌 제거
    if (tombMap.has(player)) {
        system.clearRun(tombMap.get(player).interval);
        tombMap.delete(player);
    }
});
