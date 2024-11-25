import { world, system } from "@minecraft/server";

// 아이템 사용 이벤트 등록
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;

    // 아이템이 시계일 때만 실행
    if (event.itemStack.typeId === "minecraft:clock") {
        // 플레이어의 시선 방향 가져오기
        const viewDirection = player.getViewDirection();

        // 기본 속도 설정
        const baseSpeed = 7;

        // 발사 개수 및 각도 조정
        const arrowCount = 5; // 발사할 화살 개수
        const angleSpread = 0.1; // 각도 차이 (값이 클수록 퍼짐)

        for (let i = 0; i < arrowCount; i++) {
            // 플레이어 앞쪽의 위치 계산
            const spawnPos = {
                x: player.location.x + viewDirection.x,
                y: player.location.y + 1.5,
                z: player.location.z + viewDirection.z,
            };

            // 각도 오프셋 계산
            const offsetX = viewDirection.x + Math.random() * angleSpread - angleSpread / 2;
            const offsetY = viewDirection.y + Math.random() * angleSpread - angleSpread / 2;
            const offsetZ = viewDirection.z + Math.random() * angleSpread - angleSpread / 2;

            // 엔티티 생성 및 속도 설정
            system.run(() => {
                try {
                    // 투사체를 화살로 생성
                    const projectile = player.dimension.spawnEntity("minecraft:arrow", spawnPos);

                    // 속도 설정
                    projectile.applyImpulse({
                        x: offsetX * baseSpeed,
                        y: offsetY * baseSpeed,
                        z: offsetZ * baseSpeed,
                    });
                } catch (error) {
                    player.sendMessage(`§c오류 발생: ${error.message}`); // 오류 메시지
                }
            });
        }

        player.sendMessage("§a여러 개의 화살을 발사했습니다!"); // 성공 메시지
    }
});
