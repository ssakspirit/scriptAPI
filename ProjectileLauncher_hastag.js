import { world, system } from "@minecraft/server";

/*
 * 사용 방법:
 * 이 스크립트는 플레이어가 특정 아이템을 사용했을 때 여러 개의 화살을 발사하고,
 * 발사된 화살이 블록에 충돌했을 때 폭발하도록 합니다.
 * 
 * 사용자가 수정할 수 있는 부분:
 * - itemType: 화살을 발사하는 데 사용할 아이템의 종류를 설정합니다. 기본값은 "minecraft:clock"입니다.
 * - baseSpeed: 화살의 기본 속도를 조정합니다. 기본값은 4입니다.
 * - arrowCount: 발사할 화살의 개수를 조정합니다. 기본값은 5입니다.
 * - angleSpread: 화살의 퍼짐 각도를 조정합니다. 기본값은 0.2입니다.
 */

const itemType = "minecraft:clock"; // 사용할 아이템 종류

// 화살 발사 이벤트 (여러 개의 화살 발사)
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;

    // 아이템이 설정된 종류일 때만 실행
    if (event.itemStack.typeId === itemType) {
        const viewDirection = player.getViewDirection();
        const baseSpeed = 4; // 화살의 기본 속도
        const arrowCount = 5; // 발사할 화살 개수
        const angleSpread = 0.2; // 퍼짐 각도

        for (let i = 0; i < arrowCount; i++) {
            // 화레이어의 시선 방향 벡터 가져오기
            const viewDirection = player.getViewDirection();
            
            // 화살 생성 위치 계산 (플레이어 머리 위에서 시작)
            const spawnPos = {
                x: player.location.x + viewDirection.x * 2,  // 2블록 앞으로
                y: player.location.y + 1.8 + viewDirection.y * 2,  // 머리 위 + 시선 방향
                z: player.location.z + viewDirection.z * 2   // 2블록 앞으로
            };

            // 각도 오프셋 계산 (시선 방향 기준)
            const offsetX = viewDirection.x + Math.random() * angleSpread - angleSpread / 2;
            const offsetY = viewDirection.y + Math.random() * angleSpread - angleSpread / 2;
            const offsetZ = viewDirection.z + Math.random() * angleSpread - angleSpread / 2;

            // 방향 벡터 정규화
            const length = Math.sqrt(offsetX * offsetX + offsetY * offsetY + offsetZ * offsetZ);
            const normalizedDirection = {
                x: offsetX / length,
                y: offsetY / length,
                z: offsetZ / length
            };

            system.run(() => {
                try {
                    const projectile = player.dimension.spawnEntity("minecraft:arrow", spawnPos);
                    
                    // 화살에 플레이어 ID와 함께 태그 추가
                    projectile.addTag(`owner:${player.name}`);
                    projectile.addTag("clock_shot");

                    // 정규화된 방향으로 속도 적용
                    projectile.applyImpulse({
                        x: normalizedDirection.x * baseSpeed,
                        y: normalizedDirection.y * baseSpeed,
                        z: normalizedDirection.z * baseSpeed,
                    });

                } catch (error) {
                    player.sendMessage(`§c오류 발생: ${error.message}`);
                }
            });
        }

        player.sendMessage("§a여러 개의 화살을 발사했습니다!");
    }
});

// 화살이 블록에 충돌했을 때 폭발
world.afterEvents.projectileHitBlock.subscribe((event) => {
    const projectile = event.projectile;

    // 화살만 처리
    if (projectile.typeId === "minecraft:arrow" && projectile.hasTag("clock_shot")) { // 태그 확인
        const blockHit = event.getBlockHit();
        if (blockHit) {
            const hitLocation = blockHit.block.location;

            // 비동기적으로 폭발 처리
            system.run(() => {
                if (projectile.isValid()) { // 화살이 유효한지 확인
                    projectile.dimension.createExplosion(hitLocation, 4, {
                        causesFire: false,
                        breaksBlocks: true,
                    });
                }
            });
        }
    }
});

// 화살이 엔티티에 맞았을 때 처리
world.afterEvents.projectileHitEntity.subscribe((event) => {
    const projectile = event.projectile;
    const hitEntity = event.getEntityHit().entity;

    // 화살이 플레이어가 쏜 것인지 확인
    if (projectile.typeId === "minecraft:arrow" && projectile.hasTag("clock_shot")) {
        // 맞은 엔티티가 플레이어이고, 화살의 소유자인 경우 데미지 무시
        if (hitEntity.typeId === "minecraft:player" && 
            projectile.getTags().some(tag => tag === `owner:${hitEntity.name}`)) {
            projectile.kill(); // 화살 제거
            return; // 추가 처리 중단
        }
    }
});
