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

        player.runCommandAsync(`give @s[hasitem={item=emerald, quantity=${totalPrice}..}] ${item_en} ${quantity}`);
        player.runCommandAsync(`title @s[hasitem={item=emerald, quantity=${totalPrice}..}] actionbar ${item}을(를) 구매했습니다`);
        player.runCommandAsync(`clear @s[hasitem={item=emerald, quantity=${totalPrice}..}] minecraft:emerald 0 ${totalPrice}`);
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
