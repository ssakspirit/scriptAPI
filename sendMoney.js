import { world, system } from '@minecraft/server';
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const score_id = "money";

// 일정 간격으로 플레이어의 스코어보드값을 약속
system.runInterval(() => {
    world.getDimension("overworld").runCommandAsync(`scoreboard objectives add ${score_id} dummy`);
    world.getDimension("overworld").runCommandAsync(`scoreboard players add @a ${score_id} 0`);
}, 2)

world.afterEvents.itemUse.subscribe((data) => {
    const item = data.itemStack;
    const player = data.source;
    if (item.typeId === "minecraft:compass") {
        bank(player)
    }
});

// 아이템 사용 이벤트를 구독하여 컴퍼스 사용 시 은행 UI를 열어주는 함수
export function bank(player) {

    const formData = new ActionFormData();
    formData.title('은행').body('밑에 기능에서 선택해주세요.');
    formData.button(`송금하기`)
    formData.button(`잔액확인하기`)
    formData.show(player).then(response => {
        if (response.canceled) return;

        if (response.selection == 0) {
            send_money(player)
        } else if (response.selection == 1) {
            player.sendMessage(`${player.name}님의 잔액은 ${getScore(player)}원입니다`)
        }
    })
};

// 송금 UI 함수
export function send_money(player) {

    const formData = new ModalFormData();
    const players = world.getAllPlayers().map(player => player.name)
    formData.title('송금 하기');
    formData.dropdown("송금할 플레이어를 선택하세요.", players)
    formData.textField("송금 금액을 입력하세요.", "1~10000")

    // 플레이어에게 은행 UI를 표시하고 사용자 선택에 따라 처리
    formData.show(player).then(({ formValues }) => {

        const received_player = players[formValues[0]]; //formValues[0]은 드롭다운 메뉴에서 선택된 플레이어의 인덱스
        const money = formValues[1]; // formValues[1]은 사용자가 입력한 송금 금액

        if (received_player == player.name) {//선택한 플레이어가 자신이라면
            player.sendMessage(`자신에게는 송금을 할수없습니다.`)
        } else if (money.length == 0) {//입력칸이 비어있다면
            player.sendMessage(`송금금액 입력칸이 비어있습니다.`)
        } else if (money < 1 || money > 10000) {//입력값이 유효하지않다면
            player.sendMessage(`${money}는 유효하지않은 송금금액입니다.`)
        } else if (!/[0-9]/g.test(money)) {//숫자정규식을 사용해 만약에 텍스트필드에 들어간게 숫자가 아니라면
            player.sendMessage(`송금금액에 숫자가 아닌 문자가 들어가있습니다.`)
        } else if (money > getScore(player)) {//보낼수 있는 돈이 없다면
            player.sendMessage(`보낼수있는 돈이 없습니다.`)
        } else {
            // 송금 처리: 송금자의 잔액에서 송금 금액을 빼고, 수취자의 잔액에 송금 금액을 추가
            player.runCommandAsync(`scoreboard players remove @s ${score_id} ${money}`)
            player.runCommandAsync(`scoreboard players add "${received_player}" ${score_id} ${money}`)
            player.runCommandAsync(`tellraw "${received_player}" {"rawtext":[{"text":"${player.name}님이 ${money}원을 송금했습니다."}]}`)
            player.sendMessage(`${received_player}님에게 ${money}원을 보냈습니다.`)
        }
    })
}

//스코어보드값을 가져오는 함수
function getScore(player) {
    return world.scoreboard.getObjective(score_id).getScore(player)
}
