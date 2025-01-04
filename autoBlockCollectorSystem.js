import { world, system, ItemStack } from "@minecraft/server";

/**
 * Auto Block Collector System
 * 블록 자동 수집 시스템
 * 
 * 기능 설명:
 * 1. 특정 블록을 파괴하면 자동으로 인벤토리에 들어갑니다
 * 2. 드롭 아이템 없이 즉시 인벤토리로 이동합니다
 * 3. 인벤토리가 가득 찬 경우 일반적인 방식으로 블록이 파괴됩니다
 * 4. 수집 가능한 블록 목록은 COLLECTABLE_BLOCKS에서 관리됩니다
 * 
 * 사용 방법:
 * 1. 수집 가능한 블록을 도구로 파괴하면 자동으로 인벤토리에 들어갑니다
 * 2. 별도의 명령어나 설정 없이 바로 사용 가능합니다
 * 
 * 커스터마이징:
 * 1. COLLECTABLE_BLOCKS 배열에 수집하고 싶은 블록의 ID를 추가하세요
 * 2. 블록 ID는 "minecraft:블록이름" 형식입니다
 * 3. 일반 광석과 심층암 광석 모두 추가 가능합니다
 * 
 * 개발자 참고사항:
 * - beforeEvents.playerBreakBlock 이벤트 사용
 * - system.run()으로 안전한 컨텍스트에서 실행
 * - inventory.addItem()으로 아이템 추가
 * - dimension.getBlock().setType()으로 블록 제거
 * 
 * 주의사항:
 * 1. 인벤토리가 가득 찬 경우 일반적인 방식으로 블록이 파괴됩니다
 * 2. 수집 가능한 블록 목록이 너무 많으면 성능에 영향을 줄 수 있습니다
 * 3. 블록 ID는 정확하게 입력해야 합니다
 */

// 자동 수집할 블록 목록
const COLLECTABLE_BLOCKS = [
    "minecraft:diamond_ore",          // 다이아몬드 광석
    "minecraft:deepslate_diamond_ore",// 심층암 다이아몬드 광석
    "minecraft:iron_ore",            // 철 광석
    "minecraft:deepslate_iron_ore",  // 심층암 철 광석
    "minecraft:gold_ore",            // 금 광석
    "minecraft:deepslate_gold_ore",  // 심층암 금 광석
    "minecraft:emerald_ore",         // 에메랄드 광석
    "minecraft:deepslate_emerald_ore",// 심층암 에메랄드 광석
    "minecraft:coal_ore",            // 석탄 광석
    "minecraft:deepslate_coal_ore",  // 심층암 석탄 광석
    "minecraft:lapis_ore",           // 청금석 광석
    "minecraft:deepslate_lapis_ore", // 심층암 청금석 광석
    "minecraft:redstone_ore",        // 레드스톤 광석
    "minecraft:deepslate_redstone_ore",// 심층암 레드스톤 광석
    "minecraft:copper_ore",          // 구리 광석
    "minecraft:deepslate_copper_ore" // 심층암 구리 광석
];

// 블록 파괴 이벤트 처리
world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    const blockPos = block.location;
    
    // 수집 가능한 블록인지 확인
    if (COLLECTABLE_BLOCKS.includes(block.typeId)) {
        // 블록 파괴 시 드롭 아이템 취소
        event.cancel = true;
        
        // 안전한 컨텍스트에서 인벤토리 조작 실행
        system.run(() => {
            try {
                // 인벤토리에 아이템 추가
                const inventory = player.getComponent("inventory").container;
                const itemStack = new ItemStack(block.typeId, 1);
                
                // 인벤토리에 아이템 추가 시도
                inventory.addItem(itemStack);
                
                // 블록 제거
                const dimension = player.dimension;
                dimension.getBlock(blockPos).setType("minecraft:air");
                
            } catch (error) {
                // 오류 발생 시 (예: 인벤토리 가득 참) 일반적인 방식으로 블록 파괴
                console.warn("아이템 추가 중 오류 발생:", error);
                event.cancel = false;
            }
        });
    }
});
