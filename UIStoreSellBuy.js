/**
 * UI Store System - UI 상점 시스템 (구매/판매)
 *
 * [ 기능 설명 ]
 * - 나침반을 사용하면 상점 UI가 열립니다.
 * - 플레이어는 에메랄드를 사용하여 아이템을 구매하거나 판매할 수 있습니다.
 * - 구매와 판매를 모두 지원하는 양방향 거래 시스템입니다.
 *
 * [ 사용 방법 ]
 * 1. 나침반 아이템을 사용(우클릭)합니다.
 * 2. "구매" 또는 "판매"를 선택합니다.
 * 3. 거래할 아이템을 선택합니다.
 * 4. 슬라이더로 거래 수량을 설정합니다.
 * 5. 구매: 에메랄드가 차감되고 아이템을 받습니다.
 *    판매: 아이템이 차감되고 에메랄드를 받습니다.
 *
 * [ 상품 목록 ]
 * - 황금사과: 에메랄드 3개
 * - 감자: 에메랄드 2개
 * - 당근: 에메랄드 1개
 *
 * [ 상품 추가/수정 방법 ]
 * 1. itemList 배열에 아이템 추가 (17번째 줄)
 * 2. getPrice 함수에 가격 설정 추가
 * 3. getItemEn 함수에 영문 아이템 ID 추가
 *
 * [ 주의사항 ]
 * - 구매 시 에메랄드가 부족하면 거래가 되지 않습니다.
 * - 판매 시 아이템이 부족하면 거래가 되지 않습니다.
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

    formData.title('상점').body('구매하거나 판매하실 물건을 선택해주세요.');
    formData.button("구매");
    formData.button("판매");

    formData.show(player).then(response => {
        if (response.canceled) {
            return;
        } else {
            if (response.selection === 0) {
                // 구매
                showItemSelectionForm(player, itemList, "구매");
            } else if (response.selection === 1) {
                // 판매
                showItemSelectionForm(player, itemList, "판매");
            }
        }
    });
}

// 아이템 선택 UI 보여주기
function showItemSelectionForm(player, itemList, action) {
    const formData = new ActionFormData();
    formData.title(`${action}할 아이템을 선택하세요.`);

    itemList.forEach((item) => {
        formData.button(item);
    });

    formData.show(player).then(response => {
        if (response.canceled) {
            return;
        } else {
            let selectedItem = itemList[response.selection];
            let price = getPrice(selectedItem); // 선택된 아이템에 따른 가격 가져오기
            if (action === "구매") {
                buyForm(player, selectedItem, price); // 가격 정보를 buyForm 함수에 전달
            } else if (action === "판매") {
                sellForm(player, selectedItem, price); // 가격 정보를 sellForm 함수에 전달
            }
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

// 판매 UI 보여주기 
export function sellForm(player, item, price) {
    const formData = new ModalFormData();
    let item_en = getItemEn(item); // 선택된 아이템에 따른 영문 아이템 ID 가져오기

    formData.title(`${item} 판매`);
    formData.slider(`판매하실 ${item}의 수량을 설정하세요.`, 1, 10, 1);

    formData.show(player).then(({ formValues }) => {
        const quantity = formValues[0];
        const totalPrice = quantity * price;

        player.runCommand(`clear @s[hasitem={item=${item_en}, quantity=${quantity}..}] ${item_en} 0 ${quantity}`)
        player.runCommand(`give @s[hasitem={item=${item_en}, quantity=${quantity}..}] minecraft:emerald ${totalPrice}`);
        player.runCommand(`title @s[hasitem={item=${item_en}, quantity=${quantity}..}] actionbar ${item}을(를) 판매했습니다`);
        player.runCommand(`title @s[hasitem={item=${item_en}, quantity=..${quantity}}] actionbar ${item}이(가) 충분하지 않습니다`);

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
