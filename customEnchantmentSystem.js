import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

/**
 * 커스텀 인챈트 시스템 v2.3
 * 
 * [ 사용 방법 ]
 * 1. 기본 사용법
 *    - 네더 스타를 들고 우클릭하여 인챈트 UI를 엽니다
 *    - 인챈트할 아이템을 들고 있어야 합니다
 *    - 인챈트에는 에메랄드가 필요합니다
 * 
 * 2. 인챈트 가능 아이템
 *    - 다이아몬드/네더라이트 검, 도끼: 그리스월드의 저주, 얼음의 유산, 엘사의 격려, 철벽치기, 스티브의 추진력 인챈트 가능
 *    - 다이아몬드/네더라이트 검: 검기, 맹독 인챈트 가능
 *    - 다이아몬드/네더라이트 괭이: 양치기의 분노 인챈트 가능
 *    - 다이아몬드/네더라이트 부츠: 신속/도약 인챈트 가능
 *    - 메이스: 역 반동 점프 인챈트 가능
 * 
 * 3. 인챈트 종류
 *    - 그리스월드의 저주: 보는 방향으로 번개와 폭발을 일으킵니다 (최대 레벨 3)
 *    - 얼음의 유산: 주변 몹에게 슬로우 효과를 주고 눈덩이를 떨어뜨립니다 (최대 레벨 3)
 *    - 엘사의 격려: 주변의 물을 얼음으로 변환합니다 (최대 레벨 3, 쿨타임 없음)
 *    - 양치기의 분노: 주변의 모든 엔티티를 양으로 변환합니다 (최대 레벨 3)
 *    - 신속의 부츠: 이동 속도가 증가합니다 (최대 레벨 3)
 *    - 도약의 부츠: 점프력이 증가합니다 (최대 레벨 2)
 *    - 철벽치기: 주변의 적들을 강력하게 밀쳐냅니다 (최대 레벨 3)
 *    - 스티브의 추진력: 보는 방향으로 빠르게 대쉬합니다 (최대 레벨 3)
 *    - 검기: 바라보는 방향으로 강력한 검기를 발사합니다 (최대 레벨 3)
 *    - 맹독: 타격 시 독 효과를 부여합니다 (최대 레벨 4, 4레벨부터 위더 효과)
 *    - 역 반동 점프: 주변 몹을 앞으로 2칸 끌어오며 자신은 위로 점프합니다 (최대 레벨 3)
 * 
 * 4. 비용 및 위험
 *    - 기본 비용: 인챈트별로 상이 (8~30 에메랄드)
 *    - 레벨이 올라갈 때마다 비용이 증가
 *    - 인챈트 실패 확률: 인챈트별로 상이 (10~40%)
 *    - 아이템 파괴 확률: 10%
 * 
 * 5. 쿨타임 시스템
 *    - 각 스킬형 인챈트는 독립적인 쿨타임을 가집니다
 *    - 쿨타임은 ActionBar에 표시됩니다
 *    - 엘사의 격려는 쿨타임이 없습니다
 *    - 부츠 효과는 3초마다 자동으로 갱신됩니다
 * 
 * [ 새로운 인챈트 추가 방법 ]
 * 1. CUSTOM_ENCHANTS 객체에 새로운 인챈트 추가
 *    예시:
 *    NEW_ENCHANT: {
 *        id: "고유한_아이디",              // 다른 인챈트와 겹치지 않는 고유 ID (영문)
 *        name: "인챈트 이름",              // 게임에 표시될 이름 (한글 가능)
 *        description: "인챈트 설명",        // 효과 설명
 *        baseCost: 10,                    // 기본 비용 (에메랄드)
 *        costIncrease: 5,                 // 레벨당 비용 증가량
 *        baseSuccessChance: 0.7,          // 기본 성공 확률 (70%)
 *        levelPenalty: 0.1,               // 레벨당 성공 확률 감소율 (10%)
 *        maxLevel: 3,                     // 최대 레벨
 *        cooldown: 10,                    // 쿨타임 (초) - 스킬형 인챈트만 필요
 *        allowedItems: ["minecraft:검_ID"] // 적용 가능한 아이템 목록
 *    }
 * 
 * 2. 효과 구현하기
 *    A) 지속형 효과 (예: 부츠 효과)
 *       - system.runInterval 내부의 효과 적용 부분에 새로운 효과 추가
 *       - 기존 신속/도약 부츠 코드를 참고하여 작성
 * 
 *    B) 스킬형 효과 (예: 번개/얼음/양 변환 효과)
 *       - world.beforeEvents.itemUse.subscribe 내부에 새로운 효과 추가
 *       - 다음 단계로 구현:
 *         1) lore에서 인챈트 확인: line.includes(CUSTOM_ENCHANTS.새로운_인챈트.id)
 *         2) 레벨 파싱: parseInt(line.split("_").pop())
 *         3) 쿨타임 체크: if (!isOnCooldown(player, "새로운_인챈트"))
 *         4) 효과 구현: player.runCommandAsync() 등으로 효과 적용
 *         5) 쿨타임 시작: startCooldown(player, "새로운_인챈트")
 *         6) 이벤트 취소: shouldCancelEvent = true
 * 
 * [ 효과 구현 예시 ]
 * 1. 명령어로 효과 구현
 *    - 효과 부여: player.runCommandAsync(`effect @s 효과_ID 지속시간 레벨 true`);
 *    - 엔티티 소환: player.runCommandAsync(`summon 엔티티_ID ~ ~ ~`);
 *    - 블록 변경: player.runCommandAsync(`fill ~-범위 ~-범위 ~-범위 ~범위 ~범위 ~범위 블록_ID`);
 *    - 엔티티 이동: player.runCommandAsync(`tp @e[type=타입,r=범위] x y z`);
 * 
 * 2. API로 효과 구현
 *    - 폭발: player.dimension.createExplosion(위치, 범위, 옵션);
 *    - 파티클: player.runCommandAsync(`particle 파티클_ID ~ ~ ~`);
 *    - 시선 방향: player.getViewDirection()
 *    - 넉백: player.applyKnockback(x, z, 수평강도, 수직강도)
 * 
 * [ 주의 사항 ]
 * - 인챈트 실패 시 에메랄드는 소모됩니다
 * - 아이템 파괴 시 복구할 수 없습니다
 * - 한 아이템에는 하나의 커스텀 인챈트만 적용 가능합니다
 * - 각 인챈트의 쿨타임은 독립적으로 작동합니다
 */

// 쿨타임 관리를 위한 클래스
class CooldownManager {
    constructor() {
        this.cooldowns = new Map();
    }

    // 쿨타임 시작
    startCooldown(player, enchantId) {
        const key = `${player.name}-${enchantId}`;
        const cooldownTime = CUSTOM_ENCHANTS[enchantId].cooldown;
        if (!cooldownTime) return; // 쿨타임이 없는 인챈트는 무시

        this.cooldowns.set(key, {
            endTime: Date.now() + (cooldownTime * 1000),
            enchantId: enchantId
        });
    }

    // 쿨타임 체크
    isOnCooldown(player, enchantId) {
        const key = `${player.name}-${enchantId}`;
        const cooldownInfo = this.cooldowns.get(key);

        if (cooldownInfo && cooldownInfo.endTime > Date.now()) {
            return true;
        }

        if (cooldownInfo) {
            this.cooldowns.delete(key); // 만료된 쿨타임 제거
        }
        return false;
    }

    // 특정 플레이어의 모든 쿨타임 정보 가져오기
    getPlayerCooldowns(player) {
        return Array.from(this.cooldowns.entries())
            .filter(([key]) => key.startsWith(player.name))
            .map(([key, value]) => {
                const remainingTime = Math.ceil((value.endTime - Date.now()) / 1000);
                if (remainingTime <= 0) {
                    this.cooldowns.delete(key);
                    return null;
                }
                return {
                    enchantId: value.enchantId,
                    remainingTime: remainingTime
                };
            })
            .filter(info => info !== null);
    }

    // 특정 플레이어의 특정 인챈트 남은 시간 가져오기
    getRemainingTime(player, enchantId) {
        const key = `${player.name}-${enchantId}`;
        const cooldownInfo = this.cooldowns.get(key);

        if (cooldownInfo && cooldownInfo.endTime > Date.now()) {
            return Math.ceil((cooldownInfo.endTime - Date.now()) / 1000);
        }
        return 0;
    }
}

// 쿨타임 매니저 인스턴스 생성
const cooldownManager = new CooldownManager();

// 커스텀 인챈트 설정
const ENCHANT_CONFIG = {
    ENCHANT_ITEM: "minecraft:nether_star",    // 인챈트 UI를 열 아이템
    MAX_LEVEL: 5,                             // 최대 인챈트 레벨
    BREAK_CHANCE: 0.1                         // 실패 시 아이템 파괴 확률 (10%)
};

// 커스텀 인챈트 정의
const CUSTOM_ENCHANTS = {
    LIGHTNING_STRIKE: {
        id: "griswolds_curse",
        name: "그리스월드의 저주",
        description: "보는 방향으로 번개와 폭발을 일으킵니다",
        baseCost: 10,                         // 기본 비용
        costIncrease: 8,                      // 레벨당 비용 증가량
        baseSuccessChance: 0.75,              // 1레벨 성공 확률 (75%)
        levelPenalty: 0.2,                    // 레벨당 성공 확률 감소율 (20%)
        maxLevel: 3,
        cooldown: 10,
        allowedItems: ["minecraft:diamond_sword", "minecraft:netherite_sword", "minecraft:diamond_axe", "minecraft:netherite_axe"]
    },
    SHEPHERDS_RAGE: {
        id: "shepherds_rage",
        name: "양치기의 분노",
        description: "주변의 모든 엔티티를 양으로 변환합니다",
        baseCost: 15,
        costIncrease: 10,                     // 더 높은 비용 증가
        baseSuccessChance: 0.7,               // 더 낮은 기본 성공률
        levelPenalty: 0.15,
        maxLevel: 3,
        cooldown: 20,
        allowedItems: ["minecraft:diamond_hoe", "minecraft:netherite_hoe"]
    },
    ICE_ASPECT: {
        id: "ice_legacy",
        name: "얼음의 유산",
        description: "주변 몹에게 슬로우 효과를 주고 눈덩이를 떨어뜨립니다",
        baseCost: 8,
        costIncrease: 6,
        baseSuccessChance: 0.85,              // 더 높은 기본 성공률
        levelPenalty: 0.1,                    // 더 낮은 페널티
        maxLevel: 3,
        cooldown: 15,
        allowedItems: ["minecraft:diamond_sword", "minecraft:netherite_sword", "minecraft:diamond_axe", "minecraft:netherite_axe"]
    },
    ELSA_ENCOURAGEMENT: {
        id: "elsa_encouragement",
        name: "엘사의 격려",
        description: "주변의 물을 얼음으로 변환합니다",
        baseCost: 12,
        costIncrease: 7,
        baseSuccessChance: 0.8,
        levelPenalty: 0.15,
        maxLevel: 3,
        allowedItems: ["minecraft:diamond_sword", "minecraft:netherite_sword", "minecraft:diamond_axe", "minecraft:netherite_axe"]
    },
    SPEED_BOOST: {
        id: "speed_boots",
        name: "신속의 부츠",
        description: "이동 속도가 증가합니다",
        baseCost: 8,
        costIncrease: 5,
        baseSuccessChance: 0.9,               // 매우 높은 기본 성공률
        levelPenalty: 0.1,                    // 낮은 페널티
        maxLevel: 3,
        allowedItems: ["minecraft:diamond_boots", "minecraft:netherite_boots"]
    },
    JUMP_BOOST: {
        id: "jump_boots",
        name: "도약의 부츠",
        description: "점프력이 증가합니다",
        baseCost: 8,
        costIncrease: 5,
        baseSuccessChance: 0.9,               // 매우 높은 기본 성공률
        levelPenalty: 0.1,                    // 낮은 페널티
        maxLevel: 2,
        allowedItems: ["minecraft:diamond_boots", "minecraft:netherite_boots"]
    },
    IRON_WALL: {
        id: "iron_wall",
        name: "철벽치기",
        description: "주변의 적들을 강력하게 밀쳐냅니다",
        baseCost: 12,
        costIncrease: 8,                      // 높은 비용 증가
        baseSuccessChance: 0.8,               // 중간 성공률
        levelPenalty: 0.15,                   // 중간 페널티
        maxLevel: 3,
        cooldown: 3,
        allowedItems: ["minecraft:diamond_sword", "minecraft:netherite_sword", "minecraft:diamond_axe", "minecraft:netherite_axe"]
    },
    STEVE_DASH: {
        id: "steve_dash",
        name: "스티브의 추진력",
        description: "보는 방향으로 빠르게 대쉬합니다",
        baseCost: 10,
        costIncrease: 7,                      // 중간 비용 증가
        baseSuccessChance: 0.85,              // 높은 성공률
        levelPenalty: 0.12,                   // 낮은-중간 페널티
        maxLevel: 3,
        allowedItems: ["minecraft:diamond_sword", "minecraft:netherite_sword", "minecraft:diamond_axe", "minecraft:netherite_axe"]
    },
    SWORD_WAVE: {
        id: "sword_wave",
        name: "검기",
        description: "바라보는 방향으로 강력한 검기를 발사합니다",
        baseCost: 15,                         // 1레벨 비용: 15 에메랄드
        costIncrease: 20,                     // 레벨당 20 에메랄드 증가
        baseSuccessChance: 0.6,               // 1레벨 성공 확률: 60%
        levelPenalty: 0.2,                    // 레벨당 20% 감소
        maxLevel: 3,
        cooldown: 7,
        allowedItems: ["minecraft:diamond_sword", "minecraft:netherite_sword"]
    },
    DEADLY_POISON: {
        id: "deadly_poison",
        name: "맹독",
        description: "타격 시 독 효과를 부여합니다",
        baseCost: 20,                         // 1레벨 비용: 20 에메랄드
        costIncrease: 5,                     // 레벨당 5 에메랄드 증가
        baseSuccessChance: 0.7,               // 1레벨 성공 확률: 70%
        levelPenalty: 0.5,                   // 레벨당 5% 감소
        maxLevel: 4,
        allowedItems: ["minecraft:diamond_sword", "minecraft:netherite_sword"]
    },
    REVERSE_JUMP: {
        id: "reverse_jump",
        name: "역 반동 점프",
        description: "우클릭시 주변 모든 몹을 앞으로 2칸 끌고 오며 자신은 위로 +5칸 올라간다",
        baseCost: 30,
        costIncrease: 30,
        baseSuccessChance: 0.6,
        levelPenalty: 0.2,
        maxLevel: 3,
        cooldown: 9,
        allowedItems: ["minecraft:mace"]
    }
};

// 기존의 isOnCooldown과 startCooldown 함수를 새로운 매니저를 사용하도록 수정
function isOnCooldown(player, enchantId) {
    return cooldownManager.isOnCooldown(player, enchantId);
}

function startCooldown(player, enchantId) {
    cooldownManager.startCooldown(player, enchantId);
}

// 쿨타임 표시 시스템 수정 (0.5초마다 갱신)
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const activeCooldowns = cooldownManager.getPlayerCooldowns(player);

        if (activeCooldowns.length > 0) {
            const cooldownTexts = activeCooldowns.map(cooldown => {
                const enchant = CUSTOM_ENCHANTS[cooldown.enchantId];
                return `§b${enchant.name}: §f${cooldown.remainingTime}초`;
            });

            const actionBarText = cooldownTexts.join(" §7| ");
            player.onScreenDisplay.setActionBar(actionBarText);
        }
    }
}, 10);

// 이벤트 처리
world.afterEvents.itemUse.subscribe((data) => {
    const item = data.itemStack;
    const player = data.source;

    if (item.typeId === ENCHANT_CONFIG.ENCHANT_ITEM) {
        showEnchantUI(player);
    }
});

// 인챈트 UI 표시
function showEnchantUI(player) {
    try {
        const inventory = player.getComponent("inventory").container;
        const enchantableItems = [];

        // 인벤토리의 모든 슬롯을 확인하여 인챈트 가능한 아이템 찾기
        for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i);
            if (!item) continue;

            // 아이템이 인챈트 가능한지 확인
            const availableEnchants = Object.values(CUSTOM_ENCHANTS).filter(enchant =>
                enchant.allowedItems.includes(item.typeId)
            );

            if (availableEnchants.length > 0) {
                enchantableItems.push({
                    slot: i,
                    item: item,
                    enchants: availableEnchants
                });
            }
        }

        if (enchantableItems.length === 0) {
            // 인챈트 가능한 아이템 목록 생성
            const enchantableItemsList = Object.values(CUSTOM_ENCHANTS).reduce((acc, enchant) => {
                enchant.allowedItems.forEach(itemId => {
                    const itemName = itemId.split(":")[1].replace(/_/g, " ");
                    if (!acc.includes(itemName)) {
                        acc.push(itemName);
                    }
                });
                return acc;
            }, []);

            player.sendMessage(
                "§c인벤토리에 인챈트 가능한 아이템이 없습니다.\n" +
                "§e인챈트 가능한 아이템 목록:\n§7- " +
                enchantableItemsList.join("\n§7- ")
            );
            return;
        }

        const formData = new ActionFormData()
            .title("인챈트할 아이템 선택")
            .body("인챈트할 아이템을 선택하세요.");

        enchantableItems.forEach(({ item, enchants }) => {
            const itemName = item.nameTag || item.typeId.split(":")[1].replace(/_/g, " ");
            formData.button(
                `${itemName}\n§7적용 가능한 인챈트: ${enchants.length}개`
            );
        });

        formData.show(player).then(response => {
            if (response.canceled) return;

            const selectedItem = enchantableItems[response.selection];
            showEnchantTypeUI(player, selectedItem.item, selectedItem.enchants, selectedItem.slot);
        });
    } catch (error) {
        console.warn("UI 표시 중 오류:", error);
        player.sendMessage("§c오류가 발생했습니다. 다시 시도해주세요.");
    }
}

// 인챈트 종류 선택 UI
function showEnchantTypeUI(player, item, availableEnchants, slot) {
    const formData = new ActionFormData()
        .title("인챈트 선택")
        .body("적용할 인챈트를 선택하세요.");

    availableEnchants.forEach(enchant => {
        formData.button(
            `${enchant.name}\n§7${enchant.description}\n§e기본 비용: ${enchant.baseCost}에메랄드`
        );
    });

    formData.show(player).then(response => {
        if (response.canceled) {
            showEnchantUI(player);
            return;
        }

        const selectedEnchant = availableEnchants[response.selection];
        showEnchantLevelUI(player, item, selectedEnchant, slot);
    });
}

// 인챈트 레벨 선택 UI
function showEnchantLevelUI(player, item, enchant, slot) {
    const formData = new ModalFormData()
        .title(`${enchant.name} 레벨 선택`)
        .slider(
            `§7${enchant.description}\n\n인챈트 레벨을 선택하세요:`,
            1,
            enchant.maxLevel,
            1
        );

    formData.show(player).then(({ formValues, canceled }) => {
        if (canceled) {
            showEnchantUI(player);
            return;
        }

        const level = formValues[0];
        applyEnchant(player, item, enchant, level, slot);
    });
}

// 인챈트 적용
function applyEnchant(player, item, enchant, level, slot) {
    try {
        const inventory = player.getComponent("inventory").container;
        const cost = enchant.baseCost + (enchant.costIncrease * (level - 1));

        // 에메랄드 수량 확인
        let emeraldCount = 0;
        for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i);
            if (item?.typeId === "minecraft:emerald") {
                emeraldCount += item.amount;
            }
        }

        // 에메랄드가 부족한 경우
        if (emeraldCount < cost) {
            player.sendMessage(`§c에메랄드가 부족합니다. §e(필요: ${cost}개, 보유: ${emeraldCount}개)`);
            return;
        }

        // 레벨별 성공 확률 계산
        const successChance = Math.max(0.05, enchant.baseSuccessChance - (enchant.levelPenalty * (level - 1)));
        const random = Math.random();
        
        // 성공 확률과 비용 표시
        player.sendMessage(`§e${enchant.name} 인챈트 시도 중...\n§f- 성공 확률: §a${Math.round(successChance * 100)}%\n§f- 비용: §6${cost}에메랄드`);

        if (random > successChance) {
            // 실패
            player.runCommandAsync(`clear @s emerald 0 ${cost}`);

            if (random < ENCHANT_CONFIG.BREAK_CHANCE) {
                // 아이템 파괴
                inventory.setItem(slot, undefined);
                player.sendMessage("§c인챈트 실패! 아이템이 파괴되었습니다.");
            } else {
                player.sendMessage("§c인챈트 실패! 에메랄드만 소모되었습니다.");
            }
            return;
        }

        try {
            // 현재 슬롯의 아이템 다시 확인
            const currentItem = inventory.getItem(slot);
            if (!currentItem || currentItem.typeId !== item.typeId) {
                player.sendMessage("§c아이템이 변경되었습니다. 다시 시도해주세요.");
                return;
            }

            // 에메랄드 차감
            player.runCommandAsync(`clear @s emerald 0 ${cost}`);

            // 기존 로어 가져오기
            const existingLore = currentItem.getLore() || [];

            // 같은 인챈트가 있는지 확인하고, 있다면 레벨 비교
            const existingEnchantLine = existingLore.find(line => line.includes(enchant.id));
            if (existingEnchantLine) {
                const existingLevel = parseInt(existingEnchantLine.split("_").pop());
                if (level <= existingLevel) {
                    player.sendMessage(`§c이미 더 높거나 같은 레벨의 ${enchant.name} 인챈트가 적용되어 있습니다.`);
                    return;
                }
                // 기존 인챈트 관련 로어 제거
                const enchantIndex = existingLore.findIndex(line => line.includes(enchant.id));
                existingLore.splice(enchantIndex - 2, 3); // 설명, 레벨, ID 3줄 제거
            }

            // 아이템 이름 업데이트 (기존 인챈트 이름 제거 후 새로 추가)
            let newName = currentItem.nameTag || item.typeId.split(":")[1].replace(/_/g, " ");
            newName = newName.replace(new RegExp(`\\+ ${enchant.name} \\d+`, 'g'), '').trim();
            newName = `${newName} + ${enchant.name} ${level}`;
            currentItem.nameTag = newName;

            // 새 인챈트 로어 추가
            existingLore.push(
                `§7${enchant.description}`,
                `§e레벨: ${level}`,
                `${enchant.id}_${level}`
            );

            currentItem.setLore(existingLore);

            // 수정된 아이템을 동일한 슬롯에 저장
            inventory.setItem(slot, currentItem);

            player.sendMessage(`§a인챈트 성공! ${enchant.name} ${level}이(가) 추가되었습니다.`);
        } catch (error) {
            console.warn("아이템 적용 중 오류:", error);
            player.sendMessage("§c아이템 적용 중 오류가 발생했습니다.");
        }
    } catch (error) {
        console.warn("인챈트 적용 중 오류:", error);
        player.sendMessage("§c오류가 발생했습니다. 다시 시도해주세요.");
    }
}

// 인챈트 스킬 효과 처리
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;

    if (!item) return;

    try {
        const lore = item.getLore();
        let shouldCancelEvent = false;

        // 그리스월드의 저주 효과
        const lightningLine = lore.find(line => line.includes(CUSTOM_ENCHANTS.LIGHTNING_STRIKE.id));
        if (lightningLine) {
            const level = parseInt(lightningLine.split("_").pop());

            // 쿨타임 체크
            if (!isOnCooldown(player, "LIGHTNING_STRIKE")) {
                // 플레이어의 시선 방향으로 스킬 발동 (거리 8블록으로 증가)
                const viewDirection = player.getViewDirection();
                const targetPos = {
                    x: player.location.x + viewDirection.x * 8,
                    y: player.location.y + viewDirection.y * 8,
                    z: player.location.z + viewDirection.z * 8
                };

                // 번개 소환 및 폭발 (레벨에 따라 강화, 폭발 범위 감소)
                player.runCommandAsync(`summon lightning_bolt ${targetPos.x} ${targetPos.y} ${targetPos.z}`);
                system.runTimeout(() => {
                    player.dimension.createExplosion(targetPos, 0.5 + (level * 0.5), {
                        breaksBlocks: false,
                        causesFire: false
                    });
                }, 10);

                startCooldown(player, "LIGHTNING_STRIKE");
                shouldCancelEvent = true;
            }
        }

        // 얼음의 유산  효과
        const iceLine = lore.find(line => line.includes(CUSTOM_ENCHANTS.ICE_ASPECT.id));
        if (iceLine) {
            const level = parseInt(iceLine.split("_").pop());

            // 쿨타임 체크
            if (!isOnCooldown(player, "ICE_ASPECT")) {
                // 주변 몹들에게 슬로우 효과 (레벨에 따라 강화)
                player.runCommandAsync(`effect @e[type=!player,r=10] slowness ${5 + level * 2} ${level} true`);

                // 플레이어의 시선 방향으로 눈덩이 소환
                const viewDirection = player.getViewDirection();
                const spawnDistance = 3;
                const spawnHeight = 5;

                const basePos = {
                    x: player.location.x + (viewDirection.x * spawnDistance),
                    y: player.location.y + spawnHeight,
                    z: player.location.z + (viewDirection.z * spawnDistance)
                };

                // 3x3 패턴으로 눈덩이 소환
                const offsets = [
                    { x: 0, z: 0 }, { x: 1, z: 0 }, { x: -1, z: 0 },
                    { x: 0, z: 1 }, { x: 0, z: -1 }, { x: 1, z: 1 },
                    { x: -1, z: -1 }, { x: 1, z: -1 }, { x: -1, z: 1 }
                ];

                offsets.forEach(offset => {
                    const pos = {
                        x: basePos.x + offset.x,
                        y: basePos.y,
                        z: basePos.z + offset.z
                    };
                    player.runCommandAsync(`summon snowball ${pos.x.toFixed(1)} ${pos.y.toFixed(1)} ${pos.z.toFixed(1)}`);
                });

                startCooldown(player, "ICE_ASPECT");
                shouldCancelEvent = true;
            }
        }

        // 엘사의 격려 효과
        const elsaLine = lore.find(line => line.includes(CUSTOM_ENCHANTS.ELSA_ENCOURAGEMENT.id));
        if (elsaLine) {
            const level = parseInt(elsaLine.split("_").pop());

            // 레벨에 따라 범위 증가 (3/4/5 블록)
            const radius = 2 + level;

            // 주변의 물 블록을 얼음으로 변환
            player.runCommandAsync(`fill ~-${radius} ~-1 ~-${radius} ~${radius} ~1 ~${radius} minecraft:ice [] replace minecraft:water`);
            player.runCommandAsync(`fill ~-${radius} ~-1 ~-${radius} ~${radius} ~1 ~${radius} minecraft:ice [] replace minecraft:flowing_water`);

            // 파티클 효과 추가 (플레이어 위치에 눈꽃 파티클)
            for (let i = 0; i < 20; i++) {
                player.runCommandAsync(`particle minecraft:snowflake_particle ~ ~ ~`);
            }

            shouldCancelEvent = true;
        }

        // 양치기의 분노 효과
        const shepherdLine = lore.find(line => line.includes(CUSTOM_ENCHANTS.SHEPHERDS_RAGE.id));
        if (shepherdLine) {
            const level = parseInt(shepherdLine.split("_").pop());

            // 쿨타임 체크
            if (!isOnCooldown(player, "SHEPHERDS_RAGE")) {
                // 레벨에 따라 범위 증가 (5/7/10 블록)
                const radius = 3 + (level * 2);

                // 주변 엔티티를 양으로 변환 (플레이어 제외)
                player.runCommandAsync(`execute as @e[type=!player,type=!sheep,r=${radius}] at @s run summon sheep ~ ~ ~`);
                player.runCommandAsync(`execute as @e[type=!player,type=!sheep,r=${radius}] at @s run particle minecraft:heart_particle ~ ~1 ~`);
                player.runCommandAsync(`kill @e[type=!player,type=!sheep,r=${radius}]`);

                // 파티클 효과
                for (let i = 0; i < 30; i++) {
                    player.runCommandAsync(`particle minecraft:heart_particle ~ ~1 ~`);
                }

                startCooldown(player, "SHEPHERDS_RAGE");
                shouldCancelEvent = true;
            }
        }

        // 철벽치기 효과
        const ironWallLine = lore.find(line => line.includes(CUSTOM_ENCHANTS.IRON_WALL.id));
        if (ironWallLine) {
            const level = parseInt(ironWallLine.split("_").pop());

            // 쿨타임 체크
            if (!isOnCooldown(player, "IRON_WALL")) {
                system.run(() => {
                    // 레벨에 따라 효과 증가
                    const range = 5 + (level * 2);      // 범위: 7/9/11 블록
                    const power = 2 + (level * 0.5);    // 넉백 세기: 2.5/3/3.5
                    const height = 0.5 + (level * 0.2); // 위로 뜨는 힘: 0.7/0.9/1.1

                    const dimension = world.getDimension("overworld");
                    const loc = player.location;

                    // 파티클 효과
                    for (let i = 0; i < 360; i += 15) {
                        const angle = i * Math.PI / 180;
                        const px = loc.x + Math.cos(angle) * 2;
                        const pz = loc.z + Math.sin(angle) * 2;
                        dimension.runCommand(`particle minecraft:large_explosion ${px} ${loc.y} ${pz}`);
                    }

                    // 주변 엔티티에 넉백 적용
                    for (const entity of dimension.getEntities({
                        location: loc,
                        maxDistance: range,
                        excludeNames: [player.name]
                    })) {
                        try {
                            // 먼저 엔티티가 플레이어를 바라보게 함
                            entity.lookAt(loc);

                            // 엔티티의 새로운 방향을 가져옴
                            const { x, z } = entity.getViewDirection();

                            // 넉백 적용
                            entity.applyKnockback(-x, -z, power, height);

                            // 넉백된 엔티티 위치에 파티클
                            const eLoc = entity.location;
                            dimension.runCommand(`particle minecraft:critical_hit_emitter ${eLoc.x} ${eLoc.y + 1} ${eLoc.z}`);
                        } catch (error) {
                            continue;
                        }
                    }

                    // 사운드 효과
                    dimension.runCommand(`playsound mob.enderdragon.hit @a ${loc.x} ${loc.y} ${loc.z} 1 1`);
                });

                startCooldown(player, "IRON_WALL");
                shouldCancelEvent = true;
            }
        }

        // 스티브의 추진력 효과
        const dashLine = lore.find(line => line.includes(CUSTOM_ENCHANTS.STEVE_DASH.id));
        if (dashLine) {
            const level = parseInt(dashLine.split("_").pop());

            // 레벨에 따른 대쉬 강도 설정
            const forwardPower = 3 + (level * 2);    // 레벨당 2씩 증가 (5/7/9)
            const upwardPower = 0.3 + (level * 0.2); // 레벨당 0.2씩 증가 (0.5/0.7/0.9)

            system.run(() => {
                const dimension = world.getDimension("overworld");
                const direction = player.getViewDirection();

                // 대쉬 적용
                player.applyKnockback(
                    direction.x,
                    direction.z,
                    forwardPower,
                    upwardPower
                );

                // 파티클 효과 (플레이어를 따라다니도록)
                let tickCount = 0;
                const particleInterval = system.runInterval(() => {
                    const currentPos = player.location;
                    // 플레이어 주변에 여러 개의 파티클 생성
                    for (let i = 0; i < 3; i++) {
                        const offset = Math.random() * 0.5 - 0.25;
                        dimension.runCommand(
                            `particle minecraft:dragon_breath_trail ` +
                            `${currentPos.x + offset} ${currentPos.y + 0.5} ${currentPos.z + offset}`
                        );
                    }
                    tickCount++;

                    // 20틱(1초) 동안 파티클 생성
                    if (tickCount >= 20) {
                        system.clearRun(particleInterval);
                    }
                }, 1);

                // 사운드 효과
                dimension.runCommand(`playsound mob.phantom.swoop @a ${player.location.x} ${player.location.y} ${player.location.z} 1 1`);
            });

            shouldCancelEvent = true;
        }

        // 검기 효과
        const swordWaveLine = lore.find(line => line.includes(CUSTOM_ENCHANTS.SWORD_WAVE.id));
        if (swordWaveLine) {
            const level = parseInt(swordWaveLine.split("_").pop());

            // 쿨타임 체크
            if (!isOnCooldown(player, "SWORD_WAVE")) {
                system.run(() => {
                    const dimension = world.getDimension("overworld");
                    const viewDirection = player.getViewDirection();
                    const loc = player.location;
                    
                    const range = 5 + level;           // 사거리: 5/6/7 블록
                    const damage = 5 + level;          // 데미지: 5/6/7
                    const width = 1;                   // 검기 양쪽으로 1블록씩 (총 3블록 너비)

                    // 수직 방향 계산 (데미지 판정에도 사용되므로 미리 계산)
                    const perpX = viewDirection.z;
                    const perpZ = -viewDirection.x;

                    // 검기 파티클 효과
                    for (let dist = 0; dist <= range; dist += 0.5) {
                        const x = loc.x + (viewDirection.x * dist);
                        const y = loc.y + 1;  // 플레이어 눈높이
                        const z = loc.z + (viewDirection.z * dist);

                        // 중앙선
                        dimension.runCommand(`particle minecraft:critical_hit_emitter ${x} ${y} ${z}`);

                        // 양쪽 파티클
                        for (let w = 1; w <= width; w++) {
                            // 왼쪽
                            dimension.runCommand(
                                `particle minecraft:critical_hit_emitter ${x + (perpX * w)} ${y} ${z + (perpZ * w)}`
                            );
                            // 오른쪽
                            dimension.runCommand(
                                `particle minecraft:critical_hit_emitter ${x - (perpX * w)} ${y} ${z - (perpZ * w)}`
                            );
                        }
                    }

                    // 데미지 적용 (중앙, 왼쪽, 오른쪽)
                    // 중앙 라인 데미지
                    dimension.runCommand(
                        `damage @e[type=!minecraft:item,name=!${player.name},x=${loc.x},y=${loc.y},z=${loc.z},` +
                        `dx=${viewDirection.x * range},dy=2,dz=${viewDirection.z * range}] ${damage} entity_attack`
                    );

                    // 왼쪽 라인 데미지
                    dimension.runCommand(
                        `damage @e[type=!minecraft:item,name=!${player.name},x=${loc.x + perpX},y=${loc.y},z=${loc.z + perpZ},` +
                        `dx=${viewDirection.x * range},dy=2,dz=${viewDirection.z * range}] ${damage} entity_attack`
                    );

                    // 오른쪽 라인 데미지
                    dimension.runCommand(
                        `damage @e[type=!minecraft:item,name=!${player.name},x=${loc.x - perpX},y=${loc.y},z=${loc.z - perpZ},` +
                        `dx=${viewDirection.x * range},dy=2,dz=${viewDirection.z * range}] ${damage} entity_attack`
                    );

                    // 사운드 효과
                    dimension.runCommand(
                        `playsound item.trident.throw @a ${loc.x} ${loc.y} ${loc.z} 1 0.5`
                    );
                });

                startCooldown(player, "SWORD_WAVE");
                shouldCancelEvent = true;
            }
        }

        // 맹독 효과
        const poisonLine = lore.find(line => line.includes(CUSTOM_ENCHANTS.DEADLY_POISON.id));
        if (poisonLine) {
            try {
                // 디버깅: 타격된 엔티티 정보
                console.warn(`타격된 엔티티 정보: ${hitEntity.typeId}`);
                
                // 디버깅: 위더 효과 명령어 실행
                const effectCommand = "effect @s wither 4 1";
                console.warn(`실행할 명령어: ${effectCommand}`);
                
                // 위더 효과 적용
                hitEntity.dimension.runCommand(effectCommand);
                console.warn("위더 효과 적용 완료");
                
                // 파티클 효과
                const loc = hitEntity.location;
                hitEntity.dimension.runCommand(`particle minecraft:large_smoke ~ ~1 ~`);
                console.warn("파티클 효과 적용 완료");
                
                // 사운드 효과
                hitEntity.dimension.runCommand(`playsound mob.wither.shoot @a ~ ~ ~ 0.3 1.5`);
                console.warn("사운드 효과 적용 완료");
                
            } catch (error) {
                // 오류 메시지를 문자열로 변환하여 출력
                const errorMessage = typeof error === 'string' ? error : error.message || '알 수 없는 오류';
                console.warn(`맹독 효과 처리 중 오류 발생: ${errorMessage}`);
            }
        }

        // 역 반동 점프 인챈트 처리
        const reverseLine = lore.find(line => line.includes(CUSTOM_ENCHANTS.REVERSE_JUMP.id));
        if (reverseLine) {
            try {
                const level = parseInt(reverseLine.split("_").pop());            
                // 쿨타임 체크
                if (!isOnCooldown(player, 'REVERSE_JUMP')) {
                    system.run(() => {
                        const loc = player.location;
                        const jumpHeight = 5 + (level - 1);  // 기본 5블록 + 레벨당 1블록 추가
                        const viewDirection = player.getViewDirection();
                        // 플레이어 앞 2칸 위치 계산
                        const targetX = loc.x + (viewDirection.x * 2);
                        const targetZ = loc.z + (viewDirection.z * 2);
                        
                        // 주변 몹들을 플레이어 앞으로 끌어당기기
                        player.runCommandAsync(`tp @e[type=!player,type=!item,r=10,name=!${player.name}] ${targetX} ${loc.y} ${targetZ}`);
                        
                        // 플레이어를 위로 점프시키기
                        player.applyKnockback(0, 0, 0, jumpHeight * 0.2);
                        
                        // 파티클 효과
                        player.runCommandAsync(`particle minecraft:dragon_breath_trail ~ ~ ~`);
                        
                        // 사운드 효과
                        player.runCommandAsync(`playsound item.trident.return @a ~ ~ ~ 1 0.5`);

                        // 쿨타임 설정 (9초)
                        startCooldown(player, 'REVERSE_JUMP');
                    });
                    shouldCancelEvent = true;
                }
            } catch (error) {
                console.warn(`역 반동 점프 처리 중 오류: ${error.message}`);
            }
        }


        // 모든 효과 처리 후 이벤트 취소 여부 결정
        if (shouldCancelEvent) {
            event.cancel = true;
        }
    } catch (error) {
        console.warn("스킬 효과 처리 중 오류:", error);
    }
});

// 인챈트 효과 적용 (3초마다 갱신)
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const armor = player.getComponent("equippable");

        const boots = armor.getEquipment("Feet");
        if (boots) {
            const lore = boots.getLore();
            // 신속의 부츠 효과
            if (lore.some(line => line.includes(CUSTOM_ENCHANTS.SPEED_BOOST.id))) {
                const level = parseInt(lore.find(line => line.includes(CUSTOM_ENCHANTS.SPEED_BOOST.id)).split("_").pop());
                player.runCommandAsync(`effect @s speed ${level * 3} ${level - 1} true`);
            }
            // 도약의 부츠 효과
            if (lore.some(line => line.includes(CUSTOM_ENCHANTS.JUMP_BOOST.id))) {
                const level = parseInt(lore.find(line => line.includes(CUSTOM_ENCHANTS.JUMP_BOOST.id)).split("_").pop());
                player.runCommandAsync(`effect @s jump_boost ${level * 3} ${level - 1} true`);
            }
        }
    }
}, 60); // 3초마다 효과 갱신 

// 플레이어의 현재 들고 있는 아이템을 가져오는 함수
function getItem(player) {
    try {
        const inventory = player.getComponent("inventory");
        const selectedSlot = player.selectedSlotIndex;
        const item = inventory.container.getItem(selectedSlot);
        return item;
    } catch (err) {
        return undefined;
    }
}

// 맹독 인챈트 - 타격 효과 처리 
world.afterEvents.entityHurt.subscribe((event) => {
    try {
        // 1. 기본 정보 확인
        const hitEntity = event.hurtEntity;
        const damageSource = event.damageSource;
        const player = damageSource.damagingEntity;
        
        // 2. 플레이어 검증
        if (!player || player.typeId !== "minecraft:player") {
            return;
        }

        // 3. 현재 들고 있는 아이템 확인
        const mainhand = getItem(player);
        if (!mainhand) {
            return;
        }

        // 4. 로어 확인
        const lore = mainhand.getLore();
        if (!lore || !Array.isArray(lore)) {
            return;
        }

        // 5. 맹독 인챈트 확인
        const poisonLine = lore.find(line => line.includes(CUSTOM_ENCHANTS.DEADLY_POISON.id));
        if (!poisonLine) {
            return;
        }

        // 6. 효과 적용
        const level = parseInt(poisonLine.split("_").pop());
        
        if (level >= 4) {
            // 레벨 4 이상: 위더 효과 (2레벨)
            hitEntity.runCommand(`effect @s wither 4 1`);
        } else {
            // 레벨 1-3: 독 효과 (레벨에 따라 1-3)
            hitEntity.runCommand(`effect @s poison 4 ${level - 1}`);
        }

        // 파티클 및 사운드 효과
        hitEntity.runCommand(`particle minecraft:large_smoke ~ ~1 ~`);
        hitEntity.runCommand(`playsound mob.wither.shoot @a ~ ~ ~ 0.3 1.5`);

    } catch (error) {
        console.warn(`타격 이벤트 처리 중 오류: ${error.message}`);
    }
});
