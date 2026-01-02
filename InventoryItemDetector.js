/**
 * Inventory Item Detector - 인벤토리 아이템 감지 시스템
 *
 * [ 기능 설명 ]
 * - 특정 아이템을 사용하면 인벤토리 내에서 해당 아이템을 모두 찾아 표시합니다.
 * - 각 아이템의 위치(슬롯 번호)와 개수를 알려줍니다.
 *
 * [ 사용 방법 ]
 * 1. 다이아몬드 아이템을 사용(우클릭)합니다.
 * 2. 인벤토리 내의 모든 다이아몬드 위치와 개수가 채팅창에 표시됩니다.
 * 3. 예시 메시지: "슬롯 1에 다이아몬드가 5개 있습니다."
 *
 * [ 커스터마이징 ]
 * - typeId를 변경하여 다른 아이템으로 설정할 수 있습니다.
 * - 감지할 아이템 종류도 변경 가능합니다.
 *
 * [ 주의사항 ]
 * - 슬롯 번호는 1부터 시작합니다 (실제 인덱스는 0부터).
 * - 인벤토리의 모든 슬롯을 검사합니다.
 */

import { world } from '@minecraft/server';

console.warn(`불러옴`); // 코드가 불러왔는지 확인

// 아이템 사용 이벤트 구독
world.afterEvents.itemUse.subscribe((event) => {
    const item = event.itemStack; // 사용된 아이템 가져오기
    const player = event.source;  // 아이템을 사용한 플레이어

    if (item && item.typeId === "minecraft:diamond") { // 다이아몬드 아이템을 사용했는지 확인
        const inventoryComponent = player.getComponent("minecraft:inventory"); // 플레이어의 인벤토리 컴포넌트 가져오기
        const inventoryContainer = inventoryComponent.container; // 인벤토리 컨테이너 가져오기

        for (let i = 0; i < inventoryContainer.size; i++) { // 인벤토리 슬롯 수만큼 반복
            const inventoryItem = inventoryContainer.getItem(i); // 인벤토리 슬롯의 아이템 가져오기
            if (inventoryItem && inventoryItem.typeId === "minecraft:diamond") { // 다이아몬드를 감지
                player.sendMessage(`슬롯 ${i + 1}에 다이아몬드가 ${inventoryItem.amount}개 있습니다.`); // 다이아몬드 개수 출력
            }
        }
    }
});
