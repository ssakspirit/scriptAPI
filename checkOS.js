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
