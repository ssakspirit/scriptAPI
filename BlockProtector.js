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
 *    - !보호목록: 현재 설정된 모든 보호 영역을 보여줍니다
 *    - !보호삭제 [번호]: 특정 번호의 보호 영역을 삭제합니다
 *    - !보호초기화: 모든 보호 영역을 삭제합니다
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
const DB_KEY = "protectedAreas"

// 보호 영역 데이터 로드
function loadProtectedAreas() {
    try {
        const savedData = world.getDynamicProperty(DB_KEY);
        return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
        console.warn("데이터 로드 실패:", error);
        return [];
    }
}

// 보호 영역 데이터 저장
function saveProtectedAreas(areas) {
    try {
        world.setDynamicProperty(DB_KEY, JSON.stringify(areas));
    } catch (error) {
        console.warn("데이터 저장 실패:", error);
    }
}

// 채팅 명령어 처리
world.beforeEvents.chatSend.subscribe(e => {
    const player = e.sender
    const message = e.message

    if (!player.hasTag(ADMIN_TAG)) {
        if (message.startsWith('!보호')) {
            e.cancel = true;
            player.sendMessage(`§c[ system ] 해당 명령어를 쓸 권한이 없습니다.`);
            return;
        }
    }

    if (message === '!보호목록') {
        e.cancel = true;
        const areas = loadProtectedAreas();
        if (areas.length === 0) {
            player.sendMessage(`§e[ system ] 설정된 보호 영역이 없습니다.`);
            return;
        }
        player.sendMessage(`§e[ system ] 보호 영역 목록:`);
        areas.forEach((area, index) => {
            player.sendMessage(`§e${index + 1}. (${area.pos1.x}, ${area.pos1.y}, ${area.pos1.z}) - (${area.pos2.x}, ${area.pos2.y}, ${area.pos2.z})`);
        });
        PlaySound(player, `random.orb`);
    } else if (message.startsWith('!보호삭제 ')) {
        e.cancel = true;
        const index = parseInt(message.split(' ')[1]) - 1;
        const areas = loadProtectedAreas();
        if (isNaN(index) || index < 0 || index >= areas.length) {
            player.sendMessage(`§c[ system ] 올바른 보호 영역 번호를 입력해주세요.`);
            return;
        }
        areas.splice(index, 1);
        saveProtectedAreas(areas);
        player.sendMessage(`§e[ system ] ${index + 1}번 보호 영역이 삭제되었습니다.`);
        PlaySound(player, `random.levelup`);
    } else if (message === '!보호초기화') {
        e.cancel = true;
        saveProtectedAreas([]);
        player.sendMessage(`§e[ system ] 모든 보호 영역이 초기화되었습니다.`);
        PlaySound(player, `random.levelup`);
    }
})

// 블록 상호작용 처리
world.beforeEvents.playerInteractWithBlock.subscribe(e => {
    const player = e.player
    const item = e.itemStack
    const block = e.block

    if (item?.typeId === ADMIN_ITEM_NAME && player.hasTag(ADMIN_TAG)) {
        e.cancel = true
        if (e.isFirstEvent) {
            const location1 = player.getDynamicProperty(`location1`)

            if (location1) {
                const areas = loadProtectedAreas();
                areas.push({
                    pos1: location1,
                    pos2: {
                        x: block.location.x,
                        y: block.location.y,
                        z: block.location.z
                    }
                });
                saveProtectedAreas(areas);
                player.setDynamicProperty(`location1`, undefined);
                player.sendMessage(`§e[ system ] 새로운 보호 영역이 저장되었습니다. (${location1.x}, ${location1.y}, ${location1.z}) - (${block.location.x}, ${block.location.y}, ${block.location.z})`);
                PlaySound(player, `random.levelup`);
            } else {
                player.setDynamicProperty(`location1`, {
                    x: block.location.x,
                    y: block.location.y,
                    z: block.location.z
                });
                player.sendMessage(`§e[ system ] 첫번째 좌표가 저장되었습니다. (${block.location.x}, ${block.location.y}, ${block.location.z})`);
                PlaySound(player, `random.orb`);
            }
        }
    }
})

// 블록 설치 방지
world.beforeEvents.playerPlaceBlock.subscribe(e => {
    const player = e.player
    const block = e.block

    if (!player.hasTag(ADMIN_TAG)) {
        const areas = loadProtectedAreas();
        for (const area of areas) {
            if (isInProtectedArea(area.pos1, area.pos2, block.location)) {
                e.cancel = true;
                player.sendMessage(CANT_PLACE_MESSAGE);
                PlaySound(player, CANT_PLACE_SOUND);
                break;
            }
        }
    }
})

// 블록 파괴 방지
world.beforeEvents.playerBreakBlock.subscribe(e => {
    const player = e.player
    const block = e.block

    if (!player.hasTag(ADMIN_TAG)) {
        const areas = loadProtectedAreas();
        for (const area of areas) {
            if (isInProtectedArea(area.pos1, area.pos2, block.location)) {
                e.cancel = true;
                player.sendMessage(CANT_DESTROY_MESSAGE);
                PlaySound(player, CANT_DESTROY_SOUND);
                break;
            }
        }
    }
})

// 좌표가 보호 영역 내에 있는지 확인
function isInProtectedArea(pos1, pos2, blockLocation) {
    return blockLocation.x >= Math.min(pos1.x, pos2.x) && blockLocation.x <= Math.max(pos1.x, pos2.x) &&
           blockLocation.y >= Math.min(pos1.y, pos2.y) && blockLocation.y <= Math.max(pos1.y, pos2.y) &&
           blockLocation.z >= Math.min(pos1.z, pos2.z) && blockLocation.z <= Math.max(pos1.z, pos2.z);
}

function PlaySound(player, id) {
    system.run(() => {
        player.playSound(id)
    })
}
