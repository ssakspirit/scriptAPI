/**
 * UI 재고상점 시스템 (UI Inventory Shop System)
 * Version: 1.0.0
 * 
 * [ 기능 설명 ]
 * - 일반 상점: 아이템 구매/판매
 * - 관리자 상점: 아이템 가격 및 재고 관리
 * 
 * [ 사용 방법 ]
 * 1. 일반 상점:
 *    - '!상점' 입력 또는 상점 아이템 우클릭
 *    - 구매/판매 선택 후 아이템 거래
 * 
 * 2. 관리자 상점:
 *    - '!관리자창' 입력 또는 관리자 아이템 우클릭
 *    - admin 태그가 있는 플레이어만 사용 가능
 *    - 아이템 가격, 재고, 구매 제한 설정
 * 
 * 3. 상점 초기화:
 *    - '!상점초기화' 입력 (admin 태그 필요)
 *    - 상점이 기본값으로 초기화됨 (shopData 리셋)
 */

import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

// 상점 시스템 설정
const SHOP_CONFIG = {
    SHOP_ITEM: "minecraft:emerald",           // 상점 열기 아이템
    ADMIN_ITEM: "minecraft:blaze_rod",        // 관리자 상점 열기 아이템
    DEFAULT_STOCK: 64,                        // 기본 재고량
    MAX_PURCHASE_PER_PLAYER: 64,             // 플레이어당 최대 구매 가능 수량
    SELL_PRICE_RATIO: 0.7                    // 판매가 비율 (구매가 대비 %)
};

// 상점 데이터 저장
const shopItems = new Map();
const playerPurchases = new Map();

// 기본 상점 아이템 설정
const DEFAULT_ITEMS = [
    { id: "minecraft:diamond", price: 10, stock: 64, maxPerPlayer: 64, name: "다이아몬드" },
    { id: "minecraft:iron_ingot", price: 5, stock: 128, maxPerPlayer: 64, name: "철괴" },
    { id: "minecraft:gold_ingot", price: 8, stock: 128, maxPerPlayer: 64, name: "금괴" }
];

// 상점 데이터 로드
function loadShopData() {
    try {
        const shopData = world.getDynamicProperty("shopData");
        const purchaseData = world.getDynamicProperty("purchaseData");
        
        if (shopData) {
            const items = JSON.parse(shopData);
            shopItems.clear();
            items.forEach(item => shopItems.set(item.id, item));
        } else {
            initializeShop();
            saveShopData();
        }
        
        if (purchaseData) {
            const purchases = JSON.parse(purchaseData);
            playerPurchases.clear();
            Object.entries(purchases).forEach(([key, value]) => {
                playerPurchases.set(key, value);
            });
        }
    } catch (error) {
        console.warn("상점 데이터 로드 중 오류 발생:", error);
        initializeShop();
    }
}

// 상점 데이터 저장
function saveShopData() {
    try {
        const items = Array.from(shopItems.values());
        world.setDynamicProperty("shopData", JSON.stringify(items));
        
        const purchases = Object.fromEntries(playerPurchases);
        world.setDynamicProperty("purchaseData", JSON.stringify(purchases));
    } catch (error) {
        console.warn("상점 데이터 저장 중 오류 발생:", error);
    }
}

// 상점 초기화
function initializeShop() {
    shopItems.clear();
    DEFAULT_ITEMS.forEach(item => {
        shopItems.set(item.id, item);
    });
}

// 상점 UI 표시
function showShopUI(player) {
    system.runTimeout(() => {
        const form = new ActionFormData()
            .title("상점 메뉴")
            .body("원하시는 메뉴를 선택하세요.")
            .button("§a아이템 구매")
            .button("§e아이템 판매");

        form.show(player).then(response => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showShopUI(player);
                }, 10);
                return;
            }

            if (!response || response.canceled) return;

            if (response.selection === 0) {
                showBuyUI(player);
            } else {
                showSellUI(player);
            }
        });
    }, 1);
}

// 구매 UI 표시
function showBuyUI(player) {
    system.runTimeout(() => {
        const form = new ActionFormData()
            .title("아이템 구매")
            .body("구매할 아이템을 선택하세요.");

        // 구매 가능한 아이템 목록
        for (const [id, item] of shopItems) {
            const purchased = playerPurchases.get(`${player.name}_${id}`) || 0;
            const remainingQuota = item.maxPerPlayer - purchased;
            const available = Math.min(item.stock, remainingQuota);
            form.button(
                `${item.name}\n§a가격: ${item.price}에메랄드 §7| §e재고: ${item.stock}개\n§b구매 가능: ${available}개`
            );
        }

        form.show(player).then(response => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showBuyUI(player);
                }, 10);
                return;
            }

            if (!response || response.canceled) {
                showShopUI(player);
                return;
            }

            const selectedItem = Array.from(shopItems.values())[response.selection];
            showBuyAmountUI(player, selectedItem);
        });
    }, 1);
}

// 구매 수량 선택 UI
function showBuyAmountUI(player, item) {
    system.runTimeout(() => {
        const purchased = playerPurchases.get(`${player.name}_${item.id}`) || 0;
        const remainingQuota = item.maxPerPlayer - purchased;
        const maxAmount = Math.min(item.stock, remainingQuota);

        const form = new ModalFormData()
            .title("구매 수량 선택")
            .textField(
                `§e${item.name}\n§a가격: ${item.price}에메랄드 §7| §e재고: ${item.stock}개\n§b구매 가능: ${maxAmount}개\n\n구매할 수량을 입력하세요:`,
                "수량 입력"
            );

        form.show(player).then(response => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showBuyAmountUI(player, item);
                }, 10);
                return;
            }

            if (!response || response.canceled) {
                showBuyUI(player);
                return;
            }

            const amount = parseInt(response.formValues[0]);
            if (isNaN(amount) || amount <= 0 || amount > maxAmount) {
                player.sendMessage("§c올바른 수량을 입력해주세요.");
                return;
            }

            buyItem(player, item, amount);
        });
    }, 1);
}

// 아이템 구매 처리
function buyItem(player, item, amount) {
    const totalPrice = item.price * amount;
    const inventory = player.getComponent("inventory").container;
    let emeraldCount = 0;
    for (let i = 0; i < inventory.size; i++) {
        const slotItem = inventory.getItem(i);
        if (slotItem?.typeId === "minecraft:emerald") {
            emeraldCount += slotItem.amount;
        }
    }
    if (emeraldCount < totalPrice) {
        player.sendMessage(`§c에메랄드가 부족합니다. §e(보유: ${emeraldCount}개, 필요: ${totalPrice}개)`);
        return;
    }
    player.runCommand(`clear @s emerald 0 ${totalPrice}`);
    player.runCommand(`give @s ${item.id} ${amount}`);
    item.stock -= amount;
    const purchaseKey = `${player.name}_${item.id}`;
    playerPurchases.set(purchaseKey, (playerPurchases.get(purchaseKey) || 0) + amount);
    saveShopData();
    player.sendMessage(`§a${item.name} ${amount}개를 구매했습니다. §e(${totalPrice}에메랄드 사용)`);
}

// 판매 UI 표시
function showSellUI(player) {
    system.runTimeout(() => {
        const form = new ActionFormData()
            .title("아이템 판매")
            .body("판매할 아이템을 선택하세요.");

        for (const [id, item] of shopItems) {
            const sellPrice = Math.floor(item.price * SHOP_CONFIG.SELL_PRICE_RATIO);
            form.button(
                `${item.name}\n§a판매가: ${sellPrice}에메랄드 §7(구매가의 ${SHOP_CONFIG.SELL_PRICE_RATIO * 100}%)`
            );
        }

        form.show(player).then(response => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showSellUI(player);
                }, 10);
                return;
            }

            if (!response || response.canceled) {
                showShopUI(player);
                return;
            }

            const selectedItem = Array.from(shopItems.values())[response.selection];
            showSellAmountUI(player, selectedItem);
        });
    }, 1);
}

// 판매 수량 선택 UI
function showSellAmountUI(player, item) {
    system.runTimeout(() => {
        const sellPrice = Math.floor(item.price * SHOP_CONFIG.SELL_PRICE_RATIO);
        const form = new ModalFormData()
            .title("판매 수량 선택")
            .textField(
                `§e${item.name}\n§a판매가: ${sellPrice}에메랄드 §7(구매가의 ${SHOP_CONFIG.SELL_PRICE_RATIO * 100}%)\n\n판매할 수량을 입력하세요:`,
                "수량 입력"
            );

        form.show(player).then(response => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showSellAmountUI(player, item);
                }, 10);
                return;
            }

            if (!response || response.canceled) {
                showSellUI(player);
                return;
            }

            const amount = parseInt(response.formValues[0]);
            if (isNaN(amount) || amount <= 0) {
                player.sendMessage("§c올바른 수량을 입력해주세요.");
                return;
            }

            sellItem(player, item, amount);
        });
    }, 1);
}

// 아이템 판매 처리
function sellItem(player, item, amount) {
    const inventory = player.getComponent("inventory").container;
    let itemCount = 0;
    for (let i = 0; i < inventory.size; i++) {
        const slotItem = inventory.getItem(i);
        if (slotItem?.typeId === item.id) {
            itemCount += slotItem.amount;
        }
    }
    if (itemCount < amount) {
        player.sendMessage(`§c${item.name}이(가) 부족합니다. §e(보유: ${itemCount}개, 필요: ${amount}개)`);
        return;
    }
    const result = player.runCommand(`clear @s ${item.id} 0 ${amount}`);
    if (result.successCount > 0) {
        const sellPrice = Math.floor(item.price * SHOP_CONFIG.SELL_PRICE_RATIO * amount);
        player.runCommand(`give @s emerald ${sellPrice}`);
        item.stock += amount;
        saveShopData();
        player.sendMessage(`§a${item.name} ${amount}개를 판매했습니다. §e(${sellPrice}에메랄드)`);
    } else {
        player.sendMessage("§c아이템 판매 중 오류가 발생했습니다.");
    }
}

// 관리자 UI 표시
function showAdminUI(player) {
    if (!player.hasTag("admin")) {
        player.sendMessage("§c관리자 권한이 없습니다.");
        return;
    }

    system.runTimeout(() => {
        const form = new ActionFormData()
            .title("관리자 메뉴")
            .body("관리할 항목을 선택하세요.")
            .button("§a아이템 추가")
            .button("§e아이템 관리")
            .button("§c아이템 제거");

        form.show(player).then(response => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showAdminUI(player);
                }, 10);
                return;
            }

            if (!response || response.canceled) return;

            switch (response.selection) {
                case 0:
                    showAddItemUI(player);
                    break;
                case 1:
                    showManageItemsUI(player);
                    break;
                case 2:
                    showRemoveItemUI(player);
                    break;
            }
        });
    }, 1);
}

// 아이템 추가 UI
function showAddItemUI(player) {
    system.runTimeout(() => {
        const form = new ModalFormData()
            .title("아이템 추가")
            .textField("아이템 ID:", "minecraft:item_id")
            .textField("아이템 이름:", "표시될 이름")
            .textField("가격:", "에메랄드 개수")
            .textField("초기 재고:", "수량")
            .textField("플레이어당 최대 구매량:", "수량");

        form.show(player).then(response => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showAddItemUI(player);
                }, 10);
                return;
            }

            if (!response || response.canceled) {
                showAdminUI(player);
                return;
            }

            const [id, name, price, stock, maxPerPlayer] = response.formValues;
            if (!id || !name || !price || !stock || !maxPerPlayer) {
                player.sendMessage("§c모든 항목을 입력해주세요.");
                return;
            }

            shopItems.set(id, {
                id,
                name,
                price: parseInt(price),
                stock: parseInt(stock),
                maxPerPlayer: parseInt(maxPerPlayer)
            });
            
            saveShopData();  // 아이템 추가 후 저장
            player.sendMessage(`§a${name} 아이템이 상점에 추가되었습니다.`);
        });
    }, 1);
}

// 아이템 관리 UI
function showManageItemsUI(player) {
    system.runTimeout(() => {
        const form = new ActionFormData()
            .title("아이템 관리")
            .body("관리할 아이템을 선택하세요.");

        for (const [id, item] of shopItems) {
            form.button(
                `${item.name}\n§a가격: ${item.price} §7| §e재고: ${item.stock} §7| §b최대: ${item.maxPerPlayer}`
            );
        }

        form.show(player).then(response => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showManageItemsUI(player);
                }, 10);
                return;
            }

            if (!response || response.canceled) {
                showAdminUI(player);
                return;
            }

            const selectedItem = Array.from(shopItems.values())[response.selection];
            showEditItemUI(player, selectedItem);
        });
    }, 1);
}

// 아이템 수정 UI
function showEditItemUI(player, item) {
    system.runTimeout(() => {
        const form = new ModalFormData()
            .title("아이템 수정")
            .textField("가격:", item.price.toString())
            .textField("재고:", item.stock.toString())
            .textField("플레이어당 최대 구매량:", item.maxPerPlayer.toString());

        form.show(player).then(response => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showEditItemUI(player, item);
                }, 10);
                return;
            }

            if (!response || response.canceled) {
                showManageItemsUI(player);
                return;
            }

            const [price, stock, maxPerPlayer] = response.formValues;
            if (!price || !stock || !maxPerPlayer) {
                player.sendMessage("§c모든 항목을 입력해주세요.");
                return;
            }

            item.price = parseInt(price);
            item.stock = parseInt(stock);
            item.maxPerPlayer = parseInt(maxPerPlayer);
            
            saveShopData();  // 아이템 수정 후 저장
            player.sendMessage(`§a${item.name} 아이템이 수정되었습니다.`);
        });
    }, 1);
}

// 아이템 제거 UI
function showRemoveItemUI(player) {
    system.runTimeout(() => {
        const form = new ActionFormData()
            .title("아이템 제거")
            .body("제거할 아이템을 선택하세요.");

        for (const [id, item] of shopItems) {
            form.button(item.name);
        }

        form.show(player).then(response => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showRemoveItemUI(player);
                }, 10);
                return;
            }

            if (!response || response.canceled) {
                showAdminUI(player);
                return;
            }

            const selectedItem = Array.from(shopItems.values())[response.selection];
            shopItems.delete(selectedItem.id);
            saveShopData();  // 아이템 제거 후 저장
            player.sendMessage(`§a${selectedItem.name} 아이템이 제거되었습니다.`);
        });
    }, 1);
}

// 관리자용 상점 초기화 명령어
if (
  world.beforeEvents &&
  world.beforeEvents.chatSend &&
  typeof world.beforeEvents.chatSend.subscribe === "function"
) {
  world.beforeEvents.chatSend.subscribe(event => {
    if (event.message === "!상점초기화" && event.sender.hasTag("admin")) {
      world.setDynamicProperty("shopData", undefined);
      initializeShop();
      saveShopData();
      event.sender.sendMessage("§a상점이 기본값으로 초기화되었습니다.");
      event.cancel = true;
    }
  });
}

// 이벤트 처리
world.beforeEvents.itemUse.subscribe(event => {
    const player = event.source;
    const item = event.itemStack;

    if (item.typeId === SHOP_CONFIG.SHOP_ITEM) {
        event.cancel = true;
        showShopUI(player);
    } else if (item.typeId === SHOP_CONFIG.ADMIN_ITEM) {
        event.cancel = true;
        showAdminUI(player);
    }
});

world.beforeEvents.chatSend.subscribe(event => {
    const message = event.message;
    const player = event.sender;

    if (message === "!상점") {
        event.cancel = true;
        player.sendMessage("§a채팅창을 닫으면 상점이 열립니다.");
        showShopUI(player);
    } else if (message === "!관리자창") {
        event.cancel = true;
        player.sendMessage("§a채팅창을 닫으면 관리자 메뉴가 열립니다.");
        showAdminUI(player);
    }
});

// 시스템 초기화
world.afterEvents.worldLoad.subscribe(() => {
    // 초기 데이터 로드
    loadShopData();
    
    // 주기적으로 데이터 저장 (5분마다)
    system.runInterval(() => {
        saveShopData();
    }, 6000); // 6000틱 = 5분
});
