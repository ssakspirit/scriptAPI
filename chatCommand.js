/**
 * Chat Command System - 채팅 명령어 시스템
 *
 * [ 기능 설명 ]
 * - 채팅창에 특정 키워드를 입력하면 미리 설정된 명령이 실행됩니다.
 * - 각 명령어마다 다른 동작을 수행할 수 있습니다.
 *
 * [ 사용 가능한 명령어 ]
 * - 명령어1: 확인 메시지를 표시합니다.
 * - 명령어2: 확인 메시지를 표시하고 사과 아이템 1개를 지급합니다.
 * - 명령어3: 확인 메시지를 표시하고 신속 효과를 10초간 부여합니다.
 *
 * [ 명령어 추가 방법 ]
 * switch 문에 새로운 case를 추가하여 명령어를 확장할 수 있습니다.
 * 예시:
 * case "새명령어":
 *     player.sendMessage("새로운 명령어 실행");
 *     // 원하는 동작 추가
 *     break;
 *
 * [ 주의사항 ]
 * - 명령어는 대소문자를 구분합니다.
 * - 명령어를 입력한 플레이어에게만 효과가 적용됩니다.
 */

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
