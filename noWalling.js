import {
    world,
    system
} from '@minecraft/server';

console.warn(`불러옴`) // 제대로 코드가 불러왔는지 확인

const chat_length = 10 // 채팅 글자 제한
const chat_speed = 10; // 채팅 속도 (1틱 = 0.05초)

system.runInterval(() => { // 주기적으로 실행되는 함수
    world.getDimension("overworld").runCommandAsync(`scoreboard objectives add chat_speed dummy`); // "chat_speed"라는 스코어보드 목표를 만듦
    world.getDimension("overworld").runCommandAsync(`scoreboard players add @a chat_speed 0`); // 모든 플레이어에 대해 "chat_speed" 스코어를 추가
    for (const player of world.getAllPlayers()) { // 모든 플레이어에 대해 반복
        if (getScore(player, "chat_speed") > 0) { // 플레이어의 채팅 속도가 0보다 크면
            player.runCommandAsync(`scoreboard players remove @s chat_speed 1`) // 채팅 속도를 1 감소시킴
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
        player.runCommandAsync(`scoreboard players set @s chat_speed ${chat_speed}`) // 플레이어의 채팅 속도를 설정
        player.setDynamicProperty("lastChat", msg) // 플레이어의 마지막 채팅 내용을 저장
    }
})

// 스코어보드 값을 가져오는 함수
function getScore(entity, id) {
    return world.scoreboard.getObjective(id).getScore(entity)
}
