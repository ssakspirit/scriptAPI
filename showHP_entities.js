import {
    world,
    system
} from '@minecraft/server';

console.warn(`불러옴`); // 제대로 코드가 불러왔는지 확인

// 2틱마다 실행 (1틱 = 0.05초, 2틱 = 0.1초)
system.runInterval(() => { // runInterval을 사용해 반복
    const entities = world.getDimension("overworld").getEntities(); // overworld 차원에서 모든 엔티티 가져오기
    for (const entity of entities) { // 서버에 있는 모든 엔티티에 대해 반복
        const healthComponent = entity.getComponent("minecraft:health"); // 엔티티의 건강 컴포넌트를 가져옴
        if (healthComponent) { // 건강 컴포넌트가 있다면
            const entityHp = healthComponent.currentValue.toFixed(1); // 엔티티의 현재 HP (소수점 첫째 자리까지)
            const entityMaxHp = healthComponent.effectiveMax.toFixed(1); // 엔티티의 최대 HP (소수점 첫째 자리까지)
            entity.nameTag = `${entity.typeId}\n${entityHp}/${entityMaxHp}`; // 엔티티의 네임태그 설정
        }
    }
}, 2); // 워치독 방지를 위해 2틱마다 실행
