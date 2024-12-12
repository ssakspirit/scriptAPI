/*
스킬 아이템 시스템 사용 설명서

1. 기본 사용법
- 특정 이름을 가진 아이템을 우클릭하면 스킬이 발동됩니다.
- 각 스킬은 쿨타임이 있으며 액션바에 표시됩니다.

2. 기본 제공 스킬 아이템
   a) 그리스월드의 칼 (다이아몬드 검)
      - 보는 방향으로 번개와 폭발을 일으킵니다
      - 쿨타임: 10초
   
   b) 얼음지팡이 (막대기)
      - 주변 몹에게 슬로우 효과를 주고 눈덩이를 떨어뜨립니다
      - 쿨타임: 15초

3. 새로운 스킬 아이템 추가 방법
   SKILL_ITEMS 객체에 새로운 스킬을 추가하면 됩니다.

   예시:
   "불의 지팡이": {
       type: "minecraft:blaze_rod",        // 아이템의 실제 타입
       cooldown: 20,                       // 쿨타임(초)
       skill: (player) => {
           // 쿨타임 체크 (필수)
           if (isOnCooldown(player, "불의 지팡이")) return;

           system.run(() => {
               // 여기에 스킬 효과 구현
               player.runCommand(`효과 명령어`);
               
               // 쿨타임 시작 (필수)
               startCooldown(player, "불의 지팡이");
           });
       }
   }

4. 사용 가능한 명령어 예시
   - 이펙트: effect @e[type=!player,r=10] <효과이름> <시간> <강도>
   - 파티클: particle <파티클이름> <x> <y> <z>
   - 엔티티 소환: summon <엔티티이름> <x> <y> <z>
   - 폭발: player.dimension.createExplosion(위치, 크기, {옵션})

5. 아이템 설정 방법
   - 일반 아이템의 이름을 모루에서 스킬 이름으로 변경하면 됩니다
   - 예: 다이아몬드 검의 이름을 "그리스월드의 칼"로 변경

주의사항:
- 새로운 스킬 추가 시 반드시 쿨타임 체크와 시작을 구현해야 합니다
- 스킬 이름은 정확히 일치해야 합니다
- type은 마인크래프트 아이템 ID를 사용합니다
*/

import { world, system } from "@minecraft/server";

// 쿨타임 관리를 위한 Map
const cooldowns = new Map();

// 스킬 아이템 정의
const SKILL_ITEMS = {
    "그리스월드의 칼": {
        type: "minecraft:diamond_sword",
        cooldown: 10, // 10초 쿨타임
        skill: (player) => {
            // 쿨타임 체크
            if (isOnCooldown(player, "그리스월드의 칼")) return;

            // 플레이어의 시선 방향으로 스킬 발동
            const viewDirection = player.getViewDirection();
            const targetPos = {
                x: player.location.x + viewDirection.x * 5,
                y: player.location.y + viewDirection.y * 5,
                z: player.location.z + viewDirection.z * 5
            };

            system.run(() => {
                // 번개 소환
                player.runCommand(`summon lightning_bolt ${targetPos.x} ${targetPos.y} ${targetPos.z}`);
                
                // 0.5초 후에 폭발 효과
                system.runTimeout(() => {
                    player.dimension.createExplosion(targetPos, 2, { breaksBlocks: false });
                }, 10);

                world.sendMessage(`§a${player.name}님이 번개 스킬을 사용했습니다!`);
                
                // 쿨타임 시작
                startCooldown(player, "그리스월드의 칼");
            });
        }
    },
    "얼음지팡이": {
        type: "minecraft:stick",
        cooldown: 15, // 15초 쿨타임
        skill: (player) => {
            // 쿨타임 체크
            if (isOnCooldown(player, "얼음지팡이")) return;

            system.run(() => {
                // 주변 몹들에게 강력한 슬로우 효과
                player.runCommand(`effect @e[type=!player,r=10] slowness 10 4 true`);
                
                // 여러 방향으로 눈덩이 발사
                const positions = [
                    "~ ~5 ~", "~2 ~5 ~", "~-2 ~5 ~",
                    "~ ~5 ~2", "~ ~5 ~-2", "~2 ~5 ~2",
                    "~-2 ~5 ~-2", "~2 ~5 ~-2", "~-2 ~5 ~2"
                ];
                
                positions.forEach(pos => {
                    player.runCommand(`summon snowball ${pos}`);
                });
                
                // 시각 효과를 위해 파티클 추가
                player.runCommand(`particle minecraft:splash ~ ~0.5 ~`);
                player.runCommand(`particle minecraft:splash ~ ~0.5 ~1`);
                player.runCommand(`particle minecraft:splash ~1 ~0.5 ~`);
                player.runCommand(`particle minecraft:splash ~ ~0.5 ~-1`);
                player.runCommand(`particle minecraft:splash ~-1 ~0.5 ~`);

                world.sendMessage(`§b${player.name}님이 강력한 얼음 스킬을 사용했습니다!`);
                
                // 쿨타임 시작
                startCooldown(player, "얼음지팡이");
            });
        }
    }
};

// 쿨타임 체크 함수
function isOnCooldown(player, skillName) {
    const key = `${player.name}-${skillName}`;
    const cooldownInfo = cooldowns.get(key);
    
    if (cooldownInfo && cooldownInfo.endTime > Date.now()) {
        const remainingSeconds = Math.ceil((cooldownInfo.endTime - Date.now()) / 1000);
        player.runCommand(`title @s actionbar §c${skillName} 쿨타임: ${remainingSeconds}초`);
        return true;
    }
    return false;
}

// 쿨타임 시작 함수
function startCooldown(player, skillName) {
    const key = `${player.name}-${skillName}`;
    const cooldownTime = SKILL_ITEMS[skillName].cooldown;
    
    cooldowns.set(key, {
        endTime: Date.now() + (cooldownTime * 1000),
        skillName: skillName
    });

    // 쿨타임 타이머 시작
    let remainingSeconds = cooldownTime;
    
    const timerId = system.runInterval(() => {
        remainingSeconds--;
        if (remainingSeconds > 0) {
            player.runCommand(`title @s actionbar §c${skillName} 쿨타임: ${remainingSeconds}초`);
        } else {
            system.clearRun(timerId);
            player.runCommand(`title @s actionbar §a${skillName} 사용 가능!`);
            cooldowns.delete(key);
        }
    }, 20); // 1초마다 실행
}

// 아이템 사용 이벤트 처리
world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;

    if (!item || !item.nameTag) return;

    const skillItem = SKILL_ITEMS[item.nameTag];
    if (skillItem && item.typeId === skillItem.type) {
        skillItem.skill(player);
    }
});
