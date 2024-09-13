import { world, system } from '@minecraft/server';

console.warn("불러옴")

world.beforeEvents.itemUse.subscribe((ev) => {
    const item = ev.itemStack;
    const player = ev.source;
    const itemType = "minecraft:diamond"; // 아이템 정하기
    const desiredNameTag = "귀환서" // 여기서 원하는 이름을 설정
    const tpTo = { x: 0.5, y: -60, z: 0.5 }; // 좌표 정하기
    const spawnMessage = "스폰으로 티피되었습니다."; // 메시지 정하기

    if (item.typeId === itemType && item.nameTag === desiredNameTag) {
        player.sendMessage(`${spawnMessage}`);
        system.run(() => {
            player.teleport(tpTo);
        });
        ev.cancel = true;
    }
});
