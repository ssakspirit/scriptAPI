/**
 * Actionbar Scoreboard Display System
 * 액션바 스코어보드 표시 시스템
 * 
 * 기능 설명:
 * 1. 지정된 스코어보드의 값을 액션바에 실시간으로 표시합니다
 * 2. 여러 스코어보드를 동시에 표시할 수 있습니다
 * 3. 표시 형식과 색상을 커스터마이징할 수 있습니다
 * 
 * 사용 방법:
 * 1. DISPLAY_SCOREBOARDS 배열에 표시하고 싶은 스코어보드 이름을 추가하세요
 * 2. 게임에서 해당 스코어보드를 생성하고 값을 설정하세요
 *    예시: /scoreboard objectives add money dummy Money
 *         /scoreboard players set @p money 1000
 * 
 * 커스터마이징:
 * 1. DISPLAY_FORMAT에서 표시 형식을 수정할 수 있습니다
 * 2. UPDATE_INTERVAL에서 업데이트 주기를 조절할 수 있습니다
 */

import { world, system } from "@minecraft/server";

// 표시할 스코어보드 목록 (여기에 원하는 스코어보드 이름을 추가하세요)
const DISPLAY_SCOREBOARDS = [
    {
        name: "money",      // 스코어보드 이름
        displayName: "돈",  // 표시될 이름
        color: "§e"        // 색상 코드
    },
    {
        name: "level",      // 스코어보드 이름
        displayName: "레벨", // 표시될 이름
        color: "§a"        // 색상 코드
    }
    // 여기에 더 많은 스코어보드를 추가할 수 있습니다
];

// 업데이트 주기 (틱 단위, 20틱 = 1초)
const UPDATE_INTERVAL = 10;

// 액션바 업데이트
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            let displayText = "";
            
            // 각 스코어보드 값을 가져와서 표시
            for (const scoreboard of DISPLAY_SCOREBOARDS) {
                try {
                    const objective = world.scoreboard.getObjective(scoreboard.name);
                    if (objective) {
                        const score = objective.getScore(player.scoreboardIdentity) || 0;
                        displayText += `${scoreboard.color}${scoreboard.displayName}: ${score} §r`;
                    }
                } catch (error) {
                    // 스코어보드가 없는 경우 무시
                    console.warn(`스코어보드 '${scoreboard.name}' 를 찾을 수 없습니다.`);
                }
            }
            
            // 액션바에 표시
            if (displayText) {
                player.onScreenDisplay.setActionBar(displayText.trim());
            }
        } catch (error) {
            console.warn("액션바 업데이트 중 오류 발생:", error);
        }
    }
}, UPDATE_INTERVAL);
