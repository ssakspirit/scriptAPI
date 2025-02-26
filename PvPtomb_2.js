import { world, system } from "@minecraft/server";

/**
 * PvP Tombstone System_2
 * 기능 추가: 모든 차원에서 사망했을 때 묘비가 생성되고 관전자 모드로 변경
 * 
 * 사용법:
 * 1. PvP 서버에 이 애드온을 적용합니다.
 * 2. 플레이어가 사망하면 자동으로 묘비가 생성되고 관전자 모드로 변경됩니다.
 * 3. 다른 플레이어가 묘비를 파괴하면 사망한 플레이어가 부활합니다.
 * 4. 묘비는 모든 차원에서 찾을 수 있습니다.
 * 
 * 
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
        
        // 모든 차원에서 묘비 찾기
        const dimensions = ["overworld", "nether", "the_end"].map(id => world.getDimension(id));
        let found = false;
        
        // 각 차원에서 묘비 찾기
        Promise.all(dimensions.map(dimension => 
            dimension.getEntities({
                type: "armor_stand",
                name: graveName
            })
        )).then(results => {
            // 모든 차원의 결과를 확인
            for (let i = 0; i < results.length; i++) {
                const armorStands = results[i];
                if (armorStands.length > 0) {
                    found = true;
                    const dimension = dimensions[i];
                    const armorStand = armorStands[0];
                    
                    // 묘비 위치로 텔레포트하고 제거
                    targetPlayer.teleport(armorStand.location, {dimension: dimension});
                    armorStand.kill();
                    
                    // 플레이어 상태 변경
                    dimension.runCommandAsync(`gamemode survival "${targetName}"`);
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
                    break;
                }
            }
            
            // 묘비를 찾지 못한 경우
            if (!found) {
                player.sendMessage(`§c${targetName}님의 묘비를 찾을 수 없습니다!`);
            }
        }).catch(error => {
            console.warn("부활 명령어 처리 중 오류:", error);
            player.sendMessage(`§c${targetName}님을 부활시키는 중 오류가 발생했습니다!`);
        });
    }
});

// 플레이어 사망 이벤트
world.afterEvents.entityDie.subscribe((event) => {
    const entity = event.deadEntity;
    
    // 사망한 엔티티가 플레이어인지 확인
    if (entity.typeId === "minecraft:player") {
        try {
            const playerName = entity.name;
            const dimension = entity.dimension;
            
            // 사망한 플레이어의 이름 위에 표시
            entity.nameTag = "§c☠ §f" + playerName + " §c☠";
            
            // 모든 플레이어에게 사망 메시지 표시
            world.getAllPlayers().forEach(player => {
                player.sendMessage(`§c${playerName}님이 사망하셨습니다!`);
                player.runCommandAsync(`title @s actionbar §c${playerName}님이 사망하셨습니다!`);
            });
            
            // 사망한 플레이어에게 메시지
            entity.sendMessage("§c사망하여 관전자 모드로 변경되었습니다.");
            
            const location = entity.location;
            
            // 묘비 이름 설정 (단순화)
            const graveName = `§8† §7${playerName}의 묘비 §8†`;
            
            // 묘비로 사용할 아머스탠드 소환 (이름 포함)
            dimension.runCommandAsync(`summon armor_stand "${graveName}" ${location.x} ${location.y} ${location.z}`);
            
            // 게임모드 변경 시도 (여러 번)
            const tryChangeGamemode = () => {
                try {
                    const player = world.getAllPlayers().find(p => p.name === playerName);
                    if (player) {
                        // 현재 차원이 사망한 차원과 같은지 확인
                        if (player.dimension.id === dimension.id) {
                            Promise.all([
                                player.dimension.runCommandAsync(`gamemode spectator "${playerName}"`),
                                player.runCommandAsync("gamemode spectator @s")
                            ]).catch(error => {
                                console.warn(`게임모드 변경 시도 중 오류:`, error);
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`게임모드 변경 함수 실행 중 오류:`, error);
                }
            };

            // 차원 이동이 완료될 때까지 충분히 기다린 후 게임모드 변경 시도
            system.runTimeout(() => {
                // 5초 동안 0.5초 간격으로 시도
                for (let i = 0; i < 10; i++) {
                    system.runTimeout(tryChangeGamemode, i * 10); // 0.5초 간격
                }
            }, 100); // 5초 후부터 시작
            
            // tombMap에 차원 정보 추가
            const dimensionId = dimension.id;
            
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

                    // 해당 이름의 아머스탠드 찾기 (저장된 차원에서)
                    const currentDimension = world.getDimension(dimensionId);
                    const armorStands = [...currentDimension.getEntities({
                        type: "armor_stand",
                        name: graveName
                    })];
                    
                    // 아머스탠드가 없다면 (부숴졌다면)
                    if (armorStands.length === 0 && tombMap.has(playerName)) {
                        // 마지막 묘비 위치로 텔레포트
                        const lastLocation = tombMap.get(playerName).location;
                        const lastDimension = world.getDimension(tombMap.get(playerName).dimensionId);
                        
                        // 차원 이동 및 게임모드 변경
                        entity.teleport(lastLocation, {dimension: lastDimension});
                        lastDimension.runCommandAsync(`gamemode survival "${playerName}"`);
                        
                        // 이름태그 원래대로
                        entity.nameTag = playerName;
                        entity.sendMessage("§a묘비가 파괴되어 다시 전투에 참여할 수 있습니다!");
                        
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
                    console.warn(`${playerName}의 묘비 확인 중 오류:`, error);
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

                    // 파티클 효과 적용 (현재 차원에서)
                    const currentDimension = entity.dimension;
                    currentDimension.runCommandAsync(`execute as "${playerName}" at @s run particle minecraft:villager_angry ~ ~2 ~`).catch(() => {});
                    currentDimension.runCommandAsync(`execute as "${playerName}" at @s run particle minecraft:dragon_breath_trail ~ ~1 ~`).catch(() => {});
                    
                    // 묘비 주변에 여러 파티클 효과 (저장된 차원에서)
                    const tombDimension = world.getDimension(dimensionId);
                    tombDimension.runCommandAsync(`execute as @e[type=armor_stand,name="${graveName}"] at @s run particle minecraft:endrod ~ ~0.5 ~`).catch(() => {});
                    tombDimension.runCommandAsync(`execute as @e[type=armor_stand,name="${graveName}"] at @s run particle minecraft:basic_smoke_particle ~ ~0.3 ~`).catch(() => {});
                } catch (error) {
                    console.warn(`${playerName}의 파티클 효과 처리 중 오류:`, error);
                    // 오류 발생 시 인터벌 정리
                    system.clearRun(particleInterval);
                    particleMap.delete(playerName);
                }
            }, 5);
            
            // 파티클 인터벌 저장
            particleMap.set(playerName, particleInterval);
            
        } catch (error) {
            console.warn(`플레이어 ${playerName} 사망 처리 중 오류:`, error);
        }
    }
});

// 플레이어 퇴장 이벤트 추가
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
