import { world, system } from '@minecraft/server';
import { ActionFormData } from "@minecraft/server-ui";

world.beforeEvents.chatSend.subscribe((ev) => {
    const msg = ev.message;
    const player = ev.sender;

    // '!스코어보드' 명령어가 입력되면 스코어보드를 설정하고 초기화
    if (msg == "!스코어보드") {
        ev.cancel = true;  // 명령어가 채팅창에 표시되지 않도록 취소
        setupScoreboard(player);  // 스코어보드 설정 함수 호출
    }

    // '!내정보' 명령어로 플레이어 정보 확인
    if (msg == "!내정보") {
        ev.cancel = true;
        player.sendMessage(`채팅창을 닫으면 상태창이 열립니다.`);
        myInfo(player);
    }
});

function setupScoreboard(player) {
    system.run(() => {
        // 'money'와 'level' 스코어보드를 만들고, 값을 0으로 초기화
        player.runCommandAsync('scoreboard objectives add money dummy "소지금"');
        player.runCommandAsync('scoreboard objectives add level dummy "레벨"');
        player.runCommandAsync('scoreboard players set @a money 0');
        player.runCommandAsync('scoreboard players set @a level 0');
        player.sendMessage("스코어보드가 설정되었습니다. 'money'와 'level' 값이 0으로 초기화되었습니다.");
    });
}

world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const player = ev.player
    const target = ev.target

    if (target.typeId == "minecraft:player") {
        Info(player, target)
        ev.cancel = true
    }
})

function myInfo(player) {
    system.run(() => {

        const form = new ActionFormData();

        form.title(player.name + `님의 정보`)
        form.body(`이름: ${player.name}\n소지금: ${getScore(player, `money`)} 원\n레벨: ${getScore(player, `level`)} Lv`);
        form.button(`닫기`)

        form.show(player).then(response => {
            if (response.cancelationReason == "UserBusy") {
                myInfo(player)
            }
        })
    })
};

function Info(player, target) {
    system.run(() => {

        const form = new ActionFormData();

        form.title(target.name + `님의 정보`)
        form.body(`이름: ${target.name}\n소지금: ${getScore(target, `money`)} 원\n레벨: ${getScore(target, `level`)} Lv`);
        form.button(`닫기`)

        form.show(player).then(response => {
            if (response.canceled) return;
        })
    })
};

function getScore(entity, id) {
    return world.scoreboard.getObjective(id).getScore(entity)
}
