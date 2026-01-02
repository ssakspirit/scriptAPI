/**
 * Hide Player Name System - 플레이어 이름 숨기기 시스템
 *
 * [ 기능 설명 ]
 * - 모든 플레이어의 이름표(nameTag)를 숨깁니다.
 * - 플레이어 머리 위에 이름이 표시되지 않습니다.
 *
 * [ 사용 방법 ]
 * - 스크립트를 활성화하면 자동으로 모든 플레이어의 이름이 숨겨집니다.
 * - 별도의 설정이나 명령어가 필요하지 않습니다.
 *
 * [ 주의사항 ]
 * - 2틱마다 실행되어 이름표를 빈 문자열로 유지합니다.
 * - 플레이어 구분이 어려워질 수 있으므로 PvP 서버에 유용합니다.
 * - 다른 스크립트에서 nameTag를 사용하는 경우 충돌할 수 있습니다.
 */

// Minecraft 서버 모듈에서 world와 system을 가져옵니다.
import { world, system } from "@minecraft/server"

// 2틱마다 실행되는 간격 함수를 설정합니다.
system.runInterval(() => {
    // 월드의 모든 플레이어에 대해 반복합니다.
    for (const player of world.getAllPlayers()) {
        // 각 플레이어의 이름 태그를 빈 문자열로 설정합니다.
        player.nameTag = ""
    }
}, 2)
