import { world, system } from '@minecraft/server'; // 서버와 시스템 기능을 사용하기 위해 모듈을 가져옴
import { ActionFormData } from "@minecraft/server-ui"; // UI 폼을 만들기 위해 필요한 모듈 가져옴

// 플레이어가 채팅을 보낼 때 발생하는 이벤트 처리
world.beforeEvents.chatSend.subscribe((ev) => {
    const msg = ev.message; // 플레이어가 보낸 채팅 메시지
    const player = ev.sender; // 메시지를 보낸 플레이어 객체

    // '!스코어보드' 명령어가 입력되면 스코어보드를 설정하고 초기화
    if (msg == "!스코어보드") {
        ev.cancel = true;  // 채팅창에 메시지가 표시되지 않도록 이벤트 취소
        setupScoreboard(player);  // 스코어보드 설정 함수 호출
    }

    // '!내정보' 명령어로 플레이어 정보 확인
    if (msg == "!내정보") {
        ev.cancel = true; // 채팅 메시지가 보이지 않도록 취소
        player.sendMessage(`채팅창을 닫으면 상태창이 열립니다.`); // 안내 메시지 전송
        myInfo(player); // 플레이어 정보 창 표시 함수 호출
    }
});

// 스코어보드를 설정하는 함수
function setupScoreboard(player) {
    system.run(() => {
        // 'money'와 'level' 스코어보드를 추가하고, 모든 플레이어의 해당 스코어를 0으로 초기화
        player.runCommandAsync('scoreboard objectives add money dummy "소지금"'); // 'money' 스코어보드 추가
        player.runCommandAsync('scoreboard objectives add level dummy "레벨"'); // 'level' 스코어보드 추가
        player.runCommandAsync('scoreboard players set @a money 0'); // 모든 플레이어의 'money' 스코어를 0으로 설정
        player.runCommandAsync('scoreboard players set @a level 0'); // 모든 플레이어의 'level' 스코어를 0으로 설정
        player.sendMessage("스코어보드가 설정되었습니다. 'money'와 'level' 값이 0으로 초기화되었습니다."); // 완료 메시지
    });
}

// 플레이어가 다른 플레이어와 상호작용할 때 발생하는 이벤트 처리
world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const player = ev.player; // 상호작용을 시작한 플레이어
    const target = ev.target; // 상호작용을 당한 대상

    // 대상이 다른 플레이어일 때 정보 표시
    if (target.typeId == "minecraft:player") {
        Info(player, target); // 상호작용한 플레이어의 정보 표시
        ev.cancel = true; // 상호작용을 취소
    }
});

// 플레이어 자신의 정보를 UI로 표시하는 함수
function myInfo(player) {
    system.run(() => {
        const form = new ActionFormData(); // UI 폼 생성

        form.title(player.name + `님의 정보`); // 폼 제목 설정
        form.body(`이름: ${player.name}\n소지금: ${getScore(player, `money`)} 원\n레벨: ${getScore(player, `level`)} Lv`); // 정보 출력
        form.button(`닫기`); // 닫기 버튼 추가

        form.show(player).then(response => {
            if (response.cancelationReason == "UserBusy") { // 사용자가 다른 UI를 사용 중이라면
                myInfo(player); // 다시 폼을 표시
            }
        });
    });
}

// 다른 플레이어의 정보를 UI로 표시하는 함수
function Info(player, target) {
    system.run(() => {
        const form = new ActionFormData(); // UI 폼 생성

        form.title(target.name + `님의 정보`); // 대상 플레이어의 이름을 폼 제목으로 설정
        form.body(`이름: ${target.name}\n소지금: ${getScore(target, `money`)} 원\n레벨: ${getScore(target, `level`)} Lv`); // 대상의 소지금 및 레벨 정보 출력
        form.button(`닫기`); // 닫기 버튼 추가

        form.show(player).then(response => {
            if (response.canceled) return; // 폼이 취소되면 아무 작업도 하지 않음
        });
    });
}

// 특정 플레이어의 스코어보드 점수를 가져오는 함수
function getScore(entity, id) {
    return world.scoreboard.getObjective(id).getScore(entity); // 스코어보드에서 지정된 ID의 점수를 반환
}
