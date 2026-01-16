from docx import Document
from docx.shared import Pt, Cm

doc = Document()

# --- Page layout (margins) ---
section = doc.sections[0]
section.top_margin = Cm(2.5)
section.bottom_margin = Cm(2.5)
section.left_margin = Cm(2.5)
section.right_margin = Cm(2.5)

styles = doc.styles

# --- Normal = body text ---
normal = styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(12)
normal_par = normal.paragraph_format
normal_par.space_before = Pt(0)
normal_par.space_after = Pt(6)   # small gap between paragraphs

# --- Heading 1 = main title ---
h1 = styles["Heading 1"]
h1.font.name = "Calibri"
h1.font.size = Pt(16)
h1.font.bold = True

# --- Heading 2 = section titles ---
h2 = styles["Heading 2"]
h2.font.name = "Calibri"
h2.font.size = Pt(13)   # a bit smaller than H1
h2.font.bold = True

doc.save("base_proposal.docx")
print("base_proposal.docx created")
