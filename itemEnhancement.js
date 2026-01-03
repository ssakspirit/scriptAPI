/**
 * 아이템 강화 시스템 v1.0
 * 
 * [ 사용 방법 ]
 * 1. 강화하고 싶은 아이템을 들고 있습니다.
 * 2. 인벤토리에 에메랄드가 1개 이상 있어야 합니다.
 * 3. 아이템을 들고 우클릭(사용)을 두 번 연속으로 합니다.
 * 4. 강화가 성공하면 인챈트가 강화되고, 실패하면 아이템이 파괴됩니다.
 * 5. 우클릭을 했을 때 착용되는 갑옷과 같은 아이템은 핫바의 첫번째 슬롯에 위치 시킨 뒤 채팅명령어 '!아이템강화'를 입력하면 됩니다.
 * 
 * [ 강화 가능한 아이템 ]
 * - 철 등급: 검, 곡괭이, 도끼
 * - 다이아몬드 등급: 검, 곡괭이, 도끼, 활
 * - 네더라이트 등급: 검, 곡괭이, 도끼
 * - 기타: 낚싯대, 방패
 * 
 * [ 강화 단계 ]
 * - +1 단계: 100% 성공
 * - +2 단계: 80% 성공
 * - +3 단계: 60% 성공
 * - +4 단계: 40% 성공
 * 
 * [ 주의사항 ]
 * - 강화 실패 시 아이템과 에메랄드가 모두 소멸됩니다.
 * - 이미 인챈트된 아이템은 강화가 불가능합니다.
 * - 최대 강화 단계는 +4입니다.
 */

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
    1: 80,   // 1 -> 2 강화 률
    2: 60,   // 2 -> 3 강화 확률
    3: 40    // 3 -> 4 강화 확률
};

// 강화 비용 설정
const ENHANCEMENT_COST = {
    item: "minecraft:emerald",  // 강화에 필요한 아이템
    count: 1,                   // 필요한 개수
    displayName: "에메랄드"    // 표시될 이름
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
            player.runCommand(`playsound mob.villager.no @s ~ ~ ~ 1 1`);
            return { 
                success: false, 
                message: "§c이미 최대로 강화되었습니다." 
            };
        }

        const inventory = player.getComponent("inventory");
        let hasCostItem = false;
        
        // 강화 비용 아이템 확인
        for (let i = 0; i < inventory.container.size; i++) {
            const slotItem = inventory.container.getItem(i);
            if (slotItem?.typeId === ENHANCEMENT_COST.item && slotItem.amount >= ENHANCEMENT_COST.count) {
                hasCostItem = true;
                break;
            }
        }

        if (!hasCostItem) {
            player.runCommand(`playsound mob.villager.no @s ~ ~ ~ 1 1`);
            return { 
                success: false, 
                message: `§c강화에 필요한 ${ENHANCEMENT_COST.displayName}가 부족합니다. (필요: ${ENHANCEMENT_COST.count}개)` 
            };
        }

        const successChance = ENHANCEMENT_CHANCES[currentLevel];
        const randomValue = Math.random() * 100;

        if (randomValue > successChance) {
            // 실패 시 아이템 제거
            player.runCommand(`clear @s ${ENHANCEMENT_COST.item} 0 ${ENHANCEMENT_COST.count}`);
            player.runCommand(`clear @s ${item.typeId} 0 1`);
            player.runCommand(`playsound random.break @s ~ ~ ~ 1 1`);
            player.runCommand(`playsound mob.wither.death @s ~ ~ ~ 0.5 0.5`);
            return {
                success: false,
                message: `§c강화 실패! 아이템이 파괴되었습니다. (성공확률: ${successChance}%)`
            };
        }

        try {
            const nextLevel = currentLevel + 1;
            const itemConfig = ENHANCEABLE_ITEMS[item.typeId];
            const enchantments = itemConfig.enchantments[nextLevel];

            player.runCommand(`clear @s ${ENHANCEMENT_COST.item} 0 ${ENHANCEMENT_COST.count}`);

            for (const [enchantType, level] of Object.entries(enchantments)) {
                player.runCommand(`enchant @s ${enchantType} ${level}`);
            }
            
            player.runCommand(`playsound random.levelup @s ~ ~ ~ 1 1`);
            player.runCommand(`playsound random.orb @s ~ ~ ~ 1 1`);
            
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
                player.runCommand(`playsound note.bass @s ~ ~ ~ 1 0.5`);  // 낮은 음의 효과음
                player.runCommand(`playsound mob.villager.no @s ~ ~ ~ 1 1`);  // 실패 효과음
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

// 채팅 명령어 이벤트 처리 수정
world.beforeEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    const message = event.message.trim();

    if (message === "!아이템강화") {
        try {
            // 첫 번째 슬롯의 아이템을 가져옴
            const heldItem = getSelectedItem(player); // 수정된 부분
            console.log("현재 슬롯 번호:", player.selectedSlot); // 현재 슬롯 번호 출력

            if (!heldItem) {
                player.sendMessage("§c손에 든 아이템이 없습니다.");
                console.warn("선택된 슬롯에 아이템 없음:", player.selectedSlot);
                return;
            }

            // 강화 가능한 아이템인지 확인
            const itemConfig = ENHANCEABLE_ITEMS[heldItem.typeId];
            if (!itemConfig) {
                player.sendMessage("§c강화할 수 없는 아이템입니다.");
                return; // 강화 불가능한 아이템이면 무시
            }

            // 현재 강화 단계 확인
            const currentLevel = getCurrentLevel(heldItem, itemConfig);
            
            // 4단계인 경우 더 이상 강화 불가
            if (currentLevel >= 4) {
                player.runCommand(`playsound note.bass @s ~ ~ ~ 1 0.5`);  // 낮은 음의 효과음
                player.runCommand(`playsound mob.villager.no @s ~ ~ ~ 1 1`);  // 실패 효과음
                player.sendMessage("§c이미 최대 강화 단계입니다.");
                return;
            }

            // 강화 아이템 확인
            const inventory = player.getComponent("inventory");
            let hasCostItem = false;
            
            for (let i = 0; i < inventory.container.size; i++) {
                const slotItem = inventory.container.getItem(i);
                if (slotItem?.typeId === ENHANCEMENT_COST.item && slotItem.amount >= ENHANCEMENT_COST.count) {
                    hasCostItem = true;
                    break;
                }
            }

            if (!hasCostItem) {
                player.sendMessage(`§c강화에 필요한 ${ENHANCEMENT_COST.displayName}가 부족합니다. (필요: ${ENHANCEMENT_COST.count}개)`);
                return;
            }

            // 아이템 강화 시도
            enhanceItem(heldItem, currentLevel, player).then(result => {
                player.sendMessage(result.message);
            }).catch(error => {
                console.warn("강화 처리 중 오류:", error);
                player.sendMessage("§c강화 중 오류가 발생했습니다.");
            });

        } catch (error) {
            console.warn("아이템 강화 처리 중 오류:", error);
            player.sendMessage("§c강화 중 오류가 발생했습니다.");
        }
    }
});

// 슬롯 번호를 가져오는 함수 수정
function getSelectedItem(player) {
    const inventory = player.getComponent("inventory");
    if (inventory && inventory.container) {
        return inventory.container.getItem(0); // 첫 번째 슬롯의 아이템 반환
    }
    return undefined;
}



