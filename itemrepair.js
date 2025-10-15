/**
 * ===========================================
 * 마인크래프트 내구도 수리 NPC 스크립트
 * ===========================================
 * 
 * 사용법:
 * 1. 게임 내에서 이름이 "repair"인 NPC를 생성하세요
 * 2. 플레이어가 해당 NPC를 우클릭하면 수리 UI가 열립니다
 * 3. 손에 든 아이템의 내구도를 에메랄드 1개로 수리할 수 있습니다
 * 
 * 기능:
 * - NPC 이름이 "repair"인 경우에만 작동
 * - 손에 든 아이템의 내구도가 0이 아닌 경우에만 수리 가능
 * - 수리 비용: 에메랄드 1개
 * - 인첸트와 로어는 수리 후에도 유지됩니다
 * - 내구도가 이미 최대인 경우 비용을 차감하지 않습니다
 * 
 * 작동 방식:
 * 1. 직접 수리 시도 (damage 속성 수정)
 * 2. 실패 시 새 아이템으로 교체하여 수리
 * 3. 인벤토리에서 여러 스택에 걸쳐 에메랄드를 차감 가능
 * 
 * 필요한 파일:
 * - entities/player.json: 플레이어 엔티티 설정
 * - functions/tick.json: 틱 함수 설정
 * - manifest.json: 스크립트 API 활성화 필요
 */

import { world, system, ItemStack } from "@minecraft/server";
import { MessageFormData } from "@minecraft/server-ui";

const NPC_TYPE = "minecraft:npc";
const NPC_NAME = "repair";
const COST_ITEM_ID = "minecraft:emerald";
const COST_AMOUNT = 1;

// === 이벤트: NPC 기본 대화창 차단 후 우리 UI 실행 ===
world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
  const { player, target } = ev;
  if (!player || !target) return;
  if (!isRepairNpc(target)) return;

  ev.cancel = true; // 기본 대화창 방지
  system.run(() => openRepairUI(player));
});

async function openRepairUI(player) {
  try {
    // 손에 든 아이템 확인 (먼저 미리 안내)
    const held = getHeldItem(player);
    const heldName = held ? held.typeId.split(":")[1] : "없음";

    const form = new MessageFormData()
      .title("⚒ 내구도 수리")
      .body(
        [
          `대상: 손에 든 아이템 (${heldName})`,
          `비용: 에메랄드 ${COST_AMOUNT}개`,
          "",
          "진행하시겠어요?"
        ].join("\n")
      )
      .button1("예, 수리")
      .button2("아니오");

    const res = await form.show(player);
    if (res.canceled || res.selection !== 0) return;

    // 유효성 검사
    if (!held) {
      player.sendMessage("§7손에 든 아이템이 없습니다.");
      return;
    }
    const dura = held.getComponent("minecraft:durability");
    if (!dura) {
      player.sendMessage("§7이 아이템은 내구도가 없습니다.");
      return;
    }
    if (typeof dura.damage === "number" && dura.damage === 0) {
      player.sendMessage("§7이미 최대 내구도입니다. (비용 차감 없음)");
      return;
    }

    // 비용 확인/차감
    const costOk = consumeFromInventory(player, COST_ITEM_ID, COST_AMOUNT);
    if (!costOk) {
      player.sendMessage("§c에메랄드가 부족합니다! (필요: 1개)");
      return;
    }

    // 수리 수행: A 경로(직접) 시도 -> 실패 시 B 경로(교체)
    const repaired = repairHeldItem(player);
    if (repaired === "direct" || repaired === "replace") {
      const label = repaired === "direct" ? "직접 수리" : "교체 수리";
      player.sendMessage(`§a수리 완료! (${label}, 비용: 에메랄드 1개)`);
    } else {
      player.sendMessage("§c수리에 실패했습니다. (비용은 반환되지 않습니다)");
    }
  } catch (e) {
    console.warn("[repair_npc] UI error:", e);
  }
}

// === 도우미: repair NPC 판별 ===
function isRepairNpc(entity) {
  if (entity.typeId !== NPC_TYPE) return false;
  const raw = (entity.nameTag ?? "").toString();
  const normalized = stripMcFormatting(raw).toLowerCase().trim();
  return normalized === NPC_NAME.toLowerCase();
}

// § 색/포맷 코드 제거
function stripMcFormatting(s) {
  return s.replace(/§[0-9a-fklmnor]/gi, "");
}

// === 손에 든 아이템 가져오기 ===
function getHeldItem(player) {
  const invComp = player.getComponent("minecraft:inventory");
  const container = invComp?.container;
  if (!container) return null;
  const slot = player.selectedSlotIndex ?? 0; // 0~8 (핫바)
  return container.getItem(slot) ?? null;
}

// === 손에 든 아이템 수리 ===
function repairHeldItem(player) {
  const invComp = player.getComponent("minecraft:inventory");
  const container = invComp?.container;
  if (!container) return "fail";
  const slot = player.selectedSlotIndex ?? 0;

  const item = container.getItem(slot);
  if (!item) return "fail";

  const dura = item.getComponent("minecraft:durability");
  if (!dura) return "fail";

  // A) damage 세터 가능 시 직접 수리
  try {
    if (typeof dura.damage === "number") {
      if (dura.damage !== 0) {
        dura.damage = 0;
        container.setItem(slot, item);
      }
      return "direct";
    }
  } catch (_) {
    // 무시하고 B 경로
  }

  // B) 동일 아이템 새로 만들어 교체 (인첸트/로어 복사)
  try {
    const newItem = new ItemStack(item.typeId, item.amount);

    // 로어
    try { newItem.setLore(item.getLore?.() ?? item.getRawLore?.() ?? []); } catch (_) {}

    // 인첸트 복사
    try {
      const enchOld = item.getComponent("minecraft:enchantable");
      const enchNew = newItem.getComponent("minecraft:enchantable");
      if (enchOld && enchNew) {
        const list = enchOld.getEnchantments();
        for (const e of list) {
          if (enchNew.canAddEnchantment?.(e)) enchNew.addEnchantment(e);
        }
      }
    } catch (_) {}

    container.setItem(slot, newItem);
    return "replace";
  } catch (_) {
    return "fail";
  }
}

// === 인벤토리에서 특정 아이템 차감 (여러 스택 걸쳐 충당 가능) ===
function consumeFromInventory(player, typeId, amount) {
  const invComp = player.getComponent("minecraft:inventory");
  const container = invComp?.container;
  if (!container) return false;

  let remaining = amount;

  // 0~container.size-1 순회 (핫바/인벤토리 전체)
  for (let i = 0; i < container.size; i++) {
    const it = container.getItem(i);
    if (!it || it.typeId !== typeId) continue;

    if (it.amount > remaining) {
      // 일부만 깎기
      const newStack = new ItemStack(it.typeId, it.amount - remaining);
      // 메타/데이터 있는 경우 필요 시 복사 로직 추가
      container.setItem(i, newStack);
      return true;
    } else if (it.amount === remaining) {
      // 정확히 소진
      container.setItem(i, undefined);
      return true;
    } else {
      // 이 스택 전부 소모하고 다음 스택에서 이어서
      remaining -= it.amount;
      container.setItem(i, undefined);
      if (remaining <= 0) return true;
    }
  }

  // 충분히 못 깎았으면 실패 (여기선 롤백하지 않음 -> 위 루프 설계상 여기 도달 X)
  return false;
}
