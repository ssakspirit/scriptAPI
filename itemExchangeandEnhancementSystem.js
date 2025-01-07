/*
아이템 교환 및 강화 시스템 v1.0

[ 사용 방법 ]
1. 강화하거나 교체하고 싶은 아이템을 인벤토리의 첫 번째 슬롯에 놓습니다.
2. 채팅창에 '!강화상점' 명령어를 입력합니다.
3. 채팅창이 닫히면 상점 UI가 열립니다.

[ 강화 가능한 아이템 ]
- 검: 나무 → 돌 → 철 → 다이아몬드 → 네더라이트
- 곡괭이: 나무 → 돌 → 철 → 다이아몬드 → 네더라이트
- 도끼: 나무 → 돌 → 철 → 다이아몬드 → 네더라이트

[ 강화 확률 ]
- 나무 → 돌: 100% 성공
- 돌 → 철: 90% 성공
- 철 → 다이아: 70% 성공
- 다이아 → 네더라이트: 50% 성공

[ 다운그레이드 확률 ]
- 모든 다운그레이드: 100% 성공

[ 비용 ]
- 모든 교체/강화: 5 에메랄드

[ 주의사항 ]
1. 강화/교체할 아이템은 반드시 인벤토리의 첫 번째 슬롯에 있어야 합니다.
2. 한 번에 한 단계씩만 강화/다운그레이드가 가능합니다.
3. 강화 실패 시 아이템과 에메랄드가 모두 소멸됩니다.
4. 인챈트된 아이템을 강화/다운그레이드해도 인챈트는 유지됩니다.

[ 예시 ]
- 철검(날카로움 3)을 다이아몬드 검으로 강화 시도 → 성공하면 다이아몬드 검(날카로움 3)
- 다이아몬드 곡괭이(효율 4)를 철 곡괭이로 다운그레이드 → 철 곡괭이(효율 4)
*/

import { world, system } from '@minecraft/server';
import { ModalFormData, ActionFormData } from "@minecraft/server-ui";
// itemEnhancement.js 불러오기
import './Enhancement/itemEnhancement.js';

// 교환 가능한 아이템 그룹 정의
const EXCHANGE_GROUPS = {
    "sword": {
        name: "검",
        items: [
            "minecraft:wooden_sword",
            "minecraft:stone_sword",
            "minecraft:iron_sword",
            "minecraft:diamond_sword",
            "minecraft:netherite_sword"
        ],
        cost: 5  // 에메랄드 비용
    },
    "pickaxe": {
        name: "곡괭이",
        items: [
            "minecraft:wooden_pickaxe",
            "minecraft:stone_pickaxe",
            "minecraft:iron_pickaxe",
            "minecraft:diamond_pickaxe",
            "minecraft:netherite_pickaxe"
        ],
        cost: 5
    },
    "axe": {
        name: "도끼",
        items: [
            "minecraft:wooden_axe",
            "minecraft:stone_axe",
            "minecraft:iron_axe",
            "minecraft:diamond_axe",
            "minecraft:netherite_axe"
        ],
        cost: 5
    }
};

// 아이템 등급별 교체 성공 확률 정의 (%)
const UPGRADE_CHANCES = {
    "wooden": 100,    // 나무 → 돌: 100%
    "stone": 90,      // 돌 → 철: 90%
    "iron": 70,       // 철 → 다이아: 70%
    "diamond": 50     // 다이아 → 네더라이트: 50%
};

const DOWNGRADE_CHANCES = {
    "netherite": 100, // 네더라이트 → 다이아: 100%
    "diamond": 100,   // 다이아 → 철: 100%
    "iron": 100,      // 철 → 돌: 100%
    "stone": 100      // 돌 → 나무: 100%
};

// 아이템 등급 순서 정의
const TIER_ORDER = ["wooden", "stone", "iron", "diamond", "netherite"];

// 아이템 등급 가져오기 함수 수정
function getItemTier(itemId) {
    if (itemId.includes("wooden")) return "wooden";
    if (itemId.includes("stone")) return "stone";
    if (itemId.includes("iron")) return "iron";
    if (itemId.includes("diamond")) return "diamond";
    if (itemId.includes("netherite")) return "netherite";
    return null;
}

// 채팅 명령어로 상점 열기
world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message;
    const player = event.sender;

    if (message === "!강화상점") {
        event.cancel = true;
        player.sendMessage(`§a채팅창을 닫으면 상점이 열립니다.`);
        showExchangeShop(player);
    }
    // 다른 명령어들은 itemEnhancement.js에서 처리되도록 함
});

// 플레이어의 첫 번째 슬롯 아이템 가져오기로 수정
function getHeldItem(player) {
    try {
        const inventory = player.getComponent("inventory");
        if (!inventory) return undefined;
        
        // 첫 번째 슬롯(인덱스 0)의 아이템 반환
        return inventory.container.getItem(0);
    } catch (err) {
        console.warn("getHeldItem 오류:", err);
        return undefined;
    }
}

// 아이템이 속한 그룹 찾기
function findItemGroup(itemId) {
    for (const [groupId, group] of Object.entries(EXCHANGE_GROUPS)) {
        if (group.items.includes(itemId)) {
            return { groupId, group };
        }
    }
    return null;
}

// 강화인지 다운그레이드인지 확인하는 함수 추가
function isUpgrade(currentTier, targetItemId) {
    const currentIndex = TIER_ORDER.indexOf(currentTier);
    const targetTier = getItemTier(targetItemId);
    const targetIndex = TIER_ORDER.indexOf(targetTier);
    return targetIndex > currentIndex;
}

// 아이템의 다음 단계 아이템을 가져오는 함수 추가
function getNextTierItem(currentItemId, itemGroup) {
    const currentTier = getItemTier(currentItemId);
    const currentIndex = TIER_ORDER.indexOf(currentTier);
    const nextTier = TIER_ORDER[currentIndex + 1];
    const prevTier = TIER_ORDER[currentIndex - 1];

    // 같은 그룹의 아이템들 중에서 다음/이전 단계 아이템만 반환
    return itemGroup.items.filter(itemId => {
        const itemTier = getItemTier(itemId);
        return itemTier === nextTier || itemTier === prevTier;
    });
}

// 상점 UI 표시 함수 수정
function showExchangeShop(player) {
    system.runTimeout(() => {
        try {
            const heldItem = getHeldItem(player);
            if (!heldItem) {
                player.sendMessage("§c교체할 아이템을 첫 번째 슬롯에 놓고 상점을 열어주세요.");
                return;
            }

            const itemGroup = findItemGroup(heldItem.typeId);
            if (!itemGroup) {
                player.sendMessage("§c이 아이템은 교체할 수 없습니다.");
                return;
            }

            // 현재 아이템의 다음/이전 단계 아이템만 가져오기
            const availableItems = getNextTierItem(heldItem.typeId, itemGroup.group);
            if (availableItems.length === 0) {
                player.sendMessage("§c더 이상 강화/다운그레이드할 수 없는 아이템입니다.");
                return;
            }

            // UI 생성
            const form = new ActionFormData();
            const currentTier = getItemTier(heldItem.typeId);
            
            form.title("아이템 교환 상점");
            form.body(`현재 아이템: ${heldItem.typeId.replace("minecraft:", "")}\n교체할 아이템을 선택하세요.\n비용: ${itemGroup.group.cost} 에메랄드\n\n§e강화 확률: ${UPGRADE_CHANCES[currentTier] || 100}%\n§e다운그레이드 확률: ${DOWNGRADE_CHANCES[currentTier] || 100}%\n\n§e※ 교체할 아이템은 첫 번째 슬롯에 있어야 합니다.\n§c※ 실패 시 아이템과 에메랄드가 모두 소멸됩니다!`);

            // 가능한 아이템만 버튼으로 추가
            availableItems.forEach(itemId => {
                const itemTier = getItemTier(itemId);
                const isUp = TIER_ORDER.indexOf(itemTier) > TIER_ORDER.indexOf(currentTier);
                form.button(`${isUp ? '§a↑ ' : '§c↓ '}${itemId.replace("minecraft:", "")}`);
            });

            // UI 표시
            form.show(player).then(response => {
                if (response.cancelationReason === "UserBusy") {
                    showExchangeShop(player);
                    return;
                }
                if (response.canceled) {
                    player.sendMessage("§e상점을 닫았습니다.");
                    return;
                }

                // 선택된 아이템으로 교체 시도
                const targetItemId = availableItems[response.selection];
                exchangeItem(player, heldItem, targetItemId, itemGroup.group.cost);
            }).catch(error => {
                console.warn("UI 표시 중 오류:", error);
                player.sendMessage("§c상점 UI를 표시하는 중 오류가 발생했습니다.");
            });
        } catch (error) {
            console.warn("showExchangeShop 오류:", error);
            player.sendMessage("§c상점을 여는 중 오류가 발생했습니다.");
        }
    }, 20);
}

// 아이템 교체 실행
async function exchangeItem(player, currentItem, newItemId, cost) {
    try {
        // 에메랄드 확인
        const hasEmeralds = await player.runCommandAsync(`testfor @s[hasitem={item=emerald,quantity=${cost}}]`);
        if (!hasEmeralds) {
            player.sendMessage(`§c에메랄드가 부족합니다. (필요: ${cost}개)`);
            return;
        }

        // 현재 아이템의 등급 확인
        const currentTier = getItemTier(currentItem.typeId);
        const isUpgrading = isUpgrade(currentTier, newItemId);
        
        // 강화/다운그레이드 확률 선택
        const chance = isUpgrading ? 
            (UPGRADE_CHANCES[currentTier] || 100) : 
            (DOWNGRADE_CHANCES[currentTier] || 100);

        // 성공 여부 결정
        const isSuccess = Math.random() * 100 <= chance;

        if (!isSuccess) {
            const inventory = player.getComponent("inventory");
            if (inventory) {
                inventory.container.setItem(0, undefined);
            }
            await player.runCommandAsync(`clear @s emerald 0 ${cost}`);
            player.sendMessage(`§c${isUpgrading ? '강화' : '다운그레이드'} 실패! 아이템이 파괴되었습니다. (성공 확률: ${chance}%)`);
            return;
        }

        // 인챈트 정보 저장
        const enchantable = currentItem.getComponent("minecraft:enchantable");
        const enchantments = [];
        if (enchantable) {
            const currentEnchants = enchantable.getEnchantments();
            for (const enchant of currentEnchants) {
                enchantments.push({
                    id: enchant.type.id.replace('minecraft:', ''),
                    level: enchant.level
                });
            }
        }

        // 인벤토리에서 직접 아이템 제거
        const inventory = player.getComponent("inventory");
        if (inventory) {
            inventory.container.setItem(0, undefined);
        }

        // 에메랄드 차감
        await player.runCommandAsync(`clear @s emerald 0 ${cost}`);
        
        // 새 아이템 지급
        await player.runCommandAsync(`give @s ${newItemId} 1`);

        // 인챈트 적용
        system.runTimeout(async () => {
            try {
                for (const enchant of enchantments) {
                    await player.runCommandAsync(`enchant @s ${enchant.id} ${enchant.level}`);
                }
                player.sendMessage(`§a${isUpgrading ? '강화' : '다운그레이드'} 성공! (성공 확률: ${chance}%)`);
            } catch (error) {
                console.warn("인챈트 적용 중 오류:", error);
                player.sendMessage("§c인챈트 적용 중 오류가 발생했습니다.");
            }
        }, 5);

    } catch (error) {
        console.warn("아이템 교체 중 오류:", error);
        player.sendMessage("§c아이템 교체 중 오류가 발생했습니다.");
    }
}
