import {
    world,
    system
} from '@minecraft/server';

console.warn(`불러옴`); // 제대로 코드가 불러왔는지 확인

system.runInterval(() => { // runInterval을 사용해 반복
    const players = world.getAllPlayers(); // 모든 플레이어 가져오기
    for (const player of players) { // 모든 플레이어에 대해 반복
        const inventoryComponent = player.getComponent("minecraft:inventory"); // 플레이어의 인벤토리 컴포넌트 가져오기
        const inventoryContainer = inventoryComponent.container; // 인벤토리 컨테이너 가져오기

        for (let i = 0; i < inventoryContainer.size; i++) { // 인벤토리 슬롯 수만큼 반복
            const item = inventoryContainer.getItem(i); // 인벤토리 슬롯의 아이템 가져오기
            if (item && item.typeId === "minecraft:diamond") { // 특정 아이템(여기서는 다이아몬드)을 감지
                player.sendMessage(`슬롯 ${i + 1}에 다이아몬드가 있습니다.`); // 메시지 출력
            }
        }
    }
}, 100); // 100틱마다 실행 (5초마다 실행)
