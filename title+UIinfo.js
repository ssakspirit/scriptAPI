/*
칭호+상태창
사용법:
1. 이 스크립트를 Minecraft Bedrock Edition의 행동 팩에 포함시킵니다.
2. 행동 팩을 월드에 적용합니다.
3. 게임 내에서 다음 기능들을 사용할 수 있습니다:

   a) 채팅 명령어:
      - !스코어보드: 'money'와 'level' 스코어보드를 생성하고 초기화합니다.
      - !내정보: 자신의 정보(이름, 소지금, 레벨)를 확인합니다.

   b) 칭호 시스템:
      - 컴퍼스 아이템을 사용하여 칭호 관리 메뉴를 엽니다.
      - 칭호를 설정하거나 삭제할 수 있습니다.
      - 설정된 칭호는 채팅 시 플레이어 이름 앞에 표시됩니다.

   c) 플레이어 정보 확인:
      - 다른 플레이어를 터치하여 해당 플레이어의 정보를 확인할 수 있습니다.

4. 채팅 시 설정된 칭호가 자동으로 표시됩니다. 칭호가 없는 경우 "뉴비"로 표시됩니다.

5. 플레이어의 이름 태그 위에도 칭호가 표시됩니다.

주의사항:
- 스코어보드 명령어는 한 번만 실행하면 됩니다. 중복 실행 시 기존 데이터가 초기화될 수 있습니다.
- 칭호는 1-10글자로 제한됩니다.
- 이 스크립트는 실험적 기능을 사용하므로, 월드 설정에서 "Beta APIs" 옵션을 활성화해야 할 수 있습니다.
*/

import { world } from '@minecraft/server';
import { ModalFormData } from "@minecraft/server-ui";
import { system } from '@minecraft/server';
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";



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


// 아이템 사용 이벤트를 구독하여 컴퍼스 사용 시 칭호 메인 함수 호출
world.afterEvents.itemUse.subscribe((data) => {
    const item = data.itemStack;
    const player = data.source;
    if (item.typeId === "minecraft:compass") {
        rankMain(player)
    }
});

// 칭호 메인 UI 함수
export function rankMain(player) {

    const formData = new ActionFormData();

    formData.title('칭호 메인').body('밑에 기능에서 선택해주세요..');

    formData.button(`칭호 설정`)
    formData.button(`칭호 삭제`)

    formData.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection == 0) {
            setRank(player)
        } else if (response.selection == 1) {
            removeRank(player)
        }
    })
};

// 칭호 설정 UI 함수
export function setRank(player) {

    const formData = new ModalFormData();

    formData.title('칭호 설정');
    formData.textField("칭호를 설정하세요", "칭호를 입력해주세요")
    formData.show(player).then(({ formValues }) => {
        if (formValues[0].length == 0) {
            player.sendMessage(`칭호는 1글자 이상이여야합니다`)
        } else if (formValues[0].length > 10) {
            player.sendMessage(`칭호는 최대 10글자 입니다.`)
        } else {
            player.setDynamicProperty(`rank`, formValues[0])
            player.sendMessage(`칭호가 ${formValues[0]}으로 설정되었습니다.`)
        }
    })
}

// 칭호 삭제 UI 함수
export function removeRank(player) {

    const formData = new MessageFormData();

    formData.title('칭호 삭제').body('정말 칭호를 삭제하시겠습니까?');

    formData.button1(`아니요`)//0
    formData.button2(`네`)//1

    formData.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection == 1) {
            player.sendMessage(`칭호를 삭제했습니다.`)
            player.setDynamicProperty(`rank`,)
        }
    })
};

// 채팅 이벤트 처리 (통합된 버전)
world.beforeEvents.chatSend.subscribe((ev) => {
    const player = ev.sender;
    const msg = ev.message;
    const rank = player.getDynamicProperty(`rank`);

    // 명령어 처리
    if (msg.startsWith("!")) {
        ev.cancel = true;
        system.run(() => {
            handleCommand(player, msg);
        });
    } else {
        // 일반 채팅 메시지 처리
        ev.cancel = true;
        system.run(() => {
            const rankDisplay = rank ? rank : "뉴비";
            world.sendMessage(`<${rankDisplay}> <${player.name}> ${msg}`);
        });
    }
});

// 명령어 처리 함수
function handleCommand(player, msg) {
    switch (msg.toLowerCase()) {
        case "!스코어보드":
            setupScoreboard(player);
            break;
        case "!내정보":
            player.sendMessage(`채팅창을 닫으면 상태창이 열립니다.`);
            myInfo(player);
            break;
        default:
            player.sendMessage("알 수 없는 명령어입니다.");
            break;
    }
}

// 스코어보드 설정 함수
function setupScoreboard(player) {
    const commands = [
        'scoreboard objectives add money dummy "소지금"',
        'scoreboard objectives add level dummy "레벨"',
        'scoreboard players set @a money 0',
        'scoreboard players set @a level 0'
    ];
    
    commands.forEach(cmd => player.runCommandAsync(cmd));
    player.sendMessage("스코어보드가 설정되었습니다. 'money'와 'level' 값이 0으로 초기화되었습니다.");
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
