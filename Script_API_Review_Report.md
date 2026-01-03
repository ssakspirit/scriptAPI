# Script API 2.5.0-beta 코드 리뷰 리포트

**검토 날짜**: 2026-01-02
**최종 업데이트**: 2026-01-03
**대상 폴더**: `C:\Users\ssaks\OneDrive - main\0nowcoding\scriptAPI`
**검토 기준**: Minecraft Bedrock Script API 2.5.0-beta 모범 사례

---

## 📋 수정 완료 현황

### ✅ 완료된 항목 (Issues #1-6)
- ✅ **Issue #1**: 명령어 실행 결과 검증 추가 (6개 파일)
- ✅ **Issue #2**: 존재하지 않는 API 속성 수정 (1개 파일)
- ✅ **Issue #3**: 타겟 셀렉터 오용 및 Script API 전환 (2개 파일)
- ✅ **Issue #4**: Dynamic Property 타입 검증 추가 (1개 파일)
- ✅ **Issue #5**: 비동기 블록/엔티티 유효성 재확인 (1개 파일)
- ✅ **Issue #6**: 메모리 누수 방지 (1개 파일)

**총 수정 파일**: 12개
**높은 우선순위 완료**: 100%
**중간 우선순위 완료**: 3/3

---

## 🔴 새로 발견된 높은 우선순위 이슈

### Issue #7: system.beforeEvents.startup 제거됨 (CRITICAL)

**우선순위**: 🔴 높음 (즉시 수정 필요)
**영향받는 파일**: 1개

**위치**:
- `figureMaker.js` (Line 81)

**문제점**:
```javascript
// ❌ 현재 - API에서 제거된 이벤트 사용
system.beforeEvents.startup.subscribe(e => {
    const command = e.customCommandRegistry;
    // 명령어 등록 로직
});
```

`system.beforeEvents.startup`은 **Script API 2.0.0+에서 완전히 제거**되었습니다. 이 이벤트를 사용하면 스크립트 로드 자체가 실패합니다.

**권장 수정**:
```javascript
// ✅ 수정 - 모듈 레벨에서 직접 실행
const registerCommands = () => {
    // 명령어 등록 로직
    console.log("[Figure Generator] Commands registered successfully!");
};

// 모듈 로드 시 즉시 실행
registerCommands();
```

**수정 효과**:
- 스크립트 정상 로드
- 명령어 등록 기능 복구

---

### Issue #8: player.isOp() 제거됨 (CRITICAL)

**우선순위**: 🔴 높음 (즉시 수정 필요)
**영향받는 파일**: 9개

**위치**:
- `advancedCouponManagementSystem.js`
- `PvPtomb_autoRespawn.js`
- `PvPtomb_2.js`
- `PvPtomb.js`
- `denyBlock.js` (Lines 45, 66)
- `allowBlock.js` (Lines 44, 65)
- `welcomemute.js` (Line 48)
- `welcomemessage.js` (Line 116)
- `setDenyBlock.js` (Lines 86, 99)

**문제점**:
```javascript
// ❌ 현재 - 제거된 메서드 사용
if (!player.isOp()) {
    ev.cancel = true;
    player.sendMessage(`§c이 영역에서는 블록을 파괴할 수 없습니다.`);
}
```

`player.isOp()` 메서드가 **Script API에서 제거**되었습니다. 런타임 오류가 발생합니다.

**권장 수정**:
```javascript
// ✅ 수정 - 태그 기반 권한 시스템 사용
if (!player.hasTag("admin")) {
    ev.cancel = true;
    player.sendMessage(`§c이 영역에서는 블록을 파괴할 수 없습니다.`);
}
```

**관리자 설정 방법**:
```
/tag @p add admin
```

**수정 효과**:
- 런타임 오류 제거
- 더 유연한 권한 시스템 (여러 권한 레벨 가능)

---

### Issue #9: isFirstEvent 속성 사용 문제

**우선순위**: 🔴 높음
**영향받는 파일**: 3개

**위치**:
- `blockInteraction.js` (Line 97)
- `interactiveBlockMenuSystem.js` (Line 123)
- `BlockProtector.js` (Line 106)

**문제점**:
```javascript
// ❌ 현재 - 이벤트 누락 가능성
world.beforeEvents.playerInteractWithBlock.subscribe(e => {
    if (e.isFirstEvent) {
        // 상호작용 처리
    }
});
```

`isFirstEvent` 속성에만 의존하면 일부 이벤트가 누락될 수 있습니다.

**권장 수정 (옵션 1 - 간단한 경우)**:
```javascript
// ✅ 수정 - isFirstEvent 체크 제거
world.beforeEvents.playerInteractWithBlock.subscribe(e => {
    const player = e.player;
    const block = e.block;
    // 상호작용 직접 처리
});
```

**권장 수정 (옵션 2 - 중복 방지가 중요한 경우)**:
```javascript
// ✅ 수정 - 디바운싱 추가
const interactionCooldowns = new Map();
const DEBOUNCE_MS = 100;

world.beforeEvents.playerInteractWithBlock.subscribe(e => {
    const key = `${e.player.id}_${e.block.location.x}_${e.block.location.y}_${e.block.location.z}`;
    const now = Date.now();
    const lastInteraction = interactionCooldowns.get(key) || 0;

    if (now - lastInteraction < DEBOUNCE_MS) return;
    interactionCooldowns.set(key, now);

    // 상호작용 처리
});
```

**수정 효과**:
- 모든 이벤트 정상 처리
- 중복 이벤트 제어 가능

---

### Issue #10: 명령어 실행 결과 검증 누락 (Widespread)

**우선순위**: 🔴 높음
**영향받는 파일**: 30+ 파일

**대표 예시**:
- `survivalInstinct.js` (Lines 49-51)
- `shulkerBoxShop.js` (Line 168)
- `knockbackItem.js` (Lines 47-55)
- 기타 다수

**문제점**:
```javascript
// ❌ 현재 - 성공 여부 미확인
hurtEntity.runCommand(`effect @s resistance 3 1 true`);
hurtEntity.runCommand(`effect @s speed 3 1 true`);
```

명령어 실행 실패 시 아무런 피드백 없이 조용히 실패합니다.

**권장 수정**:
```javascript
// ✅ 수정 - 결과 검증 추가
const resistanceResult = hurtEntity.runCommand(`effect @s resistance 3 1 true`);
const speedResult = hurtEntity.runCommand(`effect @s speed 3 1 true`);

if (resistanceResult.successCount === 0 || speedResult.successCount === 0) {
    console.warn("생존 본능 효과 적용 실패");
}

// 💡 더 나은 방법 - API 직접 사용
hurtEntity.addEffect("resistance", 60, { amplifier: 1, showParticles: true });
hurtEntity.addEffect("speed", 60, { amplifier: 1, showParticles: true });
```

**수정 효과**:
- 실패 감지 및 로깅
- 더 안정적인 동작

---

### Issue #11: Dynamic Property 크기 제한 미고려

**우선순위**: 🔴 높음 (데이터 손실 위험)
**영향받는 파일**: 다수

**대표 예시**:
- `BlockProtector.js` (Lines 34-51)

**문제점**:
```javascript
// ❌ 현재 - 크기 체크 없음
function saveProtectedAreas(areas) {
    try {
        world.setDynamicProperty(DB_KEY, JSON.stringify(areas));
    } catch (error) {
        console.warn("데이터 저장 실패:", error);
    }
}
```

Dynamic Property는 **속성당 약 16KB, 전체 1MB** 제한이 있습니다. 큰 데이터는 조용히 저장 실패합니다.

**권장 수정**:
```javascript
// ✅ 수정 - 크기 검증 추가
const MAX_DYNAMIC_PROPERTY_SIZE = 15000; // 여유 공간 확보

function saveProtectedAreas(areas) {
    try {
        const jsonData = JSON.stringify(areas);

        if (jsonData.length > MAX_DYNAMIC_PROPERTY_SIZE) {
            console.error("보호 영역 데이터가 크기 제한 초과!");

            // 옵션 1: 경고 및 일부 데이터 저장
            const truncatedAreas = areas.slice(0, Math.floor(areas.length * 0.8));
            world.setDynamicProperty(DB_KEY, JSON.stringify(truncatedAreas));

            // 사용자에게 알림
            const admins = world.getAllPlayers().filter(p => p.hasTag("admin"));
            admins.forEach(admin => {
                admin.sendMessage("§c경고: 보호 영역 데이터가 너무 큽니다!");
            });

            return false;
        }

        world.setDynamicProperty(DB_KEY, jsonData);
        return true;
    } catch (error) {
        console.warn("데이터 저장 실패:", error);
        return false;
    }
}
```

**수정 효과**:
- 데이터 손실 방지
- 크기 초과 조기 감지

---------------여기까지 수정완료----------------------------------

### Issue #12: 메모리 누수 위험 (Interval 정리 미흡)

**우선순위**: 🔴 높음
**영향받는 파일**: PvPtomb 시리즈

**위치**:
- `PvPtomb.js` (Lines 108-164)
- `PvPtomb_2.js`
- `PvPtomb_autoRespawn.js`

**문제점**:
```javascript
// ❌ 현재 - 인터벌 추적 미흡
const armorStandCheck = system.runInterval(() => {
    try {
        const onlinePlayer = world.getAllPlayers().find(p => p.name === entity.name);
        if (!onlinePlayer) {
            system.clearRun(armorStandCheck);
            tombMap.delete(entity.name);
            return;
        }
        // ...
    } catch (error) {
        system.clearRun(armorStandCheck);
        tombMap.delete(entity.name);
    }
}, 10);
```

스크립트 재로드 시 interval이 정리되지 않아 메모리 누수 및 성능 저하 가능성이 있습니다.

**권장 수정**:
```javascript
// ✅ 수정 - 전역 인터벌 추적 및 정리
const activeIntervals = new Set();

function createTombInterval(intervalFn, delay) {
    const intervalId = system.runInterval(intervalFn, delay);
    activeIntervals.add(intervalId);
    return intervalId;
}

function cleanupInterval(intervalId) {
    system.clearRun(intervalId);
    activeIntervals.delete(intervalId);
}

// 사용 예시
const armorStandCheck = createTombInterval(() => {
    try {
        const onlinePlayer = world.getAllPlayers().find(p => p.name === entity.name);
        if (!onlinePlayer) {
            cleanupInterval(armorStandCheck);
            tombMap.delete(entity.name);
            return;
        }
        // ...
    } catch (error) {
        cleanupInterval(armorStandCheck);
        tombMap.delete(entity.name);
    }
}, 10);

// 스크립트 종료 시 모든 인터벌 정리
// (worldUnload 이벤트가 있다면)
world.afterEvents.worldUnload?.subscribe(() => {
    activeIntervals.forEach(id => system.clearRun(id));
    activeIntervals.clear();
    console.log("[PvPtomb] 모든 인터벌 정리 완료");
});
```

**수정 효과**:
- 메모리 누수 방지
- 장시간 실행 안정성 향상

---

## 🟡 중간 우선순위 이슈

### Issue #13: world.getDimension() 네임스페이스 누락

**우선순위**: 🟡 중간
**영향받는 파일**: 19개

**대표 예시**:
- `knockbackItem.js` (Line 43)
- `shulkerBoxShop.js` (Line 153)
- `PvPtomb.js` (Lines 52, 119, 182)

**문제점**:
```javascript
// ⚠️ 현재 - 네임스페이스 누락
const dimension = world.getDimension("overworld");
```

**권장 수정**:
```javascript
// ✅ 수정 - 명시적 네임스페이스 사용
const dimension = world.getDimension("minecraft:overworld");
// Nether: "minecraft:the_nether"
// End: "minecraft:the_end"

// 💡 더 나은 방법 - 플레이어의 현재 차원 사용
const dimension = player.dimension;
```

**수정 효과**:
- 미래 호환성 향상
- 코드 명확성 증가

---

### Issue #14: runCommand() 과다 사용 (API 직접 호출 가능)

**우선순위**: 🟡 중간 (성능 개선)
**영향받는 파일**: 30+ 파일 (215+ 발생)

**대표 예시 1 - 파티클**:
```javascript
// ❌ 현재
dimension.runCommand(`particle minecraft:explosion_particle ${loc.x} ${loc.y} ${loc.z}`);

// ✅ 수정
dimension.spawnParticle("minecraft:explosion_particle", loc);
```

**대표 예시 2 - 아이템 제거**:
```javascript
// ❌ 현재
player.runCommand(`clear @s emerald 0 ${item.price}`);

// ✅ 수정 - Inventory API 사용
const inventory = player.getComponent("inventory").container;
let remaining = item.price;

for (let i = 0; i < inventory.size && remaining > 0; i++) {
    const slotItem = inventory.getItem(i);
    if (slotItem?.typeId === "minecraft:emerald") {
        const toRemove = Math.min(slotItem.amount, remaining);
        if (slotItem.amount > toRemove) {
            slotItem.amount -= toRemove;
            inventory.setItem(i, slotItem);
        } else {
            inventory.setItem(i, undefined);
        }
        remaining -= toRemove;
    }
}
```

**대표 예시 3 - 효과 적용**:
```javascript
// ❌ 현재
entity.runCommand(`effect @s resistance 3 1 true`);

// ✅ 수정
entity.addEffect("resistance", 60, { amplifier: 1, showParticles: true });
```

**수정 효과**:
- 성능 향상
- 오류 처리 개선
- 타입 안전성 증가

---

### Issue #15: 타입 검증 누락 (Dynamic Property)

**우선순위**: 🟡 중간
**영향받는 파일**: 다수

**대표 예시**:
- `rank_byChat.js` (Lines 23-27)

**문제점**:
```javascript
// ⚠️ 현재 - 타입 검증 불충분
const rank = player.getDynamicProperty(`rank`);
if (typeof rank == "undefined") {
    player.nameTag = "[ 뉴비 ] " + player.name;
} else {
    player.nameTag = "[ " + rank + " ] " + player.name;
}
```

**권장 수정**:
```javascript
// ✅ 수정 - 완전한 타입 검증
const rank = player.getDynamicProperty(`rank`);
if (typeof rank === "string" && rank.length > 0) {
    player.nameTag = "[ " + rank + " ] " + player.name;
} else {
    player.nameTag = "[ 뉴비 ] " + player.name;
}
```

**수정 효과**:
- 데이터 손상 대응
- 예기치 않은 동작 방지

---

### Issue #16: Null/Undefined 체크 누락

**우선순위**: 🟡 중간
**영향받는 파일**: 다수

**대표 예시**:
- `autoBlockCollectorSystem.js` (Line 69)

**문제점**:
```javascript
// ⚠️ 현재 - 컴포넌트 존재 확인 없음
const inventory = player.getComponent("inventory").container;
```

**권장 수정**:
```javascript
// ✅ 수정 - 단계별 null 체크
const inventoryComp = player.getComponent("inventory");
if (!inventoryComp) {
    console.warn("Inventory component not found");
    return;
}

const inventory = inventoryComp.container;
if (!inventory) {
    console.warn("Inventory container not accessible");
    return;
}

// 이제 안전하게 사용 가능
```

**수정 효과**:
- 런타임 크래시 방지
- 디버깅 용이

---

### Issue #17: block.isValid() 불필요한 호출

**우선순위**: 🟡 중간 (코드 정리)
**영향받는 파일**: 1개

**위치**:
- `interactiveBlockMenuSystem.js` (Line 125)

**문제점**:
```javascript
// ⚠️ 현재 - 이벤트에서 받은 블록은 항상 유효
if (block.isValid() && !item && (block.typeId === "minecraft:diamond_block" || block.typeId === "minecraft:emerald_block")) {
    // ...
}
```

**권장 수정**:
```javascript
// ✅ 수정 - isValid() 제거
if (!item && (block.typeId === "minecraft:diamond_block" || block.typeId === "minecraft:emerald_block")) {
    e.cancel = true;
    system.run(() => {
        showBlockUI(player, block.typeId, block.location);
    });
}
```

**수정 효과**:
- 코드 간결화
- 불필요한 검사 제거

---

## 🟢 낮은 우선순위 이슈 (선택사항)

### Issue #18: 에러 로깅 개선

**우선순위**: 🟢 낮음
**영향받는 파일**: 모든 파일

**현재 상태**:
```javascript
// 현재 - 간단한 로깅
catch (error) {
    console.warn("오류:", error);
}
```

**권장 개선**:
```javascript
// 개선 - 구조화된 에러 정보
catch (error) {
    console.warn("[System Error]", {
        location: "emeraldBankSystem.withdraw",
        player: player.name,
        error: error.message || String(error),
        timestamp: new Date().toISOString()
    });

    // 개발 모드에서만 상세 정보
    if (DEBUG_MODE) {
        console.error(error.stack);
    }
}
```

**개선 효과**:
- 디버깅 시 문제 위치 빠르게 파악
- 프로덕션 환경에서 로그 필터링 용이
- 오류 발생 시간 추적 가능

---

### Issue #19: Map 크기 제한 추가

**우선순위**: 🟢 낮음
**영향받는 파일**: Map을 사용하는 모든 파일

**현재 상태**:
```javascript
// 현재 - 크기 제한 없음
const cache = new Map();
cache.set(key, value); // 무한정 증가 가능
```

**권장 개선**:
```javascript
// 개선 - 최대 크기 제한
const MAX_CACHE_SIZE = 1000;
const cache = new Map();

function addToCache(key, value) {
    if (cache.size >= MAX_CACHE_SIZE) {
        // 가장 오래된 항목 제거 (FIFO)
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
    cache.set(key, value);
}
```

**개선 효과**:
- 메모리 사용량 상한선 설정
- 예측 가능한 성능
- 장시간 실행 시 안정성 향상

**참고**: Issue #6에서 evasionSystem.js의 메모리 누수는 이미 해결되었습니다. 이 항목은 다른 Map 사용 사례에 적용할 수 있는 추가 최적화입니다.

---

## ✅ 올바르게 구현된 부분

### 1. 이벤트 구독 패턴
- ✅ 모든 파일이 루트 레벨에서 이벤트 구독
- ✅ 콜백 내부에서 구독하는 안티패턴 없음

### 2. Vector3 객체 사용
- ✅ 대부분의 파일이 올바르게 Vector3 객체 사용
- ✅ `{x, y, z}` 형식 준수

### 3. 틱/밀리초 사용
- ✅ `system.runTimeout()`, `system.runInterval()` 올바르게 사용
- ✅ 틱 단위(20틱 = 1초) 정확히 이해하고 사용

### 4. runCommand 사용
- ✅ 모든 파일에서 `runCommand()` 사용 (runCommandAsync 제거 완료)
- ✅ 명령어 결과 검증 추가 완료

---

## 📊 최종 통계

### 이전 검토 완료 항목 (Issues #1-6)

| 이슈 | 설명 | 상태 | 파일 수 |
|------|------|------|---------|
| **Issue #1** | 명령어 결과 검증 | ✅ 완료 | 6개 |
| **Issue #2** | 존재하지 않는 API 속성 | ✅ 완료 | 1개 |
| **Issue #3** | 타겟 셀렉터 오용 | ✅ 완료 | 2개 |
| **Issue #4** | Dynamic Property 타입 검증 | ✅ 완료 | 1개 |
| **Issue #5** | 비동기 블록 유효성 | ✅ 완료 | 1개 |
| **Issue #6** | 메모리 누수 방지 | ✅ 완료 | 1개 |

**이전 검토 완료율**: 100% (12개 파일 수정 완료)

---

### 새로 발견된 이슈 (Issues #7-19)

#### 🔴 높은 우선순위 (즉시 수정 필요)

| 이슈 | 설명 | 영향 파일 | 심각도 |
|------|------|----------|--------|
| **Issue #7** | system.beforeEvents.startup 제거됨 | 1개 | CRITICAL - 로드 실패 |
| **Issue #8** | player.isOp() 제거됨 | 9개 | CRITICAL - 런타임 오류 |
| **Issue #9** | isFirstEvent 사용 문제 | 3개 | HIGH - 이벤트 누락 |
| **Issue #10** | 명령어 결과 검증 누락 | 30+ | HIGH - 조용한 실패 |
| **Issue #11** | Dynamic Property 크기 제한 | 다수 | HIGH - 데이터 손실 |
| **Issue #12** | Interval 메모리 누수 | 3개 | HIGH - 성능 저하 |

#### 🟡 중간 우선순위 (권장 수정)

| 이슈 | 설명 | 영향 파일 |
|------|------|----------|
| **Issue #13** | getDimension 네임스페이스 누락 | 19개 |
| **Issue #14** | runCommand 과다 사용 | 30+ (215+ 발생) |
| **Issue #15** | Dynamic Property 타입 검증 누락 | 다수 |
| **Issue #16** | Null/Undefined 체크 누락 | 다수 |
| **Issue #17** | block.isValid() 불필요한 호출 | 1개 |

#### 🟢 낮은 우선순위 (선택사항)

| 이슈 | 설명 | 영향 파일 |
|------|------|----------|
| **Issue #18** | 에러 로깅 개선 | 모든 파일 |
| **Issue #19** | Map 크기 제한 추가 | Map 사용 파일 |

**새로 발견된 이슈 요약**:
- 🔴 높은 우선순위: **6개** (40+ 영향 파일)
- 🟡 중간 우선순위: **5개** (50+ 영향 파일)
- 🟢 낮은 우선순위: **2개** (선택사항)

**⚠️ 중요**: 높은 우선순위 이슈는 스크립트 로드 실패, 런타임 오류, 데이터 손실을 초래할 수 있으므로 즉시 수정이 필요합니다.

---

## 🎯 권장 다음 단계

### 즉시 수행 (CRITICAL)
- [ ] **Issue #7**: figureMaker.js의 system.beforeEvents.startup 제거
- [ ] **Issue #8**: 9개 파일의 player.isOp()를 hasTag("admin")으로 변경
- [ ] 관리자에게 `/tag @s add admin` 명령어 실행 안내

### 단기 수행 (1-2일 내)
- [ ] **Issue #9**: isFirstEvent 사용 패턴 검토 및 수정 (3개 파일)
- [ ] **Issue #10**: 주요 파일의 runCommand() 결과 검증 추가
- [ ] **Issue #11**: BlockProtector.js 등 Dynamic Property 크기 체크 추가
- [ ] **Issue #12**: PvPtomb 시리즈 interval 관리 개선 (3개 파일)

### 중기 수행 (1주일 내)
- [ ] **Issue #13**: getDimension() 호출 시 네임스페이스 추가 (19개 파일)
- [ ] **Issue #14**: 핵심 기능의 runCommand()를 API 직접 호출로 변경
- [ ] **Issue #15-16**: 타입 검증 및 null 체크 추가

### 장기 개선 (선택사항)
- [ ] **Issue #17**: 불필요한 isValid() 호출 제거
- [ ] **Issue #18**: 구조화된 에러 로깅 시스템 구축
- [ ] **Issue #19**: Map 크기 제한 로직 추가

### 테스트 및 검증
- [ ] Minecraft에서 수정된 스크립트 로드 테스트
- [ ] 각 기능별 동작 확인
- [ ] 오류 로그 모니터링 (특히 CRITICAL 수정 후)
- [ ] 관리자 권한 시스템 테스트 (admin 태그)

### 문서화
- [ ] 각 스크립트의 기능 문서화
- [ ] 사용 방법 및 설정 가이드 작성 (특히 admin 태그)
- [ ] 주요 변경 사항 changelog 작성

---

## 📚 참고 자료

- [Script API 공식 문서](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/)
- [Bedrock Wiki - Scripting](https://wiki.bedrock.dev/scripting/scripting-intro)
- [Script API 버전 매핑](https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/versioning)

---

## 📝 수정 이력

**2026-01-03 (오전)**:
- ✅ Issue #1-6 모두 완료
- ✅ 총 12개 파일 수정
- ✅ 모든 높은/중간 우선순위 항목 해결
- 📋 낮은 우선순위 항목(#7-8)은 선택사항으로 분류

**2026-01-03 (오후 - 전체 재검토)**:
- 🔍 Claude Skills 최신 레퍼런스 기반 전체 파일 재검토 완료
- 🆕 새로운 이슈 13개 발견 (Issues #7-19)
  - 🔴 CRITICAL 이슈 2개: system.beforeEvents.startup, player.isOp()
  - 🔴 HIGH 이슈 4개: isFirstEvent, 명령어 검증 누락, Dynamic Property 크기, Interval 누수
  - 🟡 MEDIUM 이슈 5개: 네임스페이스, runCommand 과다, 타입 검증, null 체크, isValid()
  - 🟢 LOW 이슈 2개: 에러 로깅, Map 크기 제한
- 📊 총 90+ 파일이 영향받는 것으로 확인
- ⚠️ 즉시 수정이 필요한 CRITICAL 이슈 발견 (스크립트 로드 실패 가능)

**검토 방법**:
- Explore 에이전트를 통한 전체 scriptAPI 폴더 심층 분석
- Claude Skills의 Script API 2.5.0-beta 최신 레퍼런스 참조
- 각 파일별 라인 단위 검토 및 문제점 식별

**리포트 작성**: Claude Code
**검토 기준**: Script API 2.5.0-beta 공식 문서 및 모범 사례
