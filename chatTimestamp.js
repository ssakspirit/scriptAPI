/*
KoreanChatTimestamp - Minecraft Bedrock Chat Enhancement System

설명:
마인크래프트 베드락의 모든 채팅 메시지에 한국 시간을 표시하는 스크립트입니다.
날짜와 시간이 [YYYY.MM.DD HH:mm] 형식으로 표시되며, 한국 표준시(KST/UTC+9)를 사용합니다.

주요 기능:
- 모든 채팅 메시지에 자동으로 시간 표시
- 한국 표준시(UTC+9) 사용
- 깔끔하고 읽기 쉬운 시간 형식
- 기존 채팅 기능 유지
- 회색으로 표시되어 가독성 향상

사용 예시:
[2024.01.25 14:30] <플레이어> 안녕하세요
*/

import { world, system } from "@minecraft/server";

// 한국 시간 포맷 함수
function getKoreanTime() {
    const now = new Date();
    // UTC+9 (한국 시간)
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const year = koreaTime.getUTCFullYear();
    const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(koreaTime.getUTCDate()).padStart(2, '0');
    const hours = String(koreaTime.getUTCHours()).padStart(2, '0');
    const minutes = String(koreaTime.getUTCMinutes()).padStart(2, '0');

    return `§7[${year}.${month}.${day} ${hours}:${minutes}]§r`;
}

// 채팅 이벤트 수정
world.beforeEvents.chatSend.subscribe((ev) => {
    const player = ev.sender;
    const message = ev.message;
    
    // 일반 채팅 메시지 처리
    ev.cancel = true; // 기본 채팅 메시지 취소
    const timeStamp = getKoreanTime();
    
    // 모든 플레이어에게 시간이 포함된 메시지 전송
    for (const p of world.getAllPlayers()) {
        p.sendMessage(`${timeStamp} <${player.name}> ${message}`);
    }
});
