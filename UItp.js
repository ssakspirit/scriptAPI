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

            player.runCommandAsync("title @a actionbar 위치 저장 완료");
        }

        // 위치로 이동하기
        if (response.selection === 1) {
            const position = playerPositions[player.name];

            if (!position) {
                player.runCommandAsync("title @a actionbar 저장된 장소가 없음");
            } else {
                player.runCommandAsync(`tp @s ${position.x} ${position.y} ${position.z}`);
                player.runCommandAsync("title @a actionbar 이동 완료");
            }
        }
    });
}
