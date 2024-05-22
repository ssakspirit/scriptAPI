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
