/**
 * 플레이어 강화 시스템 (에메랄드 사용)
 * 
 * [ 사용 가능한 명령어 ]
 * !강화 - 다음 단계로 강화를 시도합니다
 * !강화정보 - 현재 강화 상태와 다음 단계 정보를 확인합니다
 * !현타 - 모든 강화를 포기하고 수련 단계로 초기화합니다
 * 
 * [ 강화 단계 ]
 * 1단계: 수련 (흰색)
 * 2단계: 각성 (하늘색) - 체력+2, 저항+1, 속도+1
 * 3단계: 정예 (분홍색) - 체력+3, 저항+2, 속도+2
 * 4단계: 전설 (금색) - 체력+4, 저항+3, 속도+3
 * 
 * [ 강화 비용 및 확률 ]
 * 수련→각성: 에메랄드 10개 (성공확률 40%)
 * 각성→정예: 에메랄드 20개 (성공확률 30%)
 * 정예→전설: 에메랄드 30개 (성공확률 20%)
 * 
 * [ 실패 시 ]
 * - 강화 실패 시 수련 단계로 초기화됩니다
 * - 사용한 에메랄드는 반환되지 않습니다
 * 
 * [ 플레이어 이름표 ]
 * - 각 단계별로 색상이 다르게 표시됩니다
 * - 형식: [단계명] 플레이어이름
 */

import { world, system } from "@minecraft/server";

class PlayerEnhancement {
    constructor() {
        this.enhancementConfig = {
            1: {
                name: "수련"
            },
            2: {
                name: "각성",
                health: 30,
                cost: { emerald: 10 },
                successRate: 40
            },
            3: {
                name: "정예",
                health: 40,
                cost: { emerald: 20 },
                successRate: 30
            },
            4: {
                name: "전설",
                health: 50,
                cost: { emerald: 30 },
                successRate: 20
            }
        };
    }

    // 플레이어 레벨 저장
    savePlayerLevel(player, level) {
        try {
            world.setDynamicProperty(`player_level_${player.name}`, level);
        } catch (error) {
            console.warn("레벨 저장 중 오류:", error);
        }
    }

    // 플레이어 레벨 가져오기
    getPlayerLevel(player) {
        try {
            const level = world.getDynamicProperty(`player_level_${player.name}`);
            return level || 1;
        } catch (error) {
            console.warn("레벨 불러오기 중 오류:", error);
            return 1;
        }
    }

    // 스탯 적용
    applyStats(player, level) {
        try {
            // 모든 효과 초기화
            const effects = player.getEffects();
            for (const effect of effects) {
                player.removeEffect(effect.typeId);
            }

            // 레벨별 효과 적용 (999999틱 = 약 13시간)
            switch(level) {
                case 4: // 전설
                    player.addEffect("health_boost", 999999, {
                        amplifier: 4,
                        showParticles: false
                    });
                    player.addEffect("resistance", 999999, {
                        amplifier: 3,
                        showParticles: false
                    });
                    player.addEffect("speed", 999999, {
                        amplifier: 2,
                        showParticles: false
                    });
                    break;
                case 3: // 정예
                    player.addEffect("health_boost", 999999, {
                        amplifier: 3,
                        showParticles: false
                    });
                    player.addEffect("resistance", 999999, {
                        amplifier: 2,
                        showParticles: false
                    });
                    player.addEffect("speed", 999999, {
                        amplifier: 1,
                        showParticles: false
                    });
                    break;
                case 2: // 각성
                    player.addEffect("health_boost", 999999, {
                        amplifier: 2,
                        showParticles: false
                    });
                    player.addEffect("resistance", 999999, {
                        amplifier: 1,
                        showParticles: false
                    });
                    player.addEffect("speed", 999999, {
                        amplifier: 0,
                        showParticles: false
                    });
                    break;
            }
            
            // 이름표에 단계 표시 (색상 적용)
            const config = this.enhancementConfig[level];
            let rankColor;
            switch(level) {
                case 4:
                    rankColor = "§6"; // 금색 (전설)
                    break;
                case 3:
                    rankColor = "§d"; // 분홍색 (정예)
                    break;
                case 2:
                    rankColor = "§b"; // 하늘색 (각성)
                    break;
                default:
                    rankColor = "§f"; // 흰색 (수련)
            }
            
            // 단순화된 이름표 설정
            player.nameTag = `${rankColor}[${config.name}] ${player.name}`;
            
        } catch (error) {
            console.warn("스탯 적용 중 오류:", error);
        }
    }

    // 강화 비용 확인
    async checkEnhancementCost(player, level) {
        const cost = this.enhancementConfig[level].cost;
        
        try {
            // 인벤토리에서 에메랄드 개수 확인
            const inventory = player.getComponent("inventory").container;
            let emeraldCount = 0;
            
            // 모든 슬롯 확인
            for (let i = 0; i < inventory.size; i++) {
                const item = inventory.getItem(i);
                if (item?.typeId === "minecraft:emerald") {
                    emeraldCount += item.amount;
                }
            }
            
            // 필요한 에메랄드 개수와 비교
            return emeraldCount >= cost.emerald;
            
        } catch (error) {
            console.warn("에메랄드 확인 중 오류:", error);
            return false;
        }
    }

    // 비용 소비
    async consumeCost(player, level) {
        const cost = this.enhancementConfig[level].cost;
        try {
            // 인벤토리에서 에메랄드 제거
            const inventory = player.getComponent("inventory").container;
            let remainingCost = cost.emerald;
            
            // 모든 슬롯 확인하면서 에메랄드 제거
            for (let i = 0; i < inventory.size && remainingCost > 0; i++) {
                const item = inventory.getItem(i);
                if (item?.typeId === "minecraft:emerald") {
                    const removeAmount = Math.min(item.amount, remainingCost);
                    if (removeAmount === item.amount) {
                        inventory.setItem(i, undefined); // 슬롯 비우기
                    } else {
                        item.amount -= removeAmount;
                        inventory.setItem(i, item);
                    }
                    remainingCost -= removeAmount;
                }
            }
        } catch (error) {
            console.warn("비용 소비 중 오류:", error);
        }
    }

    // 강화 시도
    async tryEnhancement(player) {
        const currentLevel = this.getPlayerLevel(player);
        
        // 최대 레벨 체크
        if (currentLevel >= 4) {
            player.sendMessage("§c이미 최대 등급입니다!");
            return;
        }

        const nextLevel = currentLevel + 1;
        const config = this.enhancementConfig[nextLevel];

        // 비용 확인
        const hasCost = await this.checkEnhancementCost(player, nextLevel);
        if (!hasCost) {
            player.sendMessage(`§c강화에 필요한 에메랄드가 부족합니다!\n필요: 에메랄드 ${config.cost.emerald}개`);
            return;
        }

        // 비용 소비
        await this.consumeCost(player, nextLevel);
        
        const success = Math.random() * 100 < config.successRate;
        
        if (success) {
            // 강화 성공
            this.savePlayerLevel(player, nextLevel);
            this.applyStats(player, nextLevel);
            
            await system.run(async () => {
                player.runCommand(`particle minecraft:totem_particle ~~~`);
                player.runCommand(`playsound random.levelup @s`);
            });
            
            world.sendMessage(`§a${player.name}님이 [${config.name}] 등급으로 강화에 성공했습니다!`);
        } else {
            // 강화 실패 - 수련 단계로
            this.savePlayerLevel(player, 1);
            this.applyStats(player, 1);
            
            await system.run(async () => {
                player.runCommand(`kill @s`);
            });
            
            world.sendMessage(`§c${player.name}님이 강화에 실패하여 [수련] 단계로 돌아갔습니다...`);
        }

        // 지정된 시간 후에 코드를 실행하는 타이머 함수, succes 참이면 20틱 후, 거짓이면 60틱 후 메시지 표시
        await system.runTimeout(() => {
            this.showEnhancementInfo(player);
        }, success ? 20 : 60);
    }

    // 현재 강화 정보 표시
    showEnhancementInfo(player) {
        const currentLevel = this.getPlayerLevel(player);
        const currentConfig = this.enhancementConfig[currentLevel];
        const nextConfig = this.enhancementConfig[currentLevel + 1];

        let message = `§e== 강화 정보 ==\n`;
        message += `§f현재 등급: [${currentConfig.name}]\n`;
        
        if (currentLevel < 4) {
            message += `§f다음 등급: [${nextConfig.name}]\n`;
            message += `§f필요 재료: 에메랄드 ${nextConfig.cost.emerald}개\n`;
            message += `§f성공 확률: ${nextConfig.successRate}%`;
        } else {
            message += `§a최대 등급 달성!`;
        }

        player.sendMessage(message);
    }

    // 플레이어 초기화
    async resetPlayer(player) {
        try {
            // 레벨 1(수련)으로 초기화
            this.savePlayerLevel(player, 1);
            
            await system.run(async () => {
                try {
                    // 모든 효과 제거 후 수련 효과 적용
                    const effects = player.getEffects();
                    for (const effect of effects) {
                        player.removeEffect(effect.typeId);
                    }
                    this.applyStats(player, 1);
                    
                    // 이름표 설정
                    player.nameTag = `[수련] ${player.name}`;
                    
                    // 효과음 재생
                    player.runCommand(`playsound random.glass @s`);
                    
                    // 파티클 효과
                    player.runCommand(`particle minecraft:villager_angry ~~~`);
                } catch (error) {
                    console.warn("명령어 실행 중 오류:", error);
                }
            });
            
            // 초기화 메시지
            player.sendMessage("§e모든 강화 효과가 초기화되었습니다.");
            world.sendMessage(`§e${player.name}님이 현타가 와서 [수련] 단계로 초기화했습니다...`);
            
            // 강화정보 자동 표시
            this.showEnhancementInfo(player);
            
        } catch (error) {
            console.warn("플레이어 초기화 중 오류:", error);
        }
    }
}

// 강화 시스템 인스턴스 생성
const enhancement = new PlayerEnhancement();

// 채팅 명령어 처리
world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message;
    const player = event.sender;

    if (message === "!강화") {
        event.cancel = true;
        enhancement.tryEnhancement(player);
    } else if (message === "!강화정보") {
        event.cancel = true;
        enhancement.showEnhancementInfo(player);
    } else if (message === "!현타") {
        event.cancel = true;
        enhancement.resetPlayer(player);
    }
});

// 플레이어 참여시 스탯 적용
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    const level = enhancement.getPlayerLevel(player);
    enhancement.applyStats(player, level);
});
