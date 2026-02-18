/**
 * ===========================================
 * 내구도 무한 아이템 시스템
 * UnbreakableItemSystem
 * ===========================================
 *
 * [사용법 / How to Use]
 * 1. 모루(Anvil)에서 아이템 이름에 "무한" 문자열을 포함시킵니다.
 *    예시: "무한 다이아몬드 검", "철 곡괭이 무한", "무한 철제 곡괭이"
 * 2. 해당 아이템을 장착하면 내구도가 자동으로 복구됩니다.
 * 3. 도구, 무기, 방어구 모두 적용됩니다.
 *
 * [적용 슬롯 / Applied Slots]
 * - 메인핸드 (Mainhand)
 * - 오프핸드 (Offhand)
 * - 투구 (Head)
 * - 흉갑 (Chest)
 * - 레깅스 (Legs)
 * - 부츠 (Feet)
 *
 * [설정 변경 / Settings]
 * - UNBREAKABLE_TAG: 아이템 이름에 포함되어야 할 문자열
 * - CHECK_INTERVAL: 내구도 확인 주기 (틱 단위, 20틱 = 1초)
 *   - 5 = 0.25초 (빠른 반응, 기본값)
 *   - 10 = 0.5초
 *   - 20 = 1초 (부담 적음)
 *
 * ===========================================
 */

import { world, system, EquipmentSlot } from "@minecraft/server";

// 내구도 무한 설정
const UNBREAKABLE_TAG = "무한";  // 이 문자열이 아이템 이름에 포함되면 내구도 무한
const CHECK_INTERVAL = 5;        // 내구도 확인 주기 (틱 단위, 20틱 = 1초)

// 주기적으로 모든 플레이어의 장비 내구도 확인 및 복구
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            const equippable = player.getComponent("minecraft:equippable");
            if (!equippable) continue;

            // 메인핸드 확인
            checkAndRestoreDurability(equippable, EquipmentSlot.Mainhand);

            // 오프핸드 확인
            checkAndRestoreDurability(equippable, EquipmentSlot.Offhand);

            // 방어구 확인
            checkAndRestoreDurability(equippable, EquipmentSlot.Head);
            checkAndRestoreDurability(equippable, EquipmentSlot.Chest);
            checkAndRestoreDurability(equippable, EquipmentSlot.Legs);
            checkAndRestoreDurability(equippable, EquipmentSlot.Feet);
        } catch (e) {
            // 오류 무시
        }
    }
}, CHECK_INTERVAL);

/**
 * 특정 슬롯의 아이템 내구도를 확인하고 복구합니다.
 * @param {EntityEquippableComponent} equippable - 장비 컴포넌트
 * @param {EquipmentSlot} slot - 장비 슬롯
 */
function checkAndRestoreDurability(equippable, slot) {
    try {
        const item = equippable.getEquipment(slot);
        if (!item) return;

        // 이름 태그 확인
        const nameTag = item.nameTag;
        if (!nameTag || !nameTag.includes(UNBREAKABLE_TAG)) return;

        // 내구도 컴포넌트 확인
        const durability = item.getComponent("minecraft:durability");
        if (!durability) return;

        // 내구도가 닳았으면 복구
        if (durability.damage > 0) {
            durability.damage = 0;
            equippable.setEquipment(slot, item);
        }
    } catch (e) {
        // 오류 무시
    }
}
