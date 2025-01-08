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
 * 
 * 5. 기타 기능:
 *    - 길드 채팅: 길드원들끼리 비공개 채팅을 할 수 있습니다.
 *    - 이름 태그: 길드에 가입한 플레이어의 이름 위에 길드 이름이 표시됩니다.
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
    guilds[guildName] = {
        leader: player.name,
        description: guildDescription,
        members: [player.name],
        joinRequests: []
    };
    saveGuilds(guilds);

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

// 길드 탈퇴
function leaveGuild(player) {
    let guilds = getGuilds();
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName) {
        return false; // 입한 길드 없음
    }
    const guild = guilds[playerGuildName];

    if (guild.leader === player.name) {
        // 길드장이 탈퇴하는 경우 길드 해체
        delete guilds[playerGuildName];
        saveGuilds(guilds);

        // 모든 길드원의 이름 태그 초기화
        for (const memberName of guild.members) {
            const member = world.getAllPlayers().find(p => p.name === memberName);
            if (member) {
                updatePlayerNameTag(member);
                member.sendMessage(`§c${playerGuildName} 길드가 해체되었습니다. 길드장이 탈퇴했습니다.`);
            }
        }
    } else {
        // 일반 길드원 탈퇴
        guild.members = guild.members.filter(member => member !== player.name);
        saveGuilds(guilds);
        updatePlayerNameTag(player);
    }
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
        player.sendMessage(`이미 ${currentGuild} 길드에 가입되어 있습니다. 새로운 길드를 만들려면 먼저 현재 길드를 탈퇴해야 합니다.`);
        return;
    }

    const form = new ModalFormData()
        .title("길드 생성")
        .textField("길드 이름을 입력하세요:", "길드 이름")
        .textField("길드 설명을 입력하세요:", "길드 설명")
        .toggle("뒤로 가기", false);

    form.show(player).then((response) => {
        if (response.canceled) return;
        const [guildName, guildDescription, goBack] = response.formValues;
        if (goBack) {
            openGuildUI(player);
            return;
        }
        if (createGuild(player, guildName, guildDescription)) {
            player.sendMessage(`${guildName} 길드를 생성했습니다. 당신이 길드장입니다.`);
            // 길드 생성 성공 후 이름 태그 업데이트 확인
            system.runTimeout(() => {
                updatePlayerNameTag(player);
            }, 20);
        } else {
            player.sendMessage(`${guildName} 길드를 생성할 수 없습니다. 이미 존재하는 이름입니다.`);
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
        .toggle("뒤로 가기", false);

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

    // 길드 삭제
    delete guilds[playerGuildName];
    saveGuilds(guilds);

    // 모든 길드원에게 알림
    for (const memberName of members) {
        const member = world.getAllPlayers().find(p => p.name === memberName);
        if (member) {
            if (member.name === player.name) {
                member.sendMessage(`§c당신이 ${playerGuildName} 길드를 해체했습니다.`);
            } else {
                member.sendMessage(`§c${playerGuildName} 길드가 길드장에 의해 해체되었습니다.`);
            }
            updatePlayerNameTag(member);
        }
    }

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
        newMember.sendMessage(`§a당신의 ${playerGuildName} 길드 가입 요청이 수락되었습니다.`);
        updatePlayerNameTag(newMember);  // 새로운 멤버의 이름 태그 즉시 업데이트
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

    if (message === "!길드" || message === "!길드장" || message === "!관리자") {
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
        }
    } else if (message.startsWith('ㅁ')) {
        ev.cancel = true;
        sendGuildMessage(player, message.slice(1).trim());
    } else {
        const guildName = getPlayerGuild(player.name);
        if (guildName) {
            ev.cancel = true;
            const globalMessage = `§8[§6${guildName}§8] §f${player.name}: ${message}`;
            world.sendMessage(globalMessage);
            
            // 관리자들에게 길드 태그 표시
            for (const admin of world.getAllPlayers()) {
                if (admin.hasTag("admin") && !getGuilds()[guildName].members.includes(admin.name)) {
                    admin.sendMessage(`§8[§c관리자 모드§8] ${globalMessage}`);
                }
            }
        } else {
            // 일반 채팅은 그대로 처리
            world.sendMessage(`${player.name}: ${message}`);
        }
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

// 플레이어 스폰 이벤트 (이름 태그 업데이트용)
world.afterEvents.playerSpawn.subscribe((ev) => {
    const player = ev.player;
    system.runTimeout(() => {
        updatePlayerNameTag(player);
    }, 20);
});

// 서버 시작 시 초기화
system.run(() => {
    initGuildSystem();
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
            .toggle("뒤로 가기", false);

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

    // 모든 길드원에게 알림
    for (const memberName of guild.members) {
        const member = world.getAllPlayers().find(p => p.name === memberName);
        if (member) {
            member.sendMessage(`§c관리자에 의해 '${guildName}' 길드가 삭제되었습니다.`);
            updatePlayerNameTag(member);
        }
    }

    // 길드 삭제
    delete guilds[guildName];
    saveGuilds(guilds);

    player.sendMessage(`§a'${guildName}' 길드를 성공적으로 삭제했습니다.`);
}
