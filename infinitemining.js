/*
무한 채굴 시스템

기능:
- 특정 블록을 파괴하면 동일한 블록이 같은 위치에 다시 생성됩니다.
- RESPAWN_BLOCKS 배열에 등록된 블록만 이 기능이 적용됩니다.
*/

import { world, system } from "@minecraft/server";

// 다시 생성될 블록 목록
const RESPAWN_BLOCKS = [
    "minecraft:diamond_ore",
    "minecraft:iron_ore",
    "minecraft:gold_ore",
    "minecraft:coal_ore",
    "minecraft:stone"
    // 여기에 더 많은 블록을 추가할 수 있습니다
];

// 블록 파괴 이벤트 처리
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const block = event.brokenBlockPermutation;
    const blockPos = event.block.location;
    
    // 파괴된 블록이 재생성 목록에 있는지 확인
    if (RESPAWN_BLOCKS.includes(block.type.id)) {
        // 약간의 딜레이 후 블록 재생성 (0.5초)
        system.runTimeout(() => {
            const dimension = event.player.dimension;
            dimension.getBlock(blockPos).setPermutation(block);
        }, 1);
    }
});
