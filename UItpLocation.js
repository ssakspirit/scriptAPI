/**
 * UI Teleport Location System - UI 고정 위치 텔레포트 시스템
 *
 * [ 기능 설명 ]
 * - 나침반을 사용하여 미리 설정된 특정 위치로 즉시 이동할 수 있습니다.
 * - 여러 개의 고정 위치를 설정할 수 있습니다.
 * - UI를 통해 간편하게 원하는 위치를 선택하여 이동합니다.
 *
 * [ 사용 방법 ]
 * 1. 나침반 아이템을 사용(우클릭)합니다.
 * 2. 이동하고 싶은 위치를 선택합니다.
 * 3. 선택한 위치로 즉시 텔레포트됩니다.
 *
 * [ 이동 가능한 위치 ]
 * - 마을: (0, 0, 0)
 * - 상점: (0, 0, 10)
 * - 동굴: 코드에 설정된 좌표
 *
 * [ 위치 추가/수정 방법 ]
 * 1. showForm 함수에서 버튼을 추가합니다 (25-27번째 줄).
 * 2. 해당 버튼의 selection에 따른 if 문을 추가합니다.
 * 3. playerPositionX, Y, Z 변수에 원하는 좌표를 설정합니다.
 *
 * [ 주의사항 ]
 * - 텔레포트 좌표가 안전한 위치인지 확인하세요.
 * - 모든 플레이어가 같은 고정 위치로 이동합니다.
 * - UItp.js와 달리 위치를 저장하지 않고 미리 설정된 위치로만 이동합니다.
 */

import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

console.warn("test")

const afterEvents = world.afterEvents;

let playerPositionX, playerPositionY, playerPositionZ;

// 아이템 사용했을 때 UI 열기
afterEvents.itemUse.subscribe((data) => {
const block = data.itemStack;
const player = data.source;

if (block.typeId === "minecraft:compass") {
showForm(player);
}
});

// UI 설정
function showForm(player) {
const formData = new ActionFormData();

formData.title("순간 이동 장치").body("현재 위치를 저장하거나 저장된 위치로 이동하세요");
formData.button("마을로 이동");
formData.button("상점으로 이동");
formData.button("동굴로 이동");

formData.show(player).then((response) => {
if (response.canceled) {
return;
}

// 마을 위치로 이동
if (response.selection === 0) {
playerPositionX = 0;
playerPositionY = 0;
playerPositionZ = 0;
player.runCommandAsync(`tp @s ${playerPositionX} ${playerPositionY} ${playerPositionZ}`)
player.runCommandAsync("title @a actionbar 마을 위치로 이동 완료");
}

// 상점으로 이동하기
if (response.selection === 1) {
playerPositionX = 0;
playerPositionY = 0;
playerPositionZ = 10;
player.runCommandAsync(`tp @s ${playerPositionX} ${playerPositionY} ${playerPositionZ}`)
player.runCommandAsync("title @a actionbar 상점 위치로 이동 완료");
}

// 동굴로 이동하기
if (response.selection === 2) {
playerPositionX = 0;
playerPositionY = 0;
playerPositionZ = 20;
player.runCommandAsync(`tp @s ${playerPositionX} ${playerPositionY} ${playerPositionZ}`)
player.runCommandAsync("title @a actionbar 동굴 위치로 이동 완료");
}
});
}


