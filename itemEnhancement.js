import { world, EnchantmentTypes } from "@minecraft/server";

console.warn("아이템 강화 시스템이 로드되었습니다."); // 스크립트 로드 확인

// 플레이어별 마지막 클릭 시간을 저장할 맵
const lastClickTimes = new Map();
// 더블 클릭 간격 설정 (밀리초)
const DOUBLE_CLICK_INTERVAL = 500; // 0.5초 이내에 두 번 클릭

// 강화 가능한 아이템 목록
const ENHANCEABLE_ITEMS = {
    // 무기류
    "minecraft:diamond_sword": {
        type: "weapon",
        enchantments: {
            1: { "sharpness": 1, "unbreaking": 1 },
            2: { "sharpness": 2, "unbreaking": 2 },
            3: { "sharpness": 3, "unbreaking": 2, "fire_aspect": 1 },
            4: { "sharpness": 4, "unbreaking": 3, "fire_aspect": 2 },
            5: { "sharpness": 5, "unbreaking": 3, "fire_aspect": 2, "looting": 3 }
        }
    },
    "minecraft:netherite_sword": {
        type: "weapon",
        enchantments: {
            1: { "sharpness": 2, "unbreaking": 1 },
            2: { "sharpness": 3, "unbreaking": 2 },
            3: { "sharpness": 4, "unbreaking": 3, "fire_aspect": 1 },
            4: { "sharpness": 5, "unbreaking": 3, "fire_aspect": 2 },
            5: { "sharpness": 6, "unbreaking": 3, "fire_aspect": 2, "looting": 3 }
        }
    },
    "minecraft:bow": {
        type: "weapon",
        enchantments: {
            1: { "power": 1, "unbreaking": 1 },
            2: { "power": 2, "unbreaking": 2 },
            3: { "power": 3, "unbreaking": 2, "flame": 1 },
            4: { "power": 4, "unbreaking": 3, "flame": 1, "infinity": 1 },
            5: { "power": 5, "unbreaking": 3, "flame": 1, "infinity": 1, "punch": 2 }
        }
    },
    
    // 방어구류
    "minecraft:diamond_helmet": {
        type: "armor",
        enchantments: {
            1: { "protection": 1, "unbreaking": 1 },
            2: { "protection": 2, "unbreaking": 2 },
            3: { "protection": 3, "unbreaking": 2, "respiration": 2 },
            4: { "protection": 4, "unbreaking": 3, "respiration": 3 },
            5: { "protection": 4, "unbreaking": 3, "respiration": 3, "aqua_affinity": 1 }
        }
    },
    "minecraft:diamond_chestplate": {
        type: "armor",
        enchantments: {
            1: { "protection": 1, "unbreaking": 1 },
            2: { "protection": 2, "unbreaking": 2 },
            3: { "protection": 3, "unbreaking": 2, "thorns": 1 },
            4: { "protection": 4, "unbreaking": 3, "thorns": 2 },
            5: { "protection": 4, "unbreaking": 3, "thorns": 3, "mending": 1 }
        }
    },
    
    // 도구류
    "minecraft:diamond_pickaxe": {
        type: "tool",
        enchantments: {
            1: { "efficiency": 1, "unbreaking": 1 },
            2: { "efficiency": 2, "unbreaking": 2 },
            3: { "efficiency": 3, "unbreaking": 2, "fortune": 1 },
            4: { "efficiency": 4, "unbreaking": 3, "fortune": 2 },
            5: { "efficiency": 5, "unbreaking": 3, "fortune": 3, "mending": 1 }
        }
    },
    "minecraft:diamond_axe": {
        type: "tool",
        enchantments: {
            1: { "efficiency": 1, "unbreaking": 1 },
            2: { "efficiency": 2, "unbreaking": 2 },
            3: { "efficiency": 3, "unbreaking": 2, "sharpness": 3 },
            4: { "efficiency": 4, "unbreaking": 3, "sharpness": 4 },
            5: { "efficiency": 5, "unbreaking": 3, "sharpness": 5, "mending": 1 }
        }
    },

    // 네더라이트 무기류
    "minecraft:netherite_sword": {
        type: "weapon",
        enchantments: {
            1: { "sharpness": 2, "unbreaking": 1 },
            2: { "sharpness": 3, "unbreaking": 2 },
            3: { "sharpness": 4, "unbreaking": 3, "fire_aspect": 1 },
            4: { "sharpness": 5, "unbreaking": 3, "fire_aspect": 2 },
            5: { "sharpness": 6, "unbreaking": 3, "fire_aspect": 2, "looting": 3 }
        }
    },
    "minecraft:netherite_axe": {
        type: "tool",
        enchantments: {
            1: { "efficiency": 2, "unbreaking": 1 },
            2: { "efficiency": 3, "unbreaking": 2, "sharpness": 2 },
            3: { "efficiency": 4, "unbreaking": 2, "sharpness": 3 },
            4: { "efficiency": 5, "unbreaking": 3, "sharpness": 4 },
            5: { "efficiency": 5, "unbreaking": 3, "sharpness": 5, "mending": 1 }
        }
    },

    // 네더라이트 도구류
    "minecraft:netherite_pickaxe": {
        type: "tool",
        enchantments: {
            1: { "efficiency": 2, "unbreaking": 1 },
            2: { "efficiency": 3, "unbreaking": 2 },
            3: { "efficiency": 4, "unbreaking": 2, "fortune": 2 },
            4: { "efficiency": 5, "unbreaking": 3, "fortune": 3 },
            5: { "efficiency": 6, "unbreaking": 3, "fortune": 3, "mending": 1 }
        }
    },

    // 네더라이트 류
    "minecraft:netherite_helmet": {
        type: "armor",
        enchantments: {
            1: { "protection": 2, "unbreaking": 1 },
            2: { "protection": 3, "unbreaking": 2 },
            3: { "protection": 4, "unbreaking": 2, "respiration": 2 },
            4: { "protection": 4, "unbreaking": 3, "respiration": 3 },
            5: { "protection": 5, "unbreaking": 3, "respiration": 3, "aqua_affinity": 1, "mending": 1 }
        }
    },
    "minecraft:netherite_chestplate": {
        type: "armor",
        enchantments: {
            1: { "protection": 2, "unbreaking": 1 },
            2: { "protection": 3, "unbreaking": 2 },
            3: { "protection": 4, "unbreaking": 2, "thorns": 2 },
            4: { "protection": 4, "unbreaking": 3, "thorns": 3 },
            5: { "protection": 5, "unbreaking": 3, "thorns": 3, "mending": 1 }
        }
    },
    "minecraft:netherite_leggings": {
        type: "armor",
        enchantments: {
            1: { "protection": 2, "unbreaking": 1 },
            2: { "protection": 3, "unbreaking": 2 },
            3: { "protection": 4, "unbreaking": 2, "swift_sneak": 1 },
            4: { "protection": 4, "unbreaking": 3, "swift_sneak": 2 },
            5: { "protection": 5, "unbreaking": 3, "swift_sneak": 3, "mending": 1 }
        }
    },
    "minecraft:netherite_boots": {
        type: "armor",
        enchantments: {
            1: { "protection": 2, "unbreaking": 1 },
            2: { "protection": 3, "unbreaking": 2, "feather_falling": 2 },
            3: { "protection": 4, "unbreaking": 2, "feather_falling": 3 },
            4: { "protection": 4, "unbreaking": 3, "feather_falling": 4, "depth_strider": 2 },
            5: { "protection": 5, "unbreaking": 3, "feather_falling": 4, "depth_strider": 3, "soul_speed": 3 }
        }
    }
};

// 아이템 타입별 강화 성공 메시지
const TYPE_MESSAGES = {
    weapon: {
        success: "§a무기가 더욱 강력해졌습니다!",
        maxLevel: "§c이미 최대로 강화된 무기입니다."
    },
    armor: {
        success: "§a방어구가 더욱 단단해졌습니다!",
        maxLevel: "§c이미 최대로 강화된 방어구입니다."
    },
    tool: {
        success: "§a도구가 더욱 효율적으로 변했습니다!",
        maxLevel: "§c이미 최대로 강화된 도구입니다."
    }
};

// 강화 단계별 이름 접두사
const ENHANCEMENT_PREFIXES = {
    1: "§a[+1] ",
    2: "§e[+2] ",
    3: "§b[+3] ",
    4: "§d[+4] ",
    5: "§6[+5] "
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

        // 에메랄드 확인 및 제거
        try {
            // 에메랄드 소지 여부 확인
            const checkResult = await player.runCommandAsync(`clear @s emerald 0 0`);
            if (!checkResult) {
                return { 
                    success: false, 
                    message: "§c강화에 필요한 에메랄드가 부족합니다. (필요: 1개)" 
                };
            }
            // 에메랄드 1개 제거
            await player.runCommandAsync(`clear @s emerald 0 1`);
        } catch (error) {
            return { 
                success: false, 
                message: "§c에메랄드 처리 중 오류가 발생했습니다." 
            };
        }

        if (currentLevel >= 4) {
            const itemConfig = ENHANCEABLE_ITEMS[item.typeId];
            // 실패시 에메랄드 반환
            await player.runCommandAsync(`give @s emerald 1`);
            return { 
                success: false, 
                message: TYPE_MESSAGES[itemConfig.type].maxLevel || "§c이미 최대로 강화되었습니다." 
            };
        }

        const nextLevel = currentLevel + 1;
        const itemConfig = ENHANCEABLE_ITEMS[item.typeId];
        const enchantments = itemConfig.enchantments[nextLevel];

        try {
            await player.runCommandAsync(`clear @s ${item.typeId} 0 1`);
            await player.runCommandAsync(`give @s ${item.typeId} 1`);
            
            for (const [enchantType, level] of Object.entries(enchantments)) {
                await player.runCommandAsync(`enchant @s ${enchantType} ${level}`);
            }
            
            return { 
                success: true, 
                message: `§a아이템이 +${nextLevel} 단계로 강화되었습니다!` 
            };

        } catch (cmdError) {
            // 실패시 에메랄드 반환
            await player.runCommandAsync(`give @s emerald 1`);
            return { success: false, message: "§c강화 중 오류가 발생했습니다." };
        }

    } catch (error) {
        // 실패시 에메랄드 반환
        try {
            await player.runCommandAsync(`give @s emerald 1`);
        } catch (giveError) {
            // 에메랄드 반환 실패는 무시
        }
        return {
            success: false,
            message: "§c강화 처리 중 오류가 발생했습니다."
        };
    }
}

// 액션바 메시지 표시 함수 수정
function showActionBarMessage(player, item, currentLevel) {
    try {
        if (!item || !ENHANCEABLE_ITEMS[item.typeId]) {
            player.runCommandAsync('title @s actionbar §e강화 가능한 아이템을 들어주세요');
            return;
        }

        const itemName = item.typeId.split(':')[1].replace(/_/g, ' ');
        let message = "";

        if (currentLevel >= 4) {
            message = `§6${itemName} §f[§b+${currentLevel}§f] §c(최대 강화입니다)`;
        } else {
            const nextLevel = currentLevel + 1;
            message = `§6${itemName} §f[§b+${currentLevel}§f] §e→ §f[§b+${nextLevel}§f]`;
        }

        player.runCommandAsync(`title @s actionbar ${message}`);
    } catch (error) {
        console.warn("액션바 메시지 표시 중 오류:", error);
    }
}

// 아이템 사용 이벤트 수정
world.beforeEvents.itemUse.subscribe(async (event) => {
    const player = event.source;
    const item = event.itemStack;
    
    try {
        if (item) {
            // 강화 가능한 아이템인지 먼저 확인
            const itemConfig = ENHANCEABLE_ITEMS[item.typeId];
            if (!itemConfig) {
                showActionBarMessage(player, null, 0);
                return; // 강화 불가능한 아이템이면 무시
            }

            const currentTime = Date.now();
            const lastClickTime = lastClickTimes.get(player.id) || 0;
            
            // 현재 강화 단계 확인
            const currentLevel = getCurrentLevel(item, itemConfig);
            
            // 액션바 메시지 표시
            showActionBarMessage(player, item, currentLevel);
            
            // 4단계인 경우 더 이상 강화 불가
            if (currentLevel >= 4) {
                player.sendMessage("§c이미 최대 강화 단계입니다.");
                lastClickTimes.delete(player.id);
                return;
            }
            
            if (currentTime - lastClickTime <= DOUBLE_CLICK_INTERVAL) {
                // async 함수 호출
                enhanceItem(item, currentLevel, player).then(result => {
                    player.sendMessage(result.message);
                    // 강화 완료 후 액션바 업데이트
                    showActionBarMessage(player, item, currentLevel + 1);
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
        } else {
            showActionBarMessage(player, null, 0);
            player.sendMessage("§c손에 아이템을 들고 있어야 합니다.");
        }
    } catch (error) {
        console.warn("오류 발생:", error);
        player.sendMessage("§c강화 중 오류가 발생했습니다.");
    }
});

// 틱 이벤트 추가 - 지속적인 액션바 업데이트
world.afterEvents.tick.subscribe(() => {
    for (const player of world.getAllPlayers()) {
        const item = player.getComponent("inventory").container.getItem(player.selectedSlot);
        if (item) {
            const itemConfig = ENHANCEABLE_ITEMS[item.typeId];
            if (itemConfig) {
                const currentLevel = getCurrentLevel(item, itemConfig);
                showActionBarMessage(player, item, currentLevel);
            } else {
                showActionBarMessage(player, null, 0);
            }
        } else {
            showActionBarMessage(player, null, 0);
        }
    }
});
