/**
 * Selected Slot Display System - 선택된 슬롯 표시 시스템
 *
 * [ 기능 설명 ]
 * - 플레이어가 현재 선택한 핫바 슬롯 번호와 해당 슬롯의 아이템 정보를 액션바에 실시간으로 표시합니다.
 * - 슬롯을 변경할 때마다 즉시 업데이트됩니다.
 *
 * [ 표시 형식 ]
 * "X번째 슬롯을 선택했습니다. (아이템 : 아이템이름)"
 * 예시: "0번째 슬롯을 선택했습니다. (아이템 : minecraft:diamond_sword)"
 *
 * [ 사용 방법 ]
 * - 스크립트를 활성화하면 자동으로 작동합니다.
 * - 별도의 설정이나 명령어가 필요하지 않습니다.
 * - 핫바에서 다른 슬롯을 선택하면 자동으로 정보가 업데이트됩니다.
 *
 * [ 주의사항 ]
 * - 슬롯 번호는 0부터 시작합니다 (0~8번).
 * - 슬롯에 아이템이 없으면 "없음"으로 표시됩니다.
 * - 2틱마다 업데이트되어 성능에 영향을 줄 수 있습니다.
 */

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
