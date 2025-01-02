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
        // 1초 후에 실행되는 함수를 설정합니다.
        system.runTimeout(() => {
            // 플레이어의 현재 차원을 가져옵니다.
            const dimension = event.player.dimension;
            // 파괴된 블록의 위치에서 블록을 가져옵니다.
            const blockAtPos = dimension.getBlock(blockPos);
            // 파괴된 블록의 상태로 블록을 설정합니다.
            blockAtPos.setPermutation(block);
        }, 1);
    }
});
