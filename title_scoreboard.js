/**
 * Title Scoreboard System - 칭호 스코어보드 시스템
 *
 * [ 기능 설명 ]
 * - 스코어보드 점수에 따라 자동으로 칭호가 부여되는 시스템입니다.
 * - 칭호는 플레이어 이름 앞에 표시됩니다.
 * - 채팅 메시지에도 칭호가 함께 표시됩니다.
 *
 * [ 칭호 등급 ]
 * - 0점 미만: 뉴비
 * - 1점: 초급
 * - 2점: 중급
 * - 3점 이상: 고급
 * - 기타: 자유
 *
 * [ 표시 형식 ]
 * - 이름 표시: [ 칭호 ] 플레이어이름
 * - 채팅 표시: <칭호> <플레이어이름> 메시지내용
 *
 * [ 사용 방법 ]
 * 1. 스크립트를 활성화하면 자동으로 작동합니다.
 * 2. 스코어보드 "rank" 점수를 변경하면 칭호가 자동으로 변경됩니다.
 *    명령어 예시: /scoreboard players set @s rank 2
 *
 * [ 주의사항 ]
 * - 스코어보드 이름은 "rank"로 고정되어 있습니다.
 * - 칭호는 2틱마다 업데이트됩니다.
 * - 채팅 메시지는 자동으로 칭호 형식으로 변환됩니다.
 */

import { world, system } from '@minecraft/server';

const score_id = "rank";

// 일정 간격으로 플레이어 칭호 업데이트 함수를 실행 (2 틱마다 실행)
system.runInterval(() => {
    world.getDimension("overworld").runCommand(`scoreboard objectives add ${score_id} dummy`);
    world.getDimension("overworld").runCommand(`scoreboard players add @a ${score_id} 0`);

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
