import { world, system } from "@minecraft/server"

/**
 * 대쉬 스킬 시스템 (Dash Skill System)
 * 
 * 사용 방법:
 * 1. 기본 사용:
 *    - 종이 아이템을 들고 우클릭하면 대쉬 스킬이 발동됩니다
 *    - 보고 있는 방향으로 빠르게 이동합니다
 *    - 대쉬 경로에 파티클 효과가 생성됩니다
 *    - 스킬 사용 후 5초간 쿨타임이 적용됩니다
 *    - 쿨타임은 액션바에 실시간으로 표시됩니다
 * 
 * 2. 아이템 설정:
 *    - 모루를 사용하여 종이의 이름을 "대쉬"로 변경하세요
 * 
 * 3. 설정 변경 방법:
 *    DASH_SETTINGS 객체에서 다음 값들을 수정할 수 있습니다:
 *    - itemType: 사용할 아이템 종류 (예: "minecraft:paper")
 *    - itemName: 아이템의 이름 (비워두면 이름 상관없이 작동)
 *    - forwardPower: 전방 이동 강도 (높을수록 더 멀리 이동)
 *    - upwardPower: 수직 이동 강도 (높을수록 더 높이 뜀)
 *    - message: 스킬 사용 시 표시될 메시지
 *    - particleType: 파티클 효과 종류
 *    - particleDuration: 파티클 지속 시간 (1초 = 20틱)
 *    - cooldown: 스킬 재사용 대기 시간 (초)
 * 
 * 4. 설정 예시:
 *    // 더 강한 대쉬
 *    DASH_SETTINGS.forwardPower = 8;    // 전방 이동 강도 증가
 *    DASH_SETTINGS.upwardPower = 1;     // 수직 이동 강도 증가
 *    DASH_SETTINGS.cooldown = 8;        // 쿨타임 증가
 * 
 *    // 낮게 빠르게 이동
 *    DASH_SETTINGS.forwardPower = 10;   // 매우 강한 전방 이동
 *    DASH_SETTINGS.upwardPower = 0.1;   // 거의 띄우지 않음
 *    DASH_SETTINGS.cooldown = 3;        // 짧은 쿨타임
 * 
 *    // 높이 점프
 *    DASH_SETTINGS.forwardPower = 3;    // 약한 전방 이동
 *    DASH_SETTINGS.upwardPower = 2;     // 높은 수직 이동
 *    DASH_SETTINGS.cooldown = 6;        // 긴 쿨타임
 * 
 * 5. 쿨타임 시스템:
 *    - 스킬 사용 직후부터 쿨타임이 시작됩니다
 *    - 쿨타임 중에는 스킬을 사용할 수 없습니다
 *    - 남은 쿨타임이 액션바에 실시간으로 표시됩니다
 *    - 쿨타임 중 스킬 사용 시도 시 남은 시간이 채팅창에 표시됩니다
 *    - 쿨타임은 플레이어별로 독립적으로 적용됩니다
 * 
 * 6. 주의사항:
 *    - 너무 높은 값을 설정하면 플레이어가 매우 멀리 날아갈 수 있습니다
 *    - 적절한 값을 테스트하며 설정하세요
 *    - 쿨타임이 너무 짧으면 게임 밸런스가 깨질 수 있습니다
 */

// 대쉬 스킬 설정
const DASH_SETTINGS = {
    // 아이템 설정
    itemType: "minecraft:paper",     // 사용할 아이템
    itemName: "대쉬",               // 아이템 이름 (이름이 있는 경우에만 작동)

    // 대쉬 강도 설정
    forwardPower: 5,                // 전방 이동 강도 (기본값: 5)
    upwardPower: 0.5,               // 수직 이동 강도 (기본값: 0.5)

    // 메시지 설정
    message: "§a대쉬 스킬을 사용했습니다!",  // 사용 시 표시될 메시지

    // 파티클 설정
    particleType: "minecraft:dragon_breath_trail", // 파티클 종류
    particleDuration: 20,           // 파티클 지속 시간 (1초 = 20틱)

    // 쿨타임 설정
    cooldown: 5                     // 쿨타임 (초)
};

// 쿨타임 관리를 위한 Map
const cooldowns = new Map();

// 쿨타임 체크 함수
function isOnCooldown(player) {
    if (!cooldowns.has(player.name)) return false;
    return Date.now() < cooldowns.get(player.name);
}

// 쿨타임 설정 함수
function setCooldown(player) {
    cooldowns.set(player.name, Date.now() + (DASH_SETTINGS.cooldown * 1000));
}

// 남은 쿨타임 계산 함수
function getRemainingCooldown(player) {
    if (!cooldowns.has(player.name)) return 0;
    const remaining = (cooldowns.get(player.name) - Date.now()) / 1000;
    return remaining > 0 ? remaining : 0;
}

// 쿨타임 표시 인터벌
system.runInterval(() => {
    try {
        for (const player of world.getAllPlayers()) {
            const remaining = getRemainingCooldown(player);
            if (remaining > 0) {
                // 쿨타임을 액션바에 표시
                player.onScreenDisplay.setActionBar(`§c대쉬 쿨타임: ${remaining.toFixed(1)}초`);
            }
        }
    } catch (error) {
        console.warn("쿨타임 표시 중 오류:", error);
    }
}, 1);

// 파티클 생성 함수
function createParticles(player) {
    const pos = player.location;
    player.runCommandAsync(`particle ${DASH_SETTINGS.particleType} ${pos.x} ${pos.y} ${pos.z}`);
}

// 대쉬 스킬 사용 이벤트
world.beforeEvents.itemUse.subscribe(e => {
    system.run(() => {
        const player = e.source;
        const item = e.itemStack;
        const direction = player.getViewDirection();

        if (item?.typeId === DASH_SETTINGS.itemType && 
            (!DASH_SETTINGS.itemName || item.nameTag === DASH_SETTINGS.itemName)) {
            
            // 쿨타임 체크
            if (isOnCooldown(player)) {
                const remaining = getRemainingCooldown(player);
                player.sendMessage(`§c대쉬 스킬이 쿨타임입니다. (${remaining.toFixed(1)}초)`);
                return;
            }

            // 대쉬 실행
            player.applyKnockback(
                direction.x,
                direction.z,
                DASH_SETTINGS.forwardPower,
                DASH_SETTINGS.upwardPower
            );

            // 파티클 효과 시작
            let tickCount = 0;
            const particleInterval = system.runInterval(() => {
                createParticles(player);
                tickCount++;

                // 지정된 시간이 지나면 인터벌 중지
                if (tickCount >= DASH_SETTINGS.particleDuration) {
                    system.clearRun(particleInterval);
                }
            }, 1);
            
            // 쿨타임 설정
            setCooldown(player);
            
            player.sendMessage(DASH_SETTINGS.message);
        }
    });
});
