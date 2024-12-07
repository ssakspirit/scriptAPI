import { world, system } from "@minecraft/server";

/**
 * PvP Tombstone System
 * 
 * 사용법:
 * 1. PvP 서버에 이 애드온을 적용합니다.
 * 2. 플레이어가 사망하면 자동으로 묘비가 생성되고 관전자 모드로 변경됩니다.
 * 3. 다른 플레이어가 묘비를 파괴하면 사망한 플레이어가 부활합니다.
 * 
 * 관리자 명령어:
 * - !부활 <플레이어명>: 지정한 플레이어를 강제로 부활시킵니다.
 * - 예시: !부활 Steve
 * 
 * 주의사항:
 * - 관리자 명령어는 OP 권한이 있는 플레이어만 사용할 수 있습니다.
 * - 부활 시 플레이어는 묘비가 있던 위치로 텔레포트됩니다.
 * - 사망한 플레이어는 관전자 모드가 되어 다른 플레이어와 상호작용할 수 없습니다.
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
        const dimension = world.getDimension("overworld");
        
        // 묘비 제거 및 플레이어 부활
        dimension.runCommandAsync(`execute as @e[type=armor_stand,name="${graveName}"] at @s run tp ${targetName} ~ ~ ~`).then(() => {
            dimension.runCommandAsync(`kill @e[type=armor_stand,name="${graveName}"]`);
            targetPlayer.runCommandAsync("gamemode survival @s");
            targetPlayer.nameTag = targetPlayer.name;
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
        }).catch(() => {
            player.sendMessage(`§c${targetName}님의 묘비를 찾을 수 없습니다!`);
        });
    }
});

// 플레이어 사망 이벤트
world.afterEvents.entityDie.subscribe((event) => {
    const entity = event.deadEntity;
    
    // 사망한 엔티티가 플레이어인지 확인
    if (entity.typeId === "minecraft:player") {
        // 관전자 모드로 변경
        entity.runCommandAsync("gamemode spectator @s");
        
        // 사망한 플레이어의 이름 위에 표시
        entity.nameTag = "��c☠ §f" + entity.name + " §c☠";
        
        // 모든 플레이어에게 사망 메시지 표시
        world.getAllPlayers().forEach(player => {
            player.sendMessage(`§c${entity.name}님이 사망하셨습니다!`);
            player.runCommandAsync(`title @s actionbar §c${entity.name}님이 사망하셨습니다!`);
        });
        
        // 사망한 플레이어에게 메시지
        entity.sendMessage("§c사망하여 관전자 모드로 변경되었습니다.");
        
        const location = entity.location;
        
        // 묘비 이름 설정 (단순화)
        const graveName = `§8† §7${entity.name}의 묘비 §8†`;
        
        // 묘비로 사용할 아머스탠드 소환 (이름 포함)
        entity.runCommandAsync(`summon armor_stand "${graveName}" ${location.x} ${location.y} ${location.z}`);
        
        // 아머스탠드와 플레이어 매핑 저장
        const armorStandCheck = system.runInterval(() => {
            // 해당 이름의 아머스탠드 찾기
            const armorStands = [...world.getDimension("overworld").getEntities({
                type: "armor_stand",
                name: graveName
            })];
            
            // 아머스탠드가 없다면 (부숴졌다면)
            if (armorStands.length === 0 && tombMap.has(entity.name)) {
                // 마지막 묘비 위치로 텔레포트
                const lastLocation = tombMap.get(entity.name).location;
                entity.teleport(lastLocation);
                
                // 플레이어 권한 변경
                entity.runCommandAsync("gamemode survival @s");
                // 이름태그 원래대로
                entity.nameTag = entity.name;
                entity.sendMessage("§a묘비가 파괴되어 다시 전투에 참여할 수 있습니다!");
                
                // 모든 플레이어에게 알림
                world.getAllPlayers().forEach(p => {
                    p.sendMessage(`§e${entity.name}님이 다시 전투에 참여합니다!`);
                });
                
                // 인터벌 제거 및 매핑 제거
                system.clearRun(armorStandCheck);
                tombMap.delete(entity.name);
                
                // 파티클 효과 제거
                if (particleMap.has(entity.name)) {
                    system.clearRun(particleMap.get(entity.name));
                    particleMap.delete(entity.name);
                }
            }
            // 아머스탠드가 있다면 매핑에 추가
            else if (armorStands.length > 0 && !tombMap.has(entity.name)) {
                // 위치 정보를 포함하여 저장
                tombMap.set(entity.name, {
                    interval: armorStandCheck,
                    location: armorStands[0].location
                });
            }
        }, 10);
        
        // 파티클 효과
        const particleInterval = system.runInterval(() => {
            // 파티클 효과 적용
            entity.runCommandAsync(`execute at @s run particle minecraft:villager_angry ~ ~2 ~`);
            entity.runCommandAsync(`execute at @s run particle minecraft:dragon_breath_trail ~ ~1 ~`);
            // 묘비 주변에 여러 파티클 효과
            const dimension = world.getDimension("overworld");
            dimension.runCommandAsync(`execute as @e[type=armor_stand,name="${graveName}"] at @s run particle minecraft:endrod ~ ~0.5 ~`);
            dimension.runCommandAsync(`execute as @e[type=armor_stand,name="${graveName}"] at @s run particle minecraft:basic_smoke_particle ~ ~0.3 ~`);
        }, 5);
        
        // 파티클 인터벌 저장
        particleMap.set(entity.name, particleInterval);
    }
});
