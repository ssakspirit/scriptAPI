/**
 * Show Player HP System - 플레이어 체력 표시 시스템
 *
 * [ 기능 설명 ]
 * - 모든 플레이어의 이름 위에 현재 체력과 최대 체력을 표시합니다.
 * - 실시간으로 체력이 업데이트되어 표시됩니다.
 *
 * [ 표시 형식 ]
 * 플레이어이름
 * 현재체력/최대체력
 * 예시: Steve
 *       20/20
 *
 * [ 사용 방법 ]
 * - 스크립트를 활성화하면 자동으로 모든 플레이어에게 적용됩니다.
 * - 별도의 설정이나 명령어가 필요하지 않습니다.
 *
 * [ 주의사항 ]
 * - 2틱마다 업데이트되어 실시간으로 체력을 표시합니다.
 * - nameTag를 사용하는 다른 스크립트와 충돌할 수 있습니다.
 * - 플레이어가 데미지를 받거나 회복하면 즉시 반영됩니다.
 */

import {
    world,
    system
} from '@minecraft/server';

console.warn(`불러옴`) // 제대로 코드가 불러왔는지 확인

system.runInterval(() => {//runInterval를 사용해 반복
    try {
        for (const player of world.getAllPlayers()) {//서버에 있는 사람에게 밑에 문장을 실행
            const health = player.getComponent("minecraft:health");
            if (health) {
                const playerHp = health.currentValue;//플레이어 현재 Hp
                const playerMaxHp = health.effectiveMax;//플레이어 최대 Hp
                player.nameTag = player.name + "\n" + playerHp + "/" + playerMaxHp;//플레이어 네임태그 설정
            }
        }
    } catch (error) {
        console.warn("체력 표시 중 오류:", error);
    }
}, 2)//워치독 방지를 위해 2틱마다 실행
