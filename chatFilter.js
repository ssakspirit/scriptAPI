/*
채팅 필터 시스템 (chatFilter.js)

1. 사용법
   - 금지하고 싶은 단어를 BANNED_WORDS 배열에 추가하면 됩니다.
   - 해당 단어가 포함된 모든 채팅이 자동으로 차단됩니다.
   - 차단 시 어떤 단어가 금지되었는지 표시됩니다.

2. 금지 단어 추가 방법
   const BANNED_WORDS = [
       "사과",    // "사과"가 포함된 모든 채팅 차단
       "바보",    // "바보"가 포함된 모든 채팅 차단
       // 여기에 더 많은 금지 단어를 추가할 수 있습니다
   ];

3. 주의사항
   - 금지 단어는 대소문자를 구분합니다.
   - 금지 단어가 포함된 모든 채팅이 차단됩니다.
   - 차단된 채팅을 시도한 플레이어에게만 경고 메시지가 표시됩니다.
*/

import { world } from "@minecraft/server";

// 금지된 단어 목록
const BANNED_WORDS = [
    "사과",
    "바보",
    // 여기에 더 많은 금지 단어를 추가할 수 있습니다
];

// 채팅 이벤트 리스너 등록
world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message;
    const player = event.sender;

    // 금지된 단어 체크
    for (const bannedWord of BANNED_WORDS) {
        if (message.includes(bannedWord)) {
            event.cancel = true;
            player.sendMessage(`§c채팅이 차단되었습니다. 사유: '${bannedWord}' 단어가 포함되어 있습니다.`);
            // 관리자에게도 알림 (선택사항)
            world.getAllPlayers().forEach(p => {
                if (p.hasTag("admin")) {
                    p.sendMessage(`§e[관리자 알림] ${player.name}님의 채팅이 '${bannedWord}' 단어로 인해 차단되었습니다.`);
                }
            });
            return;
        }
    }
});
