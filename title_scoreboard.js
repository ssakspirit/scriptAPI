import { world, system } from '@minecraft/server';

const score_id = "rank";

// 일정 간격으로 플레이어 칭호 업데이트 함수를 실행 (2 틱마다 실행)
system.runInterval(() => {
    world.getDimension("overworld").runCommandAsync(`scoreboard objectives add ${score_id} dummy`);
    world.getDimension("overworld").runCommandAsync(`scoreboard players add @a ${score_id} 0`);

    for (const player of world.getAllPlayers()) {
        setRank(player);
        updateNameTag(player);
    }
}, 2); // 2틱마다 실행

// 채팅 전송 이벤트를 구독하여 칭호에 따라 적절한 메시지 전송
world.beforeEvents.chatSend.subscribe((data) => {
    const rank = data.sender.getDynamicProperty('rank') || '칭호 없음';
    const name = data.sender.name;
    const msg = data.message;
    data.cancel = true;
    world.sendMessage(`<${rank}> <${name}> ${msg}`);
});

// 칭호 설정 함수
function setRank(player) {
    const score = getScore(player);
    let rank;

    if (score < 1) {
        rank = "뉴비";
    } else if (score === 1) {
        rank = "초급";
    } else if (score === 2) {
        rank = "중급";
    } else if (score >= 3) {
        rank = "고급";
    } else {
        rank = "자유";
    }

    player.setDynamicProperty('rank', rank);
}

// 플레이어의 이름 태그 업데이트 함수
function updateNameTag(player) {
    const rank = player.getDynamicProperty('rank') || '칭호 없음';
    player.nameTag = `[ ${rank} ] ${player.name}`;
}

// 플레이어의 스코어를 가져오는 함수
function getScore(player) {
    return world.scoreboard.getObjective(score_id).getScore(player);
}
