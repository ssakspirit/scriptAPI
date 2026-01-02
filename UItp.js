/**
 * UI Teleport System - UI 텔레포트 시스템
 *
 * [ 기능 설명 ]
 * - 나침반을 사용하여 현재 위치를 저장하고 저장된 위치로 이동할 수 있습니다.
 * - 각 플레이어마다 개별적으로 위치를 저장할 수 있습니다.
 * - UI를 통해 간편하게 위치를 관리할 수 있습니다.
 *
 * [ 사용 방법 ]
 * 1. 나침반 아이템을 사용(우클릭)합니다.
 * 2. "저장하기"를 선택하면 현재 위치가 저장됩니다.
 * 3. "이동하기"를 선택하면 저장된 위치로 텔레포트됩니다.
 *
 * [ 기능 목록 ]
 * - 저장하기: 현재 서 있는 위치를 저장합니다.
 * - 이동하기: 저장된 위치로 즉시 텔레포트됩니다.
 *
 * [ 주의사항 ]
 * - 각 플레이어는 하나의 위치만 저장할 수 있습니다.
 * - 새로운 위치를 저장하면 이전 위치는 덮어씌워집니다.
 * - 저장된 위치가 없으면 "저장된 장소가 없음" 메시지가 표시됩니다.
 * - 서버를 재시작하면 저장된 위치가 초기화됩니다.
 */

import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const afterEvents = world.afterEvents;

// 각 플레이어의 위치를 저장하기 위한 객체
let playerPositions = {};

// 아이템 사용했을 때 UI 열기
afterEvents.itemUse.subscribe((data) => {
    const block = data.itemStack;
    const player = data.source;

    if (block.typeId == "minecraft:compass") {
        showForm(player);
    }
});

// UI 설정
function showForm(player) {
    const formData = new ActionFormData();

    formData.title("순간 이동 장치").body("현재 위치를 저장하거나 저장된 위치로 이동하세요");
    formData.button("저장하기");
    formData.button("이동하기");

    formData.show(player).then((response) => {
        if (response.canceled) {
            return;
        }

        // 위치 저장하기 
        if (response.selection === 0) {
            playerPositions[player.name] = {
                x: player.location.x,
                y: player.location.y,
                z: player.location.z
            };

            player.runCommand("title @a actionbar 위치 저장 완료");
        }

        // 위치로 이동하기
        if (response.selection === 1) {
            const position = playerPositions[player.name];

            if (!position) {
                player.runCommand("title @a actionbar 저장된 장소가 없음");
            } else {
                player.runCommand(`tp @s ${position.x} ${position.y} ${position.z}`);
                player.runCommand("title @a actionbar 이동 완료");
            }
        }
    });
}
