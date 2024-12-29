import { world, system, ItemStack } from "@minecraft/server";

/**
 * Magic Wand System - Block Interaction Magic
 * 마법 지팡이 시스템 - 블록 상호작용 마법
 * 
 * 사용 방법:
 * 1. 막대기의 이름을 '마법지팡이'로 변경하세요 (모루 사용)
 *    - 영어 명령어: /give @p stick 1 0 {"minecraft:keep_on_death":{},"minecraft:item_name":"마법지팡이"}
 * 
 * 2. 특별한 블록들과 상호작용하여 마법을 시전하세요:
 *    - 다이아몬드 블록: 점프 부스트 효과
 *    - 에메랄드 블록: 신속 효과
 *    - 금 블록: 힘 효과
 *    - 레드스톤 블록: 주변 몹 공중부양
 *    - 옵시디언: 번개 소환
 *    - 석탄 블록: 밤으로 변경
 *    - 청금석 블록: 낮으로 변경
 * 
 * 3. 커스터마이징:
 *    - BLOCK_COMMANDS 객체에서 실행할 명령어들을 수정할 수 있습니다
 *    - 새로운 블록과 명령어를 추가할 수 있습니다
 *    - 각 블록마다 여러 개의 명령어를 순차적으로 실행할 수 있습니다
 */

// 블록별 실행할 명령어 정의
const BLOCK_COMMANDS = {
    "minecraft:diamond_block": {
        commands: [
            'effect @p jump_boost 200 1',
            'particle minecraft:totem_particle ~ ~1 ~',
            'playsound random.levelup @p'
        ],
        message: "§b점프 부스트를 획득했습니다!"
    },
    "minecraft:emerald_block": {
        commands: [
            'effect @p speed 200 2',
            'particle minecraft:totem_particle ~ ~1 ~',
            'playsound random.orb @p'
        ],
        message: "§a신속 효과를 획득했습니다!"
    },
    "minecraft:gold_block": {
        commands: [
            'effect @p strength 300 1',
            'particle minecraft:totem_particle ~ ~1 ~',
            'playsound random.anvil_use @p'
        ],
        message: "§6힘 효과를 획득했습니다!"
    },
    "minecraft:redstone_block": {
        commands: [
            'effect @e[type=!player,r=5] levitation 1 20',
            'particle minecraft:huge_explosion_emitter ~ ~ ~',
            'playsound random.explode @a[r=10]'
        ],
        message: "§c주변 몹들을 공중으로 날렸습니다!"
    },
    "minecraft:obsidian": {
        commands: [
            'summon lightning_bolt ~ ~ ~',
            'particle minecraft:huge_explosion_emitter ~ ~ ~',
            'playsound ambient.weather.thunder @a[r=20]'
        ],
        message: "§e번개를 소환했습니다!"
    },
    "minecraft:coal_block": {
        commands: [
            'time set night',
            'particle minecraft:mob_portal ~ ~1 ~',
            'playsound mob.wither.spawn @p'
        ],
        message: "§8밤이 되었습니다!"
    },
    "minecraft:lapis_block": {
        commands: [
            'time set day',
            'particle minecraft:villager_happy ~ ~1 ~',
            'playsound random.orb @p'
        ],
        message: "§9낮이 되었습니다!"
    }
};

// 마법 지팡이 설정
const MAGIC_WAND = {
    typeId: "minecraft:stick",
    name: "마법지팡이"
};

world.beforeEvents.playerInteractWithBlock.subscribe(e => {
    const player = e.player;
    const block = e.block;
    const itemStack = e.itemStack;

    if (e.isFirstEvent) {
        try {
            if (itemStack?.typeId === MAGIC_WAND.typeId && 
                itemStack?.nameTag === MAGIC_WAND.name) {
                
                const blockCommands = BLOCK_COMMANDS[block.typeId];
                
                if (blockCommands) {
                    const pos = block.location;
                    system.run(() => {
                        // 모든 명령어 실행
                        for (const cmd of blockCommands.commands) {
                            world.getDimension("overworld").runCommand(
                                cmd.replace(/[~]/g, (match) => {
                                    return match === '~' ? pos.y : pos[match === '~' ? 'y' : match === '~x' ? 'x' : 'z'];
                                })
                            );
                        }
                    });
                    player.sendMessage(blockCommands.message);
                }
            }
        } catch (error) {
            console.warn("블록 상호작용 처리 중 오류:", error);
        }
    }
});
