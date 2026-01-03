import { system, CustomCommandStatus } from '@minecraft/server';

/*
Figure Generator - 슬래시 명령어

명령어 사용법:

1. /figure:circle - 원 모양 생성
   /figure:circle [center] [radius] [blockType] [direction] [fill]
   - direction: xy, xz, yz

2. /figure:sphere - 구 모양 생성
   /figure:sphere [center] [radius] [blockType] [fill]

3. /figure:hemisphere - 반구 모양 생성
   /figure:hemisphere [center] [radius] [blockType] [axis] [fill]
   - axis: x, -x, y, -y, z, -z

4. /figure:cylinder - 원기둥 모양 생성
   /figure:cylinder [center] [radius] [height] [blockType] [axis] [fill]

예시:
- /figure:circle ~ ~ ~ 10 minecraft:diamond_block xz true
- /figure:sphere ~ ~ ~ 10 minecraft:diamond_block true
*/

// 서버 시작 시 커스텀 명령어 등록
system.beforeEvents.startup.subscribe((e) => {
    const registry = e.customCommandRegistry;

    console.log("[Figure Generator] 애드온 로드 중...");

    // ===== 원 명령어 =====
    registry.registerCommand({
        name: "figure:circle",
        description: "원 모양을 생성합니다",
        permissionLevel: 1,
        optionalParameters: [
            { type: "Location", name: "center" },
            { type: "Integer", name: "radius" },
            { type: "BlockType", name: "blockType" },
            { type: "String", name: "direction" },
            { type: "Boolean", name: "fill" }
        ]
    }, (origin, center, radius, blockType, direction, fill) => {
        const player = origin.sourceEntity;
        if (!player) {
            return { status: CustomCommandStatus.Failure, message: "플레이어만 사용할 수 있습니다." };
        }

        const dimension = player.dimension;
        center = center || player.location;
        radius = radius || 5;
        blockType = blockType || "minecraft:stone";
        direction = direction || "xz";
        fill = fill || false;

        // 방향 유효성 검사
        if (!["xy", "xz", "yz"].includes(direction)) {
            return { status: CustomCommandStatus.Failure, message: "잘못된 방향입니다. xy, xz, yz 중 하나를 선택하세요." };
        }

        system.run(() => {
            const quarterPoints = new Set();

            for (let x = 0; x <= radius; x++) {
                for (let y = 0; y <= radius; y++) {
                    const distance = Math.sqrt(x * x + y * y);
                    if (fill ? distance <= radius : Math.abs(distance - radius) < 0.5) {
                        quarterPoints.add(`${x},${y}`);
                    }
                }
            }

            const points = new Set();
            for (const pointStr of quarterPoints) {
                const [x, y] = pointStr.split(',').map(Number);
                const symmetries = [[x, y], [-x, y], [-x, -y], [x, -y]];

                for (const [symX, symY] of symmetries) {
                    let finalX, finalY, finalZ;
                    switch (direction) {
                        case "xy":
                            finalX = Math.round(center.x + symX);
                            finalY = Math.round(center.y + symY);
                            finalZ = Math.round(center.z);
                            break;
                        case "xz":
                            finalX = Math.round(center.x + symX);
                            finalZ = Math.round(center.z + symY);
                            finalY = Math.round(center.y);
                            break;
                        case "yz":
                            finalY = Math.round(center.y + symX);
                            finalZ = Math.round(center.z + symY);
                            finalX = Math.round(center.x);
                            break;
                    }
                    points.add(`${finalX},${finalY},${finalZ}`);
                }
            }

            let count = 0;
            for (const pointStr of points) {
                const [x, y, z] = pointStr.split(',').map(Number);
                try {
                    dimension.getBlock({ x, y, z })?.setType(blockType);
                    count++;
                } catch (e) { }
            }

            player.sendMessage(`§a원이 생성되었습니다! (${count}개 블록)`);
        });

        return { status: CustomCommandStatus.Success };
    });

    // ===== 구 명령어 =====
    registry.registerCommand({
        name: "figure:sphere",
        description: "구 모양을 생성합니다",
        permissionLevel: 1,
        optionalParameters: [
            { type: "Location", name: "center" },
            { type: "Integer", name: "radius" },
            { type: "BlockType", name: "blockType" },
            { type: "Boolean", name: "fill" }
        ]
    }, (origin, center, radius, blockType, fill) => {
        const player = origin.sourceEntity;
        if (!player) {
            return { status: CustomCommandStatus.Failure, message: "플레이어만 사용할 수 있습니다." };
        }

        const dimension = player.dimension;
        center = center || player.location;
        radius = radius || 5;
        blockType = blockType || "minecraft:stone";
        fill = fill || false;

        system.run(() => {
            const eighthPoints = new Set();

            for (let x = 0; x <= radius; x++) {
                for (let y = 0; y <= radius; y++) {
                    for (let z = 0; z <= radius; z++) {
                        const distance = Math.sqrt(x * x + y * y + z * z);
                        if (fill ? distance <= radius : Math.abs(distance - radius) < 0.5) {
                            eighthPoints.add(`${x},${y},${z}`);
                        }
                    }
                }
            }

            const points = new Set();
            for (const pointStr of eighthPoints) {
                const [x, y, z] = pointStr.split(',').map(Number);
                const symmetries = [
                    [x, y, z], [-x, y, z], [-x, -y, z], [x, -y, z],
                    [x, y, -z], [-x, y, -z], [-x, -y, -z], [x, -y, -z]
                ];

                for (const [symX, symY, symZ] of symmetries) {
                    points.add(`${Math.round(center.x + symX)},${Math.round(center.y + symY)},${Math.round(center.z + symZ)}`);
                }
            }

            let count = 0;
            for (const pointStr of points) {
                const [x, y, z] = pointStr.split(',').map(Number);
                try {
                    dimension.getBlock({ x, y, z })?.setType(blockType);
                    count++;
                } catch (e) { }
            }

            player.sendMessage(`§a구가 생성되었습니다! (${count}개 블록)`);
        });

        return { status: CustomCommandStatus.Success };
    });

    // ===== 반구 명령어 =====
    registry.registerCommand({
        name: "figure:hemisphere",
        description: "반구 모양을 생성합니다",
        permissionLevel: 1,
        optionalParameters: [
            { type: "Location", name: "center" },
            { type: "Integer", name: "radius" },
            { type: "BlockType", name: "blockType" },
            { type: "String", name: "axis" },
            { type: "Boolean", name: "fill" }
        ]
    }, (origin, center, radius, blockType, axis, fill) => {
        const player = origin.sourceEntity;
        if (!player) {
            return { status: CustomCommandStatus.Failure, message: "플레이어만 사용할 수 있습니다." };
        }

        const dimension = player.dimension;
        center = center || player.location;
        radius = radius || 5;
        blockType = blockType || "minecraft:stone";
        axis = axis || "y";
        fill = fill || false;

        // 축 유효성 검사
        if (!["x", "-x", "y", "-y", "z", "-z"].includes(axis)) {
            return { status: CustomCommandStatus.Failure, message: "잘못된 축입니다. x, -x, y, -y, z, -z 중 하나를 선택하세요." };
        }

        system.run(() => {
            const quarterPoints = new Set();

            for (let x = 0; x <= radius; x++) {
                for (let y = 0; y <= radius; y++) {
                    for (let z = 0; z <= radius; z++) {
                        const distance = Math.sqrt(x * x + y * y + z * z);
                        if (fill ? distance <= radius : Math.abs(distance - radius) < 0.5) {
                            quarterPoints.add(`${x},${y},${z}`);
                        }
                    }
                }
            }

            const points = new Set();
            for (const pointStr of quarterPoints) {
                const [x, y, z] = pointStr.split(',').map(Number);
                const symmetries = [[x, y, z], [-x, y, z], [-x, -y, z], [x, -y, z]];

                for (const [symX, symY, symZ] of symmetries) {
                    let finalX, finalY, finalZ;
                    switch (axis) {
                        case "x":
                            finalX = Math.round(center.x + symZ);
                            finalY = Math.round(center.y + symY);
                            finalZ = Math.round(center.z + symX);
                            break;
                        case "-x":
                            finalX = Math.round(center.x - symZ);
                            finalY = Math.round(center.y + symY);
                            finalZ = Math.round(center.z + symX);
                            break;
                        case "y":
                            finalX = Math.round(center.x + symX);
                            finalY = Math.round(center.y + symZ);
                            finalZ = Math.round(center.z + symY);
                            break;
                        case "-y":
                            finalX = Math.round(center.x + symX);
                            finalY = Math.round(center.y - symZ);
                            finalZ = Math.round(center.z + symY);
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

            let count = 0;
            for (const pointStr of points) {
                const [x, y, z] = pointStr.split(',').map(Number);
                try {
                    dimension.getBlock({ x, y, z })?.setType(blockType);
                    count++;
                } catch (e) { }
            }

            player.sendMessage(`§a반구가 생성되었습니다! (${count}개 블록)`);
        });

        return { status: CustomCommandStatus.Success };
    });

    // ===== 원기둥 명령어 =====
    registry.registerCommand({
        name: "figure:cylinder",
        description: "원기둥 모양을 생성합니다",
        permissionLevel: 1,
        optionalParameters: [
            { type: "Location", name: "center" },
            { type: "Integer", name: "radius" },
            { type: "Integer", name: "height" },
            { type: "BlockType", name: "blockType" },
            { type: "String", name: "axis" },
            { type: "Boolean", name: "fill" }
        ]
    }, (origin, center, radius, height, blockType, axis, fill) => {
        const player = origin.sourceEntity;
        if (!player) {
            return { status: CustomCommandStatus.Failure, message: "플레이어만 사용할 수 있습니다." };
        }

        const dimension = player.dimension;
        center = center || player.location;
        radius = radius || 5;
        height = height || 10;
        blockType = blockType || "minecraft:stone";
        axis = axis || "y";
        fill = fill || false;

        // 축 유효성 검사
        if (!["x", "-x", "y", "-y", "z", "-z"].includes(axis)) {
            return { status: CustomCommandStatus.Failure, message: "잘못된 축입니다. x, -x, y, -y, z, -z 중 하나를 선택하세요." };
        }

        system.run(() => {
            const quarterPoints = new Set();

            for (let x = 0; x <= radius; x++) {
                for (let y = 0; y <= radius; y++) {
                    const distance = Math.sqrt(x * x + y * y);
                    if (fill ? distance <= radius : Math.abs(distance - radius) < 0.5) {
                        quarterPoints.add(`${x},${y}`);
                    }
                }
            }

            const points = new Set();
            for (const pointStr of quarterPoints) {
                const [x, y] = pointStr.split(',').map(Number);
                const symmetries = [[x, y], [-x, y], [-x, -y], [x, -y]];

                for (const [symX, symY] of symmetries) {
                    for (let h = 0; h < height; h++) {
                        let finalX, finalY, finalZ;
                        switch (axis) {
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

            let count = 0;
            for (const pointStr of points) {
                const [x, y, z] = pointStr.split(',').map(Number);
                try {
                    dimension.getBlock({ x, y, z })?.setType(blockType);
                    count++;
                } catch (e) { }
            }

            player.sendMessage(`§a원기둥이 생성되었습니다! (${count}개 블록)`);
        });

        return { status: CustomCommandStatus.Success };
    });

    console.log("[Figure Generator] 명령어 등록 완료!");
    console.log("  - /figure:circle");
    console.log("  - /figure:sphere");
    console.log("  - /figure:hemisphere");
    console.log("  - /figure:cylinder");
});
