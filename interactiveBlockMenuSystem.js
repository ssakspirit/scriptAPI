import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

/**
 * Interactive Block Menu System
 * 블록 상호작용 UI 시스템
 * 
 * 시스템 설명:
 * - 맨손으로 특정 블록을 오른쪽 클릭하면 UI 메뉴가 표시됩니다
 * - 각 블록마다 다른 메뉴와 효과를 가질 수 있습니다
 * - 현재 지원하는 블록: 다이아몬드 블록, 에메랄드 블록
 * 
 * 사용자 커스터마이징 가이드:
 * 1. 새로운 블록 UI 추가하기:
 *    - showBlockUI 함수의 switch 문에 새로운 case를 추가합니다
 *    - 예시:
 *      case "minecraft:gold_block":
 *          form.body("금 블록 메뉴")
 *              .button("버튼1", "textures/items/gold_ingot")
 *              .button("버튼2", "textures/items/golden_apple");
 * 
 * 2. 버튼 추가 방법:
 *    - form.button("버튼 이름", "텍스처 경로")
 *    - 주요 텍스처 경로:
 *      - textures/items/[아이템명]
 *      - textures/blocks/[블록명]
 *      - textures/ui/[UI요소명]
 *    - 자주 사용하는 아이콘:
 *      - diamond, emerald, gold_ingot
 *      - apple, golden_apple
 *      - blaze_powder, glowstone_dust
 *      - potion_bottle_invisibility
 * 
 * 3. 버튼 기능 구현:
 *    - switch (response.selection) 구문 안에 case 추가
 *    - 명령어 실행: player.runCommandAsync("명령어")
 *    - 메시지 전송: player.sendMessage("메시지")
 *    - 색상 코드: §a(초록), §b(하늘), §c(빨강), §e(노랑)
 * 
 * 4. 새로운 블록 추가하기:
 *    - 이벤트 핸들러의 조건문에 블록 추가
 *    - 예시: block.typeId === "minecraft:gold_block"
 * 
 * 5. 효과 명령어 예시:
 *    - effect @p speed 200 1 (신속, 10초, 레벨1)
 *    - effect @p jump_boost 200 2 (점프력, 10초, 레벨2)
 *    - effect @p strength 300 1 (힘, 15초, 레벨1)
 *    - effect @p resistance 200 1 (저항, 10초, 레벨1)
 */

// UI를 표시하는 함수
function showBlockUI(player, blockType, pos) {
    // 블록 이름 가져오기 (minecraft: 접두사 제거 및 _block 제거)
    const blockName = blockType.replace("minecraft:", "").replace("_block", "").replace(/_/g, " ");
    
    const form = new ActionFormData()
        .title(blockName.toUpperCase());

    // 블록 종류에 따라 다른 UI 표시
    switch (blockType) {
        case "minecraft:diamond_block":
            form.body("다이아몬드 블록 메뉴")
                .button("점프 부스트", "textures/items/diamond")
                .button("체력 회복", "textures/items/apple")
                .button("발광 효과", "textures/items/glowstone_dust");
            
            form.show(player).then((response) => {
                if (response.canceled) return;
                
                switch (response.selection) {
                    case 0:
                        player.runCommandAsync("effect @p jump_boost 200 1");
                        player.sendMessage("§b점프 부스트 효과가 적용되었습니다!");
                        break;
                    case 1:
                        player.runCommandAsync("effect @p instant_health 1 1");
                        player.sendMessage("§c체력이 회복되었습니다!");
                        break;
                    case 2:
                        player.runCommandAsync("effect @p glowing 200 1");
                        player.sendMessage("§e발광 효과가 적용되었습니다!");
                        break;
                }
            });
            break;

        case "minecraft:emerald_block":
            form.body("에메랄드 블록 메뉴")
                .button("신속", "textures/items/emerald")
                .button("야간 투시", "textures/items/blaze_powder")
                .button("투명화", "textures/items/potion_bottle_invisibility");
            
            form.show(player).then((response) => {
                if (response.canceled) return;
                
                switch (response.selection) {
                    case 0:
                        player.runCommandAsync("effect @p speed 200 2");
                        player.sendMessage("§a신속 효과가 적용되었습니다!");
                        break;
                    case 1:
                        player.runCommandAsync("effect @p night_vision 200 1");
                        player.sendMessage("§a야간 투시 효과가 적용되었습니다!");
                        break;
                    case 2:
                        player.runCommandAsync("effect @p invisibility 200 1");
                        player.sendMessage("§a투명화 효과가 적용되었습니다!");
                        break;
                }
            });
            break;
    }
}

// 블록 상호작용 이벤트 처리
world.beforeEvents.playerInteractWithBlock.subscribe((e) => {
    const player = e.player;
    const block = e.block;
    const item = e.itemStack;

    try {
        // 첫 번째 이벤트인 경우에만 처리
        if (e.isFirstEvent) {
            // 맨손으로 상호작용하는 경우 (아이템이 없는 경우)
            if (!item && (block.typeId === "minecraft:diamond_block" || block.typeId === "minecraft:emerald_block")) {
                e.cancel = true; // 기본 상호작용 취소
                system.run(() => {
                    showBlockUI(player, block.typeId, block.location);
                });
            }
        }
    } catch (error) {
        console.warn("블록 상호작용 처리 중 오류:", error);
    }
});
