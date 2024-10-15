/*
사용법:
1. 위치 저장: 채팅창에 "!저장 <위치이름>" 입력 (예: !저장 집)
2. 저장된 위치 확인 및 이동: 나침반 아이템 사용
3. 저장된 위치 삭제: 나침반 사용 후 "저장된 위치 삭제" 선택

주의: 위치는 플레이어별로 저장되며, 서버 재시작 후에도 유지됩니다.
*/

import { world, system, ItemStack, ItemTypes } from "@minecraft/server";
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

// 채팅 명령어로 위치 저장
world.beforeEvents.chatSend.subscribe((chatEvent) => {
    const player = chatEvent.sender;
    const message = chatEvent.message;

    // '!저장' 명령어 확인
    if (message.startsWith("!저장")) {
        chatEvent.cancel = true; // 채팅 메시지 전송 취소

        const locationName = message.slice(3).trim(); // '!저장' 이후의 텍스트 추출

        if (locationName) {
            const playerPosition = player.location;
            savedLocations[player.name] = savedLocations[player.name] || {};
            savedLocations[player.name][locationName] = {
                x: Math.floor(playerPosition.x),
                y: Math.floor(playerPosition.y),
                z: Math.floor(playerPosition.z)
            };

            // 저장 성공 메시지
            player.sendMessage(`§a위치 '${locationName}'이(가) 성공적으로 저장되었습니다.`);
            saveSavedLocations(); // 변경사항 저장
        } else {
            // 위치 이름이 없을 경우 오류 메시지
            player.sendMessage("§c오류: 위치 이름을 입력해주세요. 사용법: !저장 <이름>");
        }
    }
});

// 나침반 사용 이벤트 처리
world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;

    if (item.typeId === "minecraft:compass") {
        showSavedLocations(player);
    }
});

// 저장된 위치 UI 표시 함수
function showSavedLocations(player) {
    const playerLocations = savedLocations[player.name];
    if (!playerLocations || Object.keys(playerLocations).length === 0) {
        player.sendMessage("§c저장된 위치가 없습니다.");
        return;
    }

    const form = new ActionFormData()
        .title("저장된 위치")
        .body("이동하거나 삭제할 위치를 선택하세요.");

    // 저장된 위치들을 버튼으로 추가
    Object.keys(playerLocations).forEach((locationName) => {
        const coords = playerLocations[locationName];
        form.button(`${locationName} (X: ${coords.x}, Y: ${coords.y}, Z: ${coords.z})`);
    });

    // 삭제 옵션 버튼 추가
    form.button("§c저장된 위치 삭제");

    form.show(player).then((response) => {
        if (response.canceled) return;
        
        const locationNames = Object.keys(playerLocations);
        if (response.selection === locationNames.length) {
            // 삭제 옵션 선택
            showDeleteLocationUI(player);
        } else {
            // 위치 선택 및 텔레포트
            const selectedLocation = locationNames[response.selection];
            const coords = playerLocations[selectedLocation];
            
            player.teleport({ x: coords.x, y: coords.y, z: coords.z });
            player.sendMessage(`§a${selectedLocation}(으)로 이동했습니다.`);
        }
    });
}

// 위치 삭제 UI 표시 함수
function showDeleteLocationUI(player) {
    const playerLocations = savedLocations[player.name];
    const locationNames = Object.keys(playerLocations);

    const form = new ModalFormData()
        .title("위치 삭제")
        .dropdown("삭제할 위치를 선택하세요", locationNames);

    form.show(player).then((response) => {
        if (response.canceled) return;
        
        const selectedLocation = locationNames[response.formValues[0]];
        delete playerLocations[selectedLocation];
        
        player.sendMessage(`§a'${selectedLocation}' 위치가 삭제되었습니다.`);
        
        // 모든 위치가 삭제되었다면 플레이어의 저장 객체도 제거
        if (Object.keys(playerLocations).length === 0) {
            delete savedLocations[player.name];
        }

        saveSavedLocations(); // 변경사항 저장
    });
}
