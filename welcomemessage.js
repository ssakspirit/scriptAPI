/**
 * 플레이어 입장 메시지 커스터마이징 스크립트
 * 
 * 기능:
 * 1. 처음 접속한 플레이어와 재접속 플레이어를 구분하여 다른 메시지 표시
 * 2. 플레이어 접속 기록을 월드에 영구 저장
 * 3. 리스폰시에는 메시지가 표시되지 않음
 * 
 * 사용방법:
 * 1. 스크립트를 behavior_packs 폴더에 추가
 * 2. manifest.json에 필요한 권한 추가 (@minecraft/server)
 * 3. 월드에 비헤이비어 팩 적용
 * 
 * 관리자 명령어:
 * !resetplayer - 플레이어 접속 기록 초기화 (OP 권한 필요)
 */

import { world, system } from "@minecraft/server";

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
    // 리스폰인 경우 무시
    if (!eventData.initialSpawn) return;
    
    const player = eventData.player;
    
    // 월드에 저장된 플레이어 목록 가져오기
    let joinedPlayers = world.getDynamicProperty("joinedPlayers") || "";
    let playerList = joinedPlayers ? joinedPlayers.split(",") : [];
    
    if (!playerList.includes(player.name)) {
        // 처음 접속한 플레이어인 경우
        playerList.push(player.name);
        world.setDynamicProperty("joinedPlayers", playerList.join(","));
        
        // 전체 공지 메시지
        world.sendMessage(`§e새로운 플레이어 ${player.name}님이 서버에 처음 오셨습니다!`);
        
        // 개인 메시지
        player.sendMessage("§a환영합니다! 서버의 규칙을 확인해주세요!");
        player.sendMessage("§b도움말을 확인할 수 있습니다.");
    } else {
        // 재접속한 플레이어인 경우
        // 전체 공지 메시지
        world.sendMessage(`§b${player.name}님이 서버에 다시 접속하셨습니다.`);
        
        // 개인 메시지
        player.sendMessage("§a다시 오신 것을 환영합니다!");
    }
});
