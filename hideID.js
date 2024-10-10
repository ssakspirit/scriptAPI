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
