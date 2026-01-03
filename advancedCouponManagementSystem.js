/**
 * Advanced Coupon Management System (고급 쿠폰 관리 시스템)
 * Version: 1.0.0
 * 
 * 기능:
 * 1. 나침반 우클릭으로 쿠폰 입력 UI 열기
 * 2. 쿠폰은 1회만 사용 가능
 * 3. 관리자가 쿠폰 생성 및 보상 설정 가능
 * 
 * [ 플레이어 사용 방법 ]
 * 1. 나침반을 들고 우클릭하여 쿠폰 입력 창을 엽니다(또는 !쿠폰 채팅명령을 입력합니다.)
 * 2. 쿠폰 코드를 입력하고 확인을 누릅니다
 * 3. 쿠폰이 유효하면 즉시 보상이 지급됩니다
 * 4. 이미 사용한 쿠폰은 재사용할 수 없습니다
 * 
 * [ 관리자 사용 방법 ]
 * 1. 관리자 권한 얻기:
 *    - admin 태그가 필요합니다 (/tag [플레이어이름] add admin)
 *    - 또는 op 태그를 사용할 수 있습니다 (/tag [플레이어이름] add op)
 *    - player.isOp()와 PermissionLevel은 제거되어 태그 기반으로 확인합니다
 * 
 * 2. 쿠폰 관리 메뉴 (!쿠폰관리):
 *    - 쿠폰 생성: 새로운 쿠폰을 만들 수 있습니다
 *    - 쿠폰 삭제: 기존 쿠폰을 삭제할 수 있습니다
 *    - 사용 현황: 모든 쿠폰의 사용 상태를 확인할 수 있습니다
 *    - 미사용 쿠폰: 아직 사용되지 않은 쿠폰 목록을 볼 수 있습니다
 *    - 모든 쿠폰 초기화: 모든 쿠폰 데이터를 삭제합니다
 * 
 * 3. 쿠폰 생성하기:
 *    - 쿠폰 코드: 고유한 코드를 입력 (비워두면 자동 생성)
 *    - 설명: 쿠폰에 대한 설명 입력
 *    - 보상 명령어: 실행될 명령어 입력
 * 
 * 4. 쿠폰 목록 확인 (!쿠폰목록):
 *    - 등록된 모든 쿠폰의 목록을 채팅창에서 확인
 * 
 * [ 쿠폰 생성 주의사항 ]
 * 1. 보상 명령어 작성 시 @s를 사용하면 쿠폰을 사용한 플레이어가 자동으로 지정됩니다
 * 2. 예시:
 *    - give @s diamond 64 (다이아몬드 64개 지급)
 *    - effect @s strength 300 1 (힘 효과 부여)
 *    - xp 1000 @s (경험치 1000 지급)
 * 3. 명령어는 서버 권한으로 실행되므로 모든 명령어 사용이 가능합니다
 * 
 * [ 데이터 저장 ]
 * - 모든 쿠폰 데이터는 월드에 영구 저장됩니다
 * - 서버/월드를 재시작해도 데이터가 유지됩니다
 */

import { world, system } from "@minecraft/server";
import { ModalFormData, ActionFormData } from "@minecraft/server-ui";

/**
 * 운영자 권한 확인 헬퍼 함수
 * player.isOp()와 PermissionLevel이 제거되어 태그 기반으로 확인합니다.
 * 사용 전 운영자에게 태그를 부여하세요: /tag @s add op 또는 /tag @s add admin
 */
function isOperator(player) {
    return player.hasTag("op") || player.hasTag("admin");
}

// 쿠폰 데이터 저장소
const COUPON_DATA_KEY = "coupons";
const USED_COUPONS_KEY = "used_coupons";

// 쿠폰 데이터 가져오기
function getCoupons() {
    const couponsData = world.getDynamicProperty(COUPON_DATA_KEY);
    return couponsData ? JSON.parse(couponsData) : {};
}

// 쿠폰 데이터 저장하기
function saveCoupons(coupons) {
    world.setDynamicProperty(COUPON_DATA_KEY, JSON.stringify(coupons));
}

// 사용된 쿠폰 목록 가져오기
function getUsedCoupons() {
    const usedCouponsData = world.getDynamicProperty(USED_COUPONS_KEY);
    return usedCouponsData ? JSON.parse(usedCouponsData) : {};
}

// 사용된 쿠폰 저장하기
function saveUsedCoupons(usedCoupons) {
    world.setDynamicProperty(USED_COUPONS_KEY, JSON.stringify(usedCoupons));
}

// 쿠폰 입력 UI 표시
function showCouponUI(player) {
    system.runTimeout(() => {
        const form = new ModalFormData()
            .title("쿠폰 입력")
            .textField("쿠폰 코드를 입력하세요", "COUPON-CODE");

        form.show(player).then((response) => {
            if (response.cancelationReason === "UserBusy") {
                showCouponUI(player);
                return;
            }
            if (!response || response.canceled) return;
            const couponCode = response.formValues[0];
            useCoupon(player, couponCode);
        });
    }, 1);
}

// 쿠폰 사용 처리
function useCoupon(player, couponCode) {
    const coupons = getCoupons();
    const usedCoupons = getUsedCoupons();

    // 쿠폰이 존재하는지 확인
    if (!coupons[couponCode]) {
        player.sendMessage("§c존재하지 않는 쿠폰입니다!");
        return;
    }

    // 이미 사용한 쿠폰인지 확인
    if (usedCoupons[player.name]?.includes(couponCode)) {
        player.sendMessage("§c이미 사용한 쿠폰입니다!");
        return;
    }

    // 쿠폰 사용 처리
    const coupon = coupons[couponCode];
    try {
        // 보상 지급 (서버 권한으로 실행)
        let rewardSuccess = false;
        system.run(() => {
            try {
                const result = world.getDimension("overworld").runCommand(
                    coupon.reward.replace(/@s/g, player.name)
                );
                rewardSuccess = result.successCount > 0;

                if (!rewardSuccess) {
                    player.sendMessage("§c보상 지급에 실패했습니다.");
                    console.warn(`쿠폰 보상 실패: ${couponCode}, 명령어: ${coupon.reward}`);
                }
            } catch (cmdError) {
                console.warn(`쿠폰 명령어 실행 오류: ${couponCode}`, cmdError);
                player.sendMessage("§c보상 지급 중 오류가 발생했습니다.");
            }
        });

        if (!rewardSuccess) {
            return;
        }

        // 사용 기록 저장
        if (!usedCoupons[player.name]) {
            usedCoupons[player.name] = [];
        }
        usedCoupons[player.name].push(couponCode);
        saveUsedCoupons(usedCoupons);

        player.sendMessage(`§a쿠폰 사용 성공! ${coupon.description}`);
    } catch (error) {
        console.warn("쿠폰 사용 중 오류:", error);
        player.sendMessage("§c쿠폰 사용 중 오류가 발생했습니다.");
    }
}

// 쿠폰 생성 UI 표시
function showCouponCreateUI(player) {
    const form = new ModalFormData()
        .title("쿠폰 생성")
        .textField("쿠폰 코드", "COUPON-CODE")
        .textField("설명", "다이아몬드 64개 지급")
        .textField(
            "보상 명령어\n§7대상은 '@s'로 적어야 하며, 쿠폰을 사용하는 플레이어로 자동 지정됩니다.",
            "give @s diamond 64"
        );

    form.show(player).then((response) => {
        if (response.cancelationReason === "UserBusy") {
            showCouponCreateUI(player);
            return;
        }
        if (!response || response.canceled) {
            showCouponManageUI(player);
            return;
        }
        const [code, description, reward] = response.formValues;
        // 빈 값 체크 및 기본값 설정
        const finalCode = code.trim() || `COUPON-${Date.now()}`;
        const finalDescription = description.trim() || "다이아몬드 64개 지급";
        const finalReward = reward.trim() || "give @s diamond 64";
        createCoupon(player, finalCode, finalDescription, finalReward);
    });
}

// 쿠폰 생성 처리
function createCoupon(player, code, description, reward) {
    const coupons = getCoupons();

    if (coupons[code]) {
        // 실패 메시지를 UI로 표시
        const form = new ActionFormData()
            .title("§c쿠폰 생성 실패")
            .body("§c이미 존재하는 쿠폰 코드입니다!")
            .button("다시 시도");

        form.show(player).then(() => {
            showCouponCreateUI(player);
        });
        return;
    }

    coupons[code] = {
        description,
        reward,
        createdBy: player.name,
        createdAt: new Date().toISOString()
    };

    saveCoupons(coupons);

    // 성공 메시지를 UI로 표시
    const form = new ActionFormData()
        .title("§a쿠폰 생성 성공")
        .body(`§a새로운 쿠폰이 생성되었습니다!\n\n§f쿠폰 코드: ${code}\n설명: ${description}`)
        .button("계속 생성")
        .button("관리 메뉴로");

    form.show(player).then((response) => {
        if (!response || response.canceled || response.selection === 0) {
            showCouponCreateUI(player);
        } else {
            showCouponManageUI(player);
        }
    });
}

// 쿠폰 목록 표시
function showCouponList(player) {
    const coupons = getCoupons();
    let message = "§e=== 쿠폰 목록 ===\n";

    for (const [code, data] of Object.entries(coupons)) {
        message += `§f코드: ${code}\n설명: ${data.description}\n생성자: ${data.createdBy}\n\n`;
    }

    player.sendMessage(message);
}

// 쿠폰 관리 UI 표시
function showCouponManageUI(player) {
    system.runTimeout(() => {
        const form = new ActionFormData()
            .title("쿠폰 관리")
            .body("관리할 항목을 선택하세요")
            .button("쿠폰 삭제", "textures/ui/trash")
            .button("사용 현황", "textures/ui/icon_book_writable")
            .button("미사용 쿠폰", "textures/ui/icon_new")
            .button("쿠폰 생성", "textures/ui/plus")
            .button("§c모든 쿠폰 초기화", "textures/ui/realms_red_x");

        form.show(player).then((response) => {
            if (response.cancelationReason === "UserBusy") {
                showCouponManageUI(player);
                return;
            }
            if (!response || response.canceled) return;

            switch (response.selection) {
                case 0:
                    showCouponDeleteUI(player);
                    break;
                case 1:
                    showCouponUsageUI(player);
                    break;
                case 2:
                    showUnusedCouponsUI(player);
                    break;
                case 3: // 쿠폰 생성
                    showCouponCreateUI(player);
                    break;
                case 4: // 쿠폰 초기화
                    showCouponResetConfirmUI(player);
                    break;
            }
        });
    }, 1);
}

// 쿠폰 삭제 UI 표시
function showCouponDeleteUI(player) {
    system.runTimeout(() => {
        const coupons = getCoupons();
        const form = new ActionFormData()
            .title("쿠폰 삭제")
            .body("삭제할 쿠폰을 선택하세요");

        for (const [code, data] of Object.entries(coupons)) {
            form.button(`${code}\n§7${data.description}`);
        }
        form.button("뒤로 가기", "textures/ui/arrow_dark_left_stretch");

        form.show(player).then((response) => {
            if (response.cancelationReason === "UserBusy") {
                showCouponDeleteUI(player);
                return;
            }
            if (!response || response.canceled) return;

            if (response.selection === Object.keys(coupons).length) {
                // 뒤로 가기 선택
                showCouponManageUI(player);
                return;
            }

            const couponCode = Object.keys(coupons)[response.selection];
            deleteCoupon(player, couponCode);
        });
    }, 1);
}

// 쿠폰 사용 현황 UI 표시
function showCouponUsageUI(player) {
    system.runTimeout(() => {
        const coupons = getCoupons();
        const usedCoupons = getUsedCoupons();
        let message = "§e=== 쿠폰 사용 현황 ===\n\n";

        for (const [code, data] of Object.entries(coupons)) {
            let isUsed = false;
            for (const playerUsed of Object.values(usedCoupons)) {
                if (playerUsed.includes(code)) {
                    isUsed = true;
                    break;
                }
            }
            message += `§f쿠폰: ${code}\n설명: ${data.description}\n상태: ${isUsed ? '§c사용 완료' : '§b사용 가능'}\n\n`;
        }

        const form = new ActionFormData()
            .title("쿠폰 사용 현황")
            .body(message)
            .button("뒤로 가기", "textures/ui/arrow_dark_left_stretch");

        form.show(player).then((response) => {
            showCouponManageUI(player);
        });
    }, 1);
}

// 미사용 쿠폰 확인 UI 표시
function showUnusedCouponsUI(player) {
    system.runTimeout(() => {
        const coupons = getCoupons();
        const usedCoupons = getUsedCoupons();
        let message = "§e=== 미사용 쿠폰 목록 ===\n\n";

        for (const [code, data] of Object.entries(coupons)) {
            let isUnused = true;
            for (const playerUsed of Object.values(usedCoupons)) {
                if (playerUsed.includes(code)) {
                    isUnused = false;
                    break;
                }
            }
            if (isUnused) {
                message += `§f쿠폰: ${code}\n설설명: ${data.description}\n생성자: ${data.createdBy}\n\n`;
            }
        }

        const form = new ActionFormData()
            .title("미사용 쿠폰 목록")
            .body(message)
            .button("뒤로 가기", "textures/ui/arrow_dark_left_stretch");

        form.show(player).then((response) => {
            showCouponManageUI(player);
        });
    }, 1);
}

// 쿠폰 사제 처리
function deleteCoupon(player, code) {
    const coupons = getCoupons();
    if (!coupons[code]) {
        player.sendMessage("§c존재하지 않는 쿠폰입니다!");
        showCouponDeleteUI(player);
        return;
    }

    delete coupons[code];
    saveCoupons(coupons);
    player.sendMessage(`§a쿠폰 '${code}'가 삭제되었습니다.`);
    showCouponDeleteUI(player);
}

// 쿠폰 초기화 확인 UI 표시
function showCouponResetConfirmUI(player) {
    system.runTimeout(() => {
        const form = new ActionFormData()
            .title("§c⚠ 쿠폰 초기화 ⚠")
            .body("§c정말로 모든 쿠폰 데이터를 초기화하시겠습니까?\n§c이 작업은 되돌릴 수 없으며, 모든 쿠폰과 사용 기록이 삭제됩니다!")
            .button("§c예, 초기화합니다")
            .button("§a아니오, 취소합니다");

        form.show(player).then((response) => {
            if (response.cancelationReason === "UserBusy") {
                showCouponResetConfirmUI(player);
                return;
            }
            if (!response || response.canceled) {
                showCouponManageUI(player);
                return;
            }

            if (response.selection === 0) {
                // 초기화 실행
                resetAllCoupons(player);
            } else {
                // 취소하고 관리 메뉴로 돌아가기
                showCouponManageUI(player);
            }
        });
    }, 1);
}

// 쿠폰 초기화 처리
function resetAllCoupons(player) {
    try {
        world.setDynamicProperty(COUPON_DATA_KEY, JSON.stringify({}));
        world.setDynamicProperty(USED_COUPONS_KEY, JSON.stringify({}));
        player.sendMessage("§c모든 쿠폰 데이터가 초기화되었습니다.");
        showCouponManageUI(player);
    } catch (error) {
        console.warn("쿠폰 초기화 중 오류:", error);
        player.sendMessage("§c초기화 중 오류가 발생했습니다.");
    }
}

// 관리자 권한 체크 함수 (PermissionLevel 사용)
function isAdmin(player) {
    return isOperator(player) && player.hasTag("admin");
}

// 이벤트 처리
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;

    if (item?.typeId === "minecraft:compass") {
        showCouponUI(player);
    }
});

// 채팅 명령어 처리
world.beforeEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    const message = event.message;

    // 명령어 처리
    if (message.startsWith('!')) {
        event.cancel = true;  // 채팅 메시지 취소

        // 쿠폰 사용 명령어 (!쿠폰 [코드])
        if (message.startsWith('!쿠폰 ')) {
            const couponCode = message.substring(4).trim(); // '!쿠폰 ' 이후의 텍스트
            if (couponCode) {
                useCoupon(player, couponCode);
            } else {
                player.sendMessage("§c사용법: !쿠폰 [쿠폰코드]");
            }
            return;
        }

        // 관리자 명령어
        if (isAdmin(player)) {
            switch (message) {
                case "!쿠폰관리":
                    player.sendMessage("§a채팅창을 닫으면 쿠폰 관리 창이 열립니다.");
                    showCouponManageUI(player);
                    return;
                case "!쿠폰목록":
                    showCouponList(player);
                    return;
                default:
                    player.sendMessage("§c알 수 없는 명령어입니다.");
                    return;
            }
        } else if (message === "!쿠폰관리" || message === "!쿠폰목록") {
            player.sendMessage("§c이 명령어를 사용할 권한이 없습니다.");
            return;
        }
    }
});
