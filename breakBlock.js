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
