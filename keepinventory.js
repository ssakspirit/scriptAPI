/*
사용법:
!인벤 - 인벤세이브 기능을 켜거나 끕니다.
!인벤 상태 - 현재 인벤세이브 기능의 상태를 확인합니다.

주의: 
- 인벤세이브가 켜져있으면 사망 시 아이템을 잃지 않습니다.
- 서버 재시작 시 기본적으로 꺼져있는 상태가 됩니다.
*/

import { world, system } from "@minecraft/server";

// 인벤세이브 기능을 위한 변수
let inventorySaveEnabled = false;

// 인벤세이브 기능을 켜고 끄는 함수
function toggleInventorySave() {
    inventorySaveEnabled = !inventorySaveEnabled;
    system.run(() => {
        world.getDimension("overworld").runCommandAsync(`gamerule keepinventory ${inventorySaveEnabled}`);
    });
    return inventorySaveEnabled;
}

// 채팅 이벤트 리스너 등록
world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message;
    const player = event.sender;

    // !인벤 명령어 확인
    if (message.startsWith('!인벤')) {
        event.cancel = true;
        
        const args = message.split(' ');
        
        // 상태 확인 명령어
        if (args[1] === '상태') {
            const status = inventorySaveEnabled ? '§a활성화' : '§c비활성화';
            world.sendMessage(`§7현재 인벤세이브 상태: ${status}`);
            return;
        }
        
        // 토글 명령어
        const newState = toggleInventorySave();
        const stateMessage = newState ? '§a활성화' : '§c비활성화';
        world.sendMessage(`§7인벤세이브 기능이 ${stateMessage} §7되었습니다.`);
    }
});
