import { world, system } from '@minecraft/server';

/*
몬스터 전투 시뮬레이션 시스템 사용법:

1. 전투 설정
   - !전투설정 : 사용 가능한 몹 목록을 확인합니다
   - !전투설정 [첫번째몹번호] [두번째몹번호] : 전투시킬 두 종류의 몹을 선택합니다
   - 첫 번째 선택한 몹은 중앙에 모여서 소환되고, 두 번째 선택한 몹은 원형으로 둘러싸서 소환됩니다

2. 전투 시작
   - !전투 [첫번째몹수] [두번째몹수] : 설정된 몹들을 지정한 수만큼 소환하여 전투를 시작합니다
   - 플레이어의 발 아래 위치를 중심으로 몹들이 소환됩니다
   - 전투 시작 전 5초 카운트다운이 진행됩니다

3. 카메라 조작
   - 철삽을 사용하여 첫 번째로 선택한 몹들 사이에서 카메라 시점을 순차적으로 변경할 수 있습니다
   - 카메라는 선택된 몹을 자동으로 추적합니다

4. 전투 현황
   - 화면 상단에 각 몹의 남은 수가 실시간으로 표시됩니다
*/

// 전투 설정을 저장할 변수
let battleSettings = {
    mob1: null,
    mob2: null,
    currentMobIndex: 0  // 현재 보고 있는 몹의 인덱스
};

// 사용 가능한 몹 목록
const availableMobs = [
    { id: "minecraft:warden", name: "워든", displayName: "§c워든" },
    { id: "minecraft:zombie", name: "좀비", displayName: "§2좀비" },
    { id: "minecraft:skeleton", name: "스켈레톤", displayName: "§7스켈레톤" },
    { id: "minecraft:iron_golem", name: "철골렘", displayName: "§f철골렘" },
    { id: "minecraft:vindicator", name: "변명자", displayName: "§a변명자" },
];

// 몬스터 수를 저장할 스코어보드 생성
system.runInterval(() => {
    const dimension = world.getDimension("overworld");
    dimension.runCommand("scoreboard objectives add warden_count dummy");
    dimension.runCommand("scoreboard objectives add zombie_count dummy");
}, 20);

// 몬스터 수 업데이트 함수
function updateMonsterCount() {
    const dimension = world.getDimension("overworld");
    let wardenCount = 0;
    let zombieCount = 0;

    // 모든 엔티티를 확인하여 워든과 좀비 수 계산
    for (const entity of dimension.getEntities()) {
        if (entity.typeId === "minecraft:warden") {
            wardenCount++;
        } else if (entity.typeId === "minecraft:zombie") {
            zombieCount++;
        }
    }

    // 액션바에 표시
    for (const player of world.getAllPlayers()) {
        player.onScreenDisplay.setActionBar(`§c워든: ${wardenCount}  §2좀비: ${zombieCount}`);
    }

    return { wardenCount, zombieCount };
}

// 몬스터 소환 함수
function spawnMonstersInCircle(center, monsterType, count, isFirstMob) {
    const dimension = world.getDimension("overworld");
    
    if (isFirstMob) {
        // 첫 번째 몹은 모두 중앙에 한번에 소환
        for (let i = 0; i < count; i++) {
            system.runTimeout(() => {
                dimension.runCommand(`summon ${monsterType} ${center.x} ${center.y} ${center.z}`);
            }, 0);
            }
        } else {
        // 두 번째 몹은 원형으로 소환 (반지름 15블록)
        const radius = 5;
        const angleStep = (2 * Math.PI) / count;
        for (let i = 0; i < count; i++) {
            const angle = angleStep * i;
            const x = center.x + radius * Math.cos(angle);
            const z = center.z + radius * Math.sin(angle);
            const y = center.y;

            system.runTimeout(() => {
                dimension.runCommand(`summon ${monsterType} ${x} ${y} ${z}`);
            }, 0);
        }
    }
}

// 철삽 사용 이벤트 처리
world.beforeEvents.itemUse.subscribe((ev) => {
    const player = ev.source;
    const item = ev.itemStack;

    // 철삽을 사용했고, 전투가 진행 중일 때
    if (item?.typeId === "minecraft:iron_shovel" && battleSettings.mob1) {
        const dimension = world.getDimension("overworld");
        const mobs = [...dimension.getEntities({ type: battleSettings.mob1.id })];
        
        if (mobs.length > 0) {
            // 다음 몹으로 인덱스 이동
            battleSettings.currentMobIndex = (battleSettings.currentMobIndex + 1) % mobs.length;
            const targetMob = mobs[battleSettings.currentMobIndex];
            const pos = targetMob.location;
            
            // 새로운 시점으로 카메라 이동 (시스템 권한으로 실행)
            system.runTimeout(() => {
                dimension.runCommand(`camera @a[name="${player.name}"] set minecraft:free ease 0.5 linear pos ${pos.x} ${pos.y + 10} ${pos.z - 20} rot 25 0`);
            }, 0);
        }
    }
});

// 몬스터 추적 카메라 시스템 수정
function setupBattleCamera(player, mobType) {
    battleSettings.currentMobIndex = 0;  // 카메라 시점 초기화
    const cameraInterval = system.runInterval(() => {
        const dimension = world.getDimension("overworld");
        const mobs = [...dimension.getEntities({ type: mobType })];
        
        if (mobs.length > 0) {
            // 현재 인덱스가 유효한지 확인하고 조정
            if (battleSettings.currentMobIndex >= mobs.length) {
                battleSettings.currentMobIndex = 0;
            }
            
            // 현재 선택된 인덱스의 몹 위치로 카메라 설정
            const mob = mobs[battleSettings.currentMobIndex];
            const pos = mob.location;
            
            // 멀리서 내려다보는 위치로 카메라 설정 (시스템 권한으로 실행)
            system.runTimeout(() => {
                dimension.runCommand(`camera @a[name="${player.name}"] set minecraft:free ease 0.5 linear pos ${pos.x} ${pos.y + 10} ${pos.z - 20} rot 25 0`);
            }, 0);
        }
    }, 1);

    return cameraInterval;
}

// 채팅 명령어 처리
world.beforeEvents.chatSend.subscribe((ev) => {
    const message = ev.message;
    const player = ev.sender;

    // !전투설정 명령어 처리
    if (message === "!전투설정") {
        ev.cancel = true;
        
        // 사용 가능한 몹 목록 표시
        player.sendMessage("§e=== 전투 가능한 몹 목록 ===");
        availableMobs.forEach((mob, index) => {
            player.sendMessage(`${index + 1}. ${mob.displayName}`);
        });
        player.sendMessage("§e전투시킬 몹을 선택하세요: !전투설정 [첫번째몹번호] [두번째몹번호]");
        return;
    }

    // !전투설정 [몹1] [몹2] 명령어 처리
    if (message.startsWith("!전투설정 ")) {
        ev.cancel = true;
        const args = message.split(" ");
        
        if (args.length !== 3) {
            player.sendMessage("§c사용법: !전투설정 [첫번째몹번호] [두번째몹번호]");
            return;
        }

        const mob1Index = parseInt(args[1]) - 1;
        const mob2Index = parseInt(args[2]) - 1;

        if (isNaN(mob1Index) || isNaN(mob2Index) || 
            mob1Index < 0 || mob1Index >= availableMobs.length ||
            mob2Index < 0 || mob2Index >= availableMobs.length) {
            player.sendMessage("§c유효한 몹 번호를 입력해주세요.");
            return;
        }

        battleSettings.mob1 = availableMobs[mob1Index];
        battleSettings.mob2 = availableMobs[mob2Index];

        player.sendMessage(`§a전투 설정이 완료되었습니다: ${battleSettings.mob1.displayName} vs ${battleSettings.mob2.displayName}`);
        player.sendMessage("§e!전투 [첫번째몹수] [두번째몹수] 명령어로 전투를 시작하세요.");
        return;
    }

    // !전투 [수1] [수2] 명령어 처리
    if (message.startsWith("!전투 ")) {
        ev.cancel = true;
        
        if (!battleSettings.mob1 || !battleSettings.mob2) {
            player.sendMessage("§c먼저 !전투설정 명령어로 전투할 몹을 선택해주세요.");
            return;
        }

        const args = message.split(" ");
        
        if (args.length !== 3) {
            player.sendMessage("§c사용법: !전투 [첫번째몹수] [두번째몹수]");
            return;
        }

        const count1 = parseInt(args[1]);
        const count2 = parseInt(args[2]);

        if (isNaN(count1) || isNaN(count2) || count1 < 1 || count2 < 1) {
            player.sendMessage("§c유효한 숫자를 입력해주세요.");
            return;
        }

        // 100마리 이상일 때 경고 메시지
        if (count1 + count2 > 100) {
            player.sendMessage("§e경고: 너무 많은 몬스터를 소환하면 게임 성능이 저하될 수 있습니다!");
        }

        // 플레이어 위치 기준으로 소환
        const playerPos = player.location;
        
        // 플레이어 아래의 바닥 위치 찾기
        const dimension = world.getDimension("overworld");
        let groundY = playerPos.y;
        
        // 플레이어 위치에서 아래로 내려가면서 첫 번째 단단한 블록 찾기
        for (let y = Math.floor(playerPos.y); y > -64; y--) {
            const block = dimension.getBlock({ x: Math.floor(playerPos.x), y: y, z: Math.floor(playerPos.z) });
            if (block && !block.isAir) {
                groundY = y + 1; // 블록 위에 소환되도록 1 더하기
                break;
            }
        }

        const center = { x: playerPos.x, y: groundY, z: playerPos.z };

        // 카운트다운 시작
        let countdown = 5;
        const countdownInterval = system.runInterval(() => {
            if (countdown > 0) {
                for (const p of world.getAllPlayers()) {
                    p.onScreenDisplay.setTitle(`§e${countdown}`, {
                        fadeInDuration: 0,
                        stayDuration: 20,
                        fadeOutDuration: 0
                    });
                }
                countdown--;
            } else {
                system.clearRun(countdownInterval);
                
                // 카운트다운 완료 후 전투 시작
                for (const p of world.getAllPlayers()) {
                    p.onScreenDisplay.setTitle("§c전투 시작!", {
                        fadeInDuration: 0,
                        stayDuration: 20,
                        fadeOutDuration: 10
                    });
                }

                // 첫 번째 몹은 중앙에, 두 번째 몹은 원형으로 배치
                spawnMonstersInCircle(center, battleSettings.mob1.id, count1, true);   // 첫 번째 몹은 중앙에
                spawnMonstersInCircle(center, battleSettings.mob2.id, count2, false);  // 두 번째 몹은 원형으로
                
                player.sendMessage(`§a${battleSettings.mob1.displayName} ${count1}마리와 ${battleSettings.mob2.displayName} ${count2}마리가 소환되었습니다!`);

                // 카메라 설정 시작 (첫번째 몹 기준)
                const cameraInterval = setupBattleCamera(player, battleSettings.mob1.id);
            }
        }, 20);
    }
});

// 1초마다 몬스터 수 업데이트
system.runInterval(() => {
    const dimension = world.getDimension("overworld");
    let counts = new Map();

    // 모든 엔티티를 확인하여 각 몹의 수 계산
    for (const entity of dimension.getEntities()) {
        const typeId = entity.typeId;
        counts.set(typeId, (counts.get(typeId) || 0) + 1);
    }

    // 전투 중인 몹들의 수만 표시
    if (battleSettings.mob1 && battleSettings.mob2) {
        const count1 = counts.get(battleSettings.mob1.id) || 0;
        const count2 = counts.get(battleSettings.mob2.id) || 0;

        // 액션바에 표시
        for (const player of world.getAllPlayers()) {
            player.onScreenDisplay.setActionBar(`${battleSettings.mob1.displayName}: ${count1}  ${battleSettings.mob2.displayName}: ${count2}`);
        }
    }
}, 20);
