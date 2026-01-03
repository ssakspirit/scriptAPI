/**
 * Anti-Walling System - 채팅 스팸 방지 시스템
 *
 * [ 기능 설명 ]
 * - 채팅 도배(Walling)를 방지하는 시스템입니다.
 * - 채팅 글자 수 제한, 채팅 속도 제한, 중복 메시지 방지 기능이 있습니다.
 *
 * [ 제한 사항 ]
 * 1. 채팅 글자 수 제한: 최대 10글자까지만 입력 가능
 * 2. 채팅 속도 제한: 10틱(0.5초) 간격으로 채팅 가능
 * 3. 중복 메시지 방지: 이전 메시지와 동일한 내용 전송 불가
 *
 * [ 커스터마이징 ]
 * - chat_length: 채팅 최대 글자 수를 변경할 수 있습니다.
 * - chat_speed: 채팅 속도 제한 시간을 변경할 수 있습니다 (틱 단위, 1틱 = 0.05초).
 *
 * [ 경고 메시지 ]
 * - 글자 수 초과: "메시지가 너무 깁니다. 최대 (10글자)"
 * - 채팅 속도 제한: "채팅 속도가 너무 빠릅니다. (남은 시간 표시)"
 * - 중복 메시지: "이전 채팅이랑 똑같습니다."
 *
 * [ 주의사항 ]
 * - 스코어보드를 사용하여 채팅 속도를 관리합니다.
 * - Dynamic Property를 사용하여 이전 채팅 내용을 저장합니다.
 */

import {
    world,
    system
} from '@minecraft/server';

console.warn(`불러옴`) // 제대로 코드가 불러왔는지 확인

const chat_length = 10 // 채팅 글자 제한
const chat_speed = 10; // 채팅 속도 (1틱 = 0.05초)

system.runInterval(() => { // 주기적으로 실행되는 함수
    world.getDimension("overworld").runCommand(`scoreboard objectives add chat_speed dummy`); // "chat_speed"라는 스코어보드 목표를 만듦
    world.getDimension("overworld").runCommand(`scoreboard players add @a chat_speed 0`); // 모든 플레이어에 대해 "chat_speed" 스코어를 추가
    for (const player of world.getAllPlayers()) { // 모든 플레이어에 대해 반복
        if (getScore(player, "chat_speed") > 0) { // 플레이어의 채팅 속도가 0보다 크면
            player.runCommand(`scoreboard players remove @s chat_speed 1`) // 채팅 속도를 1 감소시킴
        }
    }
})

world.beforeEvents.chatSend.subscribe((data) => { // 채팅 전송 이벤트를 구독
    const msg = data.message // 전송된 메시지
    const player = data.sender // 채팅을 보낸 플레이어
    const chatSpeed = getScore(player, "chat_speed") // 플레이어의 채팅 속도

    // 이전 채팅과 내용이 같으면 채팅 전송이 취소됨
    if (player.getDynamicProperty("lastChat") == msg) {
        data.cancel = true // 이벤트 취소
        player.sendMessage(`§c이전 채팅이랑 똑같습니다.`) // 플레이어에게 메시지 전송
    } else if (msg.length > chat_length) { // 메시지의 길이가 제한을 초과하면
        data.cancel = true // 이벤트 취소
        player.sendMessage(`§c메시지가 너무 깁니다. 최대 (${chat_length}글자)`) // 플레이어에게 메시지 전송
    } else if (chatSpeed > 0) { // 채팅 속도가 0보다 크면
        data.cancel = true // 이벤트 취소
        player.sendMessage(`§c채팅 속도가 너무 빠릅니다. (${String(0.05 * chatSpeed).slice(0, 3)}초 남음)`)
        // 플레이어에게 메시지 전송, 0.05를 곱해 틱을 초로 바꾸고 소수점 셋째짜리까지 나타냄
    } else { // 위의 조건들에 해당되지 않으면
        player.runCommand(`scoreboard players set @s chat_speed ${chat_speed}`) // 플레이어의 채팅 속도를 설정
        player.setDynamicProperty("lastChat", msg) // 플레이어의 마지막 채팅 내용을 저장
    }
})

// 스코어보드 값을 가져오는 함수
function getScore(entity, id) {
    return world.scoreboard.getObjective(id).getScore(entity)
}
