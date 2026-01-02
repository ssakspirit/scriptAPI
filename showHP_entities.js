/**
 * Show Entity HP System - 엔티티 체력 표시 시스템
 *
 * [ 기능 설명 ]
 * - 오버월드의 모든 엔티티(몹, 동물 등)의 이름 위에 현재 체력과 최대 체력을 표시합니다.
 * - 실시간으로 체력이 업데이트되어 표시됩니다.
 *
 * [ 표시 형식 ]
 * 엔티티타입
 * 현재체력/최대체력
 * 예시: minecraft:zombie
 *       18.0/20.0
 *
 * [ 사용 방법 ]
 * - 스크립트를 활성화하면 자동으로 모든 엔티티에게 적용됩니다.
 * - 별도의 설정이나 명령어가 필요하지 않습니다.
 *
 * [ 주의사항 ]
 * - 오버월드(overworld) 차원의 엔티티만 표시됩니다.
 * - 2틱마다 업데이트되어 성능에 영향을 줄 수 있습니다.
 * - 체력이 없는 엔티티(아이템 프레임 등)는 표시되지 않습니다.
 * - 체력은 소수점 첫째 자리까지 표시됩니다.
 */

import {
    world,
    system
} from '@minecraft/server';

console.warn(`불러옴`); // 제대로 코드가 불러왔는지 확인

// 2틱마다 실행 (1틱 = 0.05초, 2틱 = 0.1초)
system.runInterval(() => { // runInterval을 사용해 반복
    try {
        const entities = world.getDimension("overworld").getEntities(); // overworld 차원에서 모든 엔티티 가져오기
        for (const entity of entities) { // 서버에 있는 모든 엔티티에 대해 반복
            const healthComponent = entity.getComponent("minecraft:health"); // 엔티티의 건강 컴포넌트를 가져옴
            if (healthComponent) { // 건강 컴포넌트가 있다면
                const entityHp = healthComponent.currentValue.toFixed(1); // 엔티티의 현재 HP (소수점 첫째 자리까지)
                const entityMaxHp = healthComponent.effectiveMax.toFixed(1); // 엔티티의 최대 HP (소수점 첫째 자리까지)
                entity.nameTag = `${entity.typeId}\n${entityHp}/${entityMaxHp}`; // 엔티티의 네임태그 설정
            }
        }
    } catch (error) {
        console.warn("엔티티 체력 표시 중 오류:", error);
    }
}, 2); // 워치독 방지를 위해 2틱마다 실행
