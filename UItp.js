import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const afterEvents = world.afterEvents;

let playerPositionX, playerPositionY, playerPositionZ;

//아이템 사용했을 때 ui열기
afterEvents.itemUse.subscribe((data) => {
    const block = data.itemStack
    const player = data.source

    if (block.typeId == "minecraft:compass") {
        showForm(player);
    }
});

//ui설정
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
            playerPositionX = player.location.x
            playerPositionY = player.location.y
            playerPositionZ = player.location.z

            player.runCommandAsync("title @a actionbar 위치 저장 완료");

        }

        //위치로 이동하기
        if (response.selection === 1) {

            if (playerPositionX == null) {
                player.runCommandAsync("title @a actionbar 저장된 장소가 없음");
            } else {
                player.runCommandAsync(`tp @s ${playerPositionX} ${playerPositionY} ${playerPositionZ}`)
                player.runCommandAsync("title @a actionbar 이동 완료");
            }
        }
    });
}


