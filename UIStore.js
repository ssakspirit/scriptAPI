/**
 * UI Store System - UI 상점 시스템 (구매 전용)
 *
 * [ 기능 설명 ]
 * - 나침반을 사용하면 상점 UI가 열립니다.
 * - 플레이어는 에메랄드를 사용하여 아이템을 구매할 수 있습니다.
 * - 구매 수량을 슬라이더로 조절할 수 있습니다.
 *
 * [ 사용 방법 ]
 * 1. 나침반 아이템을 사용(우클릭)합니다.
 * 2. 상점 UI에서 구매할 아이템을 선택합니다.
 * 3. 슬라이더로 구매 수량을 설정합니다 (1~10개).
 * 4. 에메랄드가 충분하면 아이템이 지급되고 에메랄드가 차감됩니다.
 *
 * [ 상품 목록 ]
 * - 황금사과: 에메랄드 3개
 * - 감자: 에메랄드 2개
 * - 당근: 에메랄드 1개
 *
 * [ 상품 추가/수정 방법 ]
 * 1. itemList 배열에 아이템 추가 (17번째 줄)
 * 2. getPrice 함수에 가격 설정 추가 (36-46번째 줄)
 * 3. getItemEn 함수에 영문 아이템 ID 추가
 *
 * [ 주의사항 ]
 * - 에메랄드가 부족하면 구매가 되지 않습니다.
 * - 최대 10개까지 한 번에 구매할 수 있습니다.
 */

import { world } from '@minecraft/server';
import { ModalFormData, ActionFormData } from "@minecraft/server-ui";

// 아이템 우클릭으로 사용하기
world.afterEvents.itemUse.subscribe((data) => {
    const item = data.itemStack;
    const player = data.source;
    //사용하고 싶은 아이템 
    if (item.typeId === "minecraft:compass") {
        shopForm(player);
    }
});

// 아이템 선택 UI 보여주기
export function shopForm(player) {
    const formData = new ActionFormData();
    const itemList = ["황금사과(가격: 3)", "감자(가격: 2)", "당근(가격: 1)"]; //<------------------이 부분 추가하거나 수정하기

    formData.title('상점').body('구매하실 물건을 선택해주세요.');

    itemList.forEach((item) => {
        formData.button(item);
    });

    formData.show(player).then(response => {
        if (response.canceled) {
            return;
        } else {
            let selectedItem = itemList[response.selection];
            let price = getPrice(selectedItem); // 선택된 아이템에 따른 가격 가져오기
            buyForm(player, selectedItem, price); // 가격 정보를 buyForm 함수에 전달
        }
    });
}

// 선택된 아이템에 따라 가격 가져오기 //<------------------이 부분 추가하거나 수정하기
function getPrice(item) {
    if (item === "황금사과(가격: 3)") {
        return 3; // 가격
    } else if (item === "감자(가격: 2)") {
        return 2; // 가격
    } else if (item === "당근(가격: 1)") {
        return 1; // 가격
    }
    return 0; // 기본적으로 가격을 0으로 설정
}

// 구매 UI 보여주기 
export function buyForm(player, item, price) {
    const formData = new ModalFormData();
    let item_en = getItemEn(item); // 선택된 아이템에 따른 영문 아이템 ID 가져오기

    formData.title(`${item} 구매`);
    formData.slider(`구매하실려는 ${item}의 수량을 설정하세요.`, 1, 10, 1);

    formData.show(player).then(({ formValues }) => {
        const quantity = formValues[0];
        const totalPrice = quantity * price;

        player.runCommand(`give @s[hasitem={item=emerald, quantity=${totalPrice}..}] ${item_en} ${quantity}`);
        player.runCommand(`title @s[hasitem={item=emerald, quantity=${totalPrice}..}] actionbar ${item}을(를) 구매했습니다`);
        player.runCommand(`clear @s[hasitem={item=emerald, quantity=${totalPrice}..}] minecraft:emerald 0 ${totalPrice}`);
    });
}

// 선택된 아이템에 따른 영문 아이템 ID 가져오기 //<------------------이 부분 추가하거나 수정하기
function getItemEn(item) {
    if (item === "황금사과(가격: 3)") {
        return "golden_apple";
    } else if (item === "감자(가격: 2)") {
        return "potato";
    } else if (item === "당근(가격: 1)") {
        return "carrot";
    }
    return ""; // 기본적으로 아이템 ID를 빈 문자열로 설정
}
