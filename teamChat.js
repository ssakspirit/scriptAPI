/*
팀 채팅 시스템 사용법:

1. 이 스크립트를 Minecraft Bedrock Edition의 행동 팩에 포함시킵니다.
2. 행동 팩을 월드에 적용합니다.
3. 게임 내에서 다음 명령어를 사용하여 팀 채팅 시스템을 이용할 수 있습니다:

   팀 설정:
   - !setteam <팀이름>
     예: !setteam 레드
     설명: 플레이어를 지정한 팀에 배정합니다. 기존 팀이 있었다면 새 팀으로 변경됩니다.
     관리자 팀 설정 명령어 (예: !adminsetteam <플레이어이름> <팀이름>) 단, 이명령어는 admin태그가 있는 플레이어만 사용할 수 있습니다.

   팀 채팅:
   - !t <메시지> 또는 !team <메시지>
     예: !t 안녕하세요, 팀원들!
     예: !team 작전을 시작합시다.
     설명: 같은 팀에 속한 플레이어들에게만 메시지를 전송합니다.

   팀 목록 확인:
   - !teamlist
     설명: 현재 설정된 모든 팀과 각 팀의 멤버 목록을 표시합니다.

4. 팀 채팅 메시지는 다른 팀 플레이어들에게는 보이지 않습니다.
5. 팀이 설정되지 않은 플레이어가 팀 채팅을 시도하면 오류 메시지가 표시됩니다.

주의사항:
- 팀 이름에는 공백을 사용할 수 없습니다. 한 단어로 된 팀 이름을 사용하세요.
- 팀 채팅 메시지는 일반 채팅창에 표시되지 않으므로, 비밀 대화가 가능합니다.
- 이 시스템은 플레이어의 동적 속성을 사용하여 팀을 구분합니다.
- 월드를 재시작하거나 플레이어가 재접속해도 팀 설정이 유지됩니다.
- 관리자는 필요에 따라 플레이어의 팀 설정을 수동으로 변경할 수 있습니다.

팁:
- 팀 확인: 자신의 현재 팀을 확인하려면 팀 채팅 명령어를 사용하세요. 팀이 설정되어 있지 않다면 알림을 받게 됩니다.
- 팀 변경: 새로운 팀으로 변경하고 싶다면, 단순히 !setteam 명령어를 새 팀 이름과 함께 사용하세요.
*/

import { world } from '@minecraft/server';

// 채팅 이벤트 구독
world.beforeEvents.chatSend.subscribe((chatEvent) => {
    const player = chatEvent.sender;
    const message = chatEvent.message;

    // 팀 채팅 명령어 확인 (예: !t 또는 !team으로 시작하는 메시지)
    if (message.startsWith('!t ') || message.startsWith('!team ')) {
        chatEvent.cancel = true; // 일반 채팅으로 전송되지 않도록 취소

        // 메시지에서 명령어 부분 제거
        const teamMessage = message.replace(/^(!t |!team )/, '');

        // 플레이어의 태그 또는 팀 확인
        const playerTeam = getPlayerTeam(player);

        if (playerTeam) {
            sendTeamMessage(player, teamMessage, playerTeam);
        } else {
            player.sendMessage('§c팀이 설정되지 않았습니다.');
        }
    }

    // 팀 목록 확인
    if (message.toLowerCase() === '!teamlist') {
        chatEvent.cancel = true;
        showTeamList(player);
    }
});

// 플레이어의 팀 또는 태그 확인
function getPlayerTeam(player) {
    return player.getDynamicProperty('team');
}

// 팀 메시지 전송
function sendTeamMessage(sender, message, team) {
    for (const player of world.getAllPlayers()) {
        if (getPlayerTeam(player) === team) {
            player.sendMessage(`§6[팀 채팅] §f${sender.name}: ${message}`);
        }
    }
}

// 팀 설정 명령어 (예: !setteam <팀이름>)
world.beforeEvents.chatSend.subscribe((chatEvent) => {
    const player = chatEvent.sender;
    const message = chatEvent.message;

    if (message.startsWith('!setteam ')) {
        chatEvent.cancel = true;
        const team = message.split(' ')[1];
        setPlayerTeam(player, team);
    }
});

// 팀 목록 표시 함수
function showTeamList(player) {
    const teams = new Map();

    // 모든 플레이어의 팀 정보 수집
    for (const p of world.getAllPlayers()) {
        const team = getPlayerTeam(p);
        if (team) {
            if (!teams.has(team)) {
                teams.set(team, []);
            }
            teams.get(team).push(p.name);
        }
    }

    // 팀 목록 메시지 생성
    let message = '§6===== 팀 목록 =====§r\n';
    if (teams.size === 0) {
        message += '§c현재 설정된 팀이 없습니다.';
    } else {
        for (const [team, members] of teams) {
            message += `§e${team}팀§r: ${members.join(', ')}\n`;
        }
    }

    // 플레이어에게 메시지 전송
    player.sendMessage(message);
}

// 플레이어 팀 설정
function setPlayerTeam(player, team) {
    player.setDynamicProperty('team', team);
    player.sendMessage(`§a팀이 '${team}'으로 설정되었습니다.`);
}

// 관리자 팀 설정 명령어 (예: !adminsetteam <플레이어이름> <팀이름>)
world.beforeEvents.chatSend.subscribe((chatEvent) => {
    const player = chatEvent.sender;
    const message = chatEvent.message;

    if (message.startsWith('!adminsetteam ')) {
        chatEvent.cancel = true;
        const args = message.split(' ');
        if (args.length !== 3) {
            player.sendMessage('§c사용법: !adminsetteam <플레이어이름> <팀이름>');
            return;
        }

        if (!isAdmin(player)) {
            player.sendMessage('§c이 명령어를 사용할 권한이 없습니다.');
            return;
        }

        const targetPlayerName = args[1];
        const team = args[2];
        const targetPlayer = world.getAllPlayers().find(p => p.name === targetPlayerName);

        if (targetPlayer) {
            setPlayerTeam(targetPlayer, team);
            player.sendMessage(`§a${targetPlayerName}님의 팀을 '${team}'으로 설정했습니다.`);
        } else {
            player.sendMessage(`§c${targetPlayerName}님을 찾을 수 없습니다.`);
        }
    }
});

// 관리자 권한 확인 함수
function isAdmin(player) {
    // 여기에서 관리자 권한을 확인하는 로직을 구현합니다.
    // 예를 들어, 특정 태그를 가진 플레이어를 관리자로 간주할 수 있습니다.
    return player.hasTag('admin');
}
