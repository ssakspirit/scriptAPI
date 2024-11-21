import { world } from "@minecraft/server";

console.warn("아이템 강화 시스템이 로드되었습니다."); // 스크립트 로드 확인

// 플레이어별 마지막 클릭 시간을 저장할 맵
const lastClickTimes = new Map();
// 더블 클릭 간격 설정 (밀리초)
const DOUBLE_CLICK_INTERVAL = 500; // 0.5초 이내에 두 번 클릭

// 아이템 사용 이벤트 (마우스 오른쪽 클릭)
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;
    
    try {
        if (item) {
            const currentTime = Date.now();
            const lastClickTime = lastClickTimes.get(player.id) || 0;
            
            // 마지막 클릭과의 시간 간격 확인
            if (currentTime - lastClickTime <= DOUBLE_CLICK_INTERVAL) {
                // 더블 클릭 감지됨
                console.warn("아이템 더블 클릭 감지됨:", item.typeId);
                player.sendMessage(`§a아이템을 더블 클릭했습니다: §f${item.typeId}`);
                // 마지막 클릭 시간 초기화
                lastClickTimes.delete(player.id);
            } else {
                // 첫 번째 클릭 시간 저장
                lastClickTimes.set(player.id, currentTime);
            }
        }
    } catch (error) {
        console.warn("오류 발생:", error);
    }
});
