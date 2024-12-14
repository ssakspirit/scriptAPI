/*
사용법:
!아이템 - 현재 손에 들고 있는 아이템의 이름을 채팅창에 표시합니다.
!로어 <설명텍스트> - 현재 손에 들고 있는 아이템의 설명을 변경합니다.
예시: !로어 이 검은 스티브코딩이 처음으로 만든 검으로 전설적인 이야기가 담겨있습니다.

주의: 
- 설명을 변경하고 싶은 아이템을 손에 들고 명령어를 사용하세요.
- 설명을 제거하려면 !로어 명령어만 입력하세요.
*/

import { world, system, ItemStack } from "@minecraft/server";

// 플레이어가 들고 있는 아이템 가져오기
function getItem(player) {
    try {
        const inventory = player.getComponent("inventory");
        const selectedSlot = player.selectedSlotIndex;
        const item = inventory.container.getItem(selectedSlot)

        return item
    } catch (err) {
        return undefined
    }
}

// 채팅 이벤트 리스너 등록
world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message;
    const player = event.sender;

    // !아이템 명령어 확인
    if (message === '!아이템') {
        event.cancel = true;
        
        const itemType = getItem(player)?.typeId;
        
        if (!itemType) {
            world.sendMessage("§c손에 아이템을 들고 있지 않습니다.");
            return;
        }

        const itemName = itemType.replace('minecraft:', '');
        world.sendMessage(`§a${player.name}님이 들고 있는 아이템: §e${itemName}`);
    }
    
    // !로어 명령어 확인
    if (message.startsWith('!로어')) {
        event.cancel = true;
        
        const item = getItem(player);
        
        if (!item) {
            world.sendMessage("§c손에 아이템을 들고 사용해주세요.");
            return;
        }

        const args = message.split(' ');
        args.shift(); // !로어 부분 제거
        const loreText = args.join(' '); // 나머지 텍스트를 로어로 사용

        // 로어 제거 기능 추가
        if (message === '!로어') {
            system.run(() => {
                try {
                    const newItem = new ItemStack(item.typeId, item.amount);
                    if (item.nameTag) {
                        newItem.nameTag = item.nameTag;
                    }
                    // 로어를 빈 배열로 설정하여 제거
                    newItem.setLore([]);
                    
                    const inventory = player.getComponent("inventory");
                    inventory.container.setItem(player.selectedSlotIndex, newItem);
                    
                    world.sendMessage("§a아이템의 로어가 제거되었습니다.");
                } catch (error) {
                    world.sendMessage("§c아이템 로어 제거에 실패했습니다: " + error.message);
                }
            });
            return;
        }

        // 기존의 로어 추가 로직 유지
        if (!loreText) {
            world.sendMessage("§c사용법: !로어 <설명텍스트>");
            return;
        }

        // 시스템 권한으로 아이템 수정 실행
        system.run(() => {
            try {
                // 새 아이템 생성 및 로어 설정
                const newItem = new ItemStack(item.typeId, item.amount);
                if (item.nameTag) {
                    newItem.nameTag = item.nameTag;
                }
                newItem.setLore([loreText]);
                
                // 수정된 아이템을 인벤토리에 다시 설정
                const inventory = player.getComponent("inventory");
                inventory.container.setItem(player.selectedSlotIndex, newItem);
                
                world.sendMessage(`§a아이템의 설명이 '${loreText}'로 변경되었습니다.`);
            } catch (error) {
                world.sendMessage("§c아이템 설명 변경에 실패했습니다: " + error.message);
            }
        });
    }
});
