"""Vector hoá ảnh mặt bằng khuôn viên UET Hoà Lạc cho dashboard.

    python -I scripts/campus/vectorize.py [docs/assets/campus/uet-campus-plan.png]

Sinh ra:
- frontend/admin/public/maps/uet-campus-base.svg: lớp nền tĩnh (đường, hồ, cây xanh, dải màu, bãi xe)
- frontend/admin/src/components/campusPlan.ts: đường bao 5 toà nhà (bấm được), chi tiết Nhà đa năng, vị trí cổng

Cách làm: xoá chữ/biểu tượng trên ảnh, phóng to 4 lần, phân lớp từng pixel theo màu gần nhất,
dò đường bao (OpenCV) rồi giản lược đa giác. Nét đường mảnh được dò như dải mỏng có tô.
Cần: opencv-python, numpy, Pillow. Đổi ảnh gốc thì kiểm tra lại các khung toạ độ bên dưới.
"""
import os
import re
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "docs/assets/campus/uet-campus-plan.png")
OUT_SVG = os.path.join(ROOT, "frontend/admin/public/maps/uet-campus-base.svg")
OUT_TS = os.path.join(ROOT, "frontend/admin/src/components/campusPlan.ts")
UP = 4  # phóng to để nét 1px thành dải đủ dày khi dò đường bao

rgb = np.array(Image.open(SRC).convert("RGB")).astype(np.int16)
H, W = rgb.shape[:2]

WHITE = (255, 255, 255)
BLDG = (201, 202, 197)
DN = (162, 162, 162)
DOME = (219, 222, 227)
RING = (141, 148, 166)
PURPLE = (169, 68, 186)
YELLOW = (254, 251, 84)
CYAN = (133, 251, 251)

# --- 1. Xoá chữ, biểu tượng, khung chú thích (vẽ lại bằng SVG) ---
rgb[648:H, 0:222] = WHITE  # khung "CHÚ THÍCH" bị cắt ở góc ảnh
rgb[54:88, 66:106] = PURPLE  # biểu tượng nhóm người
LABELS = {  # khung sát chữ (x0, y0, x1, y1) và màu nền toà
    "UET4": ((162, 91, 193, 104), BLDG),
    "UET3": ((242, 175, 296, 193), BLDG),
    "DN": ((455, 230, 493, 254), DN),
    "UET2": ((351, 472, 397, 489), BLDG),
    "UET1": ((536, 471, 589, 490), BLDG),
}
for (x0, y0, x1, y1), fill in LABELS.values():
    box = rgb[y0:y1, x0:x1]
    box[np.abs(box - np.array(fill)).sum(axis=2) > 25] = fill
for (x0, y0, x1, y1), band in (((256, 508, 284, 538), YELLOW), ((410, 676, 440, 706), CYAN)):
    box = rgb[y0:y1, x0:x1]  # chốt bảo vệ; biểu tượng cổng trên dashboard che lại chỗ này
    box[np.abs(box - np.array(band)).sum(axis=2) > 40] = band

# --- 2. Phân lớp theo màu gần nhất ---
palette = {
    "white": WHITE,
    "building": BLDG,
    "dn": DN,
    "dome": DOME,
    "ring": RING,
    "purple": PURPLE,
    "green": (99, 134, 76),
    "green2": (81, 110, 64),  # vòng cây quanh hồ, cùng lớp "green"
    "water": (98, 137, 176),
    "cyan": CYAN,
    "yellow": YELLOW,
    "red": (213, 62, 39),
}
names = list(palette)
big = cv2.resize(rgb.astype(np.uint8), (W * UP, H * UP), interpolation=cv2.INTER_CUBIC).astype(np.int16)
lum = big.mean(axis=2)
best = np.full(lum.shape, 10**6, np.int32)
cls = np.zeros(lum.shape, np.int8)
for i, col in enumerate(palette.values()):
    d = np.abs(big - np.array(col)).sum(axis=2)
    better = d < best
    best[better] = d[better]
    cls[better] = i

# Bãi đỗ xe (vạch chéo) ở góc dưới phải: gộp thành một khối
park = np.zeros(lum.shape, np.uint8)
py0, py1, px0, px1 = 655 * UP, 705 * UP, 720 * UP, W * UP
sub = (lum[py0:py1, px0:px1] < 200).astype(np.uint8)
park[py0:py1, px0:px1] = cv2.morphologyEx(sub, cv2.MORPH_CLOSE, np.ones((5 * UP, 5 * UP), np.uint8))

# Nét đường: dò ở độ phân giải gốc (xám đậm, không phải màu tô của toà nhà) rồi phóng to mặt nạ
o_lum = rgb.mean(axis=2)
o_sat = rgb.max(axis=2) - rgb.min(axis=2)
fill_like = np.zeros(o_lum.shape, bool)
for col in (BLDG, DN, DOME, RING):
    fill_like |= np.abs(rgb - np.array(col)).sum(axis=2) < 25
o_line = ((o_lum < 200) & (o_sat < 30) & ~fill_like).astype(np.float32)
line = (cv2.resize(o_line, (W * UP, H * UP), interpolation=cv2.INTER_LINEAR) > 0.35).astype(np.uint8)
line[park == 1] = 0


# --- 3. Dò đường bao ---
def polygons(mask, eps=1.6, min_area=60 * UP * UP, close=3, holes=True):
    mask = mask.astype(np.uint8)
    if close:
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((close, close), np.uint8))
    contours, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    if hier is None:
        return out
    hier = hier[0]
    for i, c in enumerate(contours):
        if hier[i][3] != -1 or cv2.contourArea(c) < min_area:
            continue  # lỗ được thêm cùng đường bao cha
        rings = [c]
        child = hier[i][2]
        while holes and child != -1:
            if cv2.contourArea(contours[child]) >= min_area / 4:
                rings.append(contours[child])
            child = hier[child][0]
        d = ""
        for r in rings:
            a = cv2.approxPolyDP(r, eps, True).reshape(-1, 2) / UP
            if len(a) >= 3:
                d += "M" + " ".join(f"{x:.1f} {y:.1f}" for x, y in a) + "Z"
        m = cv2.moments(c)
        out.append({"d": d, "cx": m["m10"] / m["m00"] / UP, "cy": m["m01"] / m["m00"] / UP})
    return out


def path(mask, **kw):
    return "".join(p["d"] for p in polygons(mask, **kw))


def of(*members):
    return np.isin(cls, [names.index(x) for x in members]) & (line == 0) & (park == 0)


layers = {k: path(of(*m)) for k, m in {
    "water": ["water"], "green": ["green", "green2"], "yellow": ["yellow"], "cyan": ["cyan"],
    "purple": ["purple"], "red": ["red"], "dn": ["dn"], "ring": ["ring"], "dome": ["dome"],
}.items()}
layers["parking"] = path(park, eps=2.0, close=0, holes=False)
layers["lines"] = path(line, eps=2.0, min_area=6 * UP * UP, close=0)

# Toà nhà: tách 5 toà chính theo tâm, phần còn lại (nhà phụ) vào lớp nền
CENTERS = {"UET1": (519, 480), "UET2": (371, 477), "UET3": (289, 163), "UET4": (177, 99), "DN": (452, 256)}
main, annex = {}, []
for p in polygons(of("building"), eps=2.4):
    code = next((k for k, (x, y) in CENTERS.items() if abs(p["cx"] - x) < 6 and abs(p["cy"] - y) < 6), None)
    if code:
        main[code] = p["d"]
    else:
        annex.append(p["d"])
missing = set(CENTERS) - set(main)
assert not missing, f"Không tìm thấy toà {missing}: kiểm tra lại CENTERS"

# --- 4. Ghi lớp nền SVG ---
FONT = "Segoe UI, Roboto, Arial, sans-serif"
people = (
    '<g transform="translate(86 71)" fill="#fff">'
    '<circle cx="-9" cy="-7" r="3.2"/><circle cx="9" cy="-7" r="3.2"/><circle cx="-4.5" cy="-9" r="3.2"/>'
    '<circle cx="4.5" cy="-9" r="3.2"/><circle cx="0" cy="-5" r="3.6"/>'
    '<path d="M-13 9v-9q0-3 4-3t4 3v9zM5 9v-9q0-3 4-3t4 3v9zM-8 6v-10q0-3 3.5-3t3.5 3v10zM1 6v-10q0-3 3.5-3t3.5 3v10z'
    'M-4.5 11v-10q0-3.4 4.5-3.4t4.5 3.4v10z" stroke="#a944ba" stroke-width="1"/></g>'
)
fills = [("water", "#6289b0"), ("green", "#63864c"), ("yellow", "#fefb54"), ("cyan", "#85fbfb"),
         ("purple", "#a944ba"), ("red", "#d53e27")]
body = [f'<path id="{k}" d="{layers[k]}" fill="{c}" fill-rule="evenodd"/>' for k, c in fills]
body.append(f'<path id="annex" d="{"".join(annex)}" fill="#c9cac5" fill-rule="evenodd"/>')
body.append(f'<path id="parking" d="{layers["parking"]}" fill="#5b5b5b"/>')
body.append(f'<text x="795" y="693" text-anchor="middle" font-family="{FONT}" font-size="20" font-weight="800" fill="#fff">P</text>')
body.append(people)
body.append(f'<path id="lines" d="{layers["lines"]}" fill="#1b1b1b" fill-rule="evenodd"/>')
os.makedirs(os.path.dirname(OUT_SVG), exist_ok=True)
with open(OUT_SVG, "w", encoding="utf8") as f:
    f.write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">\n'
        "<!-- Mặt bằng khuôn viên UET Hoà Lạc: lớp nền tĩnh, sinh bởi scripts/campus/vectorize.py. "
        "Toà nhà và cổng vẽ trong CampusMap.tsx. -->\n" + "\n".join(body) + "\n</svg>\n"
    )

# --- 5. Ghi module TypeScript ---
INFO = {  # tên, số tầng, vị trí nhãn (giữa chữ trên ảnh gốc)
    "UET1": ("Toà UET1", 5, (562, 481)),
    "UET2": ("Toà UET2", 5, (374, 481)),
    "UET3": ("Toà UET3", 5, (269, 184)),
    "UET4": ("Toà UET4", 4, (177, 98)),
    "DN": ("Nhà đa năng", 2, (474, 243)),
}
ts = [
    "/**",
    f" * Mặt bằng khuôn viên UET Hoà Lạc, vector hoá từ ảnh quy hoạch ({W} × {H} px).",
    " * Sinh bởi scripts/campus/vectorize.py từ docs/assets/campus/uet-campus-plan.png — chạy lại script, không sửa tay.",
    " * Lớp nền tĩnh (đường, hồ, cây xanh, bãi xe): public/maps/uet-campus-base.svg.",
    " */",
    "",
    f"export const CAMPUS_SIZE = {{ width: {W}, height: {H} }} as const;",
    "",
    "export interface CampusBuilding {",
    "  code: string;",
    "  name: string;",
    "  floors: number;",
    "  /** Đường bao toà nhà (SVG path, toạ độ ảnh) */",
    "  d: string;",
    "  label: { x: number; y: number };",
    "}",
    "",
    "export const CAMPUS_BUILDINGS: CampusBuilding[] = [",
]
for code, (name, floors, (x, y)) in INFO.items():
    ts.append(f'  {{ code: "{code}", name: "{name}", floors: {floors}, label: {{ x: {x}, y: {y} }}, d: "{main[code]}" }},')
ts += [
    "];",
    "",
    "/** Chi tiết Nhà đa năng: hai khối sân (xám đậm), vành mái và mái vòm */",
    "export const DN_DETAIL = {",
    f'  halls: "{layers["dn"]}",',
    f'  ring: "{layers["ring"]}",',
    f'  dome: "{layers["dome"]}",',
    "};",
    "",
    "/**",
    " * Vị trí cổng trên ảnh (toạ độ ảnh). Cổng 1, 2 đặt đúng biểu tượng chốt bảo vệ trên bản vẽ;",
    " * Cổng 3 không có trên ảnh (bị cắt), tạm đặt ở lối vào phía bãi đỗ xe — chờ xác nhận.",
    " */",
    "export const CAMPUS_GATES: Record<string, { x: number; y: number; provisional?: boolean }> = {",
    '  "CONG-1": { x: 425, y: 691 },',
    '  "CONG-2": { x: 270, y: 523 },',
    '  "CONG-3": { x: 748, y: 640, provisional: true },',
    "};",
    "",
]
with open(OUT_TS, "w", encoding="utf8") as f:
    f.write("\n".join(ts))
print(f"{os.path.relpath(OUT_SVG, ROOT)}: {os.path.getsize(OUT_SVG) // 1024} KB")
print(f"{os.path.relpath(OUT_TS, ROOT)}: {os.path.getsize(OUT_TS) // 1024} KB")
