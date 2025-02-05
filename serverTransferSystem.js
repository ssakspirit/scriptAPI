/**
 * Server Transfer System (서버 이동 시스템)
 * 
 * [추가 모듈]
 * manifest.json파일의 dependencies:에 다음 내용을 추가해야합니다.
 * {
 *     "module_name": "@minecraft/server-admin",
 *     "version": "1.0.0-beta"
 * }
 * 
 * [ 시스템 설명 ]
 * 나침반을 사용하여 다른 Minecraft 서버로 이동할 수 있는 시스템입니다.
 * UI를 통해 원하는 서버를 선택하면 자동으로 해당 서버로 이동합니다.
 * 
 * [ 사용 방법 ]
 * 1. 나침반 사용:
 *    - 인벤토리에서 나침반을 들고 사용(우클릭)하면 서버 목록 UI가 표시됩니다.
 * 
 * 2. 서버 선택:
 *    - UI에서 이동하고 싶은 서버를 클릭하면 자동으로 해당 서버로 이동합니다.
 * 
 * [ 지원 서버 목록 ]
 * - GALAXITE (play.galaxite.net)
 * - Lifeboat (mco.lbsg.net)
 * - Mineville (play.inpvp.net)
 * - CubeCraft (mco.cubecraft.net)
 * - The Hive (geo.hivebedrock.network)
 * - Enchanted Dragons (play.enchanted.gg)
 * 
 * [ 주의사항 ]
 * 1. 서버 이동 시 현재 월드의 진행상황은 저장되지 않습니다.
 * 2. 일부 서버는 접속이 제한될 수 있습니다.
 * 3. 서버 주소는 변경될 수 있으며, 항상 최신 주소를 사용해야 합니다.
 */

import { world, system } from "@minecraft/server"
import { ActionFormData } from "@minecraft/server-ui";
import { transferPlayer } from '@minecraft/server-admin';

// 서버 목록 정의
// 각 서버의 접속 정보(IP, 포트)를 저장
const servers = {
    "GALAXITE": {
        ip: `play.galaxite.net`,
        port: 19132
    },
    "lifeboat": {
        ip: `mco.lbsg.net`,
        port: 19132
    },
    "Mineville": {
        ip: `play.inpvp.net`,
        port: 19132
    },
    "CubeCraft": {
        ip: `mco.cubecraft.net`,
        port: 19132
    },
    "The Hive": {
        ip: `geo.hivebedrock.network`,
        port: 19132
    },
    "Enchanted Dragons": {
        ip: `play.enchanted.gg`,
        port: 19132
    }
}

// 나침반 사용 이벤트 감지
world.beforeEvents.itemUse.subscribe(e => {
    const player = e.source
    const item = e.itemStack

    // 나침반을 사용하면 서버 선택 UI 표시
    if (item.typeId == `minecraft:compass`) {
        serversUI(player)
    }
})

// 서버 선택 UI 표시 함수
function serversUI(player) {
    system.run(() => {
        const form = new ActionFormData()
        form.title(`서버 이동`)
        form.body(`가고 싶은 서버를 선택하세요.`)
        // 서버 목록을 버튼으로 표시
        Object.keys(servers).forEach(r => {
            form.button(r)
        })

        // UI 표시 및 서버 이동 처리
        form.show(player).then(r => {
            if (r.canceled) return  // UI가 취소되면 종료
            // 선택된 서버 정보 가져오기
            const serverInfo = servers[Object.keys(servers)[r.selection]]
            // 선택된 서버로 플레이어 이동
            transferPlayer(player, serverInfo.ip, serverInfo.port)
        })
    })
}
