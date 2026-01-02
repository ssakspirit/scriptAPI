/**
 * Platform Type Display System - 플레이어 플랫폼 정보 표시 시스템
 *
 * [ 기능 설명 ]
 * - 각 플레이어의 이름 위에 접속한 플랫폼 정보를 실시간으로 표시합니다.
 * - 플랫폼 종류: Desktop, Mobile, Console, PlayStation, Xbox, Switch 등
 *
 * [ 표시 형식 ]
 * 플레이어 이름
 * [플랫폼 타입] (빨간색으로 표시)
 *
 * [ 사용 방법 ]
 * - 스크립트를 활성화하면 자동으로 모든 플레이어의 플랫폼 정보가 표시됩니다.
 * - 별도의 설정이나 명령어가 필요하지 않습니다.
 *
 * [ 주의사항 ]
 * - 플랫폼 정보는 실시간으로 업데이트되며 서버 성능에 영향을 줄 수 있습니다.
 * - 모든 플레이어에게 표시되므로 개인정보 보호에 유의하세요.
 */

// @minecraft/server 모듈에서 world와 system 객체를 가져옵니다.
import { world, system } from '@minecraft/server'

// 주기적으로 실행되는 함수를 설정합니다.
system.runInterval(() => {
    // 서버의 모든 플레이어에 대해 반복합니다.
    for (const player of world.getAllPlayers()) {
        // 플레이어의 클라이언트 시스템 정보에서 플랫폼 타입을 가져옵니다.
        const os = player.clientSystemInfo.platformType
        
        // 플레이어의 이름 태그를 수정합니다.
        // 형식: 플레이어 이름 + 줄바꿈 + 빨간색 플랫폼 타입
        player.nameTag = player.name + `\n§c` + os
    }
})
