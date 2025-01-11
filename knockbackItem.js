import { world, system } from "@minecraft/server"

/*
 * 넉백 스킬 설정
 * - KNOCKBACK_ITEM: 스킬을 사용할 아이템 (minecraft:mace)
 * - KNOCKBACK_ITEM_NAME: 아이템의 표시 이름
 * - KNOCKBACK_RANGE: 넉백이 적용되는 범위 (블록)
 * - KNOCKBACK_POWER: 넉백의 세기 (기본값: 3)
 * - KNOCKBACK_HEIGHT: 위로 뜨는 힘 (기본값: 0.7)
 * - PARTICLE_RADIUS: 파티클 원형 효과의 반지름
 * 
 * [ 아이템 획득 방법 ]
 * 1. 명령어로 획득:
 *    /give @s mace 1 0 {"name":"§r§b넉백의 망치§r"}
 * 2. 또는 모루에서 이름 변경:
 *    매이스를 모루에서 "넉백의 망치"로 이름 변경
 */
const KNOCKBACK_CONFIG = {
    // 아이템 설정
    ITEM: "minecraft:mace",
    ITEM_NAME: "넉백의 망치",
    
    // 넉백 효과 설정
    RANGE: 10,           // 범위 (블록)
    POWER: 3,           // 넉백 세기
    HEIGHT: 0.7,        // 위로 뜨는 힘
    
    // 파티클 설정
    PARTICLE_RADIUS: 1.5 // 파티클 원형 효과의 반지름
};

// 아이템 사용 이벤트
world.beforeEvents.itemUse.subscribe(e => {
    const player = e.source
    const item = e.itemStack

    // 아이템 타입과 이름이 모두 일치하는지 확인
    if (item.typeId === KNOCKBACK_CONFIG.ITEM && item.nameTag === KNOCKBACK_CONFIG.ITEM_NAME) {
        e.cancel = true

        system.run(() => {
            // 플레이어 위치에 초기 파티클 효과
            const dimension = world.getDimension(`overworld`)
            const loc = player.location
            
            // 충격파 효과
            dimension.runCommand(`particle minecraft:explosion_particle ${loc.x} ${loc.y} ${loc.z}`)
            dimension.runCommand(`particle minecraft:sonic_explosion ${loc.x} ${loc.y} ${loc.z}`)
            
            // 원형 파티클 생성
            for (let i = 0; i < 360; i += 10) {
                const angle = i * Math.PI / 180
                const px = loc.x + Math.cos(angle) * KNOCKBACK_CONFIG.PARTICLE_RADIUS
                const pz = loc.z + Math.sin(angle) * KNOCKBACK_CONFIG.PARTICLE_RADIUS
                dimension.runCommand(`particle minecraft:basic_smoke_particle ${px} ${loc.y} ${pz}`)
            }

            // 넉백 적용 및 개별 파티클
            for (const entity of dimension.getEntities({ 
                location: player.location, 
                maxDistance: KNOCKBACK_CONFIG.RANGE, 
                excludeNames: [player.name] 
            })) {
                try {
                    // 먼저 엔티티가 플레이어를 바라보게 함
                    entity.lookAt(player.location)
                    
                    // 엔티티의 새로운 방향을 가져옴
                    const { x, z } = entity.getViewDirection()
                    
                    // 넉백 적용
                    entity.applyKnockback(
                        -x, 
                        -z, 
                        KNOCKBACK_CONFIG.POWER, 
                        KNOCKBACK_CONFIG.HEIGHT
                    )
                    
                    // 넉백이 성공적으로 적용된 엔티티에만 파티클 효과 적용
                    const eLoc = entity.location
                    dimension.runCommand(`particle minecraft:knockback_roar_particle ${eLoc.x} ${eLoc.y} ${eLoc.z}`)
                } catch (error) {
                    // 넉백이 지원되지 않는 엔티티는 무시
                    continue;
                }
            }

            // 사운드 효과 추가
            dimension.runCommand(`playsound mob.enderdragon.hit @a ${loc.x} ${loc.y} ${loc.z} 1 1`)
        })
    }
});
