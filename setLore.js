/*
사용법:
!아이템 - 현재 손에 들고 있는 아이템의 이름을 채팅창에 표시합니다.
!로어 <설명텍스트> - 현재 손에 들고 있는 아이템의 설명을 변경합니다.
!로어추가 <설명텍스트> - 기존 로어에 줄바꿈을 하고 내용을 추가합니다.
예시: !로어 이 검은 스티브코딩이 처음으로 만든 검으로 전설적인 이야기가 담겨있습니다.

주의: 
- 설명을 변경하고 싶은 아이템을 손에 들고 명령어를 사용하세요.
- 설명을 제거하려면 !로어 명령어만 입력하세요.
*/
import { world, system, ItemStack } from "@minecraft/server";

function getItem(player) {
    try {
        const inventory = player.getComponent("inventory");
        const selectedSlot = player.selectedSlotIndex;
        return inventory.container.getItem(selectedSlot);
    } catch (err) {
        return undefined;
    }
}

world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message;
    const player = event.sender;

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
    
    if (message.startsWith('!로어')) {
        event.cancel = true;
        
        const item = getItem(player);
        
        if (!item) {
            world.sendMessage("§c손에 아이템을 들고 사용해주세요.");
            return;
        }

        const args = message.split(' ');
        args.shift(); 
        const loreText = args.join(' ');

        if (message === '!로어') {
            system.run(() => {
                try {
                    const newItem = new ItemStack(item.typeId, item.amount);
                    if (item.nameTag) {
                        newItem.nameTag = item.nameTag;
                    }
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

        if (!loreText) {
            world.sendMessage("§c사용법: !로어 <설명텍스트>");
            return;
        }

        system.run(() => {
            try {
                const newItem = new ItemStack(item.typeId, item.amount);
                if (item.nameTag) {
                    newItem.nameTag = item.nameTag;
                }
                newItem.setLore([loreText]);
                
                const inventory = player.getComponent("inventory");
                inventory.container.setItem(player.selectedSlotIndex, newItem);
                
                world.sendMessage(`§a아이템의 설명이 '${loreText}'로 변경되었습니다.`);
            } catch (error) {
                world.sendMessage("§c아이템 설명 변경에 실패했습니다: " + error.message);
            }
        });
    }
    
    if (message.startsWith('!로어추가')) {
        event.cancel = true;
        
        const item = getItem(player);
        
        if (!item) {
            world.sendMessage("§c손에 아이템을 들고 사용해주세요.");
            return;
        }

        const args = message.split(' ');
        args.shift(); 
        const additionalLore = args.join(' ');

        if (!additionalLore) {
            world.sendMessage("§c사용법: !로어추가 <추가할 설명>");
            return;
        }

        system.run(() => {
            try {
                const newItem = new ItemStack(item.typeId, item.amount);
                if (item.nameTag) {
                    newItem.nameTag = item.nameTag;
                }
                const oldLore = item.getLore() || [];
                newItem.setLore([...oldLore, additionalLore]);
                
                const inventory = player.getComponent("inventory");
                inventory.container.setItem(player.selectedSlotIndex, newItem);
                
                world.sendMessage(`§a아이템의 설명에 새로운 줄이 추가되었습니다: '${additionalLore}'`);
            } catch (error) {
                world.sendMessage("§c아이템 설명 추가에 실패했습니다: " + error.message);
            }
        });
    }
});

