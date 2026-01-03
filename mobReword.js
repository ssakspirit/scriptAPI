import { world, system, ItemStack } from "@minecraft/server";

/**
 * 몹 처치 보상 시스템 사용 설명서
 * 
 * 1. 새로운 몹 보상 추가 방법:
 *    MOB_REWARDS 객체에 새로운 몹을 추가합니다.
 *    예시:
 *    "minecraft:creeper": {
 *        items: [
 *            { itemId: "minecraft:gunpowder", amount: 2, chance: 100 }
 *        ],
 *        commands: [
 *            { command: "scoreboard players add @p gold 1", chance: 100 }
 *        ]
 *    }
 * 
 * 2. 보상 설정 방법:
 *    - items: 아이템 보상 배열
 *      - itemId: 아이템의 ID (예: "minecraft:diamond")
 *      - amount: 지급할 개수
 *      - chance: 드롭 확률 (1-100 사이의 숫자)
 *    - commands: 실행할 명령어 배열
 *      - command: 실행할 명령어
 *      - chance: 실행 확률 (1-100 사이의 숫자)
 * 
 * 3. 스코어보드 설정 방법:
 *    게임 시작 전 다음 명령어를 채팅창에 입력하세요:
 *    /scoreboard objectives add gold dummy "§e골드"
 *    /scoreboard objectives setdisplay sidebar gold
 * 
 * 4. 주의사항:
 *    - 아이템 ID는 반드시 "minecraft:" 접두사를 포함해야 함
 *    - 확률은 0-100 사이의 숫자여야 함
 *    - 존재하지 않는 아이템 ID를 사용하면 오류 발생
 *    - 스코어보드는 게임 시작 전에 반드시 생성해야 함
 */

// 몹별 보상 정의 수정
const MOB_REWARDS = {
    "minecraft:vindicator": {
        items: [  // 아이템 보상
            { itemId: "minecraft:emerald", amount: 1, chance: 100 },
            { itemId: "minecraft:diamond", amount: 1, chance: 30 }
        ],
        commands: [  // 실행할 명령어
            { command: "effect @p strength 30 1", chance: 50 },  // 50% 확률로 힘 효과
            { command: "scoreboard players add @p gold 1", chance: 100 }  // 100% 확률로 골드 1 증가
        ]
    },
    "minecraft:zombie": {
        items: [
            { itemId: "minecraft:rotten_flesh", amount: 2, chance: 100 },
            { itemId: "minecraft:iron_ingot", amount: 1, chance: 10 }
        ],
        commands: [
            { command: "effect @p regeneration 10 1", chance: 30 }  // 30% 확률로 재생 효과
        ]
    },
    "minecraft:skeleton": {
        items: [
            { itemId: "minecraft:bone", amount: 2, chance: 100 },
            { itemId: "minecraft:arrow", amount: 5, chance: 50 }
        ],
        commands: [
            { command: "effect @p speed 20 1", chance: 40 }  // 40% 확률로 속도 증가
        ]
    }
};

// 보상 지급 함수
/**
 * 플레이어에게 보상을 지급하는 함수
 * @param {Player} player - 보상을 받을 플레이어
 * @param {Array} rewards - 지급할 보상 배열
 */
function giveRewards(player, rewards) {
    // 아이템 보상 지급
    if (rewards.items) {
        rewards.items.forEach(reward => {
            if (Math.random() * 100 <= reward.chance) {
                try {
                    const item = new ItemStack(reward.itemId, reward.amount);
                    player.getComponent("inventory").container.addItem(item);
                    const itemName = getKoreanItemName(reward.itemId);
                    player.sendMessage(`§a${itemName} ${reward.amount}개를 획득했습니다!`);
                } catch (error) {
                    console.warn(`아이템 지급 중 오류 발생 (${reward.itemId}):`, error);
                }
            }
        });
    }

    // 명령어 실행
    if (rewards.commands) {
        rewards.commands.forEach(cmd => {
            if (Math.random() * 100 <= cmd.chance) {
                try {
                    // 플레이어 위치 기준으로 명령어 실행
                    const dimension = player.dimension;
                    const pos = player.location;

                    // 명령어에서 @p를 플레이어 이름으로 변환
                    const command = cmd.command.replace('@p', `"${player.name}"`);

                    try {
                        const result = dimension.runCommand(command);
                        if (result.successCount === 0) {
                            console.warn(`보상 명령어 실행 실패: ${command}`);
                        }
                    } catch (cmdError) {
                        console.warn(`명령어 실행 중 오류 발생 (${cmd.command}):`, cmdError);
                    }
                } catch (error) {
                    console.warn(`명령어 실행 중 오류 발생 (${cmd.command}):`, error);
                }
            }
        });
    }
}

// 아이템 ID를 한글 이름으로 변환하는 함수
/**
 * 아이템 ID를 한글 이름으로 변환
 * @param {string} itemId - 변환할 아이템 ID
 * @returns {string} 한글 이름 또는 원래 ID
 */
function getKoreanItemName(itemId) {
    const nameMap = {
        "minecraft:emerald": "에메랄드",
        "minecraft:diamond": "다이아몬드",
        "minecraft:rotten_flesh": "썩은 고기",
        "minecraft:iron_ingot": "철괴",
        "minecraft:bone": "뼈",
        "minecraft:arrow": "화살"
        // 여기에 더 많은 아이템 이름을 추가할 수 있습니다
    };
    return nameMap[itemId] || itemId;
}

// 엔티티가 죽을 때 이벤트 감지
/**
 * 엔티티 사망 이벤트 처리
 * - 플레이어가 몹을 죽였을 때 보상 지급
 * - 설정된 확률에 따라 아이템 지급
 * - 처치 메시지와 보상 획득 메시지 표시
 */
world.afterEvents.entityDie.subscribe((event) => {
    const deadEntity = event.deadEntity;
    const killer = event.damageSource.damagingEntity;

    // 킬러가 플레이어인지 확인
    if (killer?.typeId === "minecraft:player") {
        // 죽은 몹의 보상 정보 확인
        const mobRewards = MOB_REWARDS[deadEntity.typeId];
        
        if (mobRewards) {
            // 보상 지급
            giveRewards(killer, mobRewards);
            
            // 몹 처치 메시지 (선택적)
            const mobName = getKoreanItemName(deadEntity.typeId.replace('minecraft:', ''));
            killer.sendMessage(`§e${mobName}을(를) 처치했습니다!`);
        }
    }
});
