/**
 * 플레이어 입장 메시지 커스터마이징 스크립트
 * 
 * 기능:
 * 1. 처음 접속한 플레이어와 재접속 플레이어를 구분하여 다른 메시지 표시
 * 2. 플레이어 접속 기록을 월드에 영구 저장
 * 3. 리스폰시에는 메시지가 표시되지 않음
 * 4. 처음 접속한 플레이어에게 시작 아이템 선택 UI 표시
 * 5. 선택 가능한 시작 아이템 세트:
 *    - 채굴자 세트: 채굴과 자원 수집에 특화
 *    - 탐험가 세트: 탐험과 모험에 특화
 *    - 전투가 세트: 전투와 생존에 특화
 * 
 * 사용방법:
 * 1. 스크립트를 behavior_packs 폴더에 추가
 * 2. manifest.json에 필요한 권한 추가 (@minecraft/server, @minecraft/server-ui)
 * 3. 월드에 비헤이비어 팩 적용
 * 
 * 관리자 명령어:
 * !resetplayer - 플레이어 접속 기록 초기화 (OP 권한 필요)
 */

import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

// 시작 아이템 세트 정의
const STARTER_KITS = {
    miner: {
        name: "채굴자 세트",
        items: [
            { item: "stone_pickaxe", amount: 1 },
            { item: "stone_shovel", amount: 1 },
            { item: "torch", amount: 32 },
            { item: "bread", amount: 16 },
            { item: "stone_axe", amount: 1 }
        ],
        description: "§e광물을 캐고 자원을 모으는데 특화된 세트입니다."
    },
    explorer: {
        name: "탐험가 세트",
        items: [
            { item: "leather_boots", amount: 1 },
            { item: "compass", amount: 1 },
            { item: "boat", amount: 1 },
            { item: "bread", amount: 32 },
            { item: "torch", amount: 64 }
        ],
        description: "§e세상을 탐험하고 모험하는데 특화된 세트입니다."
    },
    warrior: {
        name: "전투가 세트",
        items: [
            { item: "stone_sword", amount: 1 },
            { item: "leather_chestplate", amount: 1 },
            { item: "leather_leggings", amount: 1 },
            { item: "shield", amount: 1 },
            { item: "cooked_beef", amount: 16 }
        ],
        description: "§e전투와 생존에 특화된 세트입니다."
    }
};

// 시작 아이템 선택 UI 표시
async function showStarterKitUI(player) {
    const form = new ActionFormData()
        .title("시작 아이템 선택")
        .body("§e환영합니다! 시작 아이템 세트를 선택해주세요.\n각 세트는 한 번만 선택할 수 있습니다.");

    // 각 키트 옵션 추가
    for (const [id, kit] of Object.entries(STARTER_KITS)) {
        form.button(kit.name + "\n" + kit.description);
    }

    try {
        const response = await form.show(player);
        if (response.canceled) return;

        const selectedKit = Object.values(STARTER_KITS)[response.selection];
        await giveStarterKit(player, selectedKit);
        
        player.sendMessage(`§a${selectedKit.name}가 지급되었습니다!`);
        world.sendMessage(`§e${player.name}님이 ${selectedKit.name}를 선택했습니다!`);
    } catch (error) {
        console.warn("시작 아이템 UI 오류:", error);
    }
}

// 아이템 지급 함수
async function giveStarterKit(player, kit) {
    try {
        for (const item of kit.items) {
            await system.run(() => {
                player.runCommand(`give @s minecraft:${item.item} ${item.amount}`);
            });
        }
    } catch (error) {
        console.warn("아이템 지급 중 오류:", error);
    }
}

// 명령어로 동적 속성 초기화하는 함수
function resetJoinedPlayers() {
    try {
        world.setDynamicProperty("joinedPlayers", "");
        world.sendMessage("§a플레이어 목록이 초기화되었습니다.");
    } catch (error) {
        world.sendMessage("§c초기화 중 오류가 발생했습니다: " + error);
    }
}

// 명령어 등록
world.beforeEvents.chatSend.subscribe((eventData) => {
    if (eventData.message === "!resetplayer") {
        const player = eventData.sender;
        // 관리자 권한 확인
        if (player.isOp()) {
            resetJoinedPlayers();
        } else {
            player.sendMessage("§c이 명령어를 사용할 권한이 없습니다.");
        }
        eventData.cancel = true;
    }
});

// 플레이어가 스폰될 때 이벤트 리스너 등록
world.afterEvents.playerSpawn.subscribe((eventData) => {
    if (!eventData.initialSpawn) return;
    
    const player = eventData.player;
    let joinedPlayers = world.getDynamicProperty("joinedPlayers") || "";
    let playerList = joinedPlayers ? joinedPlayers.split(",") : [];
    
    if (!playerList.includes(player.name)) {
        // 처음 접속한 플레이어인 경우
        playerList.push(player.name);
        world.setDynamicProperty("joinedPlayers", playerList.join(","));
        
        world.sendMessage(`§e새로운 플레이어 ${player.name}님이 서버에 처음 오셨습니다!`);
        player.sendMessage("§a환영합니다! 서버의 규칙을 확인해주세요!");
        
        //시작 아이템을 없애고 싶다면 아래 코드를 지우세요.
        // 시작 아이템 UI 표시
        system.runTimeout(() => {
            showStarterKitUI(player);
        }, 40); // 2초 후에 UI 표시
        //시작 아이템을 없애고 싶다면 여기까지 코드를 지우세요.
    } else {
        world.sendMessage(`§b${player.name}님이 서버에 다시 접속하셨습니다.`);
        player.sendMessage("§a다시 오신 것을 환영합니다!");
    }
});
