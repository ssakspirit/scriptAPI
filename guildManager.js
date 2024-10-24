import { world, system } from '@minecraft/server';
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";

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
        members: [player.name]
    };
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
    return true;
}

// 길드 탈퇴
function leaveGuild(player) {
    let guilds = getGuilds();
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName) {
        return false; // 가입한 길드 없음
    }
    const guild = guilds[playerGuildName];
    
    if (guild.leader === player.name) {
        // 길드장이 탈퇴하는 경우 길드 해체
        delete guilds[playerGuildName];
        saveGuilds(guilds);
        
        // 모든 길드원에게 길드 해체 알림
        for (const memberName of guild.members) {
            const member = world.getAllPlayers().find(p => p.name === memberName);
            if (member) {
                member.sendMessage(`§c${playerGuildName} 길드가 해체되었습니다. 길드장이 탈퇴했습니다.`);
            }
        }
    } else {
        // 일반 길드원 탈퇴
        guild.members = guild.members.filter(member => member !== player.name);
        saveGuilds(guilds);
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
            player.sendMessage("UI를 표시하는 중 오류가 발��했습니다.");
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
        player.sendMessage(`이미 ${currentGuild} 길드에 가입되어 있습니다. 새로운 길드에 가입하려면 먼저 현재 길드를 탈퇴해야 합니다.`);
        return;
    }

    const guilds = getGuilds();
    const guildList = Object.keys(guilds);
    if (guildList.length === 0) {
        player.sendMessage("현재 가입 가능한 길드가 없습니다.");
        return;
    }

    const form = new ModalFormData()
        .title("길드 가입")
        .dropdown("가입할 길드를 선택하세요:", guildList)
        .toggle("뒤로 가기", false);

    form.show(player).then((response) => {
        if (response.canceled) return;
        const [selectedIndex, goBack] = response.formValues;
        if (goBack) {
            openGuildUI(player);
            return;
        }
        const selectedGuild = guildList[selectedIndex];
        if (joinGuild(player, selectedGuild)) {
            player.sendMessage(`${selectedGuild} 길드에 가입했습니다.`);
        } else {
            player.sendMessage("길드 가입에 실패했습니다. 이미 다른 길드에 가입되어 있을 수 있습니다.");
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
            player.sendMessage("길드 탈퇴 ���했습니다.");
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
                    case 2: disbandGuildUI(player); break;
                    case 3: player.sendMessage("UI를 닫았습니다."); break;
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
        .body(`${playerGuildName} 길드의 길드원 ��록입니다. 탈퇴시킬 길드원을 선택하세요.`);

    guild.members.forEach(member => {
        if (member !== player.name) {
            form.button(member);
        }
    });

    form.button("뒤로 가기");

    form.show(player).then((response) => {
        if (response.canceled || response.selection === guild.members.length - 1) {
            openGuildLeaderUI(player);
            return;
        }

        const selectedMember = guild.members[response.selection];
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
    guild.members = guild.members.filter(member => member !== memberToKick);
    saveGuilds(guilds);

    player.sendMessage(`§a${memberToKick}을(를) 길드에서 추방했습니다.`);
    const kickedPlayer = world.getAllPlayers().find(p => p.name === memberToKick);
    if (kickedPlayer) {
        kickedPlayer.sendMessage(`§c당신은 ${playerGuildName} 길드에서 추방되었습니다.`);
    }
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

// 길드 정보 업데이트 함수
function updateGuildInfo(player, newGuildName, newDescription) {
    const guilds = getGuilds();
    const playerGuildName = getPlayerGuild(player.name);
    if (!playerGuildName || guilds[playerGuildName].leader !== player.name) {
        player.sendMessage("§c권한이 없습니다.");
        return;
    }

    const guild = guilds[playerGuildName];

    if (newGuildName && newGuildName !== playerGuildName) {
        if (guilds[newGuildName]) {
            player.sendMessage("§c이미 존재하는 길드 이름입니다.");
            return;
        }
        guilds[newGuildName] = guild;
        delete guilds[playerGuildName];
        player.sendMessage(`§a길드 이름을 ${newGuildName}으로 변경했습니다.`);
    }

    if (newDescription) {
        guild.description = newDescription;
        player.sendMessage("§a길드 설명을 업데이트했습니다.");
    }

    saveGuilds(guilds);
    openGuildLeaderUI(player);
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
            player.sendMessage("길드 해체를 취소했습니다.");
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
        }
    }

    player.sendMessage(`§a${playerGuildName} 길드를 성공적으로 해체했습니다.`);
}

// 이벤트 리스너
world.beforeEvents.chatSend.subscribe((ev) => {
    const msg = ev.message;
    const player = ev.sender;

    if (msg == "!길드") {
        ev.cancel = true;
        player.sendMessage(`채팅창을 닫으면 길드 관리 창이 열립니다.`);
        openGuildUI(player);
    }
    else if (msg == "!길드장") {
        ev.cancel = true;
        player.sendMessage(`채팅창을 닫으면 길드장 관리 창이 열립니다.`);
        openGuildLeaderUI(player);
    }
});

// 서버 시작 시 길드 시스템 초기화
system.run(() => {
    initGuildSystem();
});
