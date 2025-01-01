import { world, system } from "@minecraft/server"

/**
 * 대쉬 스킬 시스템 (Dash Skill System)
 * 
 * 사용 방법:
 * 1. 기본 사용:
 *    - 종이 아이템을 들고 우클릭하면 대쉬 스킬이 발동됩니다
 *    - 보고 있는 방향으로 빠르게 이동합니다
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
 * 
 * 4. 설정 예시:
 *    // 더 강한 대쉬
 *    DASH_SETTINGS.forwardPower = 8;    // 전방 이동 강도 증가
 *    DASH_SETTINGS.upwardPower = 1;     // 수직 이동 강도 증가
 * 
 *    // 낮게 빠르게 이동
 *    DASH_SETTINGS.forwardPower = 10;   // 매우 강한 전방 이동
 *    DASH_SETTINGS.upwardPower = 0.1;   // 거의 띄우지 않음
 * 
 *    // 높이 점프
 *    DASH_SETTINGS.forwardPower = 3;    // 약한 전방 이동
 *    DASH_SETTINGS.upwardPower = 2;     // 높은 수직 이동
 * 
 * 5. 주의사항:
 *    - 너무 높은 값을 설정하면 플레이어가 매우 멀리 날아갈 수 있습니다
 *    - 적절한 값을 테스트하며 설정하세요
 */

// 대쉬 스킬 설정
const DASH_SETTINGS = {
    // 아이템 설정
    itemType: "minecraft:paper",     // 사용할 아이템
    itemName: "대쉬",        // 아이템 이름 (이름이 있는 경우에만 작동)

    // 대쉬 강도 설정
    forwardPower: 5,                // 전방 이동 강도 (기본값: 5)
    upwardPower: 0.5,               // 수직 이동 강도 (기본값: 0.5)

    // 메시지 설정
    message: "§a대쉬 스킬을 사용했습니다!"  // 사용 시 표시될 메시지
};

world.beforeEvents.itemUse.subscribe(e => {
    system.run(() => {
        const player = e.source
        const item = e.itemStack
        const { x, z } = player.getViewDirection()

        // 아이템 이름이 설정된 경우 이름도 확인
        if (item.typeId === DASH_SETTINGS.itemType && 
            (!DASH_SETTINGS.itemName || item.nameTag === DASH_SETTINGS.itemName)) {
            
            player.applyKnockback(
                x,
                z,
                DASH_SETTINGS.forwardPower,  // 설정된 전방 이동 강도 사용
                DASH_SETTINGS.upwardPower    // 설정된 수직 이동 강도 사용
            )
            player.sendMessage(DASH_SETTINGS.message)
        }
    })
})
