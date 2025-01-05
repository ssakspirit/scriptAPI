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
world.afterEvents.worldInitialize.subscribe(() => {
    console.warn("가챠박스 애드온이 로드되었습니다!");
});

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
