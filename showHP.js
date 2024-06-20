import {
    world,
    system
} from '@minecraft/server';

console.warn(`불러옴`) // 제대로 코드가 불러왔는지 확인

system.runInterval(() => {//runInterval를 사용해 반복
    for (const player of world.getAllPlayers()) {//서버에 있는 사람에게 밑에 문장을 실행
        const playerHp = player.getComponent("minecraft:health").currentValue//플레이어 현재 Hp
        const playerMaxHp = player.getComponent("minecraft:health").effectiveMax//플레이어 최대 Hp
        player.nameTag = player.name + "\n" + playerHp + "/" + playerMaxHp//플레이어 네임태그 설정
    }
}, 2)//워치독 방지를 위해 2틱마다 실행
