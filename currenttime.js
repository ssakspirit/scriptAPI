/**
 * Korean Time Display System - 한국 시간 표시 시스템
 *
 * [ 기능 설명 ]
 * - 모든 플레이어의 액션바에 한국 시간을 실시간으로 표시합니다.
 * - 날짜, 요일, 시간이 모두 표시됩니다.
 *
 * [ 표시 형식 ]
 * YYYY년 MM월 DD일 (요일) HH:MM:SS
 * 예시: 2024년 1월 15일 (월) 14:30:25
 *
 * [ 사용 방법 ]
 * - 스크립트를 활성화하면 자동으로 모든 플레이어에게 시간이 표시됩니다.
 * - 별도의 설정이나 명령어가 필요하지 않습니다.
 *
 * [ 주의사항 ]
 * - 한국 표준시(KST, UTC+9)를 기준으로 표시됩니다.
 * - 2틱마다 업데이트되어 실시간으로 시간을 보여줍니다.
 *
 * [ 크레딧 ]
 * - 플럼님이 제공한 코드입니다.
 */

import { world, system } from "@minecraft/server"
//플럼님이 제공한 코드입니다. 

system.runInterval(() => {
    try {
        for (const player of world.getAllPlayers()) {
            // 한국 시간 계산
            const kr_date = new Date(new Date().getTime() +
                (new Date().getTimezoneOffset() * 60 * 1000) +
                (9 * 60 * 60 * 1000));

            // 요일 배열 (한글)
            const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

            // 날짜 형식 구성
            const year = kr_date.getFullYear();
            const month = kr_date.getMonth() + 1;  // getMonth()는 0부터 시작
            const date = kr_date.getDate();
            const day = weekDays[kr_date.getDay()];
            const time = kr_date.toString().split(` `)[4];

            // 액션바에 표시 (YYYY년 MM월 DD일 (요일) HH:MM:SS)
            player.onScreenDisplay.setActionBar(
                `§e${year}년 ${month}월 ${date}일 §a(${day}) §b${time}`
            );
        }
    } catch (error) {
        console.warn("시간 표시 중 오류:", error);
    }
}, 2);
