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
                    player.runCommandAsync(`give @s emerald 10`)
                    player.runCommandAsync(`tag @s add chat_compensation`)
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
                    player.runCommandAsync(`give @s emerald 5`)
                    player.runCommandAsync(`tag @s add hit_compensation`)
                }
            }
        }
    })
};

// 채팅 전송 이벤트를 구독하여 채팅 퀘스트 완료 처리
world.afterEvents.chatSend.subscribe((data) => {
    if (!data.sender.hasTag(`chat`)) {
        data.sender.runCommandAsync(`tag @s add chat`)
        data.sender.sendMessage(`퀘스트 "채팅 치기" 완료!`)
    }
})

// 엔티티 때리기 이벤트를 구독하여 플레이어 때리기 퀘스트 완료 처리
world.afterEvents.entityHitEntity.subscribe((data) => {
    const damagingentity = data.damagingEntity
    const hitentity = data.hitEntity
    if (hitentity.typeId == "minecraft:player") {
        if (!damagingentity.hasTag(`hit`)) {
            damagingentity.runCommandAsync(`tag @s add hit`)
            damagingentity.sendMessage(`퀘스트 "플레이어 때리기" 완료!`)
        }
    }
})
