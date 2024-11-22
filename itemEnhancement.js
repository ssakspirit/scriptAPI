import { world, system } from "@minecraft/server";

console.warn("아이템 강화 시스템이 로드되었습니다.");

// 플레이어별 마지막 클릭 시간을 저장할 맵
const lastClickTimes = new Map();
// 더블 클릭 간격 설정 (밀리초)
const DOUBLE_CLICK_INTERVAL = 500; // 0.5초 이내에 두 번 클릭

// 강화 가능한 아이템 목록
const ENHANCEABLE_ITEMS = {
    // 철 무기류
    "minecraft:iron_sword": {
        type: "weapon",
        enchantments: {
            1: { "sharpness": 2, "unbreaking": 1 },
            2: { "sharpness": 2, "unbreaking": 2, "fire_aspect": 1 },
            3: { "sharpness": 3, "unbreaking": 2, "fire_aspect": 1 },
            4: { "sharpness": 3, "unbreaking": 3, "fire_aspect": 1, "looting": 2 }
        }
    },
    // 철 도구류
    "minecraft:iron_pickaxe": {
        type: "tool",
        enchantments: {
            1: { "efficiency": 2, "unbreaking": 1 },
            2: { "efficiency": 2, "unbreaking": 2, "fortune": 1 },
            3: { "efficiency": 3, "unbreaking": 2, "fortune": 2 },
            4: { "efficiency": 3, "unbreaking": 3, "fortune": 2, "mending": 1 }
        }
    },
    "minecraft:iron_axe": {
        type: "tool",
        enchantments: {
            1: { "efficiency": 2, "unbreaking": 1 },
            2: { "efficiency": 2, "unbreaking": 2, "sharpness": 2 },
            3: { "efficiency": 3, "unbreaking": 2, "sharpness": 3 },
            4: { "efficiency": 3, "unbreaking": 3, "sharpness": 3, "mending": 1 }
        }
    },

    // 다이아몬드 무기류
    "minecraft:diamond_sword": {
        type: "weapon",
        enchantments: {
            1: { "sharpness": 2, "unbreaking": 2 },
            2: { "sharpness": 3, "unbreaking": 2, "fire_aspect": 1 },
            3: { "sharpness": 4, "unbreaking": 3, "fire_aspect": 2 },
            4: { "sharpness": 5, "unbreaking": 3, "fire_aspect": 2, "looting": 3 }
        }
    },
    "minecraft:bow": {
        type: "weapon",
        enchantments: {
            1: { "power": 2, "unbreaking": 2 },
            2: { "power": 3, "unbreaking": 2, "flame": 1 },
            3: { "power": 4, "unbreaking": 3, "flame": 1, "infinity": 1 },
            4: { "power": 5, "unbreaking": 3, "flame": 1, "infinity": 1, "punch": 2 }
        }
    },
    
    // 다이아몬드 도구류
    "minecraft:diamond_pickaxe": {
        type: "tool",
        enchantments: {
            1: { "efficiency": 2, "unbreaking": 2 },
            2: { "efficiency": 3, "unbreaking": 2, "fortune": 1 },
            3: { "efficiency": 4, "unbreaking": 3, "fortune": 2 },
            4: { "efficiency": 5, "unbreaking": 3, "fortune": 3, "mending": 1 }
        }
    },
    "minecraft:diamond_axe": {
        type: "tool",
        enchantments: {
            1: { "efficiency": 2, "unbreaking": 2 },
            2: { "efficiency": 3, "unbreaking": 2, "sharpness": 3 },
            3: { "efficiency": 4, "unbreaking": 3, "sharpness": 4 },
            4: { "efficiency": 5, "unbreaking": 3, "sharpness": 5, "mending": 1 }
        }
    },

    // 네더라이트 무기류
    "minecraft:netherite_sword": {
        type: "weapon",
        enchantments: {
            1: { "sharpness": 3, "unbreaking": 2 },
            2: { "sharpness": 4, "unbreaking": 3, "fire_aspect": 1 },
            3: { "sharpness": 5, "unbreaking": 3, "fire_aspect": 2 },
            4: { "sharpness": 6, "unbreaking": 3, "fire_aspect": 2, "looting": 3 }
        }
    },
    "minecraft:netherite_axe": {
        type: "tool",
        enchantments: {
            1: { "efficiency": 3, "unbreaking": 2, "sharpness": 2 },
            2: { "efficiency": 4, "unbreaking": 2, "sharpness": 3 },
            3: { "efficiency": 5, "unbreaking": 3, "sharpness": 4 },
            4: { "efficiency": 5, "unbreaking": 3, "sharpness": 5, "mending": 1 }
        }
    },

    // 네더라이트 도구류
    "minecraft:netherite_pickaxe": {
        type: "tool",
        enchantments: {
            1: { "efficiency": 3, "unbreaking": 2 },
            2: { "efficiency": 4, "unbreaking": 2, "fortune": 2 },
            3: { "efficiency": 5, "unbreaking": 3, "fortune": 3 },
            4: { "efficiency": 6, "unbreaking": 3, "fortune": 3, "mending": 1 }
        }
    },

    // 낚싯대
    "minecraft:fishing_rod": {
        type: "tool",
        enchantments: {
            1: { "lure": 2, "unbreaking": 2 },
            2: { "lure": 2, "unbreaking": 2, "luck_of_the_sea": 2 },
            3: { "lure": 3, "unbreaking": 3, "luck_of_the_sea": 2 },
            4: { "lure": 3, "unbreaking": 3, "luck_of_the_sea": 3, "mending": 1 }
        }
    },

    // 방패
    "minecraft:shield": {
        type: "tool",
        enchantments: {
            1: { "unbreaking": 1 },
            2: { "unbreaking": 2 },
            3: { "unbreaking": 3 },
            4: { "unbreaking": 3, "mending": 1 }
        }
    }
};

// 강화 단계별 이름 접두사
const ENHANCEMENT_PREFIXES = {
    1: "§a[+1] ",
    2: "§e[+2] ",
    3: "§b[+3] ",
    4: "§d[+4] "
};

// 강화 단계별 성공 확률 (%)
const ENHANCEMENT_CHANCES = {
    0: 100,  // 0 -> 1 강화 확률
    1: 80,   // 1 -> 2 강화 확률
    2: 60,   // 2 -> 3 강화 확률
    3: 40    // 3 -> 4 강화 확률
};

// 현재 강화 단계를 확인하는 함수 수정
function getCurrentLevel(item, itemConfig) {
    if (!item || !itemConfig) return 0;
    
    try {
        const enchantable = item.getComponent("minecraft:enchantable");
        if (!enchantable) return 0;

        const enchantments = enchantable.getEnchantments();
        const currentEnchants = {};
        
        for (const enchant of enchantments) {
            if (enchant.type?.id) {
                const simpleId = enchant.type.id.replace('minecraft:', '');
                currentEnchants[simpleId] = enchant.level;
            }
        }

        for (let level = 4; level >= 1; level--) {
            const levelEnchants = itemConfig.enchantments[level];
            let isMatch = true;
            
            for (const [enchantType, expectedLevel] of Object.entries(levelEnchants)) {
                const currentLevel = currentEnchants[enchantType];
                if (currentLevel !== expectedLevel) {
                    isMatch = false;
                    break;
                }
            }
            
            if (isMatch) return level;
        }
        
        return 0;
    } catch (error) {
        return 0;
    }
}

// 아이템 강화 함수 수정
async function enhanceItem(item, currentLevel = 0, player) {
    try {
        if (!item || !ENHANCEABLE_ITEMS[item.typeId]) {
            return { success: false, message: "§c강화할 수 없는 아이템입니다." };
        }

        if (currentLevel >= 4) {
            await player.runCommandAsync(`playsound mob.villager.no @s ~ ~ ~ 1 1`);
            return { 
                success: false, 
                message: "§c이미 최대로 강화되었습니다." 
            };
        }

        const inventory = player.getComponent("inventory");
        let hasEmerald = false;
        
        for (let i = 0; i < inventory.container.size; i++) {
            const slotItem = inventory.container.getItem(i);
            if (slotItem?.typeId === "minecraft:emerald") {
                hasEmerald = true;
                break;
            }
        }

        if (!hasEmerald) {
            await player.runCommandAsync(`playsound mob.villager.no @s ~ ~ ~ 1 1`);
            return { 
                success: false, 
                message: "§c강화에 필요한 에메랄드가 부족합니다. (필요: 1개)" 
            };
        }

        const successChance = ENHANCEMENT_CHANCES[currentLevel];
        const randomValue = Math.random() * 100;

        if (randomValue > successChance) {
            await player.runCommandAsync(`clear @s emerald 0 1`);
            await player.runCommandAsync(`clear @s ${item.typeId} 0 1`);
            await player.runCommandAsync(`playsound random.break @s ~ ~ ~ 1 1`);
            await player.runCommandAsync(`playsound mob.wither.death @s ~ ~ ~ 0.5 0.5`);
            return {
                success: false,
                message: `§c강화 실패! 아이템이 파괴되었습니다. (성공확률: ${successChance}%)`
            };
        }

        try {
            const nextLevel = currentLevel + 1;
            const itemConfig = ENHANCEABLE_ITEMS[item.typeId];
            const enchantments = itemConfig.enchantments[nextLevel];

            await player.runCommandAsync(`clear @s emerald 0 1`);

            for (const [enchantType, level] of Object.entries(enchantments)) {
                await player.runCommandAsync(`enchant @s ${enchantType} ${level}`);
            }
            
            await player.runCommandAsync(`playsound random.levelup @s ~ ~ ~ 1 1`);
            await player.runCommandAsync(`playsound random.orb @s ~ ~ ~ 1 1`);
            
            return { 
                success: true, 
                message: `§a강화 성공! +${nextLevel} 단계 달성! (성공확률: ${successChance}%)` 
            };

        } catch (cmdError) {
            return { success: false, message: "§c강화 중 오류가 발생했습니다." };
        }

    } catch (error) {
        return {
            success: false,
            message: "§c강화 처리 중 오류가 발생했습니다."
        };
    }
}

// itemUse 이벤트 수정
world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;
    
    try {
        if (item) {
            // 강화 가능한 아이템인지 먼저 확인
            const itemConfig = ENHANCEABLE_ITEMS[item.typeId];
            if (!itemConfig) {
                return; // 강화 불가능한 아이템이면 무시
            }

            const currentTime = Date.now();
            const lastClickTime = lastClickTimes.get(player.id) || 0;
            
            // 현재 강화 단계 확인
            const currentLevel = getCurrentLevel(item, itemConfig);
            
            // 4단계인 경우 더 이상 강화 불가
            if (currentLevel >= 4) {
                player.runCommandAsync(`playsound note.bass @s ~ ~ ~ 1 0.5`);  // 낮은 음의 효과음
                player.runCommandAsync(`playsound mob.villager.no @s ~ ~ ~ 1 1`);  // 실패 효과음
                player.sendMessage("§c이미 최대 강화 단계입니다.");
                lastClickTimes.delete(player.id);
                return;
            }
            
            if (currentTime - lastClickTime <= DOUBLE_CLICK_INTERVAL) {
                // async 함수 호출
                enhanceItem(item, currentLevel, player).then(result => {
                    player.sendMessage(result.message);
                }).catch(error => {
                    console.warn("강화 처리 중 오류:", error);
                    player.sendMessage("§c강화 중 오류가 발생했습니다.");
                });
                
                lastClickTimes.delete(player.id);
            } else {
                // 첫 번째 클릭 시 강화 가능한 아이템이면 메시지 표시
                player.sendMessage("§e한 번 더 클릭하면 강화를 시도합니다.");
                lastClickTimes.set(player.id, currentTime);
            }
        }
    } catch (error) {
        console.warn("오류 발생:", error);
        player.sendMessage("§c강화 중 오류가 발생했습니다.");
    }
});
