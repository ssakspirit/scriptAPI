import { world } from '@minecraft/server';

// 금지된 영역의 최소 및 최대 좌표 설정
const restrictedRegion = {
    min: { x: -10, y: -60, z: -10 },  // 최소 좌표
    max: { x: 10, y: -50, z: 10 }     // 최대 좌표
};

// 플레이어가 블록을 파괴할 때 발생하는 이벤트
world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const player = ev.player;
    const { x, y, z } = ev.block.location;

    // 현재 블록의 위치가 금지된 영역 안에 있는지 확인
    const isRestricted = (
        x >= restrictedRegion.min.x && x <= restrictedRegion.max.x &&
        y >= restrictedRegion.min.y && y <= restrictedRegion.max.y &&
        z >= restrictedRegion.min.z && z <= restrictedRegion.max.z
    );

    // 금지된 영역 내에서 블록 파괴 금지
    if (isRestricted) {
        if (!player.isOp()) { // 관리자는 허용
            ev.cancel = true;
            player.sendMessage(`§c이 영역에서는 블록을 파괴할 수 없습니다.`);
        }
    }
});

// 플레이어가 블록을 설치할 때 발생하는 이벤트
world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const player = ev.player;
    const { x, y, z } = ev.block.location;

    // 현재 블록의 위치가 금지된 영역 안에 있는지 확인
    const isRestricted = (
        x >= restrictedRegion.min.x && x <= restrictedRegion.max.x &&
        y >= restrictedRegion.min.y && y <= restrictedRegion.max.y &&
        z >= restrictedRegion.min.z && z <= restrictedRegion.max.z
    );

    // 금지된 영역 내에서 블록 설치 금지
    if (isRestricted) {
        if (!player.isOp()) { // 관리자는 허용
            ev.cancel = true;
            player.sendMessage(`§c이 영역에서는 블록을 설치할 수 없습니다.`);
        }
    }
});
