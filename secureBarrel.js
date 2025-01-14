import { world, system } from "@minecraft/server";

/**
 * SecureBarrel - Minecraft Bedrock Container Security System
 * 
 * 보안 통 시스템 사용 방법
 * 
 * 1. 황금 괭이의 이름을 "황금열쇠"로 변경하여 준비합니다.
 * 
 * 2. 통(Barrel) 잠그기:
 *    - 황금열쇠를 들고 통을 클릭합니다
 *    - 채팅창에 설정할 비밀번호를 입력합니다
 *    - 이제 통이 잠깁니다
 * 
 * 3. 잠긴 통 열기:
 *    - 잠긴 통을 클릭합니다
 *    - 채팅창에 비밀번호를 입력합니다
 *    - 비밀번호가 맞으면 한 번만 열 수 있습니다
 *    - 다시 열려면 비밀번호를 다시 입력해야 합니다
 * 
 * 4. 통 잠금 해제:
 *    - 황금열쇠를 들고 잠긴 통을 클릭합니다
 *    - 통의 잠금이 해제됩니다
 * 
 * 주의사항:
 * - 잠긴 통은 파괴할 수 없습니다
 * - 비밀번호는 채팅창에 표시되지 않습니다
 * - 월드를 나갔다 들어와도 잠금 상태가 유지됩니다
 */

// 데이터베이스 키 상수
const DB_KEY = "lockedContainers";

// 잠긴 컨테이너 관리를 위한 맵
const lockedContainers = new Map();

// 비밀번호 입력 상태 관리
const passwordStates = new Map();

// 비밀번호 입력 상태 enum
const PasswordState = {
    SETTING: "SETTING",
    UNLOCKING: "UNLOCKING"
};

// 보안 아이템 설정
const SECURITY_KEY = {
    id: "minecraft:golden_hoe",
    name: "황금열쇠",
    lore: [
        "§7통을 잠그는데 사용됩니다",
        "§e사용법:",
        "§f1. 통에 대고 사용하여 비밀번호를 설정하세요",
        "§f2. 다시 사용하면 잠금이 해제됩니다"
    ]
};

// 손에 들고 있는 아이템 확인 함수
function getItem(player) {
    try {
        const inventory = player.getComponent("inventory");
        const selectedSlot = player.selectedSlotIndex;
        const item = inventory.container.getItem(selectedSlot).typeId;
        return item;
    } catch (err) {
        return undefined;
    }
}

// 통 열기 이벤트
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    
    if (block.typeId !== "minecraft:barrel") return;
    
    const currentPos = `${block.location.x},${block.location.y},${block.location.z}`;
    const item = getItem(player);

    // 황금열쇠로 상호작용하는 경우
    if (item === SECURITY_KEY.id) {
        event.cancel = true;
        
        if (lockedContainers.has(currentPos)) {
            lockedContainers.delete(currentPos);
            player.sendMessage("§a통의 잠금이 해제되었습니다!");
            saveData();
        } else {
            passwordStates.set(player.name, {
                containerPos: currentPos,
                state: PasswordState.SETTING
            });
            player.sendMessage("§e채팅창에 설정할 비밀번호를 입력하세요.");
        }
        return;
    }
    
    // 잠긴 통인 경우
    if (lockedContainers.has(currentPos)) {
        const container = lockedContainers.get(currentPos);
        
        if (container.canOpen) {
            container.canOpen = false;
            lockedContainers.set(currentPos, container);
            saveData();
            return;
        }
        
        event.cancel = true;
        if (!passwordStates.has(player.name)) {
            passwordStates.set(player.name, {
                containerPos: currentPos,
                state: PasswordState.UNLOCKING
            });
            player.sendMessage("§e채팅창에 비밀번호를 입력하세요.");
        }
    }
});

// 블록 파괴 이벤트
world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const block = event.block;
    
    if (block.typeId === "minecraft:barrel") {
        const containerPos = `${block.location.x},${block.location.y},${block.location.z}`;
        
        if (lockedContainers.has(containerPos)) {
            event.cancel = true;
            event.player.sendMessage("§c잠긴 통은 파괴할 수 없습니다!");
        }
    }
});

// 채팅 이벤트 (비밀번호 입력 처리) 추가
world.beforeEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    const message = event.message;
    
    if (!passwordStates.has(player.name)) return;
    
    event.cancel = true; // 비밀번호가 채팅에 표시되지 않도록 함
    
    const state = passwordStates.get(player.name);
    const containerPos = state.containerPos;
    
    if (state.state === PasswordState.SETTING) {
        // 새 비밀번호 설정
        lockedContainers.set(containerPos, {
            password: message,
            canOpen: false
        });
        player.sendMessage("§a비밀번호가 설정되었습니다!");
        saveData();
    } else if (state.state === PasswordState.UNLOCKING) {
        // 비밀번호 확인
        const container = lockedContainers.get(containerPos);
        if (container && container.password === message) {
            player.sendMessage("§a비밀번호가 확인되었습니다. 통을 열 수 있습니다!");
            container.canOpen = true;
            lockedContainers.set(containerPos, container);
            saveData();
        } else {
            player.sendMessage("§c잘못된 비밀번호입니다!");
        }
    }
    
    passwordStates.delete(player.name);
});

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
system.run(() => {
    loadData();
});
