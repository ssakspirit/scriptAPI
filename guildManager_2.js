import { world, system } from '@minecraft/server';
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";

/**
 * 길드 시스템 사용법:
 * 
 * 1. 플레이어 명령어:
 *    - !길드: 일반 길드원용 길드 관리 UI를 엽니다.
 *    - !길드장: 길드장용 길드 관리 UI를 엽니다.
 *    - !관리자: 관리자용 길드 관리 UI를 엽니다 ('admin' tag 필요).
 *    - ㅁ [메시지]: 길드 채팅을 보냅니다.
 *    - !길드전쟁: 길드 전쟁을 시작합니다 ('admin' tag 필요).
 *    - !길드전쟁종료: 길드 전쟁을 종료하고 결과를 발표합니다 ('admin' tag 필요).
 *    - !길드전쟁설정: 길드 전쟁의 승리 조건과 보상을 설정합니다 ('admin' tag 필요).
 * 
 * 2. 길드 기능:
 *    - 길드 생성: 새로운 길드를 만들 수 있습니다.
 *    - 길드 가입: 기존 길드에 가입 요청을 보낼 수 있습니다.
 *    - 길드 탈퇴: 현재 소속된 길드에서 탈퇴할 수 있습니다.
 *    - 길드 정보 확인: 모든 길드의 정보를 볼 수 있습니다.
 * 
 * 3. 길드장 기능:
 *    - 길드 정보 수정: 길드 이름과 설명을 변경할 수 있습니다.
 *    - 가입 요청 관리: 길드 가입 요청을 수락하거나 거절할 수 있습니다.
 *    - 길드원 관리: 길드원을 추방할 수 있습니다.
 * 
 * 4. 관리자 기능 ('admin' 태그 필요):
 *    - 길드 삭제: 서버의 모든 길드를 삭제할 수 있습니다.
 *    - 길드 채팅 모니터링: 모든 길드의 내부 채팅을 볼 수 있습니다.
 *    - 관리자 모드 표시: 길드 채팅을 볼 때 관리자 모드로 표시됩니다.
 *    - 길드 전쟁 시작/종료: 길드 전쟁을 시작하고 종료할 수 있습니다.
 *    - 길드 전쟁 설정: 승리 조건과 보상을 설정할 수 있습니다.
 * 
 * 5. 기타 기능:
 *    - 길드 채팅: 길드원들끼리 비공개 채팅을 할 수 있습니다.
 *    - 이름 태그: 길드에 가입한 플레이어의 이름 위에 길드 이름이 표시됩니다.
 * 
 * 6. PvP 보호 시스템:
 *    - 같은 길드원끼리는 서로 공격할 수 없습니다 (데미지가 무효화됨).
 *    - 각 길드는 team1부터 team20까지의 태그 중 하나를 자동으로 할당받습니다.
 *    - 길드 가입 시 자동으로 해당 팀 태그가 부여됩니다.
 *    - 길드 탈퇴/추방/해체 시 팀 태그가 자동으로 제거됩니다.
 *    - 최대 20개의 길드까지 동시에 운영 가능합니다.
 * 
 * 7. 길드 전쟁 시스템:
 *    - 관리자가 !길드전쟁 명령어로 전쟁을 시작할 수 있습니다.
 *    - 전쟁 중에는 길드원이 상대 길드원을 처치하면 길드의 킬 점수가 증가합니다.
 *    - 실시간으로 각 길드의 킬 점수가 스코어보드에 표시됩니다.
 *    - 킬이 발생할 때마다 전체 채팅으로 알림이 표시됩니다.
 *    - !길드전쟁종료 명령어로 전쟁을 종료하면 최종 순위와 결과가 발표됩니다.
 *    - 전쟁 종료 시 모든 점수가 초기화됩니다.
 * 
 * 8. 길드 전쟁 설정 (!길드전쟁설정):
 *    - 목표 킬 수 설정: 이 킬 수에 도달하면 자동으로 전쟁이 종료되고 해당 길드가 승리합니다.
 *    - 승리 보상 설정: 승리한 길드의 모든 길드원에게 지급할 에메랄드 수를 설정합니다.
 *    - 기본값: 목표 킬 수 10킬, 보상 에메랄드 5개
 *    - 설정은 서버 재시작 후에도 유지됩니다.
 *    - 승리 조건 달성 시 자동으로 전쟁이 종료되고 보상이 지급됩니다.
 * 
 * 관리자 권한 설정 방법:
 * 1. 플레이어에게 'admin' 태그 부여:
 *    - /tag [플레이어이름] add admin
 * 2. 관리자 권한 제거:
 *    - /tag [플레이어이름] remove admin
 * 
 * 관리자 기능 사용법:
 * 1. 길드 채팅 모니터링:
 *    - admin 태그가 있는 플레이어는 자동으로 모든 길드의 채팅을 볼 수 있습니다
 *    - 관리자 모드로 보이는 메시지는 [관리자 모드] 태그가 붙습니다
 * 2. 길드 삭제:
 *    - !관리자 명령어로 관리자 메뉴를 열어 길드를 삭제할 수 있습니다
 * 
 * 주의: 이 스크립트를 사용하려면 행동 팩의 manifest.json 파일에 
 * "@minecraft/server"와 "@minecraft/server-ui" 모듈에 대한 종속성을 추가해야 합니다.
 */

// 길드 시스템 설정값
const GUILD_SETTINGS = {
    REQUIRED_LEVEL: 50 // 길드 생성에 필요한 최소 레벨 (이 값을 수정하여 레벨 제한 변경 가능)
};

// 시스템 설정값
const SYSTEM_SETTINGS = {
    SCOREBOARD: {
        LEVEL: {
            NAME: "playerMoney", // 스코어보드 내부 이름 (변경 시 기존 데이터 손실 주의)
            DISPLAY_NAME: "§b자금" // 스코어보드 표시 이름
        }
    }
};

// 길드 시스템 초기화
function initGuildSystem() {
    if (!world.getDynamicProperty('guilds')) {
        world.setDynamicProperty('guilds', JSON.stringify({}));
    }
}

// 길드 정보 가져오기
function getGuilds() {
    const guildsData = world.getDynamicProperty('guilds');
    return guildsData ? JSON.parse(guildsData) : {};
}

// 길드 정보 저장하기
function saveGuilds(guilds) {
    world.setDynamicProperty('guilds', JSON.stringify(guilds));
}

// 플레이어의 길드 가져오기
function getPlayerGuild(playerName) {
    const guilds = getGuilds();
    for (const [guildName, guildInfo] of Object.entries(guilds)) {
        if (guildInfo.members.includes(playerName)) {
            return guildName;
        }
    }
    return null;
}

// 길드 생성
function createGuild(player, guildName, guildDescription) {
    let guilds = getGuilds();
    if (guilds[guildName]) {
        return false; // 이미 존재하는 길드
    }

    // 사용 가능한 다음 팀 번호 찾기
    let teamNumber = 1;
    const existingTeams = new Set();
    for (const guild of Object.values(guilds)) {
        if (guild.teamNumber) {
            existingTeams.add(guild.teamNumber);
        }
    }
    while (existingTeams.has(teamNumber)) {
        teamNumber++;
    }

    guilds[guildName] = {
        leader: player.name,
        description: guildDescription,
        members: [player.name],
        joinRequests: [],
        teamNumber: teamNumber // 팀 번호 추가
    };
    saveGuilds(guilds);

    // 길드장에게 팀 태그 부여
    player.addTag(`team${teamNumber}`);

    // 길드 생성 직후 플레이어의 이름 태그 업데이트
    updatePlayerNameTag(player);

    return true;
}

// 길드 가입 요청 함수
function requestJoinGuild(player, guildName) {
    let guilds = getGuilds();
    if (!guilds[guildName]) {
        return false; // 존재하지 않는 길드
    }
    if (guilds[guildName].members.includes(player.name)) {
        return false; // 이미 가입한 길드
    }
    if (guilds[guildName].joinRequests.includes(player.name)) {
        return false; // 이미 가입 요청을 보낸 상태
    }
    guilds[guildName].joinRequests.push(player.name);
    saveGuilds(guilds);
    return true;
}

// 길드 가입
function joinGuild(player, guildName) {
    let guilds = getGuilds();
    if (!guilds[guildName]) {
        return false; // 존재하지 않는 길드
    }
    if (guilds[guildName].members.includes(player.name)) {
        return false; // 이미 가입한 길드
    }
    guilds[guildName].members.push(player.name);
    saveGuilds(guilds);
    updatePlayerNameTag(player);
    return true;
}

// 플레이어의 모든 team 태그 제거 함수
function removeAllTeamTags(player) {
    // 플레이어가 가진 모든 태그 가져오기
    const tags = player.getTags();
    // team으로 시작하는 모든 태그 제거
    for (const tag of tags) {
        if (tag.startsWith('team')) {
            player.removeTag(tag);
        }
    }
}

// 길드 탈퇴
function leaveGuild(player) {
    let guilds = getGuilds();
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName) {
        return false;
    }
    const guild = guilds[playerGuildName];

    // 모든 team 태그 제거
    removeAllTeamTags(player);

    if (guild.leader === player.name) {
        // 길드장이 탈퇴하는 경우 길드 해체
        // 모든 길드원의 팀 태그 제거
        for (const memberName of guild.members) {
            const member = world.getAllPlayers().find(p => p.name === memberName);
            if (member) {
                removeAllTeamTags(member);
                updatePlayerNameTag(member);
                member.sendMessage(`§c${playerGuildName} 길드가 해체되었습니다. 길드장이 탈퇴했습니다.`);
            }
        }
        delete guilds[playerGuildName];
    } else {
        // 일반 길드원 탈퇴
        guild.members = guild.members.filter(member => member !== player.name);
    }
    saveGuilds(guilds);
    updatePlayerNameTag(player);
    return true;
}

// 메인 길드 UI
function openGuildUI(player) {
    system.runTimeout(() => {
        const form = new ActionFormData();
        form.title("길드 관리");
        form.body("원하는 작업을 선택하세요.");
        form.button("길드 생성");
        form.button("길드 가입");
        form.button("길드 탈퇴");
        form.button("길드 정보");
        form.button("닫기");

        form.show(player).then((response) => {
            if (response.cancelationReason === "UserBusy") {
                openGuildUI(player);
            } else if (response.canceled) {
                player.sendMessage("길드 관리 UI를 닫았습니다.");
            } else {
                switch (response.selection) {
                    case 0: createGuildUI(player); break;
                    case 1: joinGuildUI(player); break;
                    case 2: leaveGuildUI(player); break;
                    case 3: guildInfoUI(player); break;
                    case 4: player.sendMessage("UI를 닫았습니다."); break;
                }
            }
        }).catch((error) => {
            console.warn("UI 표시 중 오류 발생:", error);
            player.sendMessage("UI를 표시하는 중 오류가 발했습니다.");
        });
    }, 20);
}

// 길드 생성 UI
function createGuildUI(player) {
    const currentGuild = getPlayerGuild(player.name);
    if (currentGuild) {
        player.sendMessage(`§c이미 ${currentGuild} 길드에 가입되어 있습니다. 새로운 길드를 만들려면 먼저 현재 길드를 탈퇴해야 합니다.`);
        return;
    }

    // 레벨 확인
    const playerLevel = getPlayerLevel(player);
    if (playerLevel < GUILD_SETTINGS.REQUIRED_LEVEL) {
        player.sendMessage(`§c길드를 생성하기 위해서는 ${SYSTEM_SETTINGS.SCOREBOARD.LEVEL.DISPLAY_NAME} ${GUILD_SETTINGS.REQUIRED_LEVEL} 이상이 필요합니다. (현재: ${playerLevel})`);
        return;
    }

    const form = new ModalFormData()
        .title("길드 생성")
        .textField("길드 이름을 입력하세요:", "길드 이름")
        .textField("길드 설명을 입력하세요:", "길드 설명")
        .toggle("뒤로 가기", { defaultValue: false });

    form.show(player).then((response) => {
        if (response.canceled) return;
        const [guildName, guildDescription, goBack] = response.formValues;
        if (goBack) {
            openGuildUI(player);
            return;
        }
        if (createGuild(player, guildName, guildDescription)) {
            player.sendMessage(`§a${guildName} 길드를 생성했습니다. 당신이 길드장입니다.`);
            // 길드 생성 성공 후 이름 태그 업데이트 확인
            system.runTimeout(() => {
                updatePlayerNameTag(player);
            }, 20);
        } else {
            player.sendMessage(`§c${guildName} 길드를 생성할 수 없습니다. 이미 존재하는 이름입니다.`);
        }
        openGuildUI(player);
    });
}

// 길드 가입 UI
function joinGuildUI(player) {
    const currentGuild = getPlayerGuild(player.name);
    if (currentGuild) {
        player.sendMessage(`이미 ${currentGuild} 길드에 가입되어 있습니다.`);
        return;
    }

    const guilds = getGuilds();
    const guildList = Object.keys(guilds);
    if (guildList.length === 0) {
        player.sendMessage("현재 가입 가능한 길드가 없습니다.");
        return;
    }

    const form = new ModalFormData()
        .title("길드 가입 요청")
        .dropdown("가입을 요청할 길드를 선택하세요:", guildList)
        .toggle("뒤로 가기", { defaultValue: false });

    form.show(player).then((response) => {
        if (response.canceled) return;
        const [selectedIndex, goBack] = response.formValues;
        if (goBack) {
            openGuildUI(player);
            return;
        }
        const selectedGuild = guildList[selectedIndex];
        if (requestJoinGuild(player, selectedGuild)) {
            player.sendMessage(`${selectedGuild} 길드에 가입 요청을 보냈습니다. 길드장의 승인을 기다려주세요.`);
        } else {
            player.sendMessage("가입 요청에 실패했습니다. 이미 요청을 보냈거나 다른 문제가 있을 수 있습니다.");
        }
        openGuildUI(player);
    });
}

// 길드 탈퇴 UI
function leaveGuildUI(player) {
    const currentGuild = getPlayerGuild(player.name);
    if (!currentGuild) {
        player.sendMessage("현재 가입한 길드가 없습니다.");
        return;
    }

    const guilds = getGuilds();
    const isLeader = guilds[currentGuild].leader === player.name;

    let message = `정말로 ${currentGuild} 길드에서 탈퇴하시겠습니까?`;
    if (isLeader) {
        message += "\n§c주의: 당신은 길드장입니다. 탈퇴하면 길드가 해체됩니다!";
    }

    const form = new MessageFormData()
        .title("길드 탈퇴")
        .body(message)
        .button1("예")
        .button2("아니오 (뒤로 가기)");

    form.show(player).then((response) => {
        if (response.selection === 0) {
            if (leaveGuild(player)) {
                if (isLeader) {
                    player.sendMessage(`§c${currentGuild} 길드를 해체했습니다.`);
                } else {
                    player.sendMessage(`${currentGuild} 길드에서 탈퇴했습니다.`);
                }
            } else {
                player.sendMessage("길드 탈퇴에 실패했습니다.");
            }
        } else {
            player.sendMessage("길드 탈퇴 했습니다.");
        }
        openGuildUI(player);
    });
}

// 길드 정보 UI
function guildInfoUI(player) {
    try {
        const guilds = getGuilds();

        if (Object.keys(guilds).length === 0) {
            player.sendMessage("§c현재 생성된 길드가 없습니다.");
            return;
        }

        let guildInfo = "§l§6길드 정보§r\n\n";

        const playerGuildName = getPlayerGuild(player.name);
        if (playerGuildName) {
            const playerGuildInfo = guilds[playerGuildName];
            guildInfo += `§l§9당신의 길드:§r\n§e길드: §b${playerGuildName}\n§e설명: §f${playerGuildInfo.description}\n§e길드원: §f${playerGuildInfo.members.join(', ')}\n`;
            if (playerGuildInfo.leader === player.name) {
                guildInfo += "§6(당신은 길드장입니다)\n";
            }
            guildInfo += "\n§l§6다른 길드 목록:§r\n\n";
        } else {
            guildInfo += "§c당신은 현재 어떤 길드에도 속해있지 않습니다.\n\n§l§6길드 목록:§r\n\n";
        }

        for (const [guildName, guildData] of Object.entries(guilds)) {
            if (playerGuildName && guildName === playerGuildName) continue;
            guildInfo += `§e길드: §b${guildName}\n§e길드장: §a${guildData.leader}\n§e설명: §f${guildData.description}\n§e길드원: §f${guildData.members.join(', ')}\n§r\n`;
        }

        const form = new ActionFormData()
            .title("§l§6길드 정보")
            .body(guildInfo)
            .button("확인 (뒤로 가기)");

        form.show(player).then(() => {
            openGuildUI(player);
        });
    } catch (error) {
        console.warn("길드 정보 UI 표시 중 오류 발생:", error);
        player.sendMessage("§c길드 정보를 불러오는 중 오류가 발생했습니다.");
    }
}

// 길드장 UI
function openGuildLeaderUI(player) {
    system.runTimeout(() => {
        const playerGuildName = getPlayerGuild(player.name);
        if (!playerGuildName) {
            player.sendMessage("§c당신은 길드에 속해있지 않습니다.");
            return;
        }

        const guilds = getGuilds();
        if (guilds[playerGuildName].leader !== player.name) {
            player.sendMessage("§c당신은 길드장이 아닙니다.");
            return;
        }

        const form = new ActionFormData();
        form.title("§l§6길드장 관리");
        form.body(`§e${playerGuildName} §f길드의 관리 메뉴입니다.`);
        form.button("길드원 관리");
        form.button("길드 정보 수정");
        form.button("가입 요청 관리");
        form.button("길드 해체");
        form.button("닫기");

        form.show(player).then((response) => {
            if (response.cancelationReason === "UserBusy") {
                openGuildLeaderUI(player);
            } else if (response.canceled) {
                player.sendMessage("길드장 관리 UI를 닫았습니다.");
            } else {
                switch (response.selection) {
                    case 0: manageMembersUI(player); break;
                    case 1: editGuildInfoUI(player); break;
                    case 2: manageJoinRequestsUI(player); break;
                    case 3: disbandGuildUI(player); break;
                    case 4: player.sendMessage("UI를 닫았습니다."); break;
                }
            }
        }).catch((error) => {
            console.warn("UI 표시 중 오류 발생:", error);
            player.sendMessage("UI를 표시하는 중 오류가 발생했습니다.");
        });
    }, 20);
}

// 길드원 관리 UI
function manageMembersUI(player) {
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName) {
        player.sendMessage("§c당신은 길드에 속해있지 않습니다.");
        return;
    }

    const guilds = getGuilds();
    const guild = guilds[playerGuildName];
    if (guild.leader !== player.name) {
        player.sendMessage("§c당신은 길드장이 아닙니다.");
        return;
    }

    const form = new ActionFormData()
        .title("길드원 관리")
        .body(`${playerGuildName} 길드의 길드원 목록입니다. 탈퇴 시킬 길드원을 선택하세요.`);

    const kickableMembers = guild.members.filter(member => member !== player.name);
    kickableMembers.forEach(member => {
        form.button(member);
    });

    form.button("뒤로 가기");

    form.show(player).then((response) => {
        if (response.canceled || response.selection === kickableMembers.length) {
            openGuildLeaderUI(player);
            return;
        }

        const selectedMember = kickableMembers[response.selection];
        kickMemberConfirmUI(player, selectedMember);
    });
}

// 길드원 추방 확인 UI
function kickMemberConfirmUI(player, memberToKick) {
    const form = new MessageFormData()
        .title("길드원 추방 확인")
        .body(`정말로 ${memberToKick}을(를) 길드에서 추방하시겠습니까?`)
        .button1("예")
        .button2("아니오");

    form.show(player).then((response) => {
        if (response.selection === 0) {
            kickMember(player, memberToKick);
        }
        manageMembersUI(player);
    });
}

// 길드원 추방 함수
function kickMember(player, memberToKick) {
    const guilds = getGuilds();
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName || guilds[playerGuildName].leader !== player.name) {
        player.sendMessage("§c권한이 없습니다.");
        return;
    }

    const guild = guilds[playerGuildName];
    if (memberToKick === player.name) {
        player.sendMessage("§c자기 자신을 추방할 수 없습니다.");
        return;
    }

    if (!guild.members.includes(memberToKick)) {
        player.sendMessage(`§c${memberToKick}은(는) 길드원이 아닙니다.`);
        return;
    }

    guild.members = guild.members.filter(member => member !== memberToKick);
    saveGuilds(guilds);

    player.sendMessage(`§a${memberToKick}을(를) 길드에서 추방했습니다.`);
    const kickedPlayer = world.getAllPlayers().find(p => p.name === memberToKick);
    if (kickedPlayer) {
        // 추방된 플레이어의 모든 team 태그 제거
        removeAllTeamTags(kickedPlayer);
        kickedPlayer.sendMessage(`§c당신은 ${playerGuildName} 길드에서 추방되었습니다.`);
        updatePlayerNameTag(kickedPlayer);
    }

    // 길드장의 이름 태그는 변경되지 않아야 함
    updatePlayerNameTag(player);
}

// 길드 정보 수정 UI
function editGuildInfoUI(player) {
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName) {
        player.sendMessage("§c당신은 길드에 속해있지 않습니다.");
        return;
    }

    const guilds = getGuilds();
    const guild = guilds[playerGuildName];
    if (guild.leader !== player.name) {
        player.sendMessage("§c당신은 길드장이 아닙니다.");
        return;
    }

    const form = new ModalFormData()
        .title("길드 정보 수정")
        .textField("새로운 길드 이름 (변경하지 않으려면 비워두세요)", "새 길드 이름", playerGuildName)
        .textField("새로운 길드 설명", "새 길드 설명", guild.description);

    form.show(player).then((response) => {
        if (response.canceled) {
            openGuildLeaderUI(player);
            return;
        }

        const [newGuildName, newDescription] = response.formValues;
        updateGuildInfo(player, newGuildName, newDescription);
    });
}

// 길드 정보 업데이트 함수 수정
function updateGuildInfo(player, newGuildName, newDescription) {
    const guilds = getGuilds();
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName || guilds[playerGuildName].leader !== player.name) {
        player.sendMessage("§c권한이 없습니다.");
        return;
    }

    const guild = guilds[playerGuildName];
    let nameChanged = false;

    if (newGuildName && newGuildName !== playerGuildName) {
        if (guilds[newGuildName]) {
            player.sendMessage("§c이미 존재하는 길드 이름입니다.");
            return;
        }
        guilds[newGuildName] = guild;
        delete guilds[playerGuildName];
        player.sendMessage(`§a길드 이름을 ${newGuildName}으로 변경했습니다.`);
        nameChanged = true;
    }

    if (newDescription) {
        guild.description = newDescription;
        player.sendMessage("§a길드 설명을 업데이트했습니다.");
    }

    saveGuilds(guilds);

    // 길드 이름이 변경되었다면 모든 길드원의 이름 태그 업데이트
    if (nameChanged) {
        updateAllGuildMembersTags(newGuildName || playerGuildName);
    }

    openGuildLeaderUI(player);
}

// 모든 길드원의 이름 태그 업데이트 함수
function updateAllGuildMembersTags(guildName) {
    const guilds = getGuilds();
    const guild = guilds[guildName];
    if (!guild) return;

    for (const memberName of guild.members) {
        const member = world.getAllPlayers().find(p => p.name === memberName);
        if (member) {
            updatePlayerNameTag(member);
            member.sendMessage(`§a길드 이름이 '${guildName}'(으)로 변경되었습니다.`);
        }
    }
}

// 길드 해체 확인 UI
function disbandGuildUI(player) {
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName) {
        player.sendMessage("§c당신은 길드에 속해있지 않습니다.");
        return;
    }

    const guilds = getGuilds();
    if (guilds[playerGuildName].leader !== player.name) {
        player.sendMessage("§c당신은 길드장이 아닙니다.");
        return;
    }

    const form = new MessageFormData()
        .title("길드 해체")
        .body(`정말로 ${playerGuildName} 길드를 해체하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)
        .button1("예, 길드를 해체합니다")
        .button2("아니오, 취소합니다");

    form.show(player).then((response) => {
        if (response.selection === 0) {
            disbandGuild(player);
        } else {
            player.sendMessage("길드 해체를 취소했니다.");
            openGuildLeaderUI(player);
        }
    });
}

// 길드 해체 함수
function disbandGuild(player) {
    const guilds = getGuilds();
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName || guilds[playerGuildName].leader !== player.name) {
        player.sendMessage("§c권한이 없습니다.");
        return;
    }

    const guild = guilds[playerGuildName];
    const members = guild.members;

    // 모든 길드원의 팀 태그 제거
    for (const memberName of members) {
        const member = world.getAllPlayers().find(p => p.name === memberName);
        if (member) {
            removeAllTeamTags(member);
            if (member.name === player.name) {
                member.sendMessage(`§c당신이 ${playerGuildName} 길드를 해체했습니다.`);
            } else {
                member.sendMessage(`§c${playerGuildName} 길드가 길드장에 의해 해체되었습니다.`);
            }
            updatePlayerNameTag(member);
        }
    }

    // 길드 삭제
    delete guilds[playerGuildName];
    saveGuilds(guilds);

    player.sendMessage(`§a${playerGuildName} 길드를 성공적으로 해체했습니다.`);
}

// 가입 요청 관리 UI
function manageJoinRequestsUI(player) {
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName) {
        player.sendMessage("§c당신은 길드에 속해있지 않습니다.");
        return;
    }

    const guilds = getGuilds();
    const guild = guilds[playerGuildName];
    if (guild.leader !== player.name) {
        player.sendMessage("§c당신은 길드장이 아닙니다.");
        return;
    }

    if (guild.joinRequests.length === 0) {
        player.sendMessage("§c현재 가입 요청이 없습니다.");
        openGuildLeaderUI(player);
        return;
    }

    const form = new ActionFormData()
        .title("가입 요청 관리")
        .body(`${playerGuildName} 길드의 가입 요청 목록입니다. 처처리할 요청을 선택하세요.`);

    guild.joinRequests.forEach(requester => {
        form.button(requester);
    });

    form.button("뒤로 가기");

    form.show(player).then((response) => {
        if (response.canceled || response.selection === guild.joinRequests.length) {
            openGuildLeaderUI(player);
            return;
        }

        const selectedRequester = guild.joinRequests[response.selection];
        processJoinRequestUI(player, selectedRequester);
    });
}

// 가입 요청 처리 UI
function processJoinRequestUI(player, requester) {
    const form = new MessageFormData()
        .title("가입 요청 처리")
        .body(`${requester}의 가입 요청을 어떻게 처리하시겠습니까?`)
        .button1("수락")
        .button2("거절");

    form.show(player).then((response) => {
        if (response.selection === 0) {
            acceptJoinRequest(player, requester);
        } else {
            rejectJoinRequest(player, requester);
        }
        manageJoinRequestsUI(player);
    });
}

// 가입 요청 수락 함수
function acceptJoinRequest(player, requester) {
    const guilds = getGuilds();
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName || guilds[playerGuildName].leader !== player.name) {
        player.sendMessage("§c권한이 없습니다.");
        return;
    }

    const guild = guilds[playerGuildName];
    guild.members.push(requester);
    guild.joinRequests = guild.joinRequests.filter(r => r !== requester);
    saveGuilds(guilds);

    player.sendMessage(`§a${requester}의 가입 요청을 수락했습니다.`);
    const newMember = world.getAllPlayers().find(p => p.name === requester);
    if (newMember) {
        // 새 멤버에게 팀 태그 부여
        newMember.addTag(`team${guild.teamNumber}`);
        newMember.sendMessage(`§a당신의 ${playerGuildName} 길드 가입 요청이 수락되었습니다.`);
        updatePlayerNameTag(newMember);
    }

    // 모든 온라인 길드원의 이름 태그 업데이트
    for (const memberName of guild.members) {
        const member = world.getAllPlayers().find(p => p.name === memberName);
        if (member) {
            updatePlayerNameTag(member);
        }
    }
}

// 가입 요청 거절 함수
function rejectJoinRequest(player, requester) {
    const guilds = getGuilds();
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName || guilds[playerGuildName].leader !== player.name) {
        player.sendMessage("§c권한이 없습니다.");
        return;
    }

    const guild = guilds[playerGuildName];
    guild.joinRequests = guild.joinRequests.filter(r => r !== requester);
    saveGuilds(guilds);

    player.sendMessage(`§a${requester}의 가입 요청을 거절했습니다.`);
    const rejectedPlayer = world.getAllPlayers().find(p => p.name === requester);
    if (rejectedPlayer) {
        rejectedPlayer.sendMessage(`§c당신의 ${playerGuildName} 길드 가입 요청이 거절되었습니다.`);
    }
}

// 플레이어의 이름 태그 업데이트
function updatePlayerNameTag(player) {
    const guildName = getPlayerGuild(player.name);
    if (guildName) {
        player.nameTag = `§8[§6${guildName}§8] §f${player.name}`;
    } else {
        player.nameTag = player.name;
    }
}

//나침반 사용시 길드 UI 열기 '!길드'와 같은 기능
world.beforeEvents.itemUse.subscribe(async (ev) => {
    const item = ev.itemStack;
    const player = ev.source;
    const itemType = "minecraft:compass"; // 아이템 정하기

    // 아이템 조건 확인
    if (item.typeId === itemType) {
        openGuildUI(player);
        ev.cancel = true; // 기본 사용 동작 취소
    }
});

// 채팅 이벤트 수정
world.beforeEvents.chatSend.subscribe((ev) => {
    const player = ev.sender;
    const message = ev.message;

    if (message === "!길드" || message === "!길드장" || message === "!관리자" || message === "!길드전쟁" || message === "!길드전쟁종료" || message === "!길드전쟁설정") {
        ev.cancel = true;
        if (message === "!길드") {
            player.sendMessage(`채팅창을 닫으면 길드 관리 창이 열립니다.`);
            openGuildUI(player);
        } else if (message === "!길드장") {
            player.sendMessage(`채팅창을 닫으면 길드장 관리 창이 열립니다.`);
            openGuildLeaderUI(player);
        } else if (message === "!관리자") {
            if (player.hasTag("admin")) {
                player.sendMessage(`채팅창을 닫으면 관리자 메뉴가 열립니다.`);
                openAdminUI(player);
            } else {
                player.sendMessage("§c이 명령어를 사용할 권한이 없습니다.");
            }
        } else if (message === "!길드전쟁") {
            startGuildWar(player);
        } else if (message === "!길드전쟁종료") {
            endGuildWar(player);
        } else if (message === "!길드전쟁설정") {
            openGuildWarSettingsUI(player);
        }
    } else if (message.startsWith('ㅁ')) {
        ev.cancel = true;
        sendGuildMessage(player, message.slice(1).trim());
    } else {
        const guildName = getPlayerGuild(player.name);
        if (guildName) {
            ev.cancel = true;
            // 일반 메시지 전송
            system.runTimeout(() => {
                const globalMessage = `§8[§6${guildName}§8] §f${player.name}: ${message}`;
                // 모든 플레이어에게 메시지 전송
                for (const p of world.getAllPlayers()) {
                    // 관리자이면서 해당 길드원이 아닌 경우에만 관리자 모드로 표시
                    if (p.hasTag("admin") && !getGuilds()[guildName].members.includes(p.name)) {
                        p.sendMessage(`§8[§c관리자 모드§8] ${globalMessage}`);
                    } else {
                        p.sendMessage(globalMessage);
                    }
                }
            }, 0);
        }
        // 길드에 속하지 않은 플레이어의 메시지는 기본 채팅 시스템이 처리하도록 함
    }
});

// 길드 메시지 전송 함수
function sendGuildMessage(player, message) {
    const guildName = getPlayerGuild(player.name);
    if (!guildName) {
        player.sendMessage("§c당신은 길드에 속해있지 않습니다.");
        return;
    }

    const guilds = getGuilds();
    const guild = guilds[guildName];

    const guildMessage = `§8[§6${guildName}§8] §a[길드] §f${player.name}: ${message}`;

    // 길드원들에게 메시지 전송
    for (const memberName of guild.members) {
        const member = world.getAllPlayers().find(p => p.name === memberName);
        if (member) {
            member.sendMessage(guildMessage);
        }
    }

    // 관리자들에게도 메시지 전송 (길드원이 아닌 경우에만)
    for (const admin of world.getAllPlayers()) {
        if (admin.hasTag("admin") && !guild.members.includes(admin.name)) {
            admin.sendMessage(`§8[§c관리자 모드§8] ${guildMessage}`);
        }
    }
}

// 플레이어 스폰 시 이름 태그 업데이트
world.afterEvents.playerSpawn.subscribe((ev) => {
    const player = ev.player;
    system.runTimeout(() => {
        updatePlayerNameTag(player);
    }, 20);
});

// 서버 시작 시 초기화
system.run(() => {
    initGuildSystem();
    initGuildWarSystem();
});

// 관리 UI 열기
function openAdminUI(player) {
    system.runTimeout(() => {
        const form = new ActionFormData();
        form.title("관리자 메뉴");
        form.body("원하는 작업을 선택하세요.");
        form.button("길드 삭제");
        form.button("닫기");

        form.show(player).then((response) => {
            if (response.cancelationReason === "UserBusy") {
                openAdminUI(player);
            } else if (response.canceled) {
                player.sendMessage("관리자 메뉴를 닫았습니다.");
            } else {
                switch (response.selection) {
                    case 0: openGuildDeletionUI(player); break;
                    case 1: player.sendMessage("관리자 메뉴를 닫았습니다."); break;
                }
            }
        }).catch((error) => {
            console.warn("UI 표시 중 오류 발생:", error);
            player.sendMessage("UI를 표시하는 중 오류가 발생했습니다.");
        });
    }, 20);
}

// 길드 삭제 UI 열기
function openGuildDeletionUI(player) {
    system.runTimeout(() => {
        const guilds = getGuilds();
        const guildNames = Object.keys(guilds);

        if (guildNames.length === 0) {
            player.sendMessage("§c삭제할 길드가 없습니다.");
            openAdminUI(player);
            return;
        }

        const form = new ModalFormData()
            .title("길드 삭제")
            .dropdown("삭제할 길드 선택", guildNames)
            .toggle("뒤로 가기", { defaultValue: false });

        form.show(player).then((response) => {
            if (response.canceled) {
                openAdminUI(player);
                return;
            }
            const [selectedIndex, goBack] = response.formValues;
            if (goBack) {
                openAdminUI(player);
                return;
            }
            const selectedGuildName = guildNames[selectedIndex];
            deleteGuildConfirmation(player, selectedGuildName);
        }).catch((error) => {
            console.warn("UI 표시 중 오류 발생:", error);
            player.sendMessage("UI를 표시하는 중 오류가 발생했습니다.");
        });
    }, 20);
}

// 길드 삭제 확인 UI
function deleteGuildConfirmation(player, guildName) {
    system.runTimeout(() => {
        const form = new MessageFormData()
            .title("길드 삭제 확인")
            .body(`정말로 '${guildName}' 길드를 삭제하시겠습니까?`)
            .button1("예, 삭제합니다")
            .button2("아니오, 취소합니다");

        form.show(player).then((response) => {
            if (response.selection === 0) {
                deleteGuild(player, guildName);
            } else {
                player.sendMessage("길드 삭제가 취소되었습니다.");
            }
            openAdminUI(player);
        }).catch((error) => {
            console.warn("UI 표시 중 오류 발생:", error);
            player.sendMessage("UI를 표시하는 중 오류가 발생했습니다.");
        });
    }, 20);
}

// 길드 삭제 함수
function deleteGuild(player, guildName) {
    let guilds = getGuilds();
    if (!guilds[guildName]) {
        player.sendMessage(`§c'${guildName}' 길드를 찾을 수 없습니다.`);
        return;
    }

    const guild = guilds[guildName];

    // 모든 길드원의 팀 태그 제거
    for (const memberName of guild.members) {
        const member = world.getAllPlayers().find(p => p.name === memberName);
        if (member) {
            removeAllTeamTags(member);
            member.sendMessage(`§c관리자에 의해 '${guildName}' 길드가 삭제되었습니다.`);
            updatePlayerNameTag(member);
        }
    }

    // 길드 삭제
    delete guilds[guildName];
    saveGuilds(guilds);

    player.sendMessage(`§a'${guildName}' 길드를 성공적으로 삭제했습니다.`);
}

// **길드 전쟁 시스템**
// 길드 전쟁 시스템 초기화
function initGuildWarSystem() {
    system.run(() => {
        try {
            // 스코어보드 생성
            world.getDimension("overworld").runCommand("scoreboard objectives add guildWar dummy \"길드 전쟁\"");
        } catch (error) {
            // 이미 존재하는 경우 무시
        }
    });
}

// 길드 전쟁 시작
function startGuildWar(player) {
    if (!player.hasTag('admin')) {
        player.sendMessage('§c관리자만 길드 전쟁을 시작할 수 있습니다.');
        return;
    }

    const guilds = getGuilds();
    if (Object.keys(guilds).length < 2) {
        player.sendMessage('§c길드 전쟁을 시작하려면 최소 2개 이상의 길드가 필요합니다.');
        return;
    }

    system.run(() => {
        try {
            const dimension = world.getDimension("overworld");
            // 스코어보드 초기화
            try {
                dimension.runCommand("scoreboard objectives remove guildWar");
            } catch (error) {
                // 스코어보드가 없는 경우 무시
            }

            // 길드 전쟁 점수 초기화
            const warScores = {};
            for (const guildName of Object.keys(guilds)) {
                warScores[guildName] = 0;
            }
            world.setDynamicProperty('guildWarScores', JSON.stringify(warScores));

            system.runTimeout(() => {
                try {
                    dimension.runCommand("scoreboard objectives add guildWar dummy \"길드 전쟁\"");
                    dimension.runCommand("scoreboard objectives setdisplay sidebar guildWar");

                    // 각 길드의 초기 점수를 0으로 설정
                    for (const guildName of Object.keys(guilds)) {
                        dimension.runCommand(`scoreboard players set "${guildName}" guildWar 0`);
                    }

                    // 전역 변수로 전쟁 상태 설정
                    world.setDynamicProperty('isGuildWarActive', true);

                    // 모든 플레이어에게 알림
                    world.sendMessage('§6=== 길드 전쟁이 시작되었습니다! ===');
                    world.sendMessage('§e각 길드의 킬 수가 스코어보드에 표시됩니다.');
                } catch (error) {
                    console.warn('길드 전쟁 시작 중 오류 발생:', error);
                    player.sendMessage('§c길드 전쟁을 시작하는 중 오류가 발생했습니다.');
                }
            }, 10);
        } catch (error) {
            console.warn('길드 전쟁 시작 중 오류 발생:', error);
            player.sendMessage('§c길드 전쟁을 시작하는 중 오류가 발생했습니다.');
        }
    });
}

// 길드 전쟁 종료
function endGuildWar(player) {
    if (!player.hasTag('admin')) {
        player.sendMessage('§c관리자만 길드 전쟁을 종료할 수 있습니다.');
        return;
    }

    system.run(() => {
        try {
            const dimension = world.getDimension("overworld");
            
            // 진행 중인 길드 전쟁이 있는지 확인
            const isWarActive = world.getDynamicProperty('isGuildWarActive');
            if (!isWarActive) {
                player.sendMessage('§c진행 중인 길드 전쟁이 없습니다.');
                return;
            }

            // 동적 속성에서 점수 가져오기
            const warScoresJson = world.getDynamicProperty('guildWarScores');
            if (!warScoresJson) {
                player.sendMessage('§c길드 전쟁 점수를 찾을 수 없습니다.');
                return;
            }

            const warScores = JSON.parse(warScoresJson);
            const scores = Object.entries(warScores).map(([name, score]) => ({
                name,
                score
            }));

            // 점수순으로 정렬
            scores.sort((a, b) => b.score - a.score);
            const winner = scores[0];

            // 결과 발표
            world.sendMessage('§6=== 길드 전쟁이 종료되었습니다! ===');
            world.sendMessage(`§e승리한 길드: §6${winner.name} §e(${winner.score}킬)`);
            
            // 모든 길드의 최종 점수 표시
            world.sendMessage('§e=== 최종 순위 ===');
            scores.forEach((p, index) => {
                world.sendMessage(`§e${index + 1}위: ${p.name} - ${p.score}킬`);
            });

            // 모든 결과를 표시한 후에 스코어보드와 동적 속성 제거
            system.runTimeout(() => {
                try {
                    // 전쟁 상태 및 점수 초기화
                    world.setDynamicProperty('isGuildWarActive', false);
                    world.setDynamicProperty('guildWarScores', '');
                    // 스코어보드 제거
                    dimension.runCommand("scoreboard objectives remove guildWar");
                } catch (error) {
                    console.warn('스코어보드 제거 중 오류 발생:', error);
                }
            }, 100);
        } catch (error) {
            console.warn('길드 전쟁 종료 중 오류 발생:', error);
            player.sendMessage('§c길드 전쟁을 종료하는 중 오류가 발생했습니다.');
        }
    });
}

// 길드 전쟁 설정 UI
function openGuildWarSettingsUI(player) {
    if (!player.hasTag('admin')) {
        player.sendMessage('§c관리자만 길드 전쟁 설정을 변경할 수 있습니다.');
        return;
    }

    system.runTimeout(() => {
        const currentSettings = world.getDynamicProperty('guildWarSettings') || '{"targetKills":10,"rewardEmeralds":5}';
        const settings = JSON.parse(currentSettings);

        const form = new ModalFormData()
            .title("길드 전쟁 설정")
            .textField("목표 킬 수 (승리 조건)", "숫자 입력", String(settings.targetKills))
            .textField("보상 에메랄드 수", "숫자 입력", String(settings.rewardEmeralds));

        form.show(player).then((response) => {
            if (response.canceled) return;

            const [targetKills, rewardEmeralds] = response.formValues;
            const newTargetKills = parseInt(targetKills);
            const newRewardEmeralds = parseInt(rewardEmeralds);

            if (isNaN(newTargetKills) || newTargetKills <= 0) {
                player.sendMessage("§c목표 킬 수는 양의 정수여야 합니다.");
                return;
            }

            if (isNaN(newRewardEmeralds) || newRewardEmeralds <= 0) {
                player.sendMessage("§c보상 에메랄드 수는 양의 정수여야 합니다.");
                return;
            }

            const newSettings = {
                targetKills: newTargetKills,
                rewardEmeralds: newRewardEmeralds
            };
            world.setDynamicProperty('guildWarSettings', JSON.stringify(newSettings));
            player.sendMessage(`§a길드 전쟁 설정이 업데이트되었습니다:\n목표 킬 수: ${newTargetKills}\n승리 보상: 에메랄드 ${newRewardEmeralds}개`);
        });
    }, 20);
}

// 길드 전쟁 승리 처리 함수
function handleGuildWarVictory(guildName, dimension) {
    const guild = getGuilds()[guildName];
    if (!guild) return;

    const settings = JSON.parse(world.getDynamicProperty('guildWarSettings'));
    
    // 승리 메시지 전송
    world.sendMessage('§6=== 길드 전쟁 승리! ===');
    world.sendMessage(`§e${guildName} 길드가 목표 킬 수(${settings.targetKills}킬)를 달성하여 승리했습니다!`);
    
    // 보상 지급
    for (const memberName of guild.members) {
        const member = world.getAllPlayers().find(p => p.name === memberName);
        if (member) {
            // 에메랄드 지급 (플레이어 이름 직접 지정)
            dimension.runCommand(`give "${memberName}" emerald ${settings.rewardEmeralds}`);
            member.sendMessage(`§a길드 전쟁 승리 보상으로 에메랄드 ${settings.rewardEmeralds}개를 받았습니다!`);
        }
    }

    // 전쟁 종료 처리
    system.runTimeout(() => {
        try {
            // 전쟁 상태 및 점수 초기화
            world.setDynamicProperty('isGuildWarActive', false);
            world.setDynamicProperty('guildWarScores', '');
            // 스코어보드 제거
            dimension.runCommand("scoreboard objectives remove guildWar");
        } catch (error) {
            console.warn('스코어보드 제거 중 오류 발생:', error);
        }
    }, 100);
}

// 킬 점수 업데이트 부분 수정 (목표 킬 수 확인 추가)
world.afterEvents.entityDie.subscribe((event) => {
    const isWarActive = world.getDynamicProperty('isGuildWarActive');
    if (!isWarActive) return;

    const victim = event.deadEntity;
    if (!(victim.typeId === 'minecraft:player')) return;

    const killer = event.damageSource.damagingEntity;
    if (!killer || !(killer.typeId === 'minecraft:player')) return;

    const killerGuildName = getPlayerGuild(killer.name);
    if (!killerGuildName) return;

    system.run(() => {
        try {
            const dimension = world.getDimension("overworld");
            const warScoresJson = world.getDynamicProperty('guildWarScores');
            if (!warScoresJson) return;

            const warScores = JSON.parse(warScoresJson);
            warScores[killerGuildName] = (warScores[killerGuildName] || 0) + 1;

            // 설정된 목표 킬 수 확인
            const settings = JSON.parse(world.getDynamicProperty('guildWarSettings'));
            
            // 동적 속성에 업데이트된 점수 저장
            world.setDynamicProperty('guildWarScores', JSON.stringify(warScores));

            system.runTimeout(() => {
                try {
                    // 스코어보드 표시 업데이트
                    dimension.runCommand(`scoreboard players set "${killerGuildName}" guildWar ${warScores[killerGuildName]}`);

                    // 킬 알림
                    world.sendMessage(`§6${killerGuildName}§f 길드의 §e${killer.name}§f님이 §e${victim.name}§f님을 처치했습니다! (${warScores[killerGuildName]}/${settings.targetKills}킬)`);

                    // 목표 킬 수 달성 확인
                    if (warScores[killerGuildName] >= settings.targetKills) {
                        handleGuildWarVictory(killerGuildName, dimension);
                    }
                } catch (error) {
                    console.warn('킬 점수 업데이트 중 오류 발생:', error);
                }
            }, 5);
        } catch (error) {
            console.warn('킬 점수 업데이트 중 오류 발생:', error);
        }
    });
});

// 레벨 시스템 초기화
function initLevelSystem() {
    try {
        const objective = world.scoreboard.getObjective(SYSTEM_SETTINGS.SCOREBOARD.LEVEL.NAME);
        if (!objective) {
            world.scoreboard.addObjective(
                SYSTEM_SETTINGS.SCOREBOARD.LEVEL.NAME, 
                SYSTEM_SETTINGS.SCOREBOARD.LEVEL.DISPLAY_NAME
            );
        }
    } catch (error) {
        console.warn("레벨 시스템 초기화 중 오류:", error);
    }
}

// 플레이어의 레벨 가져오기
function getPlayerLevel(player) {
    try {
        const objective = world.scoreboard.getObjective(SYSTEM_SETTINGS.SCOREBOARD.LEVEL.NAME);
        if (!objective) {
            console.warn("레벨 스코어보드가 존재하지 않습니다.");
            return 1;
        }
        return objective.getScore(player.scoreboardIdentity) ?? 1;
    } catch (error) {
        console.warn(`${player.name}의 레벨을 가져오는 중 오류:`, error);
        return 1;
    }
}

// 월드 초기화 시 레벨 시스템 초기화
if (world.afterEvents && world.afterEvents.worldInitialize && typeof world.afterEvents.worldInitialize.subscribe === 'function') {
    world.afterEvents.worldInitialize.subscribe(() => {
        // 레벨 시스템 초기화
        initLevelSystem();
        console.warn("레벨 시스템이 초기화되었습니다.");
    });
}
