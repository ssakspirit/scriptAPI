import { world, system } from '@minecraft/server';

console.warn("불러옴");

world.beforeEvents.itemUse.subscribe(async (ev) => {
    const item = ev.itemStack;
    const player = ev.source;
    const itemType = "minecraft:diamond"; // 아이템 정하기
    const desiredNameTag = "귀환서"; // 원하는 이름 설정
    const tpTo = { x: 0.5, y: -60, z: 0.5 }; // 좌표 설정
    const spawnMessage = "스폰으로 티피되었습니다."; // 메시지 설정

    // 아이템 조건 확인
    if (item.typeId === itemType && item.nameTag === desiredNameTag) {
        player.sendMessage(`${spawnMessage}`);

        // 플레이어 텔레포트
        system.run(() => {
            player.teleport(tpTo);
        });

        //귀환서 1회용 사용으로 추가된 코드(여러 번 사용하려면 이부분을 지우세요.)
        // clear 명령어로 귀환서 1개 제거
        try {
            await player.runCommandAsync(`clear @s ${itemType} 0 1`);
        } catch (e) {
            console.warn("아이템 제거에 실패했습니다:", e);
        }
        //귀환서 1회용 사용으로 추가된 코드


        ev.cancel = true; // 기본 사용 동작 취소
    }
});
