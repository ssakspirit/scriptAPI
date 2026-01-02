/**
 * Inventory Item Counter - 인벤토리 아이템 카운터 시스템
 *
 * [ 기능 설명 ]
 * - 특정 아이템을 사용하면 인벤토리 내의 해당 아이템 총 개수를 표시합니다.
 * - 모든 슬롯에 있는 동일한 아이템의 개수를 합산하여 보여줍니다.
 *
 * [ 사용 방법 ]
 * 1. 아무 아이템이나 사용(우클릭)합니다.
 * 2. 인벤토리 내에 있는 해당 아이템의 총 개수가 채팅창에 표시됩니다.
 * 3. 예시 메시지: "전체 인벤토리에서 minecraft:diamond 아이템이 총 15개 있습니다."
 *
 * [ 주의사항 ]
 * - 모든 인벤토리 슬롯을 검사하여 합산합니다.
 * - 아이템 타입이 정확히 일치하는 아이템만 카운트됩니다.
 * - 장비 슬롯(갑옷, 오프핸드)은 포함되지 않습니다.
 */

import { world } from '@minecraft/server';

console.warn(`불러옴`); // 코드가 불러왔는지 확인

// 아이템 사용 이벤트 구독
world.afterEvents.itemUse.subscribe((event) => {
    const item = event.itemStack; // 사용한 아이템 가져오기
    const player = event.source;  // 아이템을 사용한 플레이어

    if (item) { // 사용된 아이템이 있는지 확인
        const itemTypeId = item.typeId; // 사용된 아이템의 타입 ID 가져오기
        const inventoryComponent = player.getComponent("minecraft:inventory"); // 플레이어의 인벤토리 컴포넌트 가져오기
        const inventoryContainer = inventoryComponent.container; // 인벤토리 컨테이너 가져오기

        let totalItems = 0; // 아이템 총 개수 초기화

        for (let i = 0; i < inventoryContainer.size; i++) { // 인벤토리 슬롯 수만큼 반복
            const inventoryItem = inventoryContainer.getItem(i); // 인벤토리 슬롯의 아이템 가져오기
            if (inventoryItem && inventoryItem.typeId === itemTypeId) { // 사용된 아이템과 동일한 아이템을 감지
                totalItems += inventoryItem.amount; // 아이템 개수 합산
            }
        }

        player.sendMessage(`전체 인벤토리에서 ${itemTypeId} 아이템이 총 ${totalItems}개 있습니다.`); // 아이템 총 개수 출력
    }
});
