/*
# 팀 채팅 시스템 사용법
## 일반 사용자 명령어

1. 팀 설정하기:
   `/setteam <팀이름>`
   예: `/setteam 레드`

2. 팀 채팅 사용하기:
   `!t <메시지>` 또는 `!team <메시지>`
   예: `!t 안녕하세요, 팀원 여러분!`

3. 팀 목록 확인하기:
   `!teamlist`

## 관리자 명령어

1. 관리자 권한 얻기:
   서버 관리자에게 요청하여 'admin' 태그를 받아야 합니다.
   (서버 관리자가 실행할 명령어: `/tag <플레이어이름> add admin`)

2. 다른 플레이어의 팀 설정하기:
   `!adminsetteam <플레이어이름> <팀이름>`
   예: `!adminsetteam 플레이어1 블루`

## 주의사항

- 팀 이름은 공백 없이 입력해야 합니다.
- 관리자 명령어는 'admin' 태그가 있는 플레이어만 사용할 수 있습니다.
- 팀 채팅은 같은 팀 멤버에게만 보입니다.
- 일반 채팅은 모든 플레이어에게 보입니다.

## 팁

- 팀을 변경하려면 `/setteam` 명령어를 다시 사용하세요.
- 팀에서 나가려면 `/setteam` 명령어 뒤에 팀 이름을 입력하지 않으면 됩니다.
- 관리자는 `!adminsetteam` 명령어로 플레이어들의 팀을 효율적으로 관리할 수 있습니다.
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
