/**
 * Countdown Timer System - 카운트다운 타이머 시스템
 *
 * [ 기능 설명 ]
 * - 채팅으로 카운트다운 타이머를 시작할 수 있는 시스템입니다.
 * - 화면에 남은 시간이 타이틀로 표시됩니다.
 * - 타이머가 0이 되면 종료 메시지가 표시됩니다.
 *
 * [ 사용 방법 ]
 * 1. 채팅창에 "카운트다운 [초]"를 입력합니다.
 *    예시: "카운트다운 60" (60초 카운트다운 시작)
 *
 * 2. 카운트다운이 시작되면 모든 플레이어에게 타이틀로 남은 시간이 표시됩니다.
 *
 * 3. 카운트다운을 중지하려면 "정지"를 입력합니다.
 *
 * [ 명령어 ]
 * - "카운트다운 [숫자]": 카운트다운을 시작합니다.
 * - "정지": 진행 중인 카운트다운을 중지합니다.
 *
 * [ 주의사항 ]
 * - 한 번에 하나의 카운트다운만 실행할 수 있습니다.
 * - 카운트다운 뒤에는 반드시 숫자를 입력해야 합니다.
 * - 카운트다운은 1초 단위로 진행됩니다.
 */

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
    try {
        if (countingIs && sec > 0) {
            sec--;
            world.getDimension("overworld").runCommandAsync(`title @a actionbar 남은 시간: ${sec}초`);
        } else if (sec === 0 && countingIs) {
            countingIs = false;
            world.getDimension("overworld").runCommandAsync(`title @a actionbar 남은 시간: ${sec}초`);
            world.getDimension("overworld").runCommandAsync(`title @a title 시간 종료`);
        }
    } catch (error) {
        console.warn("타이머 업데이트 중 오류:", error);
    }
} 

// 시간 간격 설정: 20틱마다 실행 (1초에 한 번)
const interval = 20;

// system.runInterval을 사용하여 주기적으로 실행
system.runInterval(printStoredMessage, interval);
