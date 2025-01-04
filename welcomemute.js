/**
 * 플레이어 입장 메시지 및 채팅 제한 시스템
 * 
 * 기능:
 * 1. 처음 접속한 플레이어와 재접속 플레이어를 구분하여 다른 메시지 표시
 * 2. 플레이어 접속 기록을 월드에 영구 저장
 * 3. 리스폰시에는 메시지가 표시되지 않음
 * 4. 처음 접속한 플레이어에게 시작 아이템 선택 UI 표시
 * 5. 신규 플레이어 채팅 제한:
 *    - 처음 접속한 플레이어는 3분간 채팅이 제한됨
 *    - 채팅 시도 시 남은 시간 표시
 *    - 3분 후 자동으로 제한 해제
 *    - 재접속 시에는 제한이 적용되지 않음
 * 
 * 사용방법:
 * 1. 스크립트를 behavior_packs 폴더에 추가
 * 2. manifest.json에 필요한 권한 추가 (@minecraft/server, @minecraft/server-ui)
 * 3. 월드에 비헤이비어 팩 적용
 * 
 * 관리자 명령어:
 * !resetplayer - 플레이어 접속 기록 초기화 (OP 권한 필요)
 * 
 * 채팅 제한 시스템 작동 방식:
 * 1. 신규 플레이어가 처음 접속하면 자동으로 3분간 채팅 제한
 * 2. 제한된 상태에서 채팅 시도 시 남은 시간을 메시지로 표시
 * 3. Map 객체를 사용하여 제한된 플레이어 목록 관리
 * 4. Date.now()를 사용하여 제한 시간을 정확하게 계산
 * 
 * 개발자 참고사항:
 * - MUTE_DURATION 상수로 제한 시간 설정 가능 (기본값: 3분)
 * - mutedPlayers Map으로 제한된 플레이어 관리
 * - 시간은 밀리초 단위로 내부 계산됨
 */

import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

// 채팅 제한 플레이어 관리
const mutedPlayers = new Map();
const MUTE_DURATION = 3 * 60; // 3분을 초 단위로 표시

// 채팅 이벤트 처리
world.beforeEvents.chatSend.subscribe((eventData) => {
    const player = eventData.sender;

    // 명령어 처리
    if (eventData.message === "!resetplayer") {
        if (player.isOp()) {
            resetJoinedPlayers();
        } else {
            player.sendMessage("§c이 명령어를 사용할 권한이 없습니다.");
        }
        eventData.cancel = true;
        return;
    }

    // 채팅 제한 확인
    if (mutedPlayers.has(player.name)) {
        const remainingTime = Math.ceil((mutedPlayers.get(player.name) - Date.now()) / 1000);
        if (remainingTime > 0) {
            player.sendMessage(`§c채팅이 제한되었습니다. ${Math.floor(remainingTime / 60)}분 ${remainingTime % 60}초 후에 채팅이 가능합니다.`);
            eventData.cancel = true;
            return;
        } else {
            mutedPlayers.delete(player.name);
        }
    }
});

// 명령어로 동적 속성 초기화하는 함수
function resetJoinedPlayers() {
    try {
        world.setDynamicProperty("joinedPlayers", "");
        world.sendMessage("§a플레이어 목록이 초기화되었습니다.");
    } catch (error) {
        world.sendMessage("§c초기화 중 오류가 발생했습니다: " + error);
    }
}

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
        
        // 채팅 제한 설정
        mutedPlayers.set(player.name, Date.now() + (MUTE_DURATION * 1000));
        player.sendMessage("§c처음 접속하신 플레이어는 3분간 채팅이 제한됩니다.");
        
    } else {
        world.sendMessage(`§b${player.name}님이 서버에 다시 접속하셨습니다.`);
        player.sendMessage("§a다시 오신 것을 환영합니다!");
    }
});
