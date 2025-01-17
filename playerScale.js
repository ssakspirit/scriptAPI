import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

/**
 * 플레이어 크기 조절 스크립트
 * 
 * 사용법:
 * 1. 종이(paper) 아이템을 들고 사용하거나
 * 2. 채팅창에 !사이즈 를 입력하면 크기 조절 메뉴가 열립니다.
 * 
 * 기능:
 * - 플레이어의 크기를 1/10 ~ 10배까지 조절 가능
 * - 기본 크기는 1.0배 (슬라이더 값 10)
 * - 크기 초기화 기능 제공
 */

// 플레이어의 크기를 지속적으로 업데이트하는 시스템
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const value = player.getDynamicProperty(`scaleValue`)  // 저장된 크기 값 불러오기
        const ScaleComponent = player.getComponent("minecraft:scale")
        if (value) {
            ScaleComponent.value = value / 10  // 실제 크기는 설정값의 1/10
        } else {
            ScaleComponent.value = 1.0  // 기본 크기
        }
    }
}, 5)  // 5틱마다 실행

// 종이 아이템 사용 시 메뉴 열기
world.beforeEvents.itemUse.subscribe(e => {
    const player = e.source
    const item = e.itemStack

    if (item.typeId == `minecraft:paper`) {
        showActionForm(player)
        playButtonSoud(player)
    }
})

// !사이즈 명령어로 메뉴 열기
world.beforeEvents.chatSend.subscribe(e => {
    const player = e.sender
    const message = e.message

    if (message == `!사이즈`) {
        e.cancel = true  // 채팅 메시지 전송 취소
        player.sendMessage(`§e[ Scale ] 채팅창을 닫아주세요.`)
        showActionForm(player)
        playButtonSoud(player)
    }
})

/**
 * 메인 메뉴 표시
 * - 사이즈 설정 버튼
 * - 사이즈 초기화 버튼 (크기가 변경된 경우에만 표시)
 */
function showActionForm(player) {
    system.run(() => {
        const form = new ActionFormData()
        const value = player.getDynamicProperty(`scaleValue`)
        form.title("사이즈 설정 메뉴")
        form.button("사이즈 설정")

        if (value) {
            form.button("사이즈 초기화")
        }

        form.show(player).then(r => {
            if (r.cancelationReason == "UserBusy") {
                showActionForm(player)  // 인벤토리가 열려있으면 다시 시도
            }
            if (r.canceled) return
            switch (r.selection) {
                case 0:
                    setValueForm(player);  // 크기 설정 메뉴로
                    break;
                case 1:
                    deleteValueForm(player)  // 초기화 확인 메뉴로
                    break;
            }
            playButtonSoud(player)
        });
    })
}

/**
 * 크기 설정 메뉴
 * - 슬라이더로 1~100 사이의 값 설정
 * - 실제 크기는 설정값의 1/10이 적용됨
 */
function setValueForm(player) {
    const form = new ModalFormData()
    const ScaleValue = player.getDynamicProperty(`scaleValue`)
    form.title("사이즈 변경하기");
    form.slider("§e* 기본 사이즈 - 10\n\n§r사이즈", 1, 100, 1, ScaleValue == 10 ? 10 : ScaleValue);
    form.submitButton(`변경하기`)
    form.show(player).then(r => {
        if (r.canceled) return
        player.sendMessage(`§e[ Scale ] 사이즈가 §a${r.formValues[0]}§e으로 변경되었습니다.`);
        player.setDynamicProperty(`scaleValue`, r.formValues[0] === 10 ? undefined : r.formValues[0])
        playButtonSoud(player)
    })
}

/**
 * 크기 초기화 확인 메뉴
 * - 초기화 확인 후 실행
 * - 돌아가기 선택 시 메인 메뉴로 이동
 */
function deleteValueForm(player) {
    const form = new ActionFormData()
    form.title("사이즈 초기화")
    form.body(`정말 사이즈를 초기화 하시겠습니까?`)
    form.button(`초기화`)
    form.button("돌아가기")

    form.show(player).then(r => {
        if (r.canceled) return

        switch (r.selection) {
            case 0:
                player.sendMessage(`§e[ Scale ] 사이즈가 초기화 되었습니다.`)
                player.setDynamicProperty(`scaleValue`,)  // undefined로 초기화
                break;
            case 1:
                showActionForm(player)  // 메인 메뉴로 돌아가기
                break;
        }
        playButtonSoud(player)
    });
}

/**
 * 버튼 클릭음 재생
 */
function playButtonSoud(player) {
    system.run(() => {
        player.playSound(`random.orb`)
    })
}
