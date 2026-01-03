/*
 * DamageReflectionSystem - 데미지 반사 시스템
 * 
 * [설명]
 * 이 스크립트는 특정 태그를 가진 플레이어가 공격을 받았을 때
 * 받은 데미지를 공격자에게 그대로 반사하는 기능을 제공합니다.
 * 
 * [사용 방법]
 * 1. 플레이어에게 "반사" 태그를 부여합니다.
 *    명령어: /tag <플레이어이름> add 반사
 * 
 * 2. 태그가 부여된 플레이어가 공격을 받으면:
 *    - 받은 데미지가 공격자에게 반사됩니다
 *    - 공격자 주변에 크리티컬 히트 파티클이 표시됩니다
 *    - 채팅창에 반사된 데미지량이 표시됩니다
 * 
 * [태그 제거 방법]
 * - 데미지 반사 기능을 비활성화하려면 태그를 제거하세요
 *   명령어: /tag <플레이어이름> remove 반사
 */

import { world, system } from "@minecraft/server";
import { EntityHurtAfterEvent, EntityHurtAfterEventSignal } from "@minecraft/server";

// Reflex 태그를 가진 플레이어의 데미지 반사 처리
world.afterEvents.entityHurt.subscribe((ev) => {
    const hurtEntity = ev.hurtEntity;  // 데미지를 받는 엔티티
    const damageSource = ev.damageSource;  // 데미지 소스 정보
    const attacker = damageSource.damagingEntity;  // 데미지를 주는 엔티티

    // 데미지를 받는 대상이 플레이어이고 반사 태그가 있는지 확인
    if (hurtEntity.typeId === "minecraft:player" && hurtEntity.hasTag("반사")) {
        // 공격자가 존재하고 플레이어나 몹인 경우에만 처리
        if (attacker) {
            const damage = ev.damage;  // 받은 데미지 양

            try {
                // 데미지가 유효한 숫자인지 확인
                if (isNaN(damage) || damage <= 0) {
                    console.warn("유효하지 않은 데미지 값:", damage);
                    return;
                }

                // 공격자에게 데미지 반사
                attacker.applyDamage(damage);

                // 공격자 위치에 파티클 효과 표시
                const loc = attacker.location;
                try {
                    attacker.runCommand(`particle minecraft:critical_hit_emitter ~~~`);
                } catch (particleError) {
                    console.warn("파티클 효과 표시 실패:", particleError);
                }

                // 반사 메시지 표시 (tellraw 대신 sendMessage 사용)
                hurtEntity.sendMessage(`§a${damage}의 데미지를 반사했습니다!`);
            } catch (error) {
                console.warn("데미지 반사 처리 중 오류 발생:", error);
            }
        }
    }
});

