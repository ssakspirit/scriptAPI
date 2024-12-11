/*
사용법:
1. 플레이어 텔레포트: !tp <플레이어이름>
   예시: !tp Steve

2. 위치 저장: !tp 저장 <위치이름>
   예시: !tp 저장 집

3. 저장된 위치로 이동: !tp <위치이름>
   예시: !tp 집

4. 저장된 위치 목록 확인: !tp 목록

주의: 
- 위치는 플레이어별로 저장됩니다
- 저장된 위치는 서버 재시작 후에도 유지됩니다
*/

import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

// 위치 저장을 위한 객체
let savedLocations = {};

// 저장된 위치 로드
function loadSavedLocations() {
    const savedData = world.getDynamicProperty("savedLocations");
    if (savedData) {
        savedLocations = JSON.parse(savedData);
    }
}

// 위치 저장 함수
function saveSavedLocations() {
    world.setDynamicProperty("savedLocations", JSON.stringify(savedLocations));
}

// 초기 로드
loadSavedLocations();

// 채팅 이벤트 리스너 등록
world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message;
    const player = event.sender;

    // !tp 명령어 확인
    if (message.startsWith('!tp')) {
        event.cancel = true;
        
        const args = message.split(' ');
        
        if (args.length < 2) {
            world.sendMessage('§c사용법: !tp <플레이어> 또는 !tp 저장 <위치이름>');
            return;
        }

        // !tp 저장 명령어 처리
        if (args[1] === '저장' && args.length > 2) {
            const locationName = args[2];
            savedLocations[player.name] = savedLocations[player.name] || {};
            savedLocations[player.name][locationName] = {
                x: Math.floor(player.location.x),
                y: Math.floor(player.location.y),
                z: Math.floor(player.location.z)
            };
            
            saveSavedLocations();
            world.sendMessage(`§a${player.name}님이 현재 위치를 '${locationName}'으로 저장했습니다.`);
            return;
        }

        // !tp 목록 명령어 처리
        if (args[1] === '목록') {
            const playerLocations = savedLocations[player.name];
            if (!playerLocations || Object.keys(playerLocations).length === 0) {
                world.sendMessage("§c저장된 위치가 없습니다.");
                return;
            }

            world.sendMessage(`§a${player.name}님의 저장된 위치 목록:`);
            Object.entries(playerLocations).forEach(([name, loc]) => {
                world.sendMessage(`§7- ${name}: X:${loc.x} Y:${loc.y} Z:${loc.z}`);
            });
            return;
        }

        // 저장된 위치로 텔레포트
        const playerLocations = savedLocations[player.name];
        if (playerLocations && playerLocations[args[1]]) {
            const loc = playerLocations[args[1]];
            system.run(() => {
                const dimension = player.dimension;
                dimension.runCommand(`tp "${player.name}" ${loc.x} ${loc.y} ${loc.z}`);
                world.sendMessage(`§a${player.name}님이 저장된 위치 '${args[1]}'(으)로 이동했습니다.`);
            });
            return;
        }

        // 다른 플레이어에게 텔레포트
        const targetPlayer = world.getAllPlayers().find(p => p.name === args[1]);
        if (!targetPlayer) {
            world.sendMessage('§c해당 플레이어나 저장된 위치를 찾을 수 없습니다.');
            return;
        }

        const targetLoc = targetPlayer.location;
        system.run(() => {
            const dimension = player.dimension;
            dimension.runCommand(`tp "${player.name}" ${Math.floor(targetLoc.x)} ${Math.floor(targetLoc.y)} ${Math.floor(targetLoc.z)}`);
            world.sendMessage(`§a${player.name}님이 ${targetPlayer.name}에게 텔레포트했습니다.`);
        });
    }
});
