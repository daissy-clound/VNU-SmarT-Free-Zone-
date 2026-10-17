import {
  Button,
  Empty,
  Grid,
  Input,
  Pagination,
  Select,
  Skeleton,
  Table,
  Tag,
} from "antd";
import {
  SearchOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  priorityLabels,
  sourceLabels,
  statuses,
  statusLabels,
  type Ticket,
  type Zone,
} from "../../../../backend/src/contracts";

export function remaining(ticket: Ticket, now: number) {
  if (["handled", "responded", "closed"].includes(ticket.status))
    return { text: "Đã hoàn tất xử lý", overdue: false };
  if (!ticket.due_at) return { text: "Chưa có thời hạn", overdue: false };
  const delta = Date.parse(ticket.due_at) - now;
  const minutes = Math.max(1, Math.ceil(Math.abs(delta) / 60000));
  return {
    text: delta <= 0 ? `Quá hạn ${minutes} phút` : `Còn ${minutes} phút`,
    overdue: delta <= 0,
  };
}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
const isOpen = (ticket: Ticket) =>
  ["received", "assigned", "verifying"].includes(ticket.status);

export function TicketTable({
  tickets,
  zones,
  now,
  loading,
  onSelect,
  compact = false,
}: {
  tickets: Ticket[];
  zones: Zone[];
  now: number;
  loading: boolean;
  onSelect: (ticket: Ticket) => void;
  compact?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const mobile = screens.md === false;
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const status = compact ? undefined : params.get("status") || undefined;
  const zone = compact ? undefined : params.get("zone_code") || undefined;
  const query = compact ? "" : params.get("q") || "";
  const scope = compact ? "all" : params.get("scope") || "all";
  const order = compact ? "newest" : params.get("sort") || "newest";
  const update = (key: string, value?: string) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
    setPage(1);
  };
  const hasFilters = !!(status || zone || query || scope !== "all");
  const clear = () => {
    setParams({}, { replace: true });
    setPage(1);
  };
  const matchesScope = (ticket: Ticket, value: string) =>
    value === "completed"
      ? !isOpen(ticket)
      : value === "open"
        ? isOpen(ticket)
        : value === "overdue"
          ? remaining(ticket, now).overdue
          : value === "urgent"
            ? isOpen(ticket) && ticket.priority === "urgent"
            : true;
  const filtered = tickets
    .filter(
      (ticket) =>
        (!status || ticket.status === status) &&
        (!zone || ticket.zone_code === zone) &&
        matchesScope(ticket, scope) &&
        normalize(
          `${ticket.code} ${ticket.zone_code} ${zones.find((item) => item.code === ticket.zone_code)?.name || ""}`,
        ).includes(normalize(query)),
    )
    .sort((a, b) => {
      if (order === "attention") {
        const rank = (ticket: Ticket) =>
          !isOpen(ticket)
            ? 0
            : ticket.priority === "urgent"
              ? 4
              : remaining(ticket, now).overdue
                ? 3
                : ticket.priority === "high"
                  ? 2
                  : 1;
        if (rank(a) !== rank(b)) return rank(b) - rank(a);
      }
      return (
        b.created_at.localeCompare(a.created_at) || b.code.localeCompare(a.code)
      );
    });
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const filterKey = params.toString();
  useEffect(() => {
    setPage(1);
  }, [filterKey]);
  const visible = compact
    ? filtered.slice(0, 5)
    : filtered.slice((current - 1) * 10, current * 10);
  const empty = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        hasFilters
          ? "Không có phiếu khớp bộ lọc."
          : "Chưa có phiếu. Phiếu mới sẽ tự xuất hiện tại đây."
      }
    >
      {hasFilters && <Button onClick={clear}>Xem tất cả phiếu</Button>}
    </Empty>
  );
  const priorityTag = (priority: Ticket["priority"]) => (
    <Tag
      color={
        priority === "urgent"
          ? "red"
          : priority === "high"
            ? "orange"
            : "default"
      }
    >
      {priorityLabels[priority]}
    </Tag>
  );
  return (
    <>
      {!compact && (
        <>
          <div className="quick-filters" aria-label="Lọc nhanh phiếu">
            {[
              ["all", "Tất cả"],
              ["open", "Đang xử lý"],
              ["overdue", "Quá hạn"],
              ["urgent", "Khẩn cấp"],
              ["completed", "Đã xử lý"],
            ].map(([value, label]) => (
              <Button
                key={value}
                type={scope === value ? "primary" : "default"}
                aria-pressed={scope === value}
                onClick={() =>
                  update("scope", value === "all" ? undefined : value)
                }
              >
                {label}
                <span className="filter-count">
                  {
                    tickets.filter((ticket) => matchesScope(ticket, value))
                      .length
                  }
                </span>
              </Button>
            ))}
          </div>
          <div className="ticket-filters">
            <label className="filter-field search-field">
              <span>Tìm phiếu</span>
              <Input
                aria-label="Tìm phiếu"
                prefix={<SearchOutlined aria-hidden />}
                placeholder="Mã phiếu, tên hoặc mã khu vực…"
                allowClear
                value={query}
                onChange={(event) => update("q", event.target.value)}
              />
            </label>
            {(!mobile || showFilters) && (
              <>
                <label className="filter-field">
                  <span>Trạng thái</span>
                  <Select
                    aria-label="Lọc theo trạng thái"
                    placeholder="Tất cả trạng thái"
                    allowClear
                    value={status}
                    onChange={(value) => update("status", value)}
                    options={statuses.map((value) => ({
                      value,
                      label: statusLabels[value],
                    }))}
                  />
                </label>
                <label className="filter-field">
                  <span>Khu vực</span>
                  <Select
                    aria-label="Lọc theo khu vực"
                    placeholder="Tất cả khu vực"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    value={zone}
                    onChange={(value) => update("zone_code", value)}
                    options={zones.map((item) => ({
                      value: item.code,
                      label: `${item.code} · ${item.name}`,
                    }))}
                  />
                </label>
              </>
            )}
          </div>
          <div className="results-toolbar">
            <span role="status">
              {loading
                ? "Đang tải phiếu…"
                : `${filtered.length} phiếu${hasFilters ? ` / ${tickets.length} tổng số` : ""}`}
            </span>
            <div className="results-actions">
              {mobile && (
                <Button
                  aria-expanded={showFilters}
                  onClick={() => setShowFilters((value) => !value)}
                >
                  {showFilters
                    ? "Thu gọn bộ lọc"
                    : `Bộ lọc chi tiết${status || zone ? ` (${Number(!!status) + Number(!!zone)})` : ""}`}
                </Button>
              )}
              {(!mobile || showFilters) && (
                <Select
                  aria-label="Sắp xếp phiếu"
                  value={order}
                  onChange={(value) => update("sort", value)}
                  options={[
                    { value: "newest", label: "Mới nhất trước" },
                    { value: "attention", label: "Cần chú ý trước" },
                  ]}
                />
              )}
              <Button
                type="text"
                onClick={clear}
                disabled={!hasFilters && order === "newest"}
              >
                Xoá bộ lọc
              </Button>
            </div>
          </div>
        </>
      )}
      {mobile ? (
        <div className="ticket-cards" aria-label="Danh sách phiếu dạng thẻ">
          {loading ? (
            <Skeleton active />
          ) : !visible.length ? (
            empty
          ) : (
            visible.map((ticket) => {
              const area = zones.find((item) => item.code === ticket.zone_code);
              const deadline = remaining(ticket, now);
              return (
                <article
                  className={`ticket-mobile-card ${deadline.overdue ? "ticket-overdue" : ""}`}
                  key={ticket.code}
                >
                  <div className="ticket-card-top">
                    <strong>{ticket.code}</strong>
                    {priorityTag(ticket.priority)}
                  </div>
                  <h3>{area?.name || ticket.zone_code}</h3>
                  <p className="muted">
                    {area ? `Toà ${area.building} · Tầng ${area.floor} · ` : ""}
                    {ticket.zone_code}
                  </p>
                  <div className="ticket-card-tags">
                    <Tag color={ticket.status === "closed" ? "green" : "blue"}>
                      {statusLabels[ticket.status]}
                    </Tag>
                    <span>Nguồn: {sourceLabels[ticket.source]}</span>
                  </div>
                  <div
                    className={`ticket-deadline ${deadline.overdue ? "overdue" : "muted"}`}
                  >
                    <ClockCircleOutlined aria-hidden />
                    {deadline.text}
                  </div>
                  <Button
                    block
                    onClick={() => onSelect(ticket)}
                    icon={<ArrowRightOutlined />}
                    iconPlacement="end"
                  >
                    Xem phiếu {ticket.code}
                  </Button>
                </article>
              );
            })
          )}
          {!compact && (
            <Pagination
              current={current}
              pageSize={10}
              total={filtered.length}
              onChange={setPage}
              showSizeChanger={false}
              hideOnSinglePage
              simple
            />
          )}
        </div>
      ) : (
        <Table<Ticket>
          rowKey="code"
          size="middle"
          loading={loading}
          dataSource={compact ? filtered.slice(0, 5) : filtered}
          scroll={{ x: compact ? 580 : 980 }}
          rowClassName={(ticket) =>
            remaining(ticket, now).overdue ? "ticket-row-overdue" : ""
          }
          pagination={
            compact
              ? false
              : {
                  current,
                  onChange: setPage,
                  pageSize: 10,
                  showSizeChanger: false,
                  hideOnSinglePage: true,
                }
          }
          locale={{ emptyText: empty }}
          columns={[
            {
              title: "Mã phiếu",
              dataIndex: "code",
              width: compact ? 150 : 185,
              render: (code, ticket) => (
                <Button
                  type="link"
                  className="ticket-link"
                  onClick={() => onSelect(ticket)}
                >
                  {code}
                </Button>
              ),
            },
            {
              title: "Khu vực",
              dataIndex: "zone_code",
              render: (code) => (
                <>
                  <strong>
                    {zones.find((item) => item.code === code)?.name || code}
                  </strong>
                  <small className="cell-note">{code}</small>
                </>
              ),
            },
            {
              title: "Nguồn tin",
              dataIndex: "source",
              hidden: compact,
              render: (source: Ticket["source"]) => (
                <Tag
                  color={
                    source === "emergency"
                      ? "red"
                      : source === "both"
                        ? "purple"
                        : "default"
                  }
                >
                  {sourceLabels[source]}
                </Tag>
              ),
            },
            {
              title: "Ưu tiên",
              dataIndex: "priority",
              hidden: compact,
              render: priorityTag,
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              render: (status: Ticket["status"]) => (
                <Tag color={status === "closed" ? "green" : "blue"}>
                  {statusLabels[status]}
                </Tag>
              ),
            },
            {
              title: "Thời hạn còn lại",
              key: "due",
              render: (_, ticket) => {
                const value = remaining(ticket, now);
                return (
                  <span className={value.overdue ? "overdue" : "muted"}>
                    {value.overdue && <ClockCircleOutlined aria-hidden />}{" "}
                    {value.text}
                  </span>
                );
              },
            },
          ]}
        />
      )}
    </>
  );
}
