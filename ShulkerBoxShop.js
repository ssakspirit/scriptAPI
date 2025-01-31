/*
ShulkerBoxShop - Advanced Shulker Box Shop System for Minecraft Bedrock

사용법:
1. 관리자 명령어:
   - !상자등록 <이름> <가격> <x> <y> <z> <설명>
     * 지정된 좌표에 있는 셜커 상자를 상점에 등록
     * 예시: !상자등록 초보자세트 100 0 64 0 초보자를 위한 기본 아이템 세트
   
   - !상자삭제 <이름>
     * 등록된 셜커 상자를 상점에서 제거
     * 예시: !상자삭제 초보자세트

2. 일반 플레이어 명령어:
   - !상점
     * 셜커 상자 상점 열기
     * 상자 선택 후 구매 가능

주의사항:
- 관리자 명령어는 admin 태그가 있는 플레이어만 사용 가능
- 상자 등록 시 해당 좌표에 실제 셜커 상자가 있어야 함
- 구매 시 원본 셜커 상자의 내용물이 그대로 복사됨
*/

import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";

// 셜커 상자 상점 설정
const SHULKER_SHOP_CONFIG = {
    SAVE_KEY: "shulker_shop_data"
};

// 셜커 상자 상점 데이터 구조
class ShulkerShopItem {
    constructor(name, description, price, location, color = "purple") {
        this.name = name;            // 상점에 표시될 이름
        this.description = description; // 상자 설명
        this.price = price;          // 가격 (에메랄드)
        this.location = location;    // 상자 위치 {x, y, z, dimension}
        this.color = color;          // 셜커 상자 색상
    }
}

// 셜커 상자 상점 데이터 저장
function saveShulkerShopData(items) {
    world.setDynamicProperty(SHULKER_SHOP_CONFIG.SAVE_KEY, JSON.stringify(items));
}

// 셜커 상자 상점 데이터 로드
function loadShulkerShopData() {
    const data = world.getDynamicProperty(SHULKER_SHOP_CONFIG.SAVE_KEY);
    if (data === undefined) {
        return [];
    }
    return JSON.parse(data);
}

// 셜커 상자 상점 UI 표시
function openShulkerShopUI(player) {
    const items = loadShulkerShopData();
    if (items.length === 0) {
        player.sendMessage("§c현재 판매 중인 셜커 상자가 없습니다.");
        return;
    }

    // 시스템 권한으로 UI 표시
    system.run(() => {
        // 상점 UI 생성
        const form = new ActionFormData()
            .title("§l셜커 상자 상점")
            .body("§e구매할 셜커 상자를 선택하세요");

        // 각 셜커 상자에 대한 버튼 추가 (아이콘 없이)
        items.forEach(item => {
            form.button(`${item.name}\n§7(${item.price} 에메랄드)`);
        });

        // UI 표시 및 응답 처리
        form.show(player).then((response) => {
            if (response.cancelationReason === "UserBusy") {
                // 플레이어가 다른 UI를 보고 있다면 다시 시도
                system.runTimeout(() => {
                    openShulkerShopUI(player);
                }, 10);
                return;
            }

            if (!response || response.canceled) return;
            
            const selectedItem = items[response.selection];
            showShulkerBoxDetails(player, selectedItem);
        }).catch(error => {
            console.warn("상점 UI 표시 중 오류 발생:", error);
            player.sendMessage("§c상점을 열 수 없습니다. 잠시 후 다시 시도해주세요.");
        });
    });
}

// 셜커 상자 상세 정보 표시
function showShulkerBoxDetails(player, item) {
    system.run(() => {
        const form = new MessageFormData()
            .title(`§l${item.name} 상세 정보`)
            .body(
                `§e설명:\n§f${item.description}\n\n` +
                `§e가격: §f${item.price} 에메랄드`
            )
            .button2("§a돌아가기")  
            .button1("§c구매하기"); 

        form.show(player).then((response) => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showShulkerBoxDetails(player, item);
                }, 10);
                return;
            }

            if (!response || response.canceled) {
                openShulkerShopUI(player);
                return;
            }

            if (response.selection === 0) {  
                purchaseShulkerBox(player, item);
            } else {  
                openShulkerShopUI(player);
            }
        });
    });
}

// 셜커 상자 구매 처리
function purchaseShulkerBox(player, item) {
    try {
        // 에메랄드 보유 확인
        const inventory = player.getComponent("inventory").container;
        let emeraldCount = 0;
        
        for (let i = 0; i < inventory.size; i++) {
            const slotItem = inventory.getItem(i);
            if (slotItem?.typeId === "minecraft:emerald") {
                emeraldCount += slotItem.amount;
            }
        }

        if (emeraldCount < item.price) {
            player.sendMessage(`§c에메랄드가 부족합니다. §e(보유: ${emeraldCount}개, 필요: ${item.price}개)`);
            return;
        }

        // 원본 셜커 상자 위치의 블록 확인
        const dimension = world.getDimension(item.location.dimension);
        const block = dimension.getBlock(item.location);
        
        if (!block || !block.typeId.includes("shulker_box")) {
            player.sendMessage("§c원본 셜커 상자를 찾을 수 없습니다. 관리자에게 문의하세요.");
            return;
        }

        // 에메랄드 차감 및 셜커 상자 복사
        system.run(() => {
            // 에메랄드 차감
            player.runCommand(`clear @s emerald 0 ${item.price}`);

            // 셜커 상자 복사 (clone 명령어 사용)
            const targetPos = player.location;
            player.runCommand(`clone ${item.location.x} ${item.location.y} ${item.location.z} ${item.location.x} ${item.location.y} ${item.location.z} ${Math.floor(targetPos.x)} ${Math.floor(targetPos.y)} ${Math.floor(targetPos.z)}`);
            
            player.sendMessage(`§a${item.name}을(를) 구매했습니다.`);
        });

    } catch (error) {
        console.warn("셜커 상자 구매 중 오류 발생:", error);
        player.sendMessage("§c구매 처리 중 오류가 발생했습니다.");
    }
}

// 플레이어가 손에 들고 있는 아이템 확인
function getItem(player) {
    try {
        const inventory = player.getComponent("inventory");
        const selectedSlot = player.selectedSlotIndex;
        const item = inventory.container.getItem(selectedSlot).typeId;

        return item;
    } catch (err) {
        return undefined;
    }
}

// 미리 정의된 아이템 세트
const PREDEFINED_SETS = {
    "초보자 세트": [
        { id: "minecraft:stone_sword", amount: 1, slot: 0 },
        { id: "minecraft:stone_pickaxe", amount: 1, slot: 1 },
        { id: "minecraft:stone_axe", amount: 1, slot: 2 },
        { id: "minecraft:bread", amount: 16, slot: 3 }
    ],
    "광부 세트": [
        { id: "minecraft:iron_pickaxe", amount: 1, slot: 0 },
        { id: "minecraft:torch", amount: 64, slot: 1 },
        { id: "minecraft:bread", amount: 32, slot: 2 }
    ],
    "전사 세트": [
        { id: "minecraft:iron_sword", amount: 1, slot: 0 },
        { id: "minecraft:shield", amount: 1, slot: 1 },
        { id: "minecraft:golden_apple", amount: 8, slot: 2 }
    ]
};

// 아이템 세트 선택 UI 표시
function showItemSetSelectionUI(player, name, price, color) {
    system.run(() => {
        const form = new ActionFormData()
            .title("§l아이템 세트 선택")
            .body("§e셜커 상자에 포함될 아이템 세트를 선택하세요");

        // 빈 세트 옵션 추가
        form.button("빈 상자");

        // 미리 정의된 세트 옵션 추가
        Object.keys(PREDEFINED_SETS).forEach(setName => {
            form.button(setName);
        });

        form.show(player).then((response) => {
            if (response.cancelationReason === "UserBusy") {
                system.runTimeout(() => {
                    showItemSetSelectionUI(player, name, price, color);
                }, 10);
                return;
            }

            if (!response || response.canceled) return;

            let items = [];
            if (response.selection > 0) {
                // 미리 정의된 세트 선택
                const setName = Object.keys(PREDEFINED_SETS)[response.selection - 1];
                items = PREDEFINED_SETS[setName];
            }

            // 상점 데이터에 추가
            const shopItems = loadShulkerShopData();
            shopItems.push(new ShulkerShopItem(name, "", price, { x: 0, y: 0, z: 0, dimension: "minecraft:overworld" }, color));
            saveShulkerShopData(shopItems);

            player.sendMessage(`§a새로운 셜커 상자가 상점에 등록되었습니다. §e(${name}, ${price} 에메랄드)`);
            if (items.length > 0) {
                player.sendMessage(`§a선택된 세트: ${response.selection === 0 ? "빈 상자" : Object.keys(PREDEFINED_SETS)[response.selection - 1]}`);
            }
        });
    });
}

// 관리자용: 셜커 상자 등록 (수정)
function registerShulkerBox(player, name, description, price, x, y, z) {
    try {
        // 중복 이름 검사
        const shopItems = loadShulkerShopData();
        if (shopItems.some(item => item.name === name)) {
            player.sendMessage(`§c'${name}' 이름의 상자가 이미 존재합니다.`);
            return;
        }

        // 좌표 확인
        const numX = parseInt(x);
        const numY = parseInt(y);
        const numZ = parseInt(z);
        if (isNaN(numX) || isNaN(numY) || isNaN(numZ)) {
            player.sendMessage("§c올바른 좌표를 입력해주세요.");
            return;
        }

        // 해당 위치의 블록 확인
        const dimension = player.dimension;
        const block = dimension.getBlock({x: numX, y: numY, z: numZ});
        
        if (!block || !block.typeId.includes("shulker_box")) {
            player.sendMessage("§c지정된 위치에 셜커 상자가 없습니다.");
            return;
        }

        // 색상 추출
        let color = block.typeId.split(":")[1].split("_")[0];

        // 가격 확인
        const numericPrice = parseInt(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            player.sendMessage("§c가격은 0보다 큰 숫자여야 합니다.");
            return;
        }

        // 상점에 등록
        const location = {
            x: numX,
            y: numY,
            z: numZ,
            dimension: dimension.id
        };

        shopItems.push(new ShulkerShopItem(name, description, numericPrice, location, color));
        saveShulkerShopData(shopItems);
        
        player.sendMessage(`§a새로운 셜커 상자가 상점에 등록되었습니다.`);
        player.sendMessage(`§e이름: ${name}`);
        player.sendMessage(`§e설명: ${description}`);
        player.sendMessage(`§e가격: ${numericPrice} 에메랄드`);
        player.sendMessage(`§e위치: ${numX}, ${numY}, ${numZ}`);

    } catch (error) {
        console.warn("셜커 상자 등록 중 오류 발생:", error);
        player.sendMessage("§c셜커 상자 등록 중 오류가 발생했습니다.");
    }
}

// 관리자용: 셜커 상자 내용물 등록
function registerShulkerBoxContents(player, name) {
    try {
        // 상점 데이터 로드
        const shopItems = loadShulkerShopData();
        const itemIndex = shopItems.findIndex(item => item.name === name);
        
        if (itemIndex === -1) {
            player.sendMessage(`§c'${name}' 이름의 상자를 찾을 수 없습니다.`);
            return;
        }

        // 플레이어가 보고 있는 셜커 상자 찾기
        const viewDirection = player.getViewDirection();
        const startPos = player.location;
        let targetBlock = null;

        for (let i = 1; i <= 5; i++) {
            for (let dy = -1; dy <= 1; dy++) {
                const checkPos = {
                    x: Math.floor(startPos.x + viewDirection.x * i),
                    y: Math.floor(startPos.y + viewDirection.y * i + dy),
                    z: Math.floor(startPos.z + viewDirection.z * i)
                };

                try {
                    const block = player.dimension.getBlock(checkPos);
                    if (block && block.typeId.includes("shulker_box")) {
                        targetBlock = block;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            if (targetBlock) break;
        }

        if (!targetBlock) {
            player.sendMessage("§c보고 있는 방향에서 셜커 상자를 찾을 수 없습니다.");
            return;
        }

        // 상자의 내용물을 등록할 것임을 알림
        player.sendMessage(`§a'${name}' 상자의 내용물이 등록되었습니다.`);
        player.sendMessage("§e상자를 열어서 내용물을 확인할 수 있습니다.");

    } catch (error) {
        console.warn("셜커 상자 내용물 등록 중 오류 발생:", error);
        player.sendMessage("§c내용물 등록 중 오류가 발생했습니다.");
    }
}

// 관리자용: 셜커 상자 삭제
function deleteShulkerBox(player, name) {
    try {
        const shopItems = loadShulkerShopData();
        const index = shopItems.findIndex(item => item.name === name);
        
        if (index === -1) {
            player.sendMessage(`§c'${name}' 이름의 상자를 찾을 수 없습니다.`);
            return;
        }

        const deletedItem = shopItems.splice(index, 1)[0];
        saveShulkerShopData(shopItems);
        
        player.sendMessage(`§a'${deletedItem.name}' 상자가 상점에서 삭제되었습니다.`);
    } catch (error) {
        console.warn("셜커 상자 삭제 중 오류 발생:", error);
        player.sendMessage("§c상자 삭제 중 오류가 발생했습니다.");
    }
}

// 셜커 상자 내용물 확인 이벤트 처리
world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const player = ev.player;
    const block = ev.block;

    // 관리자가 아니거나 셜커 상자가 아니면 무시
    if (!player.hasTag("admin") || !block.typeId.includes("shulker_box")) return;

    system.runTimeout(() => {
        player.sendMessage("§e이 셜커 상자의 내용물을 확인하려면 '!상자확인'을 입력하세요.");
    }, 10);
});

// 관리자용: 설치된 셜커 상자 내용물 확인
function checkShulkerBoxContents(player) {
    try {
        // 플레이어가 보고 있는 블록 확인
        const viewDirection = player.getViewDirection();
        const startPos = player.location;
        let targetBlock = null;

        // 플레이어 시선 방향으로 5블록까지 확인
        for (let i = 1; i <= 5; i++) {
            // 눈높이에서 시작하여 위아래로 검색
            for (let dy = -1; dy <= 1; dy++) {
                const checkPos = {
                    x: Math.floor(startPos.x + viewDirection.x * i),
                    y: Math.floor(startPos.y + viewDirection.y * i + dy),
                    z: Math.floor(startPos.z + viewDirection.z * i)
                };

                try {
                    const block = player.dimension.getBlock(checkPos);
                    if (block && block.typeId.includes("shulker_box")) {
                        targetBlock = block;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            if (targetBlock) break;
        }

        if (!targetBlock) {
            player.sendMessage("§c보고 있는 방향에서 셜커 상자를 찾을 수 없습니다.");
            return;
        }

        // 해당 위치의 셜커 상자 정보 표시
        system.run(() => {
            try {
                player.runCommand(`testforblock ${targetBlock.x} ${targetBlock.y} ${targetBlock.z} shulker_box`);
                player.sendMessage("§a셜커 상자를 찾았습니다. 내용물을 확인하려면 상자를 열어보세요.");
                // 추가적인 정보 표시
                player.sendMessage(`§e위치: §f${targetBlock.x}, ${targetBlock.y}, ${targetBlock.z}`);
                player.sendMessage(`§e색상: §f${targetBlock.typeId.split(":")[1].replace("_shulker_box", "")}`);
            } catch (error) {
                console.warn("셜커 상자 정보 표시 중 오류:", error);
                player.sendMessage("§c셜커 상자 정보를 표시할 수 없습니다.");
            }
        });

    } catch (error) {
        console.warn("셜커 상자 확인 중 오류 발생:", error);
        player.sendMessage("§c셜커 상자 확인 중 오류가 발생했습니다.");
    }
}

// 채팅 이벤트에 상점 명령어 추가
world.beforeEvents.chatSend.subscribe((ev) => {
    const player = ev.sender;
    const message = ev.message;

    if (message === "!상점") {
        ev.cancel = true;
        player.sendMessage("§a채팅창을 닫으면 상점이 열립니다.");
        openShulkerShopUI(player);
    } else if (message.startsWith("!상자등록") && player.hasTag("admin")) {
        ev.cancel = true;
        const args = message.split(" ");
        if (args.length < 6) {
            player.sendMessage("§c사용법: !상자등록 <이름> <가격> <x> <y> <z> <설명>");
            return;
        }
        const name = args[1];
        const price = args[2];
        const x = args[3];
        const y = args[4];
        const z = args[5];
        const description = args.slice(6).join(" ") || "설명 없음";
        registerShulkerBox(player, name, description, price, x, y, z);
    } else if (message.startsWith("!상자삭제") && player.hasTag("admin")) {
        ev.cancel = true;
        const args = message.split(" ");
        if (args.length !== 2) {
            player.sendMessage("§c사용법: !상자삭제 <이름>");
            return;
        }
        deleteShulkerBox(player, args[1]);
    }
});
