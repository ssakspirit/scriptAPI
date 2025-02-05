/**
 * Emerald Bank System (에메랄드 은행 시스템)
 * Version: 1.0.0
 * 
 * [ 시스템 설명 ]
 * 에메랄드를 화폐로 사용하는 은행 시스템입니다.
 * 계좌에 돈을 저축하면 매 분마다 이자가 발생합니다.
 * 마이너스 통장 기능도 지원하지만, 마이너스 상태에서는 이자가 차감됩니다.
 * 
 * [ 사용 방법 ]
 * 1. 은행 열기:
 *    - 채팅창에 '!은행' 입력
 *    - 또는 에메랄드를 들고 우클릭
 * 
 * 2. 계좌 생성:
 *    - 처음 은행을 열면 자동으로 계좌 생성 옵션이 표시됨
 *    - 계좌는 플레이어당 1개만 생성 가능
 * 
 * 3. 입금하기:
 *    - 인벤토리에 있는 에메랄드로 입금
 *    - 입금 시 인벤토리에서 에메랄드가 차감됨
 * 
 * 4. 출금하기:
 *    - 계좌에서 에메랄드를 출금
 *    - 출금한 에메랄드는 인벤토리로 지급
 *    - 마이너스 통장 한도(-1000 에메랄드)까지 출금 가능
 * 
 * [ 이자 시스템 ]
 * - 이자율: 1퍼센트 / 분
 * - 양수 잔액: 이자 지급 (잔액 증가)
 * - 음수 잔액: 이자 차감 (부채 증가)
 * - 이자는 매 분마다 자동으로 계산되어 적용
 * - 이자 지급/차감 시 온라인 상태인 플레이어에게 알림
 * 
 * [ 마이너스 통장 ]
 * - 최대 -1000 에메랄드까지 출금 가능
 * - 마이너스 상태에서는 이자가 차감되어 부채가 증가
 * - 입금으로 양수 잔액이 되면 다시 이자 지급
 * 
 * [ 주의사항 ]
 * 1. 입출금 시 금액을 정확히 입력
 * 2. 마이너스 상태가 오래 지속되면 부채가 늘어남
 * 3. 계좌는 삭제할 수 없으며 한 번 생성하면 영구적
 */

import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

// 은행 데이터 저장소
const BANK_DATA_KEY = "bank_accounts";
const INTEREST_RATE = 0.01; // 1% 이자율
const INTEREST_INTERVAL = 1200; // 1분마다 이자 계산 (20틱 * 60초)
const MINIMUM_BALANCE = -1000; // 최소 잔액

// 계좌 데이터 가져오기
function getBankAccounts() {
    const accountsData = world.getDynamicProperty(BANK_DATA_KEY);
    return accountsData ? JSON.parse(accountsData) : {};
}

// 계좌 데이터 저장하기
function saveBankAccounts(accounts) {
    world.setDynamicProperty(BANK_DATA_KEY, JSON.stringify(accounts));
}

// 계좌 생성
function createAccount(player) {
    const accounts = getBankAccounts();
    if (accounts[player.name]) {
        player.sendMessage("§c이미 계좌가 있습니다!");
        return;
    }

    accounts[player.name] = {
        balance: 0,
        lastInterestTime: Date.now(),
        createdAt: Date.now()
    };
    saveBankAccounts(accounts);
    player.sendMessage("§a계좌가 생성되었습니다! 현재 잔액: 0 에메랄드");
}

// 입금 처리
function deposit(player, amount) {
    const accounts = getBankAccounts();
    if (!accounts[player.name]) {
        player.sendMessage("§c계좌가 없습니다. 먼저 계좌를 생성해주세요.");
        return;
    }

    // 플레이어의 에메랄드 확인 및 제거
    try {
        world.getDimension("overworld").runCommand(
            `clear "${player.name}" emerald 0 ${amount}`
        );
    } catch (error) {
        player.sendMessage("§c에메랄드가 부족합니다!");
        return;
    }

    accounts[player.name].balance += amount;
    saveBankAccounts(accounts);
    player.sendMessage(`§a${amount} 에메랄드를 입금했습니다. 현재 잔액: ${accounts[player.name].balance} 에메랄드`);
}

// 출금 처리
function withdraw(player, amount) {
    const accounts = getBankAccounts();
    if (!accounts[player.name]) {
        player.sendMessage("§c계좌가 없습니다. 먼저 계좌를 생성해주세요.");
        return;
    }

    if (accounts[player.name].balance - amount < MINIMUM_BALANCE) {
        player.sendMessage(`§c출금 한도를 초과했습니다! (최소 잔액: ${MINIMUM_BALANCE} 에메랄드)`);
        return;
    }

    // 에메랄드 지급
    world.getDimension("overworld").runCommand(
        `give "${player.name}" emerald ${amount}`
    );

    accounts[player.name].balance -= amount;
    saveBankAccounts(accounts);
    player.sendMessage(`§a${amount} 에메랄드를 출금했습니다. 현재 잔액: ${accounts[player.name].balance} 에메랄드`);
}

// 이자 계산 및 적용
function applyInterest() {
    const accounts = getBankAccounts();
    const currentTime = Date.now();

    for (const [playerName, account] of Object.entries(accounts)) {
        const interest = Math.floor(account.balance * INTEREST_RATE);
        account.balance += interest;
        account.lastInterestTime = currentTime;

        // 온라인 플레이어에게 알림
        const player = world.getAllPlayers().find(p => p.name === playerName);
        if (player && interest !== 0) {
            const message = interest > 0 ? 
                `§a이자가 지급되었습니다: +${interest} 에메랄드` :
                `§c이자가 차감되었습니다: ${interest} 에메랄드`;
            player.sendMessage(message);
        }
    }
    saveBankAccounts(accounts);
}

// 날짜를 한국 시간으로 변환하는 함수
function formatKoreanDateTime(timestamp) {
    const date = new Date(timestamp);
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    
    const year = koreanTime.getUTCFullYear();
    const month = String(koreanTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(koreanTime.getUTCDate()).padStart(2, '0');
    const hours = String(koreanTime.getUTCHours()).padStart(2, '0');
    const minutes = String(koreanTime.getUTCMinutes()).padStart(2, '0');
    
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
}

// 은행 메뉴 UI 표시
function showBankUI(player) {
    system.runTimeout(() => {
        try {
            const accounts = getBankAccounts();
            const account = accounts[player.name];

            const form = new ActionFormData()
                .title("§l§2에메랄드 은행")
                .body(account ? 
                    `§l§2[ 계좌 현황 ]\n\n` +
                    `§f현재 잔액: §a${account.balance}§f 에메랄드\n` +
                    `§f이자율: §e${INTEREST_RATE * 100}퍼센트§f / 분\n\n` +
                    `§8※ 마이너스 통장 한도: ${MINIMUM_BALANCE} 에메랄드` :
                    "§e계좌가 없습니다.\n§f계좌를 생성하시겠습니까?");

            if (account) {
                form.button("§l§a입금하기")
                    .button("§l§c출금하기")
                    .button("§l§b계좌 정보");
            } else {
                form.button("§l§2계좌 생성");
            }

            form.show(player).then((response) => {
                if (response.cancelationReason === "UserBusy") {
                    showBankUI(player);
                    return;
                }
                if (!response || response.canceled) return;

                if (!account && response.selection === 0) {
                    createAccount(player);
                    return;
                }

                switch (response.selection) {
                    case 0:
                        showDepositUI(player);
                        break;
                    case 1:
                        showWithdrawUI(player);
                        break;
                    case 2:
                        showAccountInfo(player);
                        break;
                }
            });
        } catch (error) {
            console.warn("showBankUI 오류:", error);
            player.sendMessage("§c은행을 여는 중 오류가 발생했습니다.");
        }
    }, 20);
}

// 입금 UI 표시
function showDepositUI(player) {
    const form = new ModalFormData()
        .title("§l§a입금")
        .textField("§f입금할 금액을 입력하세요\n§7예시: 100", "100");

    form.show(player).then((response) => {
        if (!response || response.canceled) {
            showBankUI(player);
            return;
        }

        const amount = parseInt(response.formValues[0]);
        if (isNaN(amount) || amount <= 0) {
            player.sendMessage("§c올바른 금액을 입력해주세요!");
            return;
        }

        deposit(player, amount);
        showBankUI(player);
    });
}

// 출금 UI 표시
function showWithdrawUI(player) {
    const accounts = getBankAccounts();
    const account = accounts[player.name];

    const form = new ModalFormData()
        .title("§l§c출금")
        .textField(
            `§f출금할 금액을 입력하세요\n` +
            `§7현재 잔액: ${account.balance} 에메랄드\n` +
            `§7출금 가능액: ${Math.min(account.balance - MINIMUM_BALANCE, account.balance)} 에메랄드`,
            "100"
        );

    form.show(player).then((response) => {
        if (!response || response.canceled) {
            showBankUI(player);
            return;
        }

        const amount = parseInt(response.formValues[0]);
        if (isNaN(amount) || amount <= 0) {
            player.sendMessage("§c올바른 금액을 입력해주세요!");
            return;
        }

        withdraw(player, amount);
        showBankUI(player);
    });
}

// 계좌 정보 표시
function showAccountInfo(player) {
    const accounts = getBankAccounts();
    const account = accounts[player.name];

    const form = new ActionFormData()
        .title("§l§b계좌 정보")
        .body(
            `§l§b[ 계좌 상세 정보 ]\n\n` +
            `§f계좌 소유자: §e${player.name}\n\n` +
            `§f현재 잔액: §a${account.balance} §f에메랄드\n` +
            `§f이자율: §e${INTEREST_RATE * 100}%§f / 분\n\n` +
            `§f계좌 생성일:\n§7${formatKoreanDateTime(account.createdAt)}\n\n` +
            `§f마지막 이자 지급:\n§7${formatKoreanDateTime(account.lastInterestTime)}\n\n` +
            `§8※ 마이너스 통장 한도: ${MINIMUM_BALANCE} 에메랄드`
        )
        .button("§l§f돌아가기");

    form.show(player).then(() => {
        showBankUI(player);
    });
}

// 이벤트 처리
world.beforeEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    const message = event.message;

    if (message === "!은행") {
        event.cancel = true;
        player.sendMessage("§a은행을 여는 중입니다...");
        showBankUI(player);
    }
});

// 에메랄드 우클릭 이벤트 추가
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;

    if (item?.typeId === "minecraft:emerald") {
        player.sendMessage("§a은행을 여는 중입니다...");
        showBankUI(player);
    }
});

// 이자 계산 타이머 설정
system.runInterval(() => {
    applyInterest();
}, INTEREST_INTERVAL); 
