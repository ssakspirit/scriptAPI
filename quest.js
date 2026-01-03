/**
 * Quest System - 퀘스트 시스템
 *
 * [ 기능 설명 ]
 * - 플레이어가 완료할 수 있는 간단한 퀘스트 시스템입니다.
 * - UI를 통해 퀘스트 목록을 확인하고 보상을 받을 수 있습니다.
 * - 태그 시스템을 사용하여 퀘스트 완료 여부를 추적합니다.
 *
 * [ 사용 방법 ]
 * 1. 나침반 아이템을 사용하면 퀘스트 UI가 열립니다.
 * 2. 완료하고 싶은 퀘스트를 선택합니다.
 * 3. 퀘스트 조건을 만족하면 완료 처리되고 보상이 지급됩니다.
 *
 * [ 퀘스트 종류 ]
 * 1. 채팅 퀘스트:
 *    - 조건: 채팅을 1회 이상 전송
 *    - 보상: 다이아몬드 1개
 *
 * 2. 플레이어 때리기 퀘스트:
 *    - 조건: 다른 플레이어를 1회 공격
 *    - 보상: 황금 사과 1개
 *
 * [ 퀘스트 상태 ]
 * - 미완료: 퀘스트를 아직 완료하지 않은 상태
 * - 완료: 퀘스트를 완료하고 보상을 받은 상태
 *
 * [ 주의사항 ]
 * - 퀘스트는 태그로 관리되므로 한 번 완료하면 다시 할 수 없습니다.
 * - 퀘스트를 초기화하려면 플레이어의 태그를 제거해야 합니다.
 */

import { world, system } from '@minecraft/server';
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";


// 아이템 사용 이벤트를 구독하여 나침반 사용 시 퀘스트 함수 호출
world.afterEvents.itemUse.subscribe((data) => {
    const item = data.itemStack;
    const player = data.source;
    if (item.typeId === "minecraft:compass") {
        quest(player)
    }
});

// 퀘스트 메인 UI를 제공하는 함수
export function quest(player) {
    let chat_quest_yn = "";
    let hit_quest_yn = "";
    if (player.hasTag(`chat`)) {
        chat_quest_yn = "완료"
    } else {
        chat_quest_yn = "미완료"
    }

    if (player.hasTag(`hit`)) {
        hit_quest_yn = "완료"
    } else {
        hit_quest_yn = "미완료"
    }

    const formData = new ActionFormData();
    formData.title('퀘스트').body('어떤 퀘스트를 수행할까요?');
    formData.button(`채팅치기\n${chat_quest_yn}`)
    formData.button(`플레이어 때리기\n${hit_quest_yn}`)
    formData.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection == 0) {
            chat_quest(player)
        } else if (response.selection == 1) {
            hit_quest(player)
        }
    })
};

// 채팅 퀘스트를 제공하는 함수
export function chat_quest(player) {

    const formData = new ActionFormData();
    formData.title('채팅 퀘스트').body('채팅을 보내 퀘스트를 완료하세요.');
    if (player.hasTag("chat")) {
        formData.button(`보상받기`)
    } else {
        formData.button(`닫기`)
    }

    formData.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection == 0) {
            if (player.hasTag("chat")) {
                if (player.hasTag(`chat_compensation`)) {
                    player.sendMessage(`이미 보상을 받았습니다.`)
                } else {
                    player.runCommand(`give @s emerald 10`)
                    player.runCommand(`tag @s add chat_compensation`)
                }
            }
        }
    })
};

// 플레이어 때리기 퀘스트를 제공하는 함수
export function hit_quest(player) {

    const formData = new ActionFormData();
    formData.title('플레이어 때리기 퀘스트').body('플레이어를 때려 퀘스트를 완료하세요.');
    if (player.hasTag("hit")) {
        formData.button(`보상받기`)
    } else {
        formData.button(`닫기`)
    }
    formData.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection == 0) {
            if (player.hasTag("hit")) {
                if (player.hasTag(`hit_compensation`)) {
                    player.sendMessage(`이미 보상을 받았습니다.`)
                } else {
                    player.runCommand(`give @s emerald 5`)
                    player.runCommand(`tag @s add hit_compensation`)
                }
            }
        }
    })
};

// 채팅 전송 이벤트를 구독하여 채팅 퀘스트 완료 처리
world.afterEvents.chatSend.subscribe((data) => {
    if (!data.sender.hasTag(`chat`)) {
        data.sender.runCommand(`tag @s add chat`)
        data.sender.sendMessage(`퀘스트 "채팅 치기" 완료!`)
    }
})

// 엔티티 때리기 이벤트를 구독하여 플레이어 때리기 퀘스트 완료 처리
world.afterEvents.entityHitEntity.subscribe((data) => {
    const damagingentity = data.damagingEntity
    const hitentity = data.hitEntity
    if (hitentity.typeId == "minecraft:player") {
        if (!damagingentity.hasTag(`hit`)) {
            damagingentity.runCommand(`tag @s add hit`)
            damagingentity.sendMessage(`퀘스트 "플레이어 때리기" 완료!`)
        }
    }
})
