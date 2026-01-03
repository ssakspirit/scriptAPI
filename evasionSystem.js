/*
 * evasionSystem - 회피 시스템
 * 
 * [설명]
 * 이 스크립트는 "회피" 태그를 가진 플레이어가 엔티티의 공격을 받았을 때
 * 50%의 확률로 데미지를 회피합니다.
 * 낙하, 화염, 익사 등의 환경 데미지는 회피할 수 없습니다.
 * 
 * [사용 방법]
 * 1. 플레이어에게 "회피" 태그를 부여합니다.
 *    명령어: /tag <플레이어이름> add 회피
 * 
 * [태그 제거 방법]
 * - 회피 기능을 비활성화하려면 태그를 제거하세요
 *   명령어: /tag <플레이어이름> remove 회피
 */

import { world } from "@minecraft/server";

// 마지막 회피 시간을 저장할 Map
const lastDodgeTime = new Map();

// 회피 확률 (0.5 = 50%)
const DODGE_CHANCE = 0.5;

// 회피 시스템
world.afterEvents.entityHurt.subscribe((ev) => {
    const hurtEntity = ev.hurtEntity;  // 데미지를 받는 엔티티
    const damageSource = ev.damageSource;  // 데미지 소스 정보
    const attacker = damageSource.damagingEntity;  // 데미지를 주는 엔티티
    const damage = ev.damage;  // 받은 데미지 양

    // 데미지를 받는 대상이 플레이어이고 회피 태그가 있는지 확인
    // 그리고 데미지가 엔티티에 의한 것인지 확인
    if (hurtEntity.typeId === "minecraft:player" && 
        hurtEntity.hasTag("회피") && 
        attacker && 
        damageSource.cause === "entityAttack") {
        try {
            // 현재 시간 가져오기
            const currentTime = Date.now();
            const lastTime = lastDodgeTime.get(hurtEntity.id) || 0;

            // 마지막 회피로부터 0.5초가 지났는지 확인
            if (currentTime - lastTime >= 500) {
                // 회피 확률 계산
                const isDodgeSuccessful = Math.random() < DODGE_CHANCE;

                if (isDodgeSuccessful) {
                    // 회피 성공
                    // 데미지에 비례하여 회복 효과 레벨 계산
                    const healLevel = Math.min(Math.floor(damage / 4), 4); // 4데미지당 1레벨, 최대 4레벨

                    try {
                        const effectResult = hurtEntity.runCommand(`effect "${hurtEntity.name}" instant_health 1 ${healLevel} true`);
                        if (effectResult.successCount === 0) {
                            console.warn(`회복 효과 적용 실패: ${hurtEntity.name}`);
                        }
                    } catch (effectError) {
                        console.warn("회복 효과 적용 오류:", effectError);
                    }

                    // 회피 성공 메시지 (sendMessage 사용)
                    hurtEntity.sendMessage(`§b${attacker.typeId.split(":")[1]}의 ${damage}데미지 공격을 회피했습니다! (회복 레벨: ${healLevel + 1})`);

                    // 회피 성공 파티클 효과
                    try {
                        const particleResult = hurtEntity.runCommand(`particle minecraft:enchanted_hit_particle ~~~`);
                        if (particleResult.successCount === 0) {
                            console.warn("파티클 효과 표시 실패");
                        }
                    } catch (particleError) {
                        console.warn("파티클 효과 표시 실패:", particleError);
                    }
                } else {
                    // 회피 실패
                    hurtEntity.sendMessage(`§c${attacker.typeId.split(":")[1]}의 ${damage}데미지 공격을 회피하지 못했습니다!`);

                    // 회피 실패 파티클 효과
                    try {
                        const particleResult = hurtEntity.runCommand(`particle minecraft:villager_angry ~~~`);
                        if (particleResult.successCount === 0) {
                            console.warn("파티클 효과 표시 실패");
                        }
                    } catch (particleError) {
                        console.warn("파티클 효과 표시 실패:", particleError);
                    }
                }

                // 마지막 회피 시도 시간 업데이트
                lastDodgeTime.set(hurtEntity.id, currentTime);
            }
        } catch (error) {
            console.warn("회피 처리 중 오류 발생:", error);
        }
    }
});
