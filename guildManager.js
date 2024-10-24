import { world, system } from '@minecraft/server'; // 서버와 시스템 기능을 사용하기 위해 모듈을 가져옴
import { ActionFormData } from "@minecraft/server-ui"; // UI 폼을 만들기 위해 필요한 모듈 가져옴

// 플레이어가 채팅을 보낼 때 발생하는 이벤트 처리
world.beforeEvents.chatSend.subscribe((ev) => {
    const msg = ev.message; // 플레이어가 보낸 채팅 메시지
    const player = ev.sender; // 메시지를 보낸 플레이어 객체

    // '!길드' 명령어로 길드 관리 UI 열기
    if (msg == "!길드") {
        ev.cancel = true; // 채팅 메시지가 보이지 않도록 취소
        player.sendMessage(`채팅창을 닫으면 길드 관리 창이 열립니다.`); // 안내 메시지 전송
        openGuildUI(player); // 길드 관리 UI 표시 함수 호출
    }
});

// 길드 관리 UI를 표시하는 함수
function openGuildUI(player) {
    system.run(() => {
        const form = new ActionFormData(); // UI 폼 생성
        form.title("길드 관리"); // 폼 제목 설정
        form.body("원하는 작업을 선택하세요."); // 정보 출력
        form.button("길드 생성"); // 길드 생성 버튼 추가
        form.button("길드 가입"); // 길드 가입 버튼 추가
        form.button("길드 탈퇴"); // 길드 탈퇴 버튼 추가
        form.button("길드 정보"); // 길드 정보 버튼 추가
        form.button("닫기"); // 닫기 버튼 추가

        form.show(player).then(response => {
            if (response.cancelationReason == "UserBusy") { // 사용자가 다른 UI를 사용 중이라면
                openGuildUI(player); // 다시 폼을 표시
            }
        });
    });
}
