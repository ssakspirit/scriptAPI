/**
 * Block Break Notification & Diamond Counter System
 * 블록 파괴 알림 및 다이아몬드 카운터 시스템
 *
 * [ 기능 설명 ]
 * 1. 블록 파괴 알림:
 *    - 플레이어가 블록을 파괴할 때마다 액션바에 알림 메시지가 표시됩니다.
 *    - 메시지 형식: "[플레이어 이름]가 [블록 이름]를 캤습니다."
 *
 * 2. 다이아몬드 채굴 카운터:
 *    - 플레이어가 다이아몬드 광석을 캘 때마다 자동으로 카운트됩니다.
 *    - 일반 다이아몬드 광석과 심층암 다이아몬드 광석 모두 지원됩니다.
 *    - 스코어보드에 다이아몬드 채굴 수가 표시됩니다.
 *
 * [ 사용 방법 ]
 * 1. 채팅창에 "1"을 입력하면 다이아몬드 스코어보드가 초기화되고 설정됩니다.
 * 2. 이후 다이아몬드를 캘 때마다 자동으로 카운트가 증가합니다.
 *
 * [ 주의사항 ]
 * - 스코어보드는 모든 플레이어에게 표시됩니다.
 * - "1" 명령어를 실행하면 모든 플레이어의 다이아몬드 카운트가 0으로 초기화됩니다.
 */

import { world } from "@minecraft/server";

console.warn("불러옴")  

world.beforeEvents.playerBreakBlock.subscribe((event) => { 
    const playername = event.player.name; 
    const block = event.block.typeId; 

    world.getDimension("overworld").runCommandAsync(`title @a actionbar ${playername}가 ${block}를 캤습니다.`); 

    if (block === "minecraft:diamond_ore" || block === "minecraft:deepslate_diamond_ore") { 

        world.getDimension("overworld").runCommandAsync(`scoreboard players add ${playername} diamond 1`); 
    } 

}); 

// 커스텀 명령어
world.afterEvents.chatSend.subscribe(e => {

    const msg = e.message

    if (msg == "1") {
        e.sender.runCommand("scoreboard objectives add diamond dummy 다이아몬드")
        e.sender.runCommand("scoreboard objectives setdisplay sidebar diamond")
        e.sender.runCommand("/scoreboard players set @a diamond 0")

    }
})
