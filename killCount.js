/**
 * Kill Count System - PvP 킬 카운트 시스템
 *
 * [ 기능 설명 ]
 * - 플레이어가 다른 플레이어를 처치할 때마다 킬 수를 카운트합니다.
 * - 스코어보드에 킬 수가 표시됩니다.
 * - 특정 플레이어 사망 시 별도 메시지를 출력합니다.
 *
 * [ 사용 가능한 명령어 ]
 * - "카운트": 킬 카운트 스코어보드를 초기화하고 활성화합니다.
 * - "초기화": 모든 플레이어의 킬 수를 0으로 초기화합니다.
 *
 * [ 사용 방법 ]
 * 1. 채팅창에 "카운트"를 입력하여 시스템을 시작합니다.
 * 2. 플레이어가 다른 플레이어를 처치하면 자동으로 킬 수가 증가합니다.
 * 3. "초기화"를 입력하면 모든 킬 수가 0으로 리셋됩니다.
 *
 * [ 특수 기능 ]
 * - "스티브"라는 이름의 플레이어가 사망하면 특별한 메시지가 출력됩니다.
 *
 * [ 주의사항 ]
 * - PvP(플레이어 대 플레이어) 전투에만 작동합니다.
 * - 몹을 처치해도 카운트되지 않습니다.
 */

import {
    world
} from '@minecraft/server';

console.warn(`불러옴`)

//스코어보드값 약속하는 채팅명령어
world.afterEvents.chatSend.subscribe(e => {
    const msg = e.message
    if (msg == "카운트") {
        e.sender.runCommand("say 카운트를 시작합니다.")
        e.sender.runCommand("scoreboard objectives add kill dummy kill")
        e.sender.runCommand("scoreboard objectives setdisplay sidebar kill")
        e.sender.runCommand("scoreboard players add @a kill 0")
    }
    if (msg == "초기화") {
        e.sender.runCommand("say 초기화되었습니다.")
        e.sender.runCommand("scoreboard players set @a kill 0")
    }
})


//죽음 횟수 카운트 
world.afterEvents.entityDie.subscribe(e => {
    const kill = e.damageSource.damagingEntity //죽인 엔티티
    const die = e.deadEntity //죽은 엔티티
    if (kill.typeId == "minecraft:player") { //만약 죽인 엔티티가 플레이어라면
        if (die.typeId == "minecraft:player") { //만약 죽은 엔티티가 플레이어라면

            //작동할 커맨드
            world.sendMessage(`플레이어가 사망했습니다.`)
            kill.runCommand('scoreboard players add @s kill 1')

        }
    }
    if (kill.typeId == "minecraft:player") { //만약 죽인 엔티티가 플레이어라면
        if (die.typeId == "minecraft:player") { //만약 죽인 엔티티가 플레이어라면
            if (die.nameTag == "스티브") { //만약 죽은 엔티티 이름이 '스티브'라면

                //작동할 커맨드
                kill.runCommand('say 스티브가 죽었습니다.')


            }
        }
    }
})
