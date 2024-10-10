import { world, system } from "@minecraft/server"

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        player.nameTag = ""
    }
}, 2)
