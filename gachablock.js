/**
 * Gacha Block System - 가챠 블록 시스템
 *
 * [ 기능 설명 ]
 * - 특정 블록을 파괴하면 확률에 따라 랜덤한 아이템을 획득할 수 있습니다.
 * - 여러 종류의 가챠 블록을 설정할 수 있으며, 각각 다른 보상 풀을 가집니다.
 * - 각 보상마다 획득 확률과 개수 범위를 설정할 수 있습니다.
 *
 * [ 사용 방법 ]
 * 1. GACHA_TYPES 객체에 가챠 블록 종류를 추가합니다.
 * 2. 각 가챠 블록마다 보상 목록을 설정합니다:
 *    - item: 보상 아이템 ID
 *    - minCount: 최소 개수
 *    - maxCount: 최대 개수
 *    - chance: 획득 확률 (숫자가 클수록 확률 높음)
 *
 * [ 가챠 블록 종류 ]
 * - stevecoding:gacha_normal: 보통 가챠박스
 * - stevecoding:gacha_rare: 희귀한 가챠박스
 * - stevecoding:rare_gachabox: 전설 가챠박스
 *
 * [ 보상 예시 ]
 * - 보통 가챠박스: 에메랄드 블록, 다이아몬드, 네더라이트 주괴
 * - 희귀한 가챠박스: 네더라이트 블록, 다이아몬드 블록, 마법이 부여된 황금 사과
 *
 * [ 주의사항 ]
 * - 가챠 블록은 커스텀 블록으로 별도의 애드온이 필요할 수 있습니다.
 * - 확률(chance)의 합이 100일 필요는 없으며, 상대적인 비율로 작동합니다.
 */

import { world, system } from "@minecraft/server";

// 가챠박스 종류별 보상 설정
const GACHA_TYPES = {
    // 기본 가챠박스
    "stevecoding:gacha_normal": {
        name: "보통뽑기",
        rewards: [
            {
                item: "emerald_block",
                minCount: 1,
                maxCount: 3,
                chance: 30
            },
            {
                item: "diamond",
                minCount: 1,
                maxCount: 5,
                chance: 40
            },
            {
                item: "netherite_ingot",
                minCount: 1,
                maxCount: 1,
                chance: 10
            }
        ]
    },
    // 레어 가챠박스
    "stevecoding:gacha_rare": {
        name: "희귀한뽑기",
        rewards: [
            {
                item: "netherite_block",
                minCount: 1,
                maxCount: 2,
                chance: 20
            },
            {
                item: "diamond_block",
                minCount: 1,
                maxCount: 3,
                chance: 40
            },
            {
                item: "enchanted_golden_apple",
                minCount: 1,
                maxCount: 5,
                chance: 30
            }
        ],

        // 전설 가챠박스
        "stevecoding:rare_gachabox": {
            name: "전설 가챠박스",
            rewards: [
                {
                    item: "netherite_block",
                    minCount: 1,
                    maxCount: 2,
                    chance: 20
                },
                {
                    item: "diamond_block",
                    minCount: 1,
                    maxCount: 3,
                    chance: 40
                },
                {
                    item: "enchanted_golden_apple",
                    minCount: 1,
                    maxCount: 5,
                    chance: 30
                }
            ]
        }
        // 여기에 더 많은 가챠박스 종류를 추가할 수 있습니다
    }
};


// 랜덤 정수 생성 함수 (최소값과 최대값 포함)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 확률에 따른 아이템 선택 함수
function selectRandomReward(gachaType) {
    const rewards = GACHA_TYPES[gachaType].rewards;
    const totalChance = rewards.reduce((sum, reward) => sum + reward.chance, 0);
    let random = Math.random() * totalChance;

    for (const reward of rewards) {
        if (random < reward.chance) {
            return reward;
        }
        random -= reward.chance;
    }
    return null;
}

// 시스템 초기화
console.warn("가챠박스 애드온이 로드되었습니다!");

// 블록이 부서질 때 이벤트
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const blockId = event.brokenBlockPermutation.type.id;

    // 부서진 블록이 가챠박스인지 확인
    if (GACHA_TYPES[blockId]) {
        const player = event.player;
        const gachaBox = GACHA_TYPES[blockId];
        const reward = selectRandomReward(blockId);

        if (reward) {
            // 선택된 아이템의 랜덤 개수 결정
            const count = getRandomInt(reward.minCount, reward.maxCount);
            // 플레이어에게 아이템 지급
            player.runCommand(`give @s ${reward.item} ${count}`);
            // 플레이어에게 메시지 전송
            player.sendMessage(`§a${gachaBox.name}에서 ${reward.item} ${count}개를 획득했습니다!`);
        } else {
            // 꽝일 경우 메시지
            player.sendMessage(`§c${gachaBox.name}에서 아무것도 얻지 못했습니다...`);
        }
    }
});
