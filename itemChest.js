/*
상자 아이템 생성 시스템 사용 설명서

1. 기능 설명
- 상자를 설치하면 자동으로 지정된 아이템들이 상자 안에 생성됩니다.
- 필수 아이템은 항상 생성되며, 랜덤 아이템은 무작위로 선택되어 생성됩니다.

2. 아이템 설정 방법
   a) 필수 아이템 설정 (REQUIRED_ITEMS)
      - 상자에 항상 들어갈 아이템을 설정합니다.
      - 형식: { type: "아이템ID", amount: 개수 }
      예시:
      const REQUIRED_ITEMS = [
          { type: "minecraft:diamond_sword", amount: 1 },
          { type: "minecraft:diamond", amount: 64 }
      ];

   b) 랜덤 아이템 풀 설정 (RANDOM_ITEMS)
      - 랜덤으로 선택될 수 있는 아이템들을 설정합니다.
      - 형식: { type: "아이템ID", amount: 개수 }
      예시:
      const RANDOM_ITEMS = [
          { type: "minecraft:golden_apple", amount: 5 },
          { type: "minecraft:emerald", amount: 16 }
      ];

   c) 랜덤 아이템 개수 설정
      - MIN_RANDOM_ITEMS: 최소 랜덤 아이템 개수
      - MAX_RANDOM_ITEMS: 최대 랜덤 아이템 개수

3. 아이템 ID 예시
   - minecraft:diamond_sword (다이아몬드 검)
   - minecraft:diamond (다이아몬드)
   - minecraft:golden_apple (황금 사과)
   - minecraft:iron_ingot (철 주괴)
   - minecraft:emerald (에메랄드)
   - minecraft:ender_pearl (엔더 진주)
   - minecraft:arrow (화살)
   - minecraft:cooked_beef (구운 쇠고기)

4. 주의사항
   - 아이템 ID는 정확히 입력해야 합니다.
   - amount는 1 이상의 정수여야 합니다.
   - 랜덤 아이템 풀에서 중복 없이 선택됩니다.
   - 상자의 공간이 부족하면 일부 아이템이 생성되지 않을 수 있습니다.
*/

import { world, system, ItemStack } from "@minecraft/server";

// 필수 아이템 목록 정의
const REQUIRED_ITEMS = [
    { type: "minecraft:diamond_sword", amount: 1 },
    { type: "minecraft:diamond", amount: 64 }
];

// 랜덤 아이템 풀 정의
const RANDOM_ITEMS = [
    { type: "minecraft:golden_apple", amount: 5 },
    { type: "minecraft:iron_ingot", amount: 32 },
    { type: "minecraft:emerald", amount: 16 },
    { type: "minecraft:ender_pearl", amount: 4 },
    { type: "minecraft:arrow", amount: 64 },
    { type: "minecraft:cooked_beef", amount: 32 }
];

// 랜덤 아이템 개수 설정
const MIN_RANDOM_ITEMS = 1; // 최소 랜덤 아이템 개수
const MAX_RANDOM_ITEMS = 3; // 최대 랜덤 아이템 개수

// 랜덤하게 아이템을 선택하는 함수
function getRandomItems() {
    const numItems = Math.floor(Math.random() * (MAX_RANDOM_ITEMS - MIN_RANDOM_ITEMS + 1)) + MIN_RANDOM_ITEMS;
    const selectedItems = [];
    const availableItems = [...RANDOM_ITEMS];

    for (let i = 0; i < numItems && availableItems.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        selectedItems.push(availableItems[randomIndex]);
        availableItems.splice(randomIndex, 1); // 선택된 아이템 제거하여 중복복 방지
    }

    return selectedItems;
}

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

                // 블록이 여전히 상자인지 확인 (40틱 후에도 존재하는지 검증)
                if (!chest || chest.typeId !== "minecraft:chest") {
                    player.sendMessage("§c상자가 사라졌습니다!");
                    console.warn(`상자 블록이 더 이상 존재하지 않거나 다른 블록으로 변경되었습니다. (위치: ${blockLocation.x}, ${blockLocation.y}, ${blockLocation.z})`);
                    return;
                }

                // 인벤토리 컴포넌트 유효성 확인
                const inventory = chest.getComponent("inventory");
                if (!inventory) {
                    player.sendMessage("§c상자 인벤토리에 접근할 수 없습니다!");
                    console.warn("상자의 인벤토리 컴포넌트를 찾을 수 없습니다.");
                    return;
                }

                // 컨테이너 유효성 확인
                if (!inventory.container) {
                    player.sendMessage("§c상자 컨테이너에 접근할 수 없습니다!");
                    console.warn("인벤토리 컨테이너가 없습니다.");
                    return;
                }

                // 아이템 추가 처리
                try {
                    // 필수 아이템 추가
                    for (const item of REQUIRED_ITEMS) {
                        const itemStack = new ItemStack(item.type, item.amount);
                        inventory.container.addItem(itemStack);
                    }

                    // 랜덤 아이템 추가
                    const randomItems = getRandomItems();
                    for (const item of randomItems) {
                        const itemStack = new ItemStack(item.type, item.amount);
                        inventory.container.addItem(itemStack);
                    }

                    player.sendMessage("§a상자에 아이템이 추가되었습니다!");
                    player.sendMessage(`§e랜덤 아이템 ${randomItems.length}개가 추가되었습니다!`);
                } catch (itemError) {
                    console.warn("아이템 추가 중 오류:", itemError);
                    player.sendMessage("§c아이템 추가 중 오류가 발생했습니다!");
                }
            } catch (error) {
                console.warn("상자 접근 오류:", error);
                player.sendMessage("§c상자 처리 중 오류가 발생했습니다!");
            }
        }, 40);
    }
});
