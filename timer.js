console.warn("불러옴") 

import { world, system } from "@minecraft/server"; 

// 플레이어 메시지를 저장할 변수 
let sec = 0; 
let countingIs = false; 

// 플레이어가 메시지를 입력할 때마다 호출되는 이벤트 핸들러 
world.afterEvents.chatSend.subscribe((event) => { 
    const player = event.sender; 
    const message = event.message; 

    // '카운트다운'이라는 단어가 포함된 경우에만 변수에 저장 
    if (message.includes('카운트다운')) { 
        // '카운트다운'이라는 단어를 빼고 저장 
        const messageToSave = message.replace('카운트다운', '').trim(); 

        // 입력한 메시지가 숫자인지 확인 
        if (isNaN(messageToSave)) { 
            player.sendMessage("카운트다운 뒤에는 숫자를 입력해주세요."); 
            return; 
        } 

        sec = messageToSave; 
        console.log(`${sec}초 카운트다운 시작`); 
        world.getDimension("overworld").runCommandAsync(`title @a title ${sec}초 카운트다운 시작`); 
        countingIs = true; 
    } 

    // '정지' 입력하면 카운트다운 멈추기  
    if (message === "정지") { 
        sec = 0; 
        console.log(`정지하기`); 
        countingIs = false; 
    } 
}); 

// 남은 시간을 출력하는 함수 
function printStoredMessage() { 
    if (countingIs && sec > 0) { 
        sec--; 
        world.getDimension("overworld").runCommandAsync(`title @a actionbar 남은 시간: ${sec}초`); 
    } else if (sec === 0 && countingIs) { 
        countingIs = false; 
        world.getDimension("overworld").runCommandAsync(`title @a actionbar 남은 시간: ${sec}초`); 
        world.getDimension("overworld").runCommandAsync(`title @a title 시간 종료`); 
    } 
} 

// 시간 간격 설정: 20틱마다 실행 (1초에 한 번)
const interval = 20;

// system.runInterval을 사용하여 주기적으로 실행
system.runInterval(printStoredMessage, interval);
