/*
 * evasionSystem - 회피 시스템
 * 
 * [설명]
 * 이 스크립트는 "회피" 태그를 가진 플레이어가 공격을 받았을 때
 * 50%의 확률로 데미지를 회피합니다.
 * 회피에 성공하면 데미지를 받지 않고, 실패하면 데미지를 받습니다.
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
const DODGE_CHANCE = 0.999;

// 회피 시스템
world.afterEvents.entityHurt.subscribe((ev) => {
    const hurtEntity = ev.hurtEntity;  // 데미지를 받는 엔티티
    const damageSource = ev.damageSource;  // 데미지 소스 정보
    const attacker = damageSource.damagingEntity;  // 데미지를 주는 엔티티
    const damage = ev.damage;  // 받은 데미지 양

    // 데미지를 받는 대상이 플레이어이고 회피 태그가 있는지 확인
    if (hurtEntity.typeId === "minecraft:player" && hurtEntity.hasTag("회피")) {
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
                    // 데미지만큼 회복하기 위해 absorption 효과 사용
                    hurtEntity.runCommand(`effect @s absorption 1 0 true`);
                    hurtEntity.runCommand(`effect @s instant_health 5 0 true`);
                    
                    // 회피 성공 메시지
                    hurtEntity.runCommand(`tellraw @s {"rawtext":[{"text":"§b${damage}의 데미지를 회피했습니다!"}]}`);
                    
                    // 회피 성공 파티클 효과
                    hurtEntity.runCommand(`particle minecraft:enchanted_hit_particle ~~~`);
                } else {
                    // 회피 실패
                    hurtEntity.runCommand(`tellraw @s {"rawtext":[{"text":"§c회피 실패! ${damage}의 데미지를 받았습니다."}]}`);
                    
                    // 회피 실패 파티클 효과
                    hurtEntity.runCommand(`particle minecraft:villager_angry ~~~`);
                }

                // 마지막 회피 시도 시간 업데이트
                lastDodgeTime.set(hurtEntity.id, currentTime);
            }
        } catch (error) {
            console.warn("회피 처리 중 오류 발생:", error);
        }
    }
});
