from flask import Flask, request, send_file, jsonify
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX, WD_LINE_SPACING
from docx.shared import RGBColor, Inches, Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.table import WD_TABLE_ALIGNMENT
import io
import os
import re
import requests


app = Flask(__name__)
# app.run(host="0.0.0.0", port=8001)
# -------------------------------------------------------------------
# Base templates for TipTap → DOCX (your existing flow)
# -------------------------------------------------------------------

BASE_DIR = os.path.dirname(__file__)

BASE_TEMPLATE = os.path.join(BASE_DIR, "base.docx")
PROPOSAL_BASE_TEMPLATE = os.path.join(BASE_DIR, "base_proposal.docx")

# -------------------------------------------------------------------
# DOCX master templates for Legal drafts (11-month rental etc.)
# -------------------------------------------------------------------

DOCX_TEMPLATES = {
    # 🔹 Used for: rental-agreement-11-months via /generate-legal-docx
    "rental_agreement_11_months": os.path.join(
        BASE_DIR, "templates", "rental_agreement_11_months.docx"
    ),
    # Add more keys for legal-docx endpoint as needed
}

# -------------------------------------------------------------------
# DOCX base templates for editor-driven documents
# Keys here are **design keys** (or slugs when you want same design).
# These are used only for /generate-docx (editor export).
# -------------------------------------------------------------------

EDITOR_BASE_TEMPLATES = {
    # Modern blue offer header/footer
    "offer_modern_blue": os.path.join(
        BASE_DIR, "templates", "offer_letter_modern_blue.docx"
    ),
    "offer_green_wave": os.path.join(
        BASE_DIR, "templates", "offer_letter_green_wave.docx"
    ),

    # Backward-compat: if something still sends the slug instead of designKey
    "offer-letter-standard": os.path.join(
        BASE_DIR, "templates", "offer_letter_modern_blue.docx"
    ),
    "proposal_modern_blue": os.path.join(BASE_DIR, "templates", "proposal_modern_blue.docx"),
    # You can add more when you create extra designs:
    # "offer_classic_border": os.path.join(BASE_DIR, "templates", "offer_letter_classic_border.docx"),
    # "noc_plain": os.path.join(BASE_DIR, "templates", "noc_employee_visa_plain.docx"),
    # "rental_plain": os.path.join(BASE_DIR, "templates", "rental_agreement_11_months.docx"),
}

# NOTE: we intentionally DO NOT include "visa-expiration-letter" here.
# That means visa letters will now use BASE_TEMPLATE → no header/footer,
# matching what you see inside the editor.

# -------------------------------------------------------------------
# Helpers for TipTap → DOCX
# -------------------------------------------------------------------


def configure_document_styles(document: Document) -> None:
    """
    Ensure clean, modern defaults regardless of which base file we load.
    We only apply this for generic base.docx / base_proposal.docx,
    not for highly-designed templates.
    """
    styles = document.styles

    try:
        normal = styles["Normal"]
        normal.font.name = "Calibri"
        normal.font.size = Pt(12)
    except KeyError:
        pass

    for style_name, size in [("Heading 1", 16), ("Heading 2", 13)]:
        try:
            s = styles[style_name]
            s.font.name = "Calibri"
            s.font.size = Pt(size)
            s.font.bold = True
        except KeyError:
            continue


def remove_table_borders(table):
    """Used only for the signature-block table."""
    tbl = table._tbl
    tblPr = tbl.tblPr
    if tblPr is None:
        tblPr = OxmlElement("w:tblPr")
        tbl.append(tblPr)

    for child in list(tblPr):
        if child.tag == qn("w:tblBorders"):
            tblPr.remove(child)

    tblBorders = OxmlElement("w:tblBorders")
    for border_name in ("top", "left", "bottom", "right", "insideH", "insideV"):
        elem = OxmlElement(f"w:{border_name}")
        elem.set(qn("w:val"), "nil")
        tblBorders.append(elem)

    tblPr.append(tblBorders)


def apply_body_spacing(paragraph, line_height=None):
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(0)
    fmt.space_after = Pt(8)  # 👈 THIS is what you're missing

    # TipTap sends something like "1", "1.15", "1.5", "2"
    if line_height is None:
        fmt.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
        fmt.line_spacing = 1.3
        return

    try:
        lh = float(str(line_height).strip())
    except Exception:
        fmt.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
        fmt.line_spacing = 1.3
        return

    # Map common Google Docs values
    if abs(lh - 1.0) < 0.01:
        fmt.line_spacing_rule = WD_LINE_SPACING.SINGLE
    elif abs(lh - 1.5) < 0.01:
        fmt.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    elif abs(lh - 2.0) < 0.01:
        fmt.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    else:
        # fallback: multiple
        fmt.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
        fmt.line_spacing = lh



def add_text_runs_from_tiptap(content_nodes, paragraph):
    if not content_nodes:
        return

    for node in content_nodes:
        if node.get("type") != "text":
            continue

        text = node.get("text", "")
        marks = node.get("marks", []) or []

        bold = any(m.get("type") == "bold" for m in marks)
        italic = any(m.get("type") == "italic" for m in marks)
        underline = any(m.get("type") == "underline" for m in marks)

        color = None
        highlight = None
        font_size = None

        for m in marks:
            mtype = m.get("type")
            attrs = m.get("attrs", {}) or {}

            if mtype == "textStyle":
                if "color" in attrs:
                    color = attrs.get("color")

            elif mtype == "highlight":
                highlight = attrs.get("color") or "yellow"

            elif mtype == "fontSize":
                font_size = attrs.get("size")

        run = paragraph.add_run(text)
        run.bold = bold or None
        run.italic = italic or None
        run.underline = underline or None

        if (
            color
            and isinstance(color, str)
            and color.startswith("#")
            and len(color) == 7
        ):
            try:
                r = int(color[1:3], 16)
                g = int(color[3:5], 16)
                b = int(color[5:7], 16)
                run.font.color.rgb = RGBColor(r, g, b)
            except ValueError:
                pass
        else:
            run.font.color.rgb = RGBColor(0, 0, 0)

        if font_size and isinstance(font_size, str):
            digits = "".join(ch for ch in font_size if ch.isdigit())
            if digits:
                try:
                    size_pt = int(digits)
                    run.font.size = Pt(size_pt)
                except ValueError:
                    pass

        if highlight:
            run.font.highlight_color = WD_COLOR_INDEX.YELLOW


def paragraph_has_visible_text(node) -> bool:
    """Check if a TipTap paragraph node actually contains non-empty text."""
    content = node.get("content", []) or []
    for child in content:
        if child.get("type") == "text" and child.get("text", "").strip():
            return True
    return False


def render_paragraph_node_into(paragraph, node) -> None:
    if not paragraph_has_visible_text(node):
        paragraph.paragraph_format.space_after = Pt(8)
        return

    add_text_runs_from_tiptap(node.get("content", []), paragraph)
    attrs = node.get("attrs", {}) or {}
    apply_body_spacing(paragraph, attrs.get("lineHeight"))

    attrs = node.get("attrs", {}) or {}
    text_align = attrs.get("textAlign", "left")

    if text_align == "center":
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif text_align == "right":
        paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    elif text_align == "justify":
        paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    else:
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT


def shade_cell(cell, fill_hex: str) -> None:
    """
    Lightly shade a table cell background (used for header row).
    fill_hex: like 'F8FAFC' (no #).
    """
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill_hex)
    tcPr.append(shd)


def extract_column_widths(rows_data, num_cols):
    """
    Read TipTap's colwidth info from cell attrs and return a list
    [w0, w1, ...] in px or None.
    """
    col_px = [None] * num_cols
    for row in rows_data:
        cells = row.get("content", []) or []
        for idx, cell_node in enumerate(cells):
            if idx >= num_cols:
                break
            attrs = cell_node.get("attrs", {}) or {}
            colwidth = attrs.get("colwidth")
            if isinstance(colwidth, list) and colwidth:
                w = colwidth[0]
                if col_px[idx] is None and w is not None:
                    col_px[idx] = w
    return col_px


def render_table_node(table_node, document: Document) -> None:
    """
    Convert a TipTap 'table' node into a python-docx table.

    - Supports arbitrary rows/cols.
    - Approximates TipTap column widths.
    - Clamps total width so it doesn't go outside the page.
    - Adds a light header background similar to the editor.
    """
    rows_data = table_node.get("content", []) or []
    if not rows_data:
        return

    num_rows = len(rows_data)
    num_cols = 0
    for row in rows_data:
        cells = row.get("content", []) or []
        if len(cells) > num_cols:
            num_cols = len(cells)

    if num_cols == 0:
        return

    table = document.add_table(rows=num_rows, cols=num_cols)
    table.autofit = True
    table.alignment = WD_TABLE_ALIGNMENT.CENTER  # center on page

    HEADER_FILL = "F8FAFC"  # light grey/blue like editor header

    # ---- Fill the cells with text, bold header row, shading ----
    for r_idx, row_node in enumerate(rows_data):
        cells_data = row_node.get("content", []) or []
        for c_idx in range(min(num_cols, len(cells_data))):
            cell_node = cells_data[c_idx]
            cell = table.rows[r_idx].cells[c_idx]

            # Clear default paragraph text
            for p in cell.paragraphs:
                p.text = ""

            # Only paragraphs inside the cell
            para_nodes = [
                c for c in (cell_node.get("content", []) or [])
                if c.get("type") == "paragraph"
            ]
            if not para_nodes:
                continue

            first_para = cell.paragraphs[0]
            render_paragraph_node_into(first_para, para_nodes[0])

            for extra_node in para_nodes[1:]:
                extra_p = cell.add_paragraph()
                render_paragraph_node_into(extra_p, extra_node)

            # Header styling
            if cell_node.get("type") == "tableHeader":
                for p in cell.paragraphs:
                    for run in p.runs:
                        run.bold = True
                shade_cell(cell, HEADER_FILL)

    # ---- Try to respect TipTap column widths ----
    col_px_raw = extract_column_widths(rows_data, num_cols)

    # Normalize to floats or None
    cleaned_px = []  # list of floats or None
    for w in col_px_raw:
        if isinstance(w, (int, float)):
            cleaned_px.append(float(w))
        elif isinstance(w, str) and w.strip():
            try:
                cleaned_px.append(float(w))
            except ValueError:
                cleaned_px.append(None)
        else:
            cleaned_px.append(None)

    valid_px = [w for w in cleaned_px if isinstance(w, float)]
    if valid_px:
        total_px = sum(valid_px)
        if total_px > 0:
            # Use a safe max total width so table never goes outside page.
            # ~6" is inside normal A4/Letter text area.
            max_total_in = 6.0

            table.autofit = False
            for idx, w in enumerate(cleaned_px):
                if not isinstance(w, float) or idx >= len(table.columns):
                    continue

                frac = w / total_px
                width_in = max_total_in * frac
                # keep reasonable minimum so columns don't disappear
                if width_in < 0.5:
                    width_in = 0.5

                for cell in table.columns[idx].cells:
                    cell.width = Inches(width_in)


def compute_image_width_inches(attrs: dict) -> float:
    """
    Convert TipTap image width (px) to a safe width in inches.
    Falls back to 4.0" if no width is stored.
    """
    default_width_in = 4.0
    max_width_in = 6.0  # don't let image be wider than text area

    width_px = None
    w_attr = attrs.get("width")

    # Common case: ResizableImage stores the width directly
    if isinstance(w_attr, (int, float)):
        width_px = float(w_attr)
    elif isinstance(w_attr, str):
        try:
            width_px = float(w_attr)
        except ValueError:
            width_px = None

    # Fallback: sometimes only stored inside a style string
    if width_px is None:
        style = attrs.get("style")
        if isinstance(style, str) and "width" in style:
            m = re.search(r"width:\s*([0-9.]+)px", style)
            if m:
                try:
                    width_px = float(m.group(1))
                except ValueError:
                    width_px = None

    if width_px is None:
        return default_width_in

    # Assume 96 dpi
    width_in = width_px / 96.0

    # Clamp to a reasonable range
    if width_in < 1.0:
        width_in = 1.0
    if width_in > max_width_in:
        width_in = max_width_in

    return width_in


def has_style(document: Document, style_name: str) -> bool:
    try:
        _ = document.styles[style_name]
        return True
    except KeyError:
        return False

def render_node(node, document: Document) -> None:
    ntype = node.get("type")

    if ntype == "pageBreak":
        document.add_page_break()
        return

    # Images from TipTap (normal or resizable)
    if ntype in ("image", "resizableImage"):
        attrs = node.get("attrs", {}) or {}
        src = attrs.get("src")
        if not src:
            return

        try:
            resp = requests.get(src, timeout=8)
            resp.raise_for_status()
            image_bytes = io.BytesIO(resp.content)
        except Exception as e:
            print("Failed to fetch image:", e, "src=", src)
            return

        # width based on editor width
        width_in = compute_image_width_inches(attrs)

        paragraph = document.add_paragraph()
        run = paragraph.add_run()
        run.add_picture(image_bytes, width=Inches(width_in))

        apply_body_spacing(paragraph)

        # alignment from TipTap attrs
        align = attrs.get("alignment") or attrs.get("textAlign")
        if align == "center":
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif align == "right":
            paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        else:
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT

        return

    if ntype == "table":
        # New: handle arbitrary TipTap tables
        render_table_node(node, document)
        return

    if ntype == "heading":
        attrs = node.get("attrs", {}) or {}
        level = attrs.get("level", 1)
        text_align = attrs.get("textAlign", None)

        style_name = f"Heading {level}"
        style_exists = has_style(document, style_name)

        # ✅ Don’t call document.add_heading() (it crashes if style missing)
        p = document.add_paragraph()

        # If the template has Heading styles, use them
        if style_exists:
            p.style = style_name

        add_text_runs_from_tiptap(node.get("content", []), p)
        apply_body_spacing(p, attrs.get("lineHeight"))

        # ✅ Manual formatting fallback if style is missing
        if not style_exists:
            size_pt = 16 if level == 1 else 13
            for run in p.runs:
                run.bold = True
                run.font.size = Pt(size_pt)
                run.font.name = "Calibri"

        if text_align == "center":
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif text_align == "right":
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        elif text_align == "justify":
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT

        return

    if ntype == "paragraph":
        # Reuse helper so cells + top-level behave the same
        p = document.add_paragraph()
        render_paragraph_node_into(p, node)
        return

    if ntype == "bulletList":
        # Render as simple "• " bullets so we don't depend on Word list styles
        for li in node.get("content", []):
            if li.get("type") != "listItem":
                continue

            for child in li.get("content", []):
                if child.get("type") != "paragraph":
                    continue

                p = document.add_paragraph()
                # prefix bullet
                bullet_run = p.add_run("• ")
                bullet_run.bold = False

                add_text_runs_from_tiptap(child.get("content", []), p)
                apply_body_spacing(p, child.get("attrs", {}).get("lineHeight"))
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT

        return

    if ntype == "orderedList":
        # Render as "1. ", "2. " etc. without using Word list styles
        attrs = node.get("attrs", {}) or {}
        start = attrs.get("start", 1) or 1
        index = 0

        for li in node.get("content", []):
            if li.get("type") != "listItem":
                continue

            for child in li.get("content", []):
                if child.get("type") != "paragraph":
                    continue

                p = document.add_paragraph()
                number_run = p.add_run(f"{start + index}. ")
                number_run.bold = False

                add_text_runs_from_tiptap(child.get("content", []), p)
                apply_body_spacing(p, child.get("attrs", {}).get("lineHeight"))
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT

                index += 1

        return

    if ntype == "signaturesBlock":
        attrs = node.get("attrs", {}) or {}
        left_title = attrs.get("leftTitle", "Client Acceptance")
        right_title = attrs.get("rightTitle", "Service Provider")

        table = document.add_table(rows=3, cols=2)
        table.autofit = True
        remove_table_borders(table)

        hdr_cells = table.rows[0].cells
        hdr_cells[0].text = left_title
        hdr_cells[1].text = right_title

        for cell in hdr_cells:
            for p in cell.paragraphs:
                p.style = "Normal"
                if p.runs:
                    p.runs[0].bold = True
                apply_body_spacing(p)

        sig_cells = table.rows[1].cells
        sig_cells[0].text = "Signature: ____________________________"
        sig_cells[1].text = "Signature: ____________________________"

        for cell in sig_cells:
            for p in cell.paragraphs:
                p.style = "Normal"
                apply_body_spacing(p)

        date_cells = table.rows[2].cells
        date_cells[0].text = "Date: _________________________________"
        date_cells[1].text = "Date: _________________________________"

        for cell in date_cells:
            for p in cell.paragraphs:
                p.style = "Normal"
                apply_body_spacing(p)

        return


def tiptap_doc_to_docx(tiptap_doc, base_template="default", template_slug=None):
    """
    Convert a TipTap JSON doc into a python-docx Document.

    base_template:
      - "default"  -> base.docx
      - "proposal" -> base_proposal.docx
    template_slug:
      - If present and in EDITOR_BASE_TEMPLATES, use that DOCX as base
        (offer letters, NOCs, special layouts, etc.).
    """
    custom_template_path = None
    if template_slug:
        custom_template_path = EDITOR_BASE_TEMPLATES.get(template_slug)

    apply_styles = True

    if custom_template_path and os.path.exists(custom_template_path):
        # Use a highly designed template → don't override its styles
        document = Document(custom_template_path)
        apply_styles = False
    elif base_template == "proposal" and os.path.exists(PROPOSAL_BASE_TEMPLATE):
        document = Document(PROPOSAL_BASE_TEMPLATE)
    elif os.path.exists(BASE_TEMPLATE):
        document = Document(BASE_TEMPLATE)
    else:
        document = Document()

    if apply_styles:
        configure_document_styles(document)

    if not tiptap_doc or tiptap_doc.get("type") != "doc":
        return document

    for node in tiptap_doc.get("content", []):
        render_node(node, document)

    return document


# -------------------------------------------------------------------
# Helpers for Legal DOCX templates (rental agreement, etc.)
# -------------------------------------------------------------------


def replace_placeholders_in_paragraph(paragraph, mapping):
    for key, value in mapping.items():
        placeholder = "{{" + key + "}}"
        if placeholder in paragraph.text:
            paragraph.text = paragraph.text.replace(placeholder, value)




def replace_placeholders_in_textboxes(element, mapping):
    for txbx in element.xpath(".//*[local-name()='txbxContent']"):
        for t in txbx.xpath(".//*[local-name()='t']"):
            if t.text:
                for key, value in mapping.items():
                    placeholder = "{{" + key + "}}"
                    if placeholder in t.text:
                        t.text = t.text.replace(placeholder, value)

def replace_placeholders_in_document(doc, mapping):
    # Body paragraphs
    for p in doc.paragraphs:
        replace_placeholders_in_paragraph(p, mapping)

    # Tables in body
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    replace_placeholders_in_paragraph(p, mapping)

    for section in doc.sections:
        header = section.header

        # Existing logic
        for p in header.paragraphs:
            replace_placeholders_in_paragraph(p, mapping)

        for table in header.tables:
            for row in table.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        replace_placeholders_in_paragraph(p, mapping)

        # 🔥 THIS WAS MISSING
        replace_placeholders_in_textboxes(header._element, mapping)

        footer = section.footer
        for p in footer.paragraphs:
            replace_placeholders_in_paragraph(p, mapping)

        for table in footer.tables:
            for row in table.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        replace_placeholders_in_paragraph(p, mapping)

        replace_placeholders_in_textboxes(footer._element, mapping)



# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------


@app.route("/generate-docx", methods=["POST"])
def generate_docx():
    """
    Endpoint: TipTap JSON -> DOCX.

    Supports:
      - templateSlug: logical template/slug (for fallback)
      - designKey:   visual design key (offer_modern_blue, etc.)
      - brand:       company details for placeholders
      - signatory:   HR details for placeholders
    """
    try:
        data = request.get_json(force=True)
        tiptap_doc = data.get("contentJson")
        file_name = data.get("fileName", "document.docx")

        base_template = data.get("baseTemplate", "default")
        template_slug = data.get("templateSlug")
        design_key = data.get("designKey")

        # Prefer explicit design_key; fall back to slug for old paths
        effective_key = design_key or template_slug

        brand = data.get("brand") or {}
        signatory = data.get("signatory") or {}

        document = tiptap_doc_to_docx(
            tiptap_doc,
            base_template=base_template,
            template_slug=effective_key,
        )

        # Map brand + signatory into {{placeholders}} for header/footer/body
        mapping = {
            "company_name": brand.get("companyName", ""),
            "company_address_line1": brand.get("addressLine1", ""),
            "company_address_line2": brand.get("addressLine2", ""),
            "company_phone": brand.get("phone", ""),
            "company_email": brand.get("email", ""),
            "signatory_name": signatory.get("fullName", ""),
            "signatory_designation": signatory.get("designation", ""),
            # You can later add special handling for logo/signature images
        }

        if any(v for v in mapping.values()):
            replace_placeholders_in_document(document, mapping)

        buf = io.BytesIO()
        document.save(buf)
        buf.seek(0)

        return send_file(
            buf,
            as_attachment=True,
            download_name=file_name,
            mimetype=(
                "application/vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
        )
    except Exception as e:
        return jsonify(
            {"error": "Failed to generate DOCX", "details": str(e)}
        ), 500

@app.route("/generate-docx-from-structure", methods=["POST"])
def generate_docx_from_structure():
    data = request.get_json(force=True)

    blocks = data.get("blocks", [])
    if not isinstance(blocks, list):
        return jsonify({"error": "Invalid structure"}), 400

    doc = Document()
    configure_document_styles(doc)

    # -----------------------------
    # Page setup (A4)
    # -----------------------------
    section = doc.sections[0]
    section.top_margin = Pt(72)
    section.bottom_margin = Pt(72)
    section.left_margin = Pt(72)
    section.right_margin = Pt(72)

    ALIGN_MAP = {
        "left": WD_ALIGN_PARAGRAPH.LEFT,
        "right": WD_ALIGN_PARAGRAPH.RIGHT,
        "center": WD_ALIGN_PARAGRAPH.CENTER,
        "justify": WD_ALIGN_PARAGRAPH.JUSTIFY,
    }

    VERTICAL_GAP_MAP = {
        "tight": 4,
        "normal": 8,
        "loose": 12,
    }

    # -----------------------------
    # PURE RENDER LOOP
    # -----------------------------
    for block in blocks:
        lines = block.get("lines", [])
        flow = block.get("flow", {})
        font = block.get("font", {})

        if not lines:
            continue

        p = doc.add_paragraph()

        # ---------- alignment ----------
        alignment = flow.get("alignment", "left")
        p.alignment = ALIGN_MAP.get(alignment, WD_ALIGN_PARAGRAPH.LEFT)

        pf = p.paragraph_format

        # ---------- indentation ----------
        first_line = flow.get("first_line", "normal")
        if first_line == "indented":
            pf.first_line_indent = Pt(24)
        elif first_line == "hanging":
            pf.left_indent = Pt(24)
            pf.first_line_indent = Pt(-18)

        # ---------- spacing ----------
        pf.space_before = Pt(0)
        pf.space_after = Pt(
            VERTICAL_GAP_MAP.get(flow.get("vertical_gap", "normal"), 8)
        )
        pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
        pf.line_spacing = 1.45

        # ---------- text rendering ----------
        if alignment == "justify":
            # 🔥 Word requires a single run for justification
            text = " ".join(l.strip() for l in lines)
            run = p.add_run(text)
            run.font.name = font.get("family", "Times New Roman")
            run.font.size = Pt(font.get("size", 12))
            run.bold = font.get("bold", False)

        else:
            # preserve line breaks (address, labels, lists)
            for i, line in enumerate(lines):
                run = p.add_run(line)
                run.font.name = font.get("family", "Times New Roman")
                run.font.size = Pt(font.get("size", 12))
                run.bold = font.get("bold", False)

                if i < len(lines) - 1:
                    run.add_break()

    # -----------------------------
    # Output
    # -----------------------------
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)

    return send_file(
        buf,
        as_attachment=True,
        download_name="output.docx",
        mimetype=(
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        ),
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)
