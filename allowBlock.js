import { world } from '@minecraft/server';

// 허용된 블록 파괴/설치 영역의 최소, 최대 좌표 설정
const allowRegion = {
    min: { x: -10, y: -60, z: -10 },  // 최소 좌표
    max: { x: 10, y: -50, z: 10 }     // 최대 좌표
};

// 플레이어가 블록을 파괴할 때 발생하는 이벤트
world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const player = ev.player;
    const { x, y, z } = ev.block.location;

    // 현재 블록의 위치가 허용된 영역 안에 있는지 확인
    const isAllowed = (
        x >= allowRegion.min.x && x <= allowRegion.max.x &&
        y >= allowRegion.min.y && y <= allowRegion.max.y &&
        z >= allowRegion.min.z && z <= allowRegion.max.z
    );

    // 허용된 영역이 아닐 경우 파괴 금지
    if (!isAllowed) {
        if (!player.isOp()) {
            ev.cancel = true;
            player.sendMessage(`§c이 영역에서는 블록을 파괴할 수 없습니다.`);
        }
    }
});

// 플레이어가 블록을 설치할 때 발생하는 이벤트
world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const player = ev.player;
    const { x, y, z } = ev.block.location;

    // 현재 블록의 위치가 허용된 영역 안에 있는지 확인
    const isAllowed = (
        x >= allowRegion.min.x && x <= allowRegion.max.x &&
        y >= allowRegion.min.y && y <= allowRegion.max.y &&
        z >= allowRegion.min.z && z <= allowRegion.max.z
    );

    // 허용된 영역이 아닐 경우 설치 금지
    if (!isAllowed) {
        if (!player.isOp()) {
            ev.cancel = true;
            player.sendMessage(`§c이 영역에서는 블록을 설치할 수 없습니다.`);
        }
    }
});
