/**
 * 워프 시스템 (Warp System)
 * Version: 1.0.0
 * 
 * [ 기능 설명 ]
 * - 플레이어 간 워프 요청 및 이동 시스템
 * - UI 또는 채팅 명령어로 조작 가능
 * - 쿨타임, 요청 만료 시간 설정 가능
 * 
 * [ 사용 방법 ]
 * 1. 워프 요청하기:
 *    - 채팅에 '!워프' 입력
 *    - 플레이어 목록에서 워프하고 싶은 대상 선택
 * 
 * 2. 워프 요청 받았을 때:
 *    방법 1) UI 버튼으로 응답
 *    - [수락] 또는 [거절] 버튼 클릭
 * 
 *    방법 2) 채팅으로 응답
 *    - '수락' 입력 - 워프 요청 수락
 *    - '거절' 입력 - 워프 요청 거절
 * 
 * [ 주요 기능 ]
 * - 쿨타임: 2분 (120초)
 * - 요청 만료: 1분 (60초)
 * - 텔레포트 지연: 3초
 * 
 * [ 시스템 동작 ]
 * 1. 워프 요청 시:
 *    - 상대방에게 수락/거절 UI 표시
 *    - 1분 내 응답이 없으면 자동 만료
 * 
 * 2. 요청 수락 시:
 *    - 3초 후 요청자가 상대방 위치로 이동
 *    - 요청자에게 2분 쿨타임 적용
 * 
 * 3. 쿨타임 중 사용 시:
 *    - 모루 소리와 함께 남은 시간 표시
 * 
 * [ 설정 변경 방법 ]
 * WARP_CONFIG 객체에서 다음 값 수정:
 * - COOLDOWN: 쿨타임 (초)
 * - REQUEST_TIMEOUT: 요청 만료 시간 (초)
 * - TELEPORT_DELAY: 텔레포트 지연 시간 (초)
 */

import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

// 워프 시스템 설정
const WARP_CONFIG = {
    COOLDOWN: 120,          // 쿨타임 (초)
    REQUEST_TIMEOUT: 60,    // 요청 만료 시간 (초)
    TELEPORT_DELAY: 3      // 텔레포트 지연 시간 (초)
};

// 플레이어 쿨타임 및 요청 상태 저장
const playerCooldowns = new Map();
const warpRequests = new Map();

// 워프 UI 표시
function showWarpUI(player) {
    // 쿨타임 체크
    const cooldownEnd = playerCooldowns.get(player.name);
    if (cooldownEnd && Date.now() < cooldownEnd) {
        const remainingTime = Math.ceil((cooldownEnd - Date.now()) / 1000);
        player.runCommandAsync(`playsound block.anvil.use @s ~ ~ ~ 1 1`);
        player.sendMessage(`§c쿨타임이 ${remainingTime}초 남았습니다.`);
        return;
    }

    system.runTimeout(() => {
        try {
            // 자신을 제외한 모든 플레이어 목록
            const players = world.getAllPlayers().filter(p => p.name !== player.name);

            // 워프 가능한 플레이어가 없는 경우
            if (players.length === 0) {
                player.sendMessage("§c워프할 수 있는 플레이어가 없습니다.");
                return;
            }

            const form = new ActionFormData()
                .title("워프 메뉴")
                .body("워프할 플레이어를 선택하세요.");

            players.forEach(p => {
                form.button(p.name);
            });

            form.show(player).then(response => {
                if (response.cancelationReason === "UserBusy") {
                    system.runTimeout(() => {
                        showWarpUI(player);
                    }, 10);
                    return;
                }

                if (!response || response.canceled) return;

                const targetPlayer = players[response.selection];
                if (!targetPlayer) return;

                // 워프 요청 보내기
                sendWarpRequest(player, targetPlayer);
            }).catch(error => {
                console.warn("워프 UI 표시 중 오류:", error);
                player.sendMessage("§cUI를 표시하는 중 오류가 발생했습니다.");
            });
        } catch (error) {
            console.warn("워프 UI 생성 중 오류:", error);
            player.sendMessage("§c워프 메뉴를 여는 중 오류가 발생했습니다.");
        }
    }, 1);
}

// 워프 요청 보내기
function sendWarpRequest(sender, target) {
    // 이미 진행 중인 요청이 있는지 확인
    if (warpRequests.has(target.name)) {
        sender.sendMessage("§c해당 플레이어에게 이미 다른 워프 요청이 진행 중입니다.");
        return;
    }

    // 요청 정보 저장
    warpRequests.set(target.name, {
        sender: sender.name,
        timestamp: Date.now()
    });

    // 요청 메시지 전송
    sender.sendMessage(`§e${target.name}님에게 워프 요청을 보냈습니다.`);
    
    // UI로 수락/거절 표시
    system.runTimeout(() => {
        try {
            const form = new ActionFormData()
                .title("워프 요청")
                .body(`§e${sender.name}님이 워프 요청을 보냈습니다.`)
                .button("§a수락")
                .button("§c거절");

            form.show(target).then(response => {
                if (response.cancelationReason === "UserBusy") {
                    system.runTimeout(() => {
                        // UI를 다시 보여주지 않고 채팅 메시지만 전송
                        target.sendMessage(`§e${sender.name}님이 워프 요청을 보냈습니다.`);
                        target.sendMessage(`§a'수락'을 입력하여 수락하거나\n§c'거절'을 입력하여 거절하세요.`);
                    }, 10);
                    return;
                }

                if (!response || response.canceled) {
                    // UI를 닫았을 때는 채팅으로 응답할 수 있다는 메시지 표시
                    target.sendMessage(`§e워프 요청에 응답하려면:`);
                    target.sendMessage(`§a'수락' §f- 수락`);
                    target.sendMessage(`§c'거절' §f- 거절`);
                    return;
                }

                // 수락(0) 또는 거절(1) 처리
                handleWarpResponse(target, sender.name, response.selection === 0);
            }).catch(error => {
                console.warn("워프 요청 UI 표시 중 오류:", error);
                target.sendMessage(`§e${sender.name}님이 워프 요청을 보냈습니다.`);
                target.sendMessage(`§a'수락'을 입력하여 수락하거나\n§c'거절'을 입력하여 거절하세요.`);
            });
        } catch (error) {
            console.warn("워프 요청 UI 생성 중 오류:", error);
            target.sendMessage(`§e${sender.name}님이 워프 요청을 보냈습니다.`);
            target.sendMessage(`§a'수락'을 입력하여 수락하거나\n§c'거절'을 입력하여 거절하세요.`);
        }
    }, 1);

    // 1분 후 요청 만료
    system.runTimeout(() => {
        if (warpRequests.has(target.name)) {
            const request = warpRequests.get(target.name);
            if (request && request.sender === sender.name) {
                warpRequests.delete(target.name);
                sender.sendMessage(`§c${target.name}님에 대한 워프 요청이 만료되었습니다.`);
                target.sendMessage(`§c${sender.name}님의 워프 요청이 만료되었습니다.`);
            }
        }
    }, WARP_CONFIG.REQUEST_TIMEOUT * 20);
}

// 워프 요청 처리 함수
function handleWarpResponse(player, senderName, accept) {
    const request = warpRequests.get(player.name);
    if (!request || request.sender !== senderName) {
        player.sendMessage("§c해당하는 워프 요청을 찾을 수 없습니다.");
        return;
    }

    const sender = Array.from(world.getAllPlayers()).find(p => p.name === senderName);
    if (!sender) {
        player.sendMessage("§c요청한 플레이어를 찾을 수 없습니다.");
        warpRequests.delete(player.name);
        return;
    }

    if (accept) {
        // 수락 처리
        player.sendMessage(`§a${sender.name}님의 워프 요청을 수락했습니다.`);
        sender.sendMessage(`§a${player.name}님이 워프 요청을 수락했습니다. 3초 후 이동합니다.`);

        // 3초 후 텔레포트
        system.runTimeout(() => {
            try {
                const targetLoc = player.location;
                sender.teleport(targetLoc);
                sender.sendMessage(`§a${player.name}님에게 이동했습니다.`);
                player.sendMessage(`§a${sender.name}님이 이동했습니다.`);

                // 쿨타임 설정
                playerCooldowns.set(sender.name, Date.now() + (WARP_CONFIG.COOLDOWN * 1000));
            } catch (error) {
                console.warn("텔레포트 중 오류:", error);
                sender.sendMessage("§c텔레포트 중 오류가 발생했습니다.");
                player.sendMessage("§c텔레포트 중 오류가 발생했습니다.");
            }
        }, WARP_CONFIG.TELEPORT_DELAY * 20);
    } else {
        // 거절 처리
        player.sendMessage(`§c${sender.name}님의 워프 요청을 거절했습니다.`);
        sender.sendMessage(`§c${player.name}님이 워프 요청을 거절했습니다.`);
    }

    warpRequests.delete(player.name);
}

// 채팅 명령어 처리
world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message;
    const player = event.sender;

    if (message === "!워프") {
        event.cancel = true;
        player.sendMessage("§a채팅창을 닫으면 워프 메뉴가 열립니다.");
        showWarpUI(player);
        return;
    }

    // 워프 수락/거절 명령어 처리
    if (message === "수락" || message === "거절") {
        event.cancel = true;
        
        // 진행 중인 워프 요청이 있는지 확인
        const request = warpRequests.get(player.name);
        if (!request) {
            player.sendMessage("§c처리할 워프 요청이 없습니다.");
            return;
        }

        handleWarpResponse(player, request.sender, message === "수락");
    }
});
