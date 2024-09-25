import * as server from "@minecraft/server"
import * as ui from "@minecraft/server-ui"

const { world } = server;
// 커스텀 명령어 
world.beforeEvents.chatSend.subscribe(e => {

    const msg = e.message

    if (msg == "명령어1") {
        e.cancel = true; //입력한 명령어가 안보이게함
        e.sender.runCommandAsync("say 명령어1을 실행함")
    }
    if (msg == "명령어2") {
        e.sender.runCommandAsync("say 명령어2를 실행함")
        e.sender.runCommandAsync("give @s apple")
    }
    if (msg == "명령어3") {
        e.sender.runCommandAsync("say 명령어3을 실행함")
        e.sender.runCommandAsync("effect @s speed")
        e.sender.runCommandAsync("")
    }
})
