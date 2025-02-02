/*
 * SurvivalInstinct - 생존 본능 시스템
 * 
 * [설명]
 * 플레이어의 체력이 위험한 수준으로 떨어졌을 때
 * 생존을 위한 버프와 효과가 자동으로 발동되는 시스템입니다.
 * 
 * [기능]
 * - 체력 30% 이하 시 자동 발동
 * - 저항 및 신속 버프 제공
 * - 시각 및 청각 효과 제공
 * - 3초 쿨타임 적용
 * 
 * [사용 방법]
 * 별도의 설정 없이 자동으로 작동합니다.
 * 체력이 6칸 이하로 떨어지면 효과가 발동됩니다.
 */

import { world, system } from "@minecraft/server";

// 마지막으로 효과가 발동된 시간을 저장하는 Map
// key: 플레이어ID, value: 마지막 발동 시간
const lastTriggerTime = new Map();

// 생존 본능 시스템 메인 로직
world.afterEvents.entityHurt.subscribe((ev) => {
    const hurtEntity = ev.hurtEntity;

    // 피해를 입은 대상이 플레이어인 경우에만 처리
    if (hurtEntity.typeId === "minecraft:player") {
        try {
            const currentTime = Date.now();
            const lastTime = lastTriggerTime.get(hurtEntity.id) || 0;

            // 쿨타임 확인 (3초)
            if (currentTime - lastTime >= 3000) {
                // 플레이어의 현재 체력 확인
                const health = hurtEntity.getComponent("health");
                if (health) {
                    const currentHealth = health.currentValue;
                    const maxHealth = health.maxValue;

                    // 체력이 30% (6칸) 이하일 때 생존 효과 발동
                    if (currentHealth <= 6) {
                        // 효과 발동 처리
                        system.run(() => {
                            try {
                                // 생존을 위한 버프 부여
                                hurtEntity.runCommand(`effect @s resistance 3 1 true`); // 저항 효과
                                hurtEntity.runCommand(`effect @s speed 3 1 true`); // 신속 효과
                                
                                // 시각 및 청각 효과
                                hurtEntity.runCommand(`particle minecraft:huge_explosion_emitter ~~~`);
                                hurtEntity.runCommand(`playsound random.explode @a[r=10] ~~~ 1 1 1`);
                                hurtEntity.runCommand(`title @s actionbar §c§l! 위기 상황 발동 !`);
                                
                                // 쿨타임 업데이트
                                lastTriggerTime.set(hurtEntity.id, currentTime);
                            } catch (cmdError) {
                                // 명령어 실행 중 오류 발생 시 무시
                            }
                        });
                    }
                }
            }
        } catch (error) {
            // 오류 발생 시 무시하고 계속 진행
        }
    }
});
