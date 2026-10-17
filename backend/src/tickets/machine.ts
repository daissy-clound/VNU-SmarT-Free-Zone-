import {
  TicketStatus,
  SourceType,
  PriorityLevel,
  Ticket,
} from "../contracts/ticket";

/**
 * Ma trận chuyển đổi trạng thái hợp lệ cho quy trình 6 bước
 * received -> assigned -> verifying -> handled -> responded -> closed
 */
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  received: ["assigned", "verifying"], // Cho phép ca trực nhận và vào xác minh ngay
  assigned: ["verifying", "received"],
  verifying: ["handled", "assigned"],
  handled: ["responded", "verifying"],
  responded: ["closed", "handled"],
  closed: [], // Trạng thái kết thúc
};

/**
 * Kiểm tra xem việc chuyển từ trạng thái `current` sang `next` có hợp lệ không
 */
export function canTransition(current: TicketStatus, next: TicketStatus): boolean {
  if (current === next) return true;
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

/**
 * Tính toán SLA hạn xử lý:
 * - Tiếp cận hiện trường trong 15 phút (due_at = now + 15m)
 * - Đóng phiếu trong vòng 48 giờ
 */
export function calculateSLA(priority: PriorityLevel = "normal"): {
  dueAt: Date;
  slaMinutes: number;
} {
  const now = new Date();
  let slaMinutes = 15; // Mặc định 15 phút theo quy định ca trực KTX

  if (priority === "urgent") {
    slaMinutes = 5; // Khẩn cấp: 5 phút có mặt
  } else if (priority === "high") {
    slaMinutes = 10;
  } else if (priority === "low") {
    slaMinutes = 30;
  }

  const dueAt = new Date(now.getTime() + slaMinutes * 60 * 1000);
  return { dueAt, slaMinutes };
}

/**
 * Gộp nguồn: kiểm tra xem phản ánh mới có trùng khu vực và trong vòng 15 phút không
 */
export function shouldMergeReport(
  existingTicket: Ticket,
  incomingZone: string,
  mergeWindowMinutes: number = 15
): boolean {
  if (existingTicket.zone_code !== incomingZone) return false;
  if (existingTicket.status === "closed") return false;

  const ticketTime = new Date(existingTicket.created_at).getTime();
  const now = Date.now();
  const diffMinutes = (now - ticketTime) / (60 * 1000);

  return diffMinutes <= mergeWindowMinutes;
}

/**
 * Quyết định nâng cấp nguồn và ưu tiên khi gộp tin:
 * - Cảm biến + Phản ánh SV -> "both" & tăng ưu tiên lên "high" hoặc "urgent"
 * - Có cờ khẩn cấp -> ưu tiên "urgent" & nguồn "emergency"
 */
export function resolveMergedSourceAndPriority(
  currentSource: SourceType,
  currentPriority: PriorityLevel,
  incomingSource: SourceType,
  isEmergency: boolean
): { source: SourceType; priority: PriorityLevel } {
  if (isEmergency || currentSource === "emergency" || incomingSource === "emergency") {
    return { source: "emergency", priority: "urgent" };
  }

  let finalSource: SourceType = currentSource;
  if (
    (currentSource === "sensor" && incomingSource === "report") ||
    (currentSource === "report" && incomingSource === "sensor") ||
    currentSource === "both" ||
    incomingSource === "both"
  ) {
    finalSource = "both";
  }

  let finalPriority: PriorityLevel = currentPriority;
  if (finalSource === "both" && (currentPriority === "low" || currentPriority === "normal")) {
    finalPriority = "high"; // Tăng ưu tiên khi cả 2 nguồn cùng phát hiện
  }

  return { source: finalSource, priority: finalPriority };
}
