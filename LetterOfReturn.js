/**
 * Letter of Return - 귀환서 시스템
 *
 * [ 기능 설명 ]
 * - 특정 이름을 가진 아이템을 사용하면 설정된 위치로 즉시 텔레포트됩니다.
 * - 귀환서는 1회용으로 사용 후 자동으로 소멸됩니다.
 *
 * [ 사용 방법 ]
 * 1. "귀환서"라는 이름을 가진 다이아몬드 아이템을 획득합니다.
 * 2. 귀환서를 사용(우클릭)하면 설정된 좌표로 텔레포트됩니다.
 * 3. 귀환서는 사용 후 자동으로 1개가 제거됩니다.
 *
 * [ 커스터마이징 ]
 * - itemType: 귀환서로 사용할 아이템 ID를 변경할 수 있습니다.
 * - desiredNameTag: 귀환서의 이름을 변경할 수 있습니다.
 * - tpTo: 텔레포트될 좌표를 변경할 수 있습니다 (x, y, z).
 * - spawnMessage: 텔레포트 시 표시될 메시지를 변경할 수 있습니다.
 *
 * [ 여러 번 사용 가능하게 변경하는 방법 ]
 * - 22~29번째 줄의 clear 명령어 코드를 삭제하면 됩니다.
 *
 * [ 주의사항 ]
 * - 아이템의 이름이 정확히 일치해야 합니다.
 * - 텔레포트 좌표가 안전한 위치인지 확인하세요.
 */

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
