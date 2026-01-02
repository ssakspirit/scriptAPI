/**
 * Item Cooldown System with Random Effects - 쿨타임 아이템 시스템
 *
 * [ 기능 설명 ]
 * - 특정 이름을 가진 아이템을 사용하면 랜덤 효과가 적용됩니다.
 * - 쿨타임 시스템으로 연속 사용을 제한합니다.
 * - 액션바에 남은 쿨타임이 실시간으로 표시됩니다.
 *
 * [ 사용 방법 ]
 * 1. "마법석"이라는 이름을 가진 에메랄드 아이템을 사용합니다.
 * 2. 랜덤으로 속도, 느려짐, 점프 향상, 힘 증가, 약화 중 하나의 효과가 적용됩니다.
 * 3. 쿨타임(10초) 동안은 아이템을 다시 사용할 수 없습니다.
 * 4. 액션바에 남은 쿨타임이 표시됩니다.
 *
 * [ 커스터마이징 ]
 * - desiredNameTag: 사용할 아이템의 이름을 변경할 수 있습니다.
 * - COOLDOWN_TIME: 쿨타임 시간을 변경할 수 있습니다 (밀리초 단위).
 * - effects 배열: 적용될 효과 목록을 추가하거나 변경할 수 있습니다.
 *
 * [ 주의사항 ]
 * - 아이템의 typeId는 "minecraft:emerald"여야 합니다.
 * - 아이템의 이름(nameTag)이 정확히 일치해야 합니다.
 */

import { world, system } from '@minecraft/server';

// 쿨타임을 저장할 객체 (플레이어마다 저장)
const cooldowns = new Map();
const COOLDOWN_TIME = 10000; // 쿨타임: 10초 (밀리초 단위)

// 아이템 사용 시 처리
world.afterEvents.itemUse.subscribe(ev => {
    const player = ev.source; // 아이템을 사용한 플레이어
    const item = ev.itemStack; // 사용한 아이템
    const desiredNameTag = "마법석" // 여기서 원하는 이름을 설정


    // 사용한 아이템이 에메랄드이며 태그가 '마법석'일 때만 실행
    if (item.typeId === "minecraft:emerald" && item.nameTag === desiredNameTag) {
        const currentTime = Date.now(); // 현재 시간
        const playerName = player.name; // 플레이어 이름

        // 이전 쿨타임이 끝났는지 확인
        if (cooldowns.has(playerName) && currentTime < cooldowns.get(playerName)) {
            const timeLeft = ((cooldowns.get(playerName) - currentTime) / 1000).toFixed(1); // 남은 쿨타임 계산
            // 액션바에 남은 쿨타임 표시
            player.runCommand(`title @s actionbar §c쿨타임: ${timeLeft}초 남음`);
            return; // 쿨타임 중이면 추가 실행하지 않음
        }

        // 랜덤 효과 목록
        const effects = [
            "speed 5 10 true", // 속도 효과
            "slowness 5 10 true", // 느려짐 효과
            "jump_boost 5 10 true", // 점프 향상 효과
            "strength 5 10 true", // 힘 증가 효과
            "weakness 5 10 true" // 약화 효과
        ];

        // 랜덤으로 효과 선택
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];

        // 플레이어에게 효과 적용
        player.runCommand(`effect @s ${randomEffect}`); // 랜덤 효과 부여
        player.sendMessage(`§a랜덤 효과가 적용되었습니다: ${randomEffect}`); // 메시지 전송

        // 쿨타임 시작 (현재 시간 + 쿨타임 시간)
        cooldowns.set(playerName, currentTime + COOLDOWN_TIME); // 쿨타임 설정
    }
});

// 쿨타임 체크와 액션바 업데이트를 위한 반복 실행
system.runInterval(() => {
    const currentTime = Date.now(); // 현재 시간
    const players = world.getAllPlayers(); // 모든 플레이어 가져오기

    for (const player of players) {
        const playerName = player.name; // 플레이어 이름

        // 쿨타임이 남아있는 플레이어에 대해 액션바에 쿨타임 표시
        if (cooldowns.has(playerName)) {
            const timeLeft = ((cooldowns.get(playerName) - currentTime) / 1000).toFixed(0); // 남은 쿨타임 계산

            // 쿨타임이 남아있을 때 액션바에 표시, 쿨타임이 끝나면 삭제
            if (currentTime < cooldowns.get(playerName)) {
                player.runCommand(`title @s actionbar §e쿨타임: ${timeLeft}초`); // 남은 쿨타임 표시
            } else {
                cooldowns.delete(playerName); // 쿨타임 종료 시 삭제
                player.runCommand(`title @s actionbar §a쿨타임 종료`); // 쿨타임 종료 메시지
            }
        }
    }
}, 20); // 매 1초(20틱)마다 실행
