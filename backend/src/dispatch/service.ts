import {
  ACCEPT_WINDOW_SECONDS,
  DUTY_ROOMS,
  OFFICE_HOURS,
  SECURITY_ROOM_ID,
  getRoom,
  isOfficeHours,
  roomOfUser,
  roomOnDuty,
  type Dispatch,
  type RoomList,
} from "../contracts/dispatch";
import type { Ticket } from "../contracts/ticket";
import { store } from "../db/store";

interface DispatchRecord {
  ticket_code: string;
  room_id: string;
  dispatched_at: string;
  dispatched_by_name: string;
  note: string | null;
  calls: { at: string; by_name: string }[];
  outside_hours: boolean;
  overdue_notified: boolean;
}

export class DispatchError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Emit = (event: string, data: unknown) => void;
type Actor = { id: string; name: string };

const ACTIVE = ["assigned", "verifying"];

/**
 * Bản ghi điều phối giữ trong RAM cạnh store của A. Trạng thái "đã nhận" không lưu riêng mà đọc
 * từ lịch sử phiếu: lần chuyển bước đầu tiên sau lúc điều phối (cán bộ bấm Đang đến / Đã đến / Báo nhầm).
 */
class DispatchService {
  private records = new Map<string, DispatchRecord>();
  private emit: Emit | null = null;

  constructor() {
    this.reset();
  }

  setEmitter(emit: Emit) {
    this.emit = emit;
  }

  /** Phiếu mẫu đã qua bước tiếp nhận được coi là đã điều phối cho Phòng bảo vệ (người nhận là `catruc`) */
  reset() {
    this.records.clear();
    for (const t of store.getTickets()) {
      if (t.status === "received" || t.is_sandbox) continue;
      this.records.set(t.code, {
        ticket_code: t.code,
        room_id: roomOfUser(t.assignee_id ?? "")?.id ?? SECURITY_ROOM_ID,
        dispatched_at: t.created_at,
        dispatched_by_name: "Ban quản lý",
        note: null,
        calls: [],
        outside_hours: false,
        overdue_notified: true,
      });
    }
  }

  private view(rec: DispatchRecord, now = Date.now()): Dispatch {
    const ticket = store.getTicket(rec.ticket_code);
    const deadline = Date.parse(rec.dispatched_at) + ACCEPT_WINDOW_SECONDS * 1000;
    let accepted_at: string | null = null;
    let accepted_by_name: string | null = null;
    if (ticket && ticket.status !== "received") {
      const entry = store
        .getHistory(ticket.code)
        .filter((h) => h.created_at >= rec.dispatched_at && h.to_status !== "received")
        .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
      accepted_at = entry?.created_at ?? ticket.updated_at;
      accepted_by_name = entry?.performed_by_name ?? null;
    }
    return {
      ticket_code: rec.ticket_code,
      room_id: rec.room_id,
      dispatched_at: rec.dispatched_at,
      dispatched_by_name: rec.dispatched_by_name,
      accept_deadline: new Date(deadline).toISOString(),
      note: rec.note,
      status: accepted_at ? "accepted" : now > deadline ? "overdue" : "waiting",
      accepted_at,
      accepted_by_name,
      calls: rec.calls,
      outside_hours: rec.outside_hours,
    };
  }

  list(): Dispatch[] {
    const now = Date.now();
    return [...this.records.values()]
      .filter((r) => store.getTicket(r.ticket_code))
      .map((r) => this.view(r, now))
      .sort((a, b) => b.dispatched_at.localeCompare(a.dispatched_at));
  }

  get(code: string) {
    const rec = this.records.get(code);
    return rec ? this.view(rec) : null;
  }

  /** Phòng trực chỉ thấy phiếu đã điều phối cho phòng mình (chưa ai nhận) và phiếu mình đã nhận */
  visibleToGuard(ticket: Ticket, userId: string) {
    if (ticket.assignee_id) return ticket.assignee_id === userId;
    const rec = this.records.get(ticket.code);
    return !!rec && !!getRoom(rec.room_id)?.staff_ids.includes(userId);
  }

  dispatch(code: string, roomId: string, by: Actor, note?: string | null): Dispatch {
    const ticket = store.getTicket(code);
    if (!ticket) throw new DispatchError(404, "Không tìm thấy phiếu");
    const room = getRoom(roomId);
    if (!room) throw new DispatchError(400, "Phòng trực không hợp lệ");
    if (ticket.status !== "received")
      throw new DispatchError(409, "Phiếu đã có người nhận kiểm tra, không điều phối lại được");
    const previous = this.records.get(code);
    const now = new Date();
    const rec: DispatchRecord = {
      ticket_code: code,
      room_id: room.id,
      dispatched_at: now.toISOString(),
      dispatched_by_name: by.name,
      note: note?.trim() || null,
      calls: [],
      outside_hours: !roomOnDuty(room, now),
      overdue_notified: false,
    };
    this.records.set(code, rec);
    const zone = store.getZone(ticket.zone_code);
    store.addHistory({
      id: `hist_${code}_dispatch_${now.getTime()}`,
      ticket_code: code,
      from_status: ticket.status,
      to_status: ticket.status,
      action: "dispatch",
      performed_by_id: by.id,
      performed_by_name: by.name,
      note: [
        previous && previous.room_id !== room.id
          ? `Chuyển điều phối từ ${getRoom(previous.room_id)?.name ?? previous.room_id} sang ${room.name}`
          : `Điều phối kiểm tra cho ${room.name}`,
        `nhận trong ${ACCEPT_WINDOW_SECONDS / 60} phút`,
        rec.note,
      ]
        .filter(Boolean)
        .join(" · "),
      created_at: rec.dispatched_at,
    });
    const view = this.view(rec);
    this.emit?.("dispatch:assigned", {
      ...view,
      room_name: room.name,
      zone_code: ticket.zone_code,
      zone_name: zone?.name ?? ticket.zone_code,
      presence: ticket.presence,
      priority: ticket.priority,
    });
    // Hết 3 phút mà chưa ai nhận → báo Ban quản lý (kèm số gọi điện)
    setTimeout(() => this.checkOverdue(code, rec.dispatched_at), ACCEPT_WINDOW_SECONDS * 1000 + 50).unref();
    return view;
  }

  checkOverdue(code: string, dispatchedAt: string) {
    const rec = this.records.get(code);
    if (!rec || rec.dispatched_at !== dispatchedAt || rec.overdue_notified) return;
    const view = this.view(rec);
    if (view.status !== "overdue") return;
    rec.overdue_notified = true;
    const room = getRoom(rec.room_id)!;
    const ticket = store.getTicket(code)!;
    this.emit?.("dispatch:overdue", {
      ...view,
      room_name: room.name,
      room_phone: room.phone,
      zone_code: ticket.zone_code,
      zone_name: store.getZone(ticket.zone_code)?.name ?? ticket.zone_code,
    });
  }

  /** Ban quản lý ghi nhận đã gọi điện cho phòng trực (số giả lập) */
  call(code: string, by: Actor): Dispatch {
    const rec = this.records.get(code);
    if (!rec) throw new DispatchError(404, "Phiếu chưa được điều phối");
    const room = getRoom(rec.room_id)!;
    const at = new Date().toISOString();
    rec.calls.push({ at, by_name: by.name });
    const ticket = store.getTicket(code)!;
    store.addHistory({
      id: `hist_${code}_call_${Date.parse(at)}`,
      ticket_code: code,
      from_status: ticket.status,
      to_status: ticket.status,
      action: "dispatch_call",
      performed_by_id: by.id,
      performed_by_name: by.name,
      note: `Gọi điện ${room.name} (${room.phone}, số giả lập) vì quá ${ACCEPT_WINDOW_SECONDS / 60} phút chưa nhận`,
      created_at: at,
    });
    const view = this.view(rec);
    this.emit?.("dispatch:updated", view);
    return view;
  }

  rooms(at: Date = new Date()): RoomList {
    const views = this.list();
    const tickets = store.getTickets();
    return {
      in_office_hours: isOfficeHours(at),
      office_hours_label: OFFICE_HOURS.label,
      accept_window_seconds: ACCEPT_WINDOW_SECONDS,
      items: DUTY_ROOMS.map((room) => ({
        ...room,
        on_duty: roomOnDuty(room, at),
        staff: room.staff_ids.map((id) => ({
          id,
          name: store.getUserById(id)?.name ?? id,
          active_tickets: tickets.filter((t) => t.assignee_id === id && ACTIVE.includes(t.status)).length,
        })),
        waiting: views.filter((v) => v.room_id === room.id && v.status !== "accepted").length,
        in_progress: tickets.filter((t) => room.staff_ids.includes(t.assignee_id ?? "") && ACTIVE.includes(t.status))
          .length,
      })),
    };
  }
}

export const dispatchService = new DispatchService();
