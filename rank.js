/**
 * Rank System - 칭호 시스템
 *
 * [ 기능 설명 ]
 * - 플레이어가 자신의 칭호를 설정하고 관리할 수 있는 시스템입니다.
 * - 칭호는 플레이어 이름 앞에 표시됩니다.
 * - UI를 통해 간편하게 칭호를 설정하거나 삭제할 수 있습니다.
 *
 * [ 사용 방법 ]
 * 1. 나침반 아이템을 사용하면 칭호 메뉴 UI가 열립니다.
 * 2. "칭호 설정"을 선택하여 원하는 칭호를 입력합니다.
 * 3. "칭호 삭제"를 선택하여 현재 칭호를 제거할 수 있습니다.
 *
 * [ 칭호 표시 형식 ]
 * - 칭호 설정 시: [ 칭호 ] 플레이어이름
 * - 칭호 미설정 시: [ 뉴비 ] 플레이어이름
 *
 * [ 주의사항 ]
 * - 칭호는 Dynamic Property에 저장됩니다.
 * - 칭호는 2틱마다 업데이트되어 항상 표시됩니다.
 * - 서버를 재시작해도 칭호가 유지됩니다.
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

// 채팅 전송 이벤트를 구독하여 칭호에 따라 적절한 메시지 전송
world.beforeEvents.chatSend.subscribe((data) => {
    const rank = data.sender.getDynamicProperty(`rank`)
    const name = data.sender.name
    const msg = data.message
    data.cancel = true;
    if (typeof rank == "undefined") {
        world.sendMessage(`<뉴비> <${name}> ${msg}`)
    } else {
        world.sendMessage(`<${rank}> <${name}> ${msg}`)
    }
})
