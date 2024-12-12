/*
사용법:
!로어 <설명텍스트> - 핫바 첫 번째 슬롯에 있는 아이템의 설명을 변경합니다.
예시: !로어 이 검은 스티브코딩이 처음으로 만든 검으로 전설적인 이야기가 담겨있습니다.

주의: 
- 핫바 첫 번째 칸에 아이템을 놓고 명령어를 사용하세요.
- 설명을 제거하려면 !로어 명령어만 입력하세요.
*/

import { world, system, ItemStack } from "@minecraft/server";

// 채팅 이벤트 리스너 등록
world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message;
    const player = event.sender;

    // !로어 명령어 확인
    if (message.startsWith('!로어')) {
        event.cancel = true;
        
        // 핫바 첫 번째 슬롯의 아이템 가져오기
        const inventory = player.getComponent("inventory");
        const item = inventory.container.getItem(0); // 핫바 첫 번째 슬롯은 0
        
        if (!item) {
            world.sendMessage("§c핫바 첫 번째 칸에 아이템을 놓고 사용해주세요.");
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
                    
                    inventory.container.setItem(0, newItem);
                    
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
                inventory.container.setItem(0, newItem);
                
                world.sendMessage(`§a아이템의 설명이 '${loreText}'로 변경되었습니다.`);
            } catch (error) {
                world.sendMessage("§c아이템 설명 변경에 실패했습니다: " + error.message);
            }
        });
    }
});
