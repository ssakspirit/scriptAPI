/**
 * Deny Block System - 블록 설치/파괴 금지 영역 시스템
 *
 * [ 기능 설명 ]
 * - 특정 영역 내에서 블록 파괴 및 설치를 금지합니다.
 * - 관리자(OP)는 모든 영역에서 블록을 자유롭게 설치/파괴할 수 있습니다.
 * - 일반 플레이어는 지정된 영역 내에서 블록을 설치/파괴할 수 없습니다.
 *
 * [ 사용 방법 ]
 * 1. restrictedRegion 변수에서 금지 영역의 좌표를 설정합니다.
 *    - min: 영역의 최소 좌표 (x, y, z)
 *    - max: 영역의 최대 좌표 (x, y, z)
 *
 * 2. 일반 플레이어가 금지 영역 내에서 블록을 설치/파괴하려고 하면
 *    작업이 취소되고 경고 메시지가 표시됩니다.
 *
 * [ 주의사항 ]
 * - 영역 설정 시 좌표값을 정확히 입력해야 합니다.
 * - OP 권한을 가진 플레이어는 모든 제한에서 제외됩니다.
 * - allowBlock.js와 반대되는 기능입니다.
 */

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
