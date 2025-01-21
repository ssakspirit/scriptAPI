/**
 * BlockProtector - 특정 영역의 블록을 보호하는 스크립트
 * 
 * [ 사용 방법 ]
 * 1. 관리자 권한:
 *    - 플레이어에게 'admin' 태그를 부여해야 관리자 권한을 얻을 수 있습니다.
 * 
 * 2. 영역 지정:
 *    - 관리자는 나무 도끼를 들고 보호하고 싶은 영역의 두 꼭지점을 클릭하여 지정합니다.
 *    - 첫 번째 클릭: 첫 번째 꼭지점 지정
 *    - 두 번째 클릭: 두 번째 꼭지점 지정 및 영역 설정 완료
 * 
 * 3. 명령어:
 *    - !좌표초기화: 설정된 보호 영역을 삭제합니다 (관리자만 사용 가능)
 * 
 * 4. 보호 기능:
 *    - 일반 플레이어는 보호된 영역 내에서 블록을 설치하거나 파괴할 수 없습니다.
 *    - 관리자는 모든 영역에서 자유롭게 블록을 설치/파괴할 수 있습니다.
 */

import { world, system } from "@minecraft/server"

const ADMIN_ITEM_NAME = `minecraft:wooden_axe`
const ADMIN_TAG = `admin`
const CANT_DESTROY_SOUND = `note.harp`
const CANT_DESTROY_MESSAGE = `§c[ system ] 해당 블록은 파괴할 수 없습니다.`
const CANT_PLACE_SOUND = `note.harp`
const CANT_PLACE_MESSAGE = `§c[ system ] 해당 블록은 설치할 수 없습니다.`


world.beforeEvents.chatSend.subscribe(e => {
    const player = e.sender
    const message = e.message
    if (message == `!좌표초기화`) {
        e.cancel = true
        if (player.hasTag(ADMIN_TAG)) {
            const location1 = world.getDynamicProperty(`notAllowLocation1`)

            if (location1) {
                world.setDynamicProperty(`notAllowLocation1`,)
                world.setDynamicProperty(`notAllowLocation2`,)
                player.sendMessage(`§e[ system ] 지정된 좌표를 초기화 했습니다.`)
                PlaySound(player, `random.levelup`)
            } else {
                player.sendMessage(`§c[ system ] 지정된 좌표가 없어 삭제가 불가능합니다.`)
                PlaySound(player, `note.harp`)
            }
        } else {
            player.sendMessage(`§c[ system ] 해당 명령어를 쓸 권한이 없습니다.`)
        }
    }
})

world.beforeEvents.playerInteractWithBlock.subscribe(e => {
    const player = e.player
    const item = e.itemStack
    const block = e.block

    if (item.typeId == ADMIN_ITEM_NAME && player.hasTag(ADMIN_TAG)) {
        e.cancel = true
        if (e.isFirstEvent) {
            const location1 = player.getDynamicProperty(`location1`)

            if (location1) {
                world.setDynamicProperty(`notAllowLocation1`, location1)
                world.setDynamicProperty(`notAllowLocation2`, block.location)
                player.setDynamicProperty(`location1`,)
                player.sendMessage(`§e[ system ] 총 좌표가 저장되었습니다. x1:${location1.x}, y1:${location1.y}, z1:${location1.z} | x2:${block.x}, y2:${block.y}, z2:${block.z}`)
                PlaySound(player, `random.levelup`)
            } else {
                player.setDynamicProperty(`location1`, block.location)
                player.sendMessage(`§e[ system ] 첫번째 좌표가 저장되었습니다. x:${block.x}, y:${block.y}, z:${block.z}`)
                PlaySound(player, `random.orb`)
            }
        }
    }
})

world.beforeEvents.playerPlaceBlock.subscribe(e => {
    const player = e.player
    const block = e.block

    if (!player.hasTag(ADMIN_TAG)) {
        const location1 = world.getDynamicProperty(`notAllowLocation1`)
        if (location1) {
            const location1 = world.getDynamicProperty(`notAllowLocation1`)
            const location2 = world.getDynamicProperty(`notAllowLocation2`)
            if (cantDestroy(location1, location2, block.location)) {
                e.cancel = true
                player.sendMessage(`${CANT_PLACE_MESSAGE}`)
                PlaySound(player, CANT_PLACE_SOUND)
            }
        }
    }
})

world.beforeEvents.playerBreakBlock.subscribe(e => {
    const player = e.player
    const block = e.block

    if (!player.hasTag(ADMIN_TAG)) {
        const location1 = world.getDynamicProperty(`notAllowLocation1`)
        if (location1) {
            const location1 = world.getDynamicProperty(`notAllowLocation1`)
            const location2 = world.getDynamicProperty(`notAllowLocation2`)
            if (cantDestroy(location1, location2, block.location)) {
                e.cancel = true
                player.sendMessage(`${CANT_DESTROY_MESSAGE}`)
                PlaySound(player, CANT_DESTROY_SOUND)
            }
        }
    }
})

function cantDestroy(location1, location2, blockLocation) {
    return blockLocation.x >= Math.min(location1.x, location2.x) && blockLocation.x <= Math.max(location1.x, location2.x) &&
        blockLocation.y >= Math.min(location1.y, location2.y) && blockLocation.y <= Math.max(location1.y, location2.y) &&
        blockLocation.z >= Math.min(location1.z, location2.z) && blockLocation.z <= Math.max(location1.z, location2.z);
}

function PlaySound(player, id) {
    system.run(() => {
        player.playSound(id)
    })
}
