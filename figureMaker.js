import { system } from '@minecraft/server';

/*

선택 매개변수 타입들(optionalParameters Types)
    - 0 = Boolean(True/False)
    - 1 = Integer(0123, 숫자)
    - 2 = Float(0.1, 소수점을 포함한 숫자)
    - 3 = String(abc, 텍스트)
    - 4 = EntitySelector(엔티티 선택)
    - 5 = PlayerSelector(플레이어 선택)
    - 6 = Location(좌표 입력)
    - 7 = BlockType(블록 선택)
    - 8 = ItemType(아이템 선택)
    - 9 = Enum(직접 만든 선택 매개변수)

커맨드 사용가능한 권한 레벨(CommandPermissionLevel)
    - 0 = Any(아무나 사용 가능)
    - 1 = GameDirectors(운영자 또는 커맨드 블록 사용 가능)
    - 2 = Admin(운영자는 사용가능하나 커맨드 블록에서는 사용 불가능)
    - 3 = Host(서버 호스트만 사용가능)
    - 4 = Owner(콘솔)
*/

/*
명령어 사용법:

1. figure:circle - 원 모양 생성
   사용법: /figure:circle [center] [radius] [blockType] [direction] [fill]
   매개변수:
   - center: 원의 중심점 좌표 (선택, 기본값: 현재 위치)
   - radius: 원의 반지름 (선택, 기본값: 5)
   - blockType: 사용할 블록 종류 (선택, 기본값: stone)
   - direction: 원이 그려질 평면 (선택, 기본값: xz)
     - xy: 수직 평면 (X-Y 평면)
     - xz: 수평 평면 (X-Z 평면)
     - yz: 수직 평면 (Y-Z 평면)
   - fill: 내부 채우기 여부 (선택, 기본값: false)

2. figure:sphere - 구 모양 생성
   사용법: /figure:sphere [center] [radius] [blockType] [fill]
   매개변수:
   - center: 구의 중심점 좌표 (선택, 기본값: 현재 위치)
   - radius: 구의 반지름 (선택, 기본값: 5)
   - blockType: 사용할 블록 종류 (선택, 기본값: stone)
   - fill: 내부 채우기 여부 (선택, 기본값: false)

3. figure:hemisphere - 반구 모양 생성
   사용법: /figure:hemisphere [center] [radius] [blockType] [axis] [fill]
   매개변수:
   - center: 반구의 중심점 좌표 (선택, 기본값: 현재 위치)
   - radius: 반구의 반지름 (선택, 기본값: 5)
   - blockType: 사용할 블록 종류 (선택, 기본값: stone)
   - axis: 반구의 방향 (선택, 기본값: y)
     - x, -x: X축 방향
     - y, -y: Y축 방향
     - z, -z: Z축 방향
   - fill: 내부 채우기 여부 (선택, 기본값: false)

4. figure:cylinder - 원기둥 모양 생성
   사용법: /figure:cylinder [center] [radius] [height] [blockType] [axis] [fill]
   매개변수:
   - center: 원기둥의 중심점 좌표 (선택, 기본값: 현재 위치)
   - radius: 원기둥의 반지름 (선택, 기본값: 5)
   - height: 원기둥의 높이 (선택, 기본값: 10)
   - blockType: 사용할 블록 종류 (선택, 기본값: stone)
   - axis: 원기둥의 방향 (선택, 기본값: y)
     - x, -x: X축 방향
     - y, -y: Y축 방향
     - z, -z: Z축 방향
   - fill: 내부 채우기 여부 (선택, 기본값: false)

예시:
- /figure:circle ~ ~ ~ 10 minecraft:diamond_block xz true
- /figure:sphere ~ ~ ~ 10 minecraft:diamond_block true
- /figure:hemisphere ~ ~ ~ 10 minecraft:diamond_block y true
- /figure:cylinder ~ ~ ~ 10 20 minecraft:diamond_block y true
*/

// 서버 시작 시 실행 이벤트
system.beforeEvents.startup.subscribe(e => {
    const command = e.customCommandRegistry;
    
    // 애드온 로드 확인 로그
    console.log("[Figure Generator] 애드온이 성공적으로 로드되었습니다!");
    console.log("[Figure Generator] 사용 가능한 명령어:");
    console.log("  - /figure:circle");
    console.log("  - /figure:sphere");
    console.log("  - /figure:hemisphere");
    console.log("  - /figure:cylinder");

    // 원 명령어 등록 (enum 없이 String 사용)
    try {
        command.registerCommand({
        name: `figure:circle`,
        description: "원 모양을 생성합니다",
        permissionLevel: 1,
        optionalParameters: [
            { type: "Location", name: "center" }, // 중심점 좌표
            { type: "Integer", name: "radius" }, // 반지름 (정수)
            { type: "BlockType", name: "blockType" }, // 블록 타입
            { type: "String", name: "direction" }, // 방향 (xy, xz, yz 평면)
            { type: "Boolean", name: "fill" } // 내부 채우기 여부
        ]
    }, (playerData, center, radius, blockType, direction, fill) => {
        const player = playerData.sourceEntity;
        const dimension = player.dimension;

        // 기본값 설정
        center = center || player.location;
        radius = radius || 5;
        blockType = blockType || "minecraft:stone";
        direction = direction || "xz";
        fill = fill || false;
        
        // 방향 유효성 검사
        if (!["xy", "xz", "yz"].includes(direction)) {
            player.sendMessage("§c잘못된 방향입니다. xy, xz, yz 중 하나를 선택하세요.");
            return;
        }

        system.run(() => {
            // 1/4 원의 점들을 저장할 Set
            const quarterPoints = new Set();
            
            // 1/4 원 생성 (0도에서 90도까지)
            for (let x = 0; x <= radius; x++) {
                for (let y = 0; y <= radius; y++) {
                    // 원의 방정식: x² + y² = r²
                    const distance = Math.sqrt(x*x + y*y);
                    
                    if (fill) {
                        // 내부 채우기
                        if (distance <= radius) {
                            quarterPoints.add(`${x},${y}`);
                        }
                    } else {
                        // 외곽선만
                        if (Math.abs(distance - radius) < 0.5) {
                            quarterPoints.add(`${x},${y}`);
                        }
                    }
                }
            }

            // 1/4 원을 이용해 전체 원 생성
            const points = new Set();
            for (const pointStr of quarterPoints) {
                const [x, y] = pointStr.split(',').map(Number);
                
                // 4개의 사분면에 대칭으로 점 추가
                const symmetries = [
                    [x, y],      // 1사분면
                    [-x, y],     // 2사분면
                    [-x, -y],    // 3사분면
                    [x, -y]      // 4사분면
                ];

                for (const [symX, symY] of symmetries) {
                    let finalX = 0, finalY = 0, finalZ = 0;

                    // 방향에 따른 좌표 변환
                    switch(direction) {
                        case "xy":
                            finalX = Math.round(center.x + symX);
                            finalY = Math.round(center.y + symY);
                            finalZ = center.z;
                            break;
                        case "xz":
                            finalX = Math.round(center.x + symX);
                            finalZ = Math.round(center.z + symY);
                            finalY = center.y;
                            break;
                        case "yz":
                            finalY = Math.round(center.y + symX);
                            finalZ = Math.round(center.z + symY);
                            finalX = center.x;
                            break;
                    }

                    points.add(`${finalX},${finalY},${finalZ}`);
                }
            }

            // 모든 점에 블록 배치
            for (const pointStr of points) {
                const [x, y, z] = pointStr.split(',').map(Number);
                dimension.getBlock({x, y, z})?.setType(blockType);
            }

            player.sendMessage("원이 생성되었습니다!");
        });
        });
        console.log("[Figure Generator] circle 명령어 등록 성공");
    } catch (error) {
        console.error("[Figure Generator] circle 명령어 등록 실패:", error);
    }

    // 구 명령어 등록
    command.registerCommand({
        name: `figure:sphere`,
        description: "구 모양을 생성합니다",
        permissionLevel: 1,
        optionalParameters: [
            { type: "Location", name: "center" }, // 중심점 좌표
            { type: "Integer", name: "radius" }, // 반지름 (정수)
            { type: "BlockType", name: "blockType" }, // 블록 타입
            { type: "Boolean", name: "fill" } // 내부 채우기 여부
        ]
    }, (playerData, center, radius, blockType, fill) => {
        const player = playerData.sourceEntity;
        const dimension = player.dimension;

        // 기본값 설정
        center = center || player.location;
        radius = radius || 5;
        blockType = blockType || "minecraft:stone";
        fill = fill || false;

        system.run(() => {
            // 1/8 구의 점들을 저장할 Set
            const eighthPoints = new Set();
            
            // 1/8 구 생성 (x, y, z 모두 양수인 부분)
            for (let x = 0; x <= radius; x++) {
                for (let y = 0; y <= radius; y++) {
                    for (let z = 0; z <= radius; z++) {
                        // 구의 방정식: x² + y² + z² = r²
                        const distance = Math.sqrt(x*x + y*y + z*z);
                        
                        if (fill) {
                            // 내부 채우기
                            if (distance <= radius) {
                                eighthPoints.add(`${x},${y},${z}`);
                            }
                        } else {
                            // 표면만
                            if (Math.abs(distance - radius) < 0.5) {
                                eighthPoints.add(`${x},${y},${z}`);
                            }
                        }
                    }
                }
            }

            // 1/8 구를 이용해 전체 구 생성
            const points = new Set();
            for (const pointStr of eighthPoints) {
                const [x, y, z] = pointStr.split(',').map(Number);
                
                // 8개의 팔분면에 대칭으로 점 추가
                const symmetries = [
                    [x, y, z],      // 1사분면
                    [-x, y, z],     // 2사분면
                    [-x, -y, z],    // 3사분면
                    [x, -y, z],     // 4사분면
                    [x, y, -z],     // 5사분면
                    [-x, y, -z],    // 6사분면
                    [-x, -y, -z],   // 7사분면
                    [x, -y, -z]     // 8사분면
                ];

                for (const [symX, symY, symZ] of symmetries) {
                    points.add(`${Math.round(center.x + symX)},${Math.round(center.y + symY)},${Math.round(center.z + symZ)}`);
                }
            }

            // 모든 점에 블록 배치
            for (const pointStr of points) {
                const [x, y, z] = pointStr.split(',').map(Number);
                dimension.getBlock({x, y, z})?.setType(blockType);
            }

            player.sendMessage("구가 생성되었습니다!");
        });
    });

    // 반구 명령어 등록
    command.registerCommand({
        name: `figure:hemisphere`,
        description: "반구 모양을 생성합니다",
        permissionLevel: 1,
        optionalParameters: [
            { type: "Location", name: "center" }, // 중심점 좌표
            { type: "Integer", name: "radius" }, // 반지름 (정수)
            { type: "BlockType", name: "blockType" }, // 블록 타입
            { type: "String", name: "axis" }, // 방향 (x, -x, y, -y, z, -z)
            { type: "Boolean", name: "fill" } // 내부 채우기 여부
        ]
    }, (playerData, center, radius, blockType, axis, fill) => {
        const player = playerData.sourceEntity;
        const dimension = player.dimension;

        // 기본값 설정
        center = center || player.location;
        radius = radius || 5;
        blockType = blockType || "minecraft:stone";
        axis = axis || "y";
        fill = fill || false;
        
        // 축 유효성 검사
        if (!["x", "-x", "y", "-y", "z", "-z"].includes(axis)) {
            player.sendMessage("§c잘못된 축입니다. x, -x, y, -y, z, -z 중 하나를 선택하세요.");
            return;
        }
        

        system.run(() => {
            // 1/4 반구의 점들을 저장할 Set
            const quarterPoints = new Set();
            
            // 1/4 반구 생성 (x, y 양수, z 양수인 부분)
            for (let x = 0; x <= radius; x++) {
                for (let y = 0; y <= radius; y++) {
                    for (let z = 0; z <= radius; z++) {
                        // 구의 방정식: x² + y² + z² = r²
                        const distance = Math.sqrt(x*x + y*y + z*z);
                        
                        if (fill) {
                            // 내부 채우기
                            if (distance <= radius) {
                                quarterPoints.add(`${x},${y},${z}`);
                            }
                        } else {
                            // 표면만
                            if (Math.abs(distance - radius) < 0.5) {
                                quarterPoints.add(`${x},${y},${z}`);
                            }
                        }
                    }
                }
            }

            // 1/4 반구를 이용해 전체 반구 생성
            const points = new Set();
            for (const pointStr of quarterPoints) {
                const [x, y, z] = pointStr.split(',').map(Number);
                
                // 4개의 사분면에 대칭으로 점 추가
                const symmetries = [
                    [x, y, z],      // 1사분면
                    [-x, y, z],     // 2사분면
                    [-x, -y, z],    // 3사분면
                    [x, -y, z]      // 4사분면
                ];

                for (const [symX, symY, symZ] of symmetries) {
                    let finalX = 0, finalY = 0, finalZ = 0;

                    // 선택된 축에 따라 좌표 변환
                    switch(axis) {
                        case "x":
                            finalX = Math.round(center.x + symZ); // z를 x로
                            finalY = Math.round(center.y + symY);
                            finalZ = Math.round(center.z + symX); // x를 z로
                            break;
                        case "-x":
                            finalX = Math.round(center.x - symZ); // z를 -x로
                            finalY = Math.round(center.y + symY);
                            finalZ = Math.round(center.z + symX); // x를 z로
                            break;
                        case "y":
                            finalX = Math.round(center.x + symX);
                            finalY = Math.round(center.y + symZ); // z를 y로
                            finalZ = Math.round(center.z + symY); // y를 z로
                            break;
                        case "-y":
                            finalX = Math.round(center.x + symX);
                            finalY = Math.round(center.y - symZ); // z를 -y로
                            finalZ = Math.round(center.z + symY); // y를 z로
                            break;
                        case "z":
                            finalX = Math.round(center.x + symX);
                            finalY = Math.round(center.y + symY);
                            finalZ = Math.round(center.z + symZ);
                            break;
                        case "-z":
                            finalX = Math.round(center.x + symX);
                            finalY = Math.round(center.y + symY);
                            finalZ = Math.round(center.z - symZ);
                            break;
                    }

                    points.add(`${finalX},${finalY},${finalZ}`);
                }
            }

            // 모든 점에 블록 배치
            for (const pointStr of points) {
                const [x, y, z] = pointStr.split(',').map(Number);
                dimension.getBlock({x, y, z})?.setType(blockType);
            }

            player.sendMessage("반구가 생성되었습니다!");
        });
    });

    // 원기둥 명령어 등록
    command.registerCommand({
        name: `figure:cylinder`,
        description: "원기둥 모양을 생성합니다",
        permissionLevel: 1,
        optionalParameters: [
            { type: "Location", name: "center" }, // 중심점 좌표
            { type: "Integer", name: "radius" }, // 반지름 (정수)
            { type: "Integer", name: "height" }, // 높이 (정수)
            { type: "BlockType", name: "blockType" }, // 블록 타입
            { type: "String", name: "axis" }, // 방향 (x, -x, y, -y, z, -z)
            { type: "Boolean", name: "fill" } // 내부 채우기 여부
        ]
    }, (playerData, center, radius, height, blockType, axis, fill) => {
        const player = playerData.sourceEntity;
        const dimension = player.dimension;

        // 기본값 설정
        center = center || player.location;
        radius = radius || 5;
        height = height || 10;
        blockType = blockType || "minecraft:stone";
        axis = axis || "y";
        fill = fill || false;
        
        // 축 유효성 검사
        if (!["x", "-x", "y", "-y", "z", "-z"].includes(axis)) {
            player.sendMessage("§c잘못된 축입니다. x, -x, y, -y, z, -z 중 하나를 선택하세요.");
            return;
        }
        

        system.run(() => {
            // 1/4 원의 점들을 저장할 Set
            const quarterPoints = new Set();
            
            // 1/4 원 생성 (0도에서 90도까지)
            for (let x = 0; x <= radius; x++) {
                for (let y = 0; y <= radius; y++) {
                    // 원의 방정식: x² + y² = r²
                    const distance = Math.sqrt(x*x + y*y);
                    
                    if (fill) {
                        // 내부 채우기
                        if (distance <= radius) {
                            quarterPoints.add(`${x},${y}`);
                        }
                    } else {
                        // 외곽선만
                        if (Math.abs(distance - radius) < 0.5) {
                            quarterPoints.add(`${x},${y}`);
                        }
                    }
                }
            }

            // 1/4 원을 이용해 전체 원 생성
            const points = new Set();
            for (const pointStr of quarterPoints) {
                const [x, y] = pointStr.split(',').map(Number);
                
                // 4개의 사분면에 대칭으로 점 추가
                const symmetries = [
                    [x, y],      // 1사분면
                    [-x, y],     // 2사분면
                    [-x, -y],    // 3사분면
                    [x, -y]      // 4사분면
                ];

                for (const [symX, symY] of symmetries) {
                    // 높이만큼 반복
                    for (let h = 0; h < height; h++) {
                        let finalX = 0, finalY = 0, finalZ = 0;

                        // 선택된 축에 따라 좌표 변환
                        switch(axis) {
                            case "x":
                                finalX = Math.round(center.x + h);
                                finalY = Math.round(center.y + symY);
                                finalZ = Math.round(center.z + symX);
                                break;
                            case "-x":
                                finalX = Math.round(center.x - h);
                                finalY = Math.round(center.y + symY);
                                finalZ = Math.round(center.z + symX);
                                break;
                            case "y":
                                finalX = Math.round(center.x + symX);
                                finalY = Math.round(center.y + h);
                                finalZ = Math.round(center.z + symY);
                                break;
                            case "-y":
                                finalX = Math.round(center.x + symX);
                                finalY = Math.round(center.y - h);
                                finalZ = Math.round(center.z + symY);
                                break;
                            case "z":
                                finalX = Math.round(center.x + symX);
                                finalY = Math.round(center.y + symY);
                                finalZ = Math.round(center.z + h);
                                break;
                            case "-z":
                                finalX = Math.round(center.x + symX);
                                finalY = Math.round(center.y + symY);
                                finalZ = Math.round(center.z - h);
                                break;
                        }

                        points.add(`${finalX},${finalY},${finalZ}`);
                    }
                }
            }

            // 모든 점에 블록 배치
            for (const pointStr of points) {
                const [x, y, z] = pointStr.split(',').map(Number);
                dimension.getBlock({x, y, z})?.setType(blockType);
            }

            player.sendMessage("원기둥이 생성되었습니다!");
        });
    });
    
    // 모든 명령어 등록 완료 로그
    console.log("[Figure Generator] 모든 명령어 등록이 완료되었습니다!");
});
