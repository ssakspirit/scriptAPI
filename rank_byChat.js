/*
사용법:
1. 이 스크립트를 Minecraft Bedrock Edition의 행동 팩에 포함시킵니다.
2. 행동 팩을 월드에 적용합니다.
3. 게임 내에서 다음 채팅 명령어를 사용하여 칭호를 관리할 수 있습니다:
   - !칭호 : 칭호 명령어의 사용법을 확인합니다.
   - !칭호 설정 <칭호> : 새로운 칭호를 설정합니다. 칭호는 최대 10글자까지 가능합니다.
   - !칭호 삭제 : 현재 설정된 칭호를 삭제합니다.
4. 칭호가 설정되면 채팅 시 플레이어 이름 앞에 칭호가 표시됩니다.
5. 플레이어의 머리 위 이름 태그에도 칭호가 표시됩니다.

주의사항:
- 칭호는 최대 10글자로 제한됩니다.
- 칭호가 없는 플레이어는 '뉴비'로 표시됩니다.
- 이름 태그는 2틱마다 업데이트되어 위치 스푸핑을 방지합니다.
*/

import { world, system } from '@minecraft/server';

// 일정 간격으로 플레이어 칭호 업데이트 함수를 실행 (2 틱마다 실행)
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const rank = player.getDynamicProperty(`rank`)
        if (typeof rank == "undefined") {
            player.nameTag = "[ 뉴비 ] " + player.name
        } else {
            player.nameTag = "[ " + rank + " ] " + player.name
        }
    }
}, 2)//위치독 방지를 위해 2틱마다 실행

// 채팅 이벤트를 구독하여 명령어 처리
world.beforeEvents.chatSend.subscribe((data) => {
    const player = data.sender;
    const msg = data.message.toLowerCase();
    const args = msg.split(" ");
    
    if (args[0] === "!칭호") {
        data.cancel = true; // 채팅 메시지가 전송되지 않도록 취소
        handleRankCommand(player, args);
    } else {
        // 기존의 채팅 처리 로직
        const rank = player.getDynamicProperty(`rank`);
        const name = player.name;
        data.cancel = true;
        if (typeof rank == "undefined") {
            world.sendMessage(`<뉴비> <${name}> ${data.message}`);
        } else {
            world.sendMessage(`<${rank}> <${name}> ${data.message}`);
        }
    }
});

// 칭호 명령어 처리 함수
function handleRankCommand(player, args) {
    if (args.length === 1) {
        player.sendMessage("§e사용법: !칭호 설정 <칭호> 또는 !칭호 삭제");
    } else if (args[1] === "설정" && args.length > 2) {
        const newRank = args.slice(2).join(" ");
        if (newRank.length > 10) {
            player.sendMessage("§c칭호는 최대 10글자입니다.");
        } else {
            player.setDynamicProperty(`rank`, newRank);
            player.sendMessage(`§a칭호가 '${newRank}'으로 설정되었습니다.`);
        }
    } else if (args[1] === "삭제") {
        player.setDynamicProperty(`rank`, undefined);
        player.sendMessage("§a칭호가 삭제되었습니다.");
    } else {
        player.sendMessage("§c잘못된 명령어입니다. !칭호 설정 <칭호> 또는 !칭호 삭제를 사용하세요.");
    }
}
