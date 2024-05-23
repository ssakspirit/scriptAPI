import {
    world,
    system
} from '@minecraft/server';

console.warn(`불러옴`)

system.runInterval(() => { //반복문
    for (const player of world.getAllPlayers()) { //아래 스크립트를 모든 플레이어에게 실행
        const playerSlot = player.selectedSlot //플레이어 슬롯 가져오기
        const playerSlotItem = player.getComponent(`minecraft:inventory`).container.getItem(playerSlot) //슬롯에 있는 아이템 가져오기
        const playerSlotItemName = typeof playerSlotItem == "undefined" ? "없음" : playerSlotItem.typeId //삼항연산자를 사용해 슬롯에 아이템이 없으면 "없음" 있으면 아이템 이름 변수에 저장
        player.onScreenDisplay.setActionBar(`${playerSlot}번째 슬롯을 선택했습니다. (아이템 : ${playerSlotItemName})`) //슬롯 위치와 슬롯에 있는 아이템을 액션바에 표시
    }
}, 2) //2틱마다 실행
