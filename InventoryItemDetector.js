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
