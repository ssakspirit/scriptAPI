import { world, system } from "@minecraft/server";

// 아이템 사용 이벤트 등록
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;

    // 아이템이 시계일 때만 실행
    if (event.itemStack.typeId === "minecraft:clock") {
        // 플레이어의 시선 방향 가져오기
        const viewDirection = player.getViewDirection();

        // 플레이어 앞쪽의 위치 계산
        const spawnPos = {
            x: player.location.x + viewDirection.x,
            y: player.location.y + 1.5,
            z: player.location.z + viewDirection.z,
        };

        // 엔티티 생성 및 속도 설정
        system.run(() => {
            try {
                // 투사체를 화살로 생성
                const projectile = player.dimension.spawnEntity("minecraft:arrow", spawnPos);

                // 속도 설정 (필요한 API를 사용하여 속도를 올바르게 적용)
                const speed = 2; // 속도를 조정
                projectile.applyImpulse({
                    x: viewDirection.x * speed,
                    y: viewDirection.y * speed,
                    z: viewDirection.z * speed,
                });

                player.sendMessage("§a화살을 발사했습니다!"); // 성공 메시지
            } catch (error) {
                player.sendMessage(`§c오류 발생: ${error.message}`); // 오류 메시지
            }
        });
    }
});
