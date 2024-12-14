import { world, system, ItemStack } from "@minecraft/server";

// 상자가 설치된 후 이벤트 감지
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const block = event.block;
    const player = event.player;

    // 설치된 블록이 상자인지 확인
    if (block.typeId === "minecraft:chest") {
        // 비동기로 처리하여 상자가 완전히 설치된 후 아이템 추가
        system.runTimeout(() => {
            try {
                // 설치된 상자의 위치에서 블록 가져오기
                const blockLocation = block.location;
                const chest = player.dimension.getBlock(blockLocation);
                
                if (chest) {
                    const inventory = chest.getComponent("inventory");
                    if (inventory && inventory.container) {
                        // 아이템 생성
                        const diamondSword = new ItemStack("minecraft:diamond_sword", 1);
                        const diamonds = new ItemStack("minecraft:diamond", 64);

                        try {
                            // 상자에 아이템 추가
                            inventory.container.addItem(diamondSword);
                            inventory.container.addItem(diamonds);
                            player.sendMessage("§a상자에 아이템이 추가되었습니다!");
                        } catch (itemError) {
                            console.warn("아이템 추가 중 오류:", itemError);
                            player.sendMessage("§c아이템 추가 실패!");
                        }
                    } else {
                        console.warn("인벤토리 컴포넌트를 찾을 수 없습니다.");
                        player.sendMessage("§c인벤토리를 찾을 수 없습니다!");
                    }
                } else {
                    console.warn("상자 블록을 찾을 수 없습니다.");
                    player.sendMessage("§c상자를 찾을 수 없습니다!");
                }
            } catch (error) {
                console.warn("상자에 아이템을 추가하는 중 오류 발생:", error);
                player.sendMessage("§c오류가 발생했습니다!");
            }
        }, 40);
    }
});
