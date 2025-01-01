import { world, system } from "@minecraft/server"
//플럼님이 제공한 코드입니다. 

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        // 한국 시간 계산
        const kr_date = new Date(new Date().getTime() + 
            (new Date().getTimezoneOffset() * 60 * 1000) + 
            (9 * 60 * 60 * 1000));
        
        // 요일 배열 (한글)
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
        
        // 날짜 형식 구성
        const year = kr_date.getFullYear();
        const month = kr_date.getMonth() + 1;  // getMonth()는 0부터 시작
        const date = kr_date.getDate();
        const day = weekDays[kr_date.getDay()];
        const time = kr_date.toString().split(` `)[4];

        // 액션바에 표시 (YYYY년 MM월 DD일 (요일) HH:MM:SS)
        player.onScreenDisplay.setActionBar(
            `§e${year}년 ${month}월 ${date}일 §a(${day}) §b${time}`
        );
    }
}, 2);
