from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import fitz


ROOT = Path(__file__).resolve().parents[3]
PORTFOLIO = ROOT / "Fanny" / "portfolio"
ASSETS = PORTFOLIO / "assets" / "projects"
OUT_DIR = ROOT / "output" / "pdf"
QA_DIR = PORTFOLIO / "_qa" / "share-pdf"
OUT_PDF = OUT_DIR / "fanny-portfolio-share-2026.pdf"

W, H = 2400, 1350
M = 118

COLORS = {
    "bg": (5, 5, 7),
    "panel": (14, 17, 25),
    "ink": (246, 248, 255),
    "muted": (170, 177, 196),
    "dim": (98, 106, 130),
    "cyan": (62, 231, 255),
    "lime": (199, 255, 53),
    "coral": (255, 77, 109),
    "cobalt": (95, 124, 255),
}

FONT_DISPLAY = Path("C:/Windows/Fonts/bahnschrift.ttf")
FONT_COND = Path("C:/Windows/Fonts/ARIALNB.TTF")
FONT_BODY = Path("C:/Windows/Fonts/segoeui.ttf")
FONT_BODY_BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")
FONT_BODY_LIGHT = Path("C:/Windows/Fonts/segoeuil.ttf")


def font(path, size):
    return ImageFont.truetype(str(path), size=size)


DISPLAY_220 = font(FONT_DISPLAY, 220)
DISPLAY_178 = font(FONT_DISPLAY, 178)
DISPLAY_132 = font(FONT_DISPLAY, 132)
COND_84 = font(FONT_COND, 84)
COND_64 = font(FONT_COND, 64)
BODY_42 = font(FONT_BODY, 42)
BODY_36 = font(FONT_BODY, 36)
BODY_31 = font(FONT_BODY, 31)
BODY_28 = font(FONT_BODY, 28)
BODY_24 = font(FONT_BODY, 24)
BODY_BOLD_30 = font(FONT_BODY_BOLD, 30)
BODY_BOLD_42 = font(FONT_BODY_BOLD, 42)
BODY_LIGHT_54 = font(FONT_BODY_LIGHT, 54)


def new_page(accent=COLORS["cyan"]):
    img = Image.new("RGB", (W, H), COLORS["bg"])
    draw = ImageDraw.Draw(img, "RGBA")
    draw.polygon(
        [(W * 0.58, 0), (W, 0), (W, H * 0.46), (W * 0.78, H * 0.38)],
        fill=(*accent, 38),
    )
    draw.polygon(
        [(W * 0.08, H), (W * 0.43, H), (W * 0.28, H * 0.78), (0, H * 0.88)],
        fill=(95, 124, 255, 26),
    )
    return img


def add_label(draw, xy, text, color=None):
    color = color or COLORS["muted"]
    draw.text(xy, text.upper(), fill=color, font=BODY_BOLD_30, spacing=8)


def text_box(draw, xy, text, max_width, font_obj, fill, line_gap=10):
    words = text.split()
    lines = []
    line = ""
    for word in words:
        test = word if not line else f"{line} {word}"
        if draw.textbbox((0, 0), test, font=font_obj)[2] <= max_width:
            line = test
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    x, y = xy
    line_h = draw.textbbox((0, 0), "Ag", font=font_obj)[3] + line_gap
    for current in lines:
        draw.text((x, y), current, fill=fill, font=font_obj)
        y += line_h
    return y


def cover_fit(path, size):
    src = Image.open(path).convert("RGB")
    sw, sh = src.size
    tw, th = size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    src = src.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return src.crop((left, top, left + tw, top + th))


def paste_photo(page, path, box, accent, radius=34, wash=True):
    x, y, w, h = box
    photo = cover_fit(path, (w, h))
    mask = Image.new("L", (w, h), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    if wash:
        overlay = Image.new("RGBA", (w, h), (*accent, 34))
        photo = Image.alpha_composite(photo.convert("RGBA"), overlay).convert("RGB")
    page.paste(photo, (x, y), mask)
    draw = ImageDraw.Draw(page, "RGBA")
    draw.rounded_rectangle((x, y, x + w, y + h), radius=radius, outline=(246, 248, 255, 28), width=2)


def draw_rule(draw, x, y1, y2, accent):
    draw.line((x, y1, x, y2), fill=(*accent, 210), width=5)


def page_cover():
    page = new_page(COLORS["cyan"])
    draw = ImageDraw.Draw(page, "RGBA")
    paste_photo(page, ASSETS / "restaurante-arrogante" / "comedor-render.jpeg", (930, 90, 1288, 1088), COLORS["cyan"], radius=48)
    draw.rectangle((0, 0, W, H), fill=(5, 5, 7, 16))
    draw.rectangle((0, 0, 980, H), fill=(5, 5, 7, 184))
    add_label(draw, (M, 116), "Portafolio 2026", COLORS["cyan"])
    draw.text((M, 270), "ESTEFANÍA", fill=COLORS["ink"], font=DISPLAY_220)
    draw.text((M, 468), "FARÍAS", fill=COLORS["ink"], font=DISPLAY_220)
    draw_rule(draw, M + 12, 780, 1102, COLORS["cyan"])
    text_box(draw, (M + 46, 790), "Diseño de ambientes, modelado 3D e interiorismo comercial con foco en espacios gastronómicos y experiencias de marca.", 790, BODY_LIGHT_54, COLORS["ink"], 16)
    draw.text((M, H - 152), "Viña del Mar, Chile", fill=COLORS["muted"], font=BODY_31)
    draw.text((M, H - 104), "renders.sol@gmail.com", fill=COLORS["cyan"], font=BODY_31)
    draw.text((W - 304, H - 144), "EF", fill=COLORS["cyan"], font=DISPLAY_132)
    return page


def page_manifesto():
    page = new_page(COLORS["lime"])
    draw = ImageDraw.Draw(page, "RGBA")
    paste_photo(page, ASSETS / "render-obra-ejecutada" / "arrogante-obra-ejecutada.jpeg", (1260, 86, 790, 500), COLORS["lime"], radius=36)
    paste_photo(page, ASSETS / "lil-silly-co" / "muro-rojo-render.jpeg", (1516, 650, 676, 488), COLORS["coral"], radius=36)
    draw.polygon([(120, 170), (710, 92), (650, 1092), (66, 1190)], fill=(*COLORS["lime"], 42))
    draw.text((M, 145), "VISUALIZAR", fill=COLORS["ink"], font=DISPLAY_178)
    draw.text((M, 315), "ANTES DE", fill=COLORS["ink"], font=DISPLAY_178)
    draw.text((M, 485), "CONSTRUIR", fill=COLORS["lime"], font=DISPLAY_178)
    draw.rectangle((1220, 860, 2200, 1168), fill=(5, 5, 7, 198))
    draw_rule(draw, 1272, 902, 1116, COLORS["lime"])
    text_box(draw, (1328, 904), "La imagen no acompaña el portafolio. Es la evidencia principal: concepto, atmósfera, materialidad y ejecución.", 760, BODY_42, COLORS["ink"], 14)
    return page


def project_page(title, label, body, paths, accent, reverse=False):
    page = new_page(accent)
    draw = ImageDraw.Draw(page, "RGBA")
    photo_x = 650 if not reverse else 124
    text_x = 126 if not reverse else 1510
    paste_photo(page, paths[0], (photo_x, 94, 1450, 906), accent, radius=44)
    paste_photo(page, paths[1], (photo_x + 38, 1048, 492, 240), accent, radius=24)
    paste_photo(page, paths[2], (photo_x + 570, 1048, 492, 240), accent, radius=24)
    draw.rectangle((text_x - 36, 126, text_x + 626, 1016), fill=(5, 5, 7, 186))
    add_label(draw, (text_x, 166), label, accent)
    words = title.upper().split()
    y = 270
    for word in words:
        draw.text((text_x, y), word, fill=COLORS["ink"], font=COND_84)
        y += 86
    text_box(draw, (text_x, min(y + 30, 696)), body, 520, BODY_31, COLORS["muted"], 10)
    draw_rule(draw, text_x + 4, 882, 1002, accent)
    draw.text((text_x + 38, 908), "Imagen principal", fill=COLORS["ink"], font=BODY_BOLD_42)
    return page


def page_proof():
    page = new_page(COLORS["cyan"])
    draw = ImageDraw.Draw(page, "RGBA")
    add_label(draw, (M, 118), "Prueba de fidelidad", COLORS["cyan"])
    draw.text((M, 210), "DEL RENDER", fill=COLORS["ink"], font=DISPLAY_132)
    draw.text((M, 336), "A LA OBRA", fill=COLORS["cyan"], font=DISPLAY_132)
    text_box(draw, (M, 530), "La comparación se convierte en argumento visual: proyecto, promesa y resultado.", 650, BODY_36, COLORS["muted"], 12)
    pairs = [
        (
            "Restaurante Arrogante",
            ASSETS / "render-obra-ejecutada" / "arrogante-render-3d.jpeg",
            ASSETS / "render-obra-ejecutada" / "arrogante-obra-ejecutada.jpeg",
            COLORS["lime"],
            830,
        ),
        (
            "Lil Silly Co.",
            ASSETS / "render-obra-ejecutada" / "lil-silly-render-3d.jpeg",
            ASSETS / "render-obra-ejecutada" / "lil-silly-obra-ejecutada.jpeg",
            COLORS["coral"],
            1612,
        ),
    ]
    for name, render, real, accent, x in pairs:
        draw.text((x, 136), name, fill=accent, font=BODY_BOLD_42)
        paste_photo(page, render, (x, 220, 660, 430), accent, radius=30)
        paste_photo(page, real, (x, 714, 660, 430), accent, radius=30)
        draw.text((x, 664), "Render 3D", fill=COLORS["muted"], font=BODY_28)
        draw.text((x, 1158), "Obra ejecutada", fill=COLORS["muted"], font=BODY_28)
    return page


def page_contact():
    page = new_page(COLORS["cobalt"])
    draw = ImageDraw.Draw(page, "RGBA")
    paste_photo(page, ASSETS / "carrusel-bagovit" / "detalle-luces-render.jpeg", (832, 86, 1330, 1094), COLORS["cobalt"], radius=52)
    draw.rectangle((0, 0, W, H), fill=(5, 5, 7, 20))
    draw.rectangle((0, 0, 904, H), fill=(5, 5, 7, 194))
    add_label(draw, (M, 120), "Contacto", COLORS["cobalt"])
    draw.text((M, 270), "ESTEFANÍA", fill=COLORS["ink"], font=DISPLAY_178)
    draw.text((M, 438), "FARÍAS", fill=COLORS["ink"], font=DISPLAY_178)
    draw_rule(draw, M + 6, 724, 1072, COLORS["cobalt"])
    y = text_box(draw, (M + 46, 730), "Diseñadora de Ambientes", 650, BODY_LIGHT_54, COLORS["ink"], 16)
    y += 54
    for line in ["Viña del Mar, Chile", "renders.sol@gmail.com", "+56 9 3306 8417", "linkedin.com/in/estefania-farias-ambientes-3d"]:
        draw.text((M + 46, y), line, fill=COLORS["muted"], font=BODY_31)
        y += 54
    return page


def build_pages():
    return [
        page_cover(),
        page_manifesto(),
        project_page(
            "Restaurante Arrogante",
            "Interiorismo gastronómico",
            "Curvas, verde salvia, madera en espiga y vegetación interior para un restaurante con presencia escénica.",
            [
                ASSETS / "restaurante-arrogante" / "comedor-render.jpeg",
                ASSETS / "restaurante-arrogante" / "muro-verde-render.jpeg",
                ASSETS / "restaurante-arrogante" / "detalle-interior-render.jpeg",
            ],
            COLORS["lime"],
        ),
        project_page(
            "Lil Silly Co.",
            "Concepto comercial",
            "Un espacio joven y gráfico: rojo profundo, ilustraciones de alto contraste y cielo perforado de luces cálidas.",
            [
                ASSETS / "lil-silly-co" / "muro-rojo-render.jpeg",
                ASSETS / "lil-silly-co" / "comedor-render-01.jpeg",
                ASSETS / "lil-silly-co" / "comedor-render-02.jpeg",
            ],
            COLORS["coral"],
            reverse=True,
        ),
        project_page(
            "Carrusel Bagovit",
            "Escenografía de marca",
            "Pieza modelada en 3D para anticipar luz, textura, volumen y fotografía desde múltiples ángulos.",
            [
                ASSETS / "carrusel-bagovit" / "carrusel-render.jpeg",
                ASSETS / "carrusel-bagovit" / "vista-frontal-render.jpeg",
                ASSETS / "carrusel-bagovit" / "detalle-luces-render.jpeg",
            ],
            COLORS["cobalt"],
        ),
        page_proof(),
        page_contact(),
    ]


def save_pdf(pages):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rgb_pages = [p.convert("RGB") for p in pages]
    rgb_pages[0].save(OUT_PDF, save_all=True, append_images=rgb_pages[1:], resolution=150.0)


def render_qa():
    QA_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(OUT_PDF)
    thumbs = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(0.33, 0.33), alpha=False)
        out = QA_DIR / f"page-{i + 1:02d}.png"
        pix.save(out)
        thumbs.append(Image.open(out).convert("RGB"))
    cols = 2
    tw, th = thumbs[0].size
    sheet = Image.new("RGB", (tw * cols, th * ((len(thumbs) + 1) // cols)), (18, 18, 22))
    for idx, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((idx % cols) * tw, (idx // cols) * th))
    sheet.save(QA_DIR / "contact-sheet.png", quality=95)
    return doc.page_count


def main():
    pages = build_pages()
    save_pdf(pages)
    count = render_qa()
    print(f"Wrote {OUT_PDF}")
    print(f"Rendered {count} pages to {QA_DIR}")


if __name__ == "__main__":
    main()
