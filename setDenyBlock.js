import { world, system } from '@minecraft/server';

/**
 * 운영자 권한 확인 헬퍼 함수
 * player.isOp()와 PermissionLevel이 제거되어 태그 기반으로 확인합니다.
 */
function isOperator(player) {
    return player.hasTag("op") || player.hasTag("admin");
}

/*
사용 방법:
1. 이 스크립트를 Minecraft Bedrock Edition의 행동 팩에 포함시킵니다.
2. 행동 팩을 월드에 적용합니다.
3. 게임 내에서 다음 채팅 명령어를 사용하여 금지 영역을 설정합니다:
   - '금지시작': 현재 플레이어 위치를 금지 영역의 시작점으로 설정합니다.
   - '금지끝': 현재 플레이어 위치를 금지 영역의 끝점으로 설정합니다.
   - '초기화': 설정된 금지 영역을 초기화합니다.
4. 금지 영역이 설정되면, 일반 플레이어는 해당 영역 내에서 블록을 파괴하거나 설치할 수 없습니다.
5. 관리자(OP) 권한이 있는 플레이어는 금지 영역 내에서도 블록을 조작할 수 있습니다.
6. 설정된 금지 영역은 월드가 저장될 때 함께 저장되며, 월드를 다시 로드해도 유지됩니다.

주의사항:
- 금지 영역을 설정하려면 최소 두 개의 명령어(금지시작, 금지끝)를 사용해야 합니다.
- 금지 영역은 육면체 모양으로 설정되며, 금지시작과 금지끝 좌표를 대각선으로 하는 영역이 생성됩니다.
- 초기화 명령어를 사용하면 설정된 금지 영역이 완전히 삭제되므로 주의해서 사용하세요.
*/

// 금지된 영역의 좌표를 저장할 변수
let restrictedRegion = {
    min: null,
    max: null
};

// 저장된 데이터 로드
function loadRestrictedRegion() {
    const minString = world.getDynamicProperty('restrictedMin');
    const maxString = world.getDynamicProperty('restrictedMax');
    if (minString && maxString) {
        restrictedRegion.min = JSON.parse(minString);
        restrictedRegion.max = JSON.parse(maxString);
    }
}

// 데이터 저장
function saveRestrictedRegion() {
    world.setDynamicProperty('restrictedMin', JSON.stringify(restrictedRegion.min));
    world.setDynamicProperty('restrictedMax', JSON.stringify(restrictedRegion.max));
}

// 채팅 명령어를 처리하는 함수
function handleChatCommand(player, message) {
    switch (message.toLowerCase()) {
        case '금지시작':
            restrictedRegion.min = { x: player.location.x, y: player.location.y, z: player.location.z };
            player.sendMessage('§a금지 영역의 시작 지점이 설정되었습니다.');
            saveRestrictedRegion();
            break;
        case '금지끝':
            restrictedRegion.max = { x: player.location.x, y: player.location.y, z: player.location.z };
            player.sendMessage('§a금지 영역의 끝 지점이 설정되었습니다.');
            saveRestrictedRegion();
            break;
        case '초기화':
            restrictedRegion = { min: null, max: null };
            player.sendMessage('§a금지 영역이 초기화되었습니다.');
            saveRestrictedRegion();
            break;
    }
}

// 채팅 이벤트 구독
world.beforeEvents.chatSend.subscribe((ev) => {
    handleChatCommand(ev.sender, ev.message);
});

// 위치가 금지된 영역 안에 있는지 확인하는 함수
function isInRestrictedRegion(location) {
    if (!restrictedRegion.min || !restrictedRegion.max) return false;

    return (
        location.x >= restrictedRegion.min.x && location.x <= restrictedRegion.max.x &&
        location.y >= restrictedRegion.min.y && location.y <= restrictedRegion.max.y &&
        location.z >= restrictedRegion.min.z && location.z <= restrictedRegion.max.z
    );
}

// 플레이어가 블록을 파괴할 때 발생하는 이벤트
world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const player = ev.player;
    const location = ev.block.location;

    if (isInRestrictedRegion(location)) {
        if (!isOperator(player)) { // 관리자는 허용 (PermissionLevel)
            ev.cancel = true;
            player.sendMessage(`§c이 영역에서는 블록을 파괴할 수 없습니다.`);
        }
    }
});

// 플레이어가 블록을 설치할 때 발생하는 이벤트
world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const player = ev.player;
    const location = ev.block.location;

    if (isInRestrictedRegion(location)) {
        if (!isOperator(player)) { // 관리자는 허용 (PermissionLevel)
            ev.cancel = true;
            player.sendMessage(`§c이 영역에서는 블록을 설치할 수 없습니다.`);
        }
    }
});

// 저장된 데이터 로드
loadRestrictedRegion();
