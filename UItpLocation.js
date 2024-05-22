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


