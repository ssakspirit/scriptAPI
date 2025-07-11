import * as server from "@minecraft/server"
import * as ui from "@minecraft/server-ui"

import { world, ItemStack } from "@minecraft/server";

// 더 안전한 코드 구조
world.afterEvents.chatSend.subscribe((event) => {
    const msg = event.message;
    const player = event.sender;

    switch (msg) {
        case "명령어1":
            player.sendMessage("명령어1을 실행함");
            break;
        case "명령어2":
            player.sendMessage("명령어2를 실행함");
            player.getComponent("inventory").container.addItem(new ItemStack("minecraft:apple", 1));
            break;
        case "명령어3":
            player.sendMessage("명령어3을 실행함");
            player.addEffect("minecraft:speed", 200, { amplifier: 1 });
            break;
    }
});
