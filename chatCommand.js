import * as server from "@minecraft/server" 
import * as ui from "@minecraft/server-ui" 

const { world } = server; 
// 커스텀 명령어 
world.afterEvents.chatSend.subscribe(e => { 

    const msg = e.message 

    if (msg == "명령어1") { 
        e.sender.runCommand("say 명령어1을 실행함") 
    } 
    if (msg == "명령어2") { 
        e.sender.runCommand("say 명령어2를 실행함") 
        e.sender.runCommand("give @s apple") 
    } 
    if (msg == "명령어3") { 
        e.sender.runCommand("say 명령어3을 실행함") 
        e.sender.runCommand("effect @s speed") 
        e.sender.runCommand("") 
    } 
})
