import { world, system } from "@minecraft/server";

/** * SecureChest - Minecraft Bedrock Container Security System

 * 보안 컨테이너 시스템 사용 방법
 * 
 * 1. 황금 괭이의 이름을 "황금열쇠"로 변경하여 준비합니다.
 * 
 * 2. 상자 잠그기:
 *    - 황금열쇠를 들고 상자를 클릭합니다
 *    - 채팅창에 설정할 비밀번호를 입력합니다
 *    - 이제 상자가 잠깁니다
 * 
 * 3. 잠긴 상자 열기:
 *    - 잠긴 상자를 클릭합니다
 *    - 채팅창에 비밀번호를 입력합니다
 *    - 비밀번호가 맞으면 한 번만 열 수 있습니다
 *    - 다시 열려면 비밀번호를 다시 입력해야 합니다
 * 
 * 4. 상자 잠금 해제:
 *    - 황금열쇠를 들고 잠긴 상자를 클릭하고 비밀번호를 입력합니다
 *    - 상자의 잠금이 해제됩니다
 * 
 * 주의사항:
 * - 잠긴 상자는 파괴할 수 없습니다
 * - 비밀번호는 채팅창에 표시되지 않습니다
 * - 월드를 나갔다 들어와도 잠금 상태가 유지됩니다
 */

// 데이터베이스 키 상수
const DB_KEY = "lockedContainers";

// 잠긴 컨테이너 관리를 위한 맵
const lockedContainers = new Map();

// 데이터 저장 함수
function saveData() {
    try {
        const data = Object.fromEntries(lockedContainers);
        world.setDynamicProperty(DB_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn("데이터 저장 실패:", error);
    }
}

// 데이터 로드 함수
function loadData() {
    try {
        const savedData = world.getDynamicProperty(DB_KEY);
        if (savedData) {
            const data = JSON.parse(savedData);
            for (const [key, value] of Object.entries(data)) {
                lockedContainers.set(key, value);
            }
        }
    } catch (error) {
        console.warn("데이터 로드 실패:", error);
    }
}

// 월드 로드 시 데이터 불러오기
loadData();

// 비밀번호 입력 상태 관리
const passwordStates = new Map(); // { playerName: { containerPos: string, state: string } }

// 비밀번호 입력 상태 enum
const PasswordState = {
    SETTING: "SETTING",           // 새 비밀번호 설정 중
    UNLOCKING: "UNLOCKING",       // 비밀번호 입력하여 열기 시도 중
    REMOVING: "REMOVING"          // 잠금 해제를 위한 비밀번호 확인 중
};

// 보안 아이템 설정
const SECURITY_KEY = {
    id: "minecraft:golden_hoe",
    name: "황금열쇠",    
};

// 손에 들고 있는 아이템 확인 함수
function getItem(player) {
    try {
        const inventory = player.getComponent("inventory");
        const selectedSlot = player.selectedSlotIndex;
        const item = inventory.container.getItem(selectedSlot).typeId

        return item
    } catch (err) {
        return undefined
    }
}

// 배럴 열기 이벤트
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    
    if (block.typeId !== "minecraft:barrel") return;
    
    const containerPos = `${block.location.x},${block.location.y},${block.location.z}`;
    const item = getItem(player);

    // 황금열쇠로 상호작용하는 경우
    if (item === SECURITY_KEY.id || item === SECURITY_KEY.name) {
        event.cancel = true;
        
        // 이미 잠긴 컨테이너인 경우
        if (lockedContainers.has(containerPos)) {
            // 비밀번호 확인 상태로 변경
            passwordStates.set(player.name, {
                containerPos: containerPos,
                state: PasswordState.REMOVING
            });
            player.sendMessage("§e잠금 해제를 위해 비밀번호를 입력하세요.");
        } else {
            // 새로운 비밀번호 설정 시작
            passwordStates.set(player.name, {
                containerPos: containerPos,
                state: PasswordState.SETTING
            });
            player.sendMessage("§e채팅창에 설정할 비밀번호를 입력하세요.");
        }
        return;
    }
    
    // 잠긴 컨테이너인 경우
    if (lockedContainers.has(containerPos)) {
        const container = lockedContainers.get(containerPos);
        
        // 비밀번호를 맞추고 한 번도 열지 않은 경우
        if (container.canOpen) {
            container.canOpen = false; // 한 번 열었으므로 플래그 해제
            lockedContainers.set(containerPos, container);
            saveData(); // 데이터 저장
            return; // 상자를 열 수 있음
        }
        
        event.cancel = true;
        // 비밀번호 입력 상태가 아닌 경우에만 메시지 표시
        if (!passwordStates.has(player.name)) {
            passwordStates.set(player.name, {
                containerPos: containerPos,
                state: PasswordState.UNLOCKING
            });
            player.sendMessage("§e채팅창에 비밀번호를 입력하세요.");
        }
    }
});

// 채팅 이벤트 수정
world.beforeEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    const message = event.message;
    
    if (!passwordStates.has(player.name)) return;
    
    event.cancel = true;
    
    const state = passwordStates.get(player.name);
    const containerPos = state.containerPos;
    
    if (state.state === PasswordState.SETTING) {
        // 새 비밀번호 설정
        lockedContainers.set(containerPos, {
            password: message,
            canOpen: false
        });
        player.sendMessage("§a비밀번호가 설정되었습니다!");
        saveData(); // 데이터 저장
    } else if (state.state === PasswordState.UNLOCKING) {
        // 비밀번호 확인
        const container = lockedContainers.get(containerPos);
        if (container && container.password === message) {
            player.sendMessage("§a비밀번호가 확인되었습니다. 컨테이너를 열 수 있습니다!");
            container.canOpen = true;
            lockedContainers.set(containerPos, container);
            saveData(); // 데이터 저장
        } else {
            player.sendMessage("§c잘못된 비밀번호입니다!");
        }
    } else if (state.state === PasswordState.REMOVING) {
        // 잠금 해제를 위한 비밀번호 확인
        const container = lockedContainers.get(containerPos);
        if (container && container.password === message) {
            lockedContainers.delete(containerPos);
            player.sendMessage("§a비밀번호가 확인되었습니다. 컨테이너의 잠금이 해제되었습니다!");
            saveData(); // 데이터 저장
        } else {
            player.sendMessage("§c잘못된 비밀번호입니다!");
        }
    }
    
    passwordStates.delete(player.name);
});

// 블록 파괴 이벤트
world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const block = event.block;
    const player = event.player;
    
    if ((block.typeId === "minecraft:barrel")) {
        const containerPos = `${block.location.x},${block.location.y},${block.location.z}`;
        
        if (lockedContainers.has(containerPos)) {
            event.cancel = true;
            player.sendMessage("§c잠긴 컨테이너는 파괴할 수 없습니다!");
        }
    }
});
