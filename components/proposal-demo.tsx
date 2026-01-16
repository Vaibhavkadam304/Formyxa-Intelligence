"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  ProposalPreview,
  ProposalFormData,
  TimelineItem,
  PricingItem,
} from "@/components/proposal-preview"

const DEFAULT_FORM_DATA: ProposalFormData = {
  clientName: "John Smith",
  clientCompany: "Acme Corporation",
  projectName: "Website Redesign & Development",
  currency: "USD ($)",
  projectValue: "",
  scope:
    "Complete website redesign with modern, responsive design.\nDevelopment of new features including user dashboard.\nIntegration with existing systems.\nBasic on-page SEO and performance improvements.",
  deliverables:
    "Wireframes and mockups for all key pages.\nFully responsive website (desktop, tablet, mobile).\nCMS setup and configuration.\nUser authentication and dashboard.\n30 days of post-launch support.",
  timeline: [
    { phase: "Discovery & Planning", start: "2025-01-15", end: "2025-01-22" },
    { phase: "Design & Wireframes", start: "2025-01-23", end: "2025-02-05" },
    { phase: "Development", start: "2025-02-06", end: "2025-02-26" },
    { phase: "Testing & Launch", start: "2025-02-27", end: "2025-03-05" },
  ],
  pricing: [
    { item: "Design & UX", qty: "1", rate: "5000" },
    { item: "Frontend Development", qty: "1", rate: "6000" },
    { item: "Backend Development", qty: "1", rate: "3000" },
    { item: "CRM Integration", qty: "1", rate: "1000" },
  ],
  terms:
    "Payment Terms:\n• 50% deposit required to begin work.\n• 25% due upon design approval.\n• 25% due on project completion.\n\nProject Terms:\n• Timeline assumes timely client feedback.\n• Client is responsible for providing all content and assets.\n• Additional change requests beyond agreed scope may be billed separately.",
  date: "",
}

export function ProposalDemo() {
  const { toast } = useToast()
  const [formData, setFormData] = useState<ProposalFormData>(DEFAULT_FORM_DATA)
  const [downloading, setDownloading] = useState(false)

  function updateFormData<K extends keyof ProposalFormData>(
    key: K,
    value: ProposalFormData[K],
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // ---- Timeline helpers ----
  const addTimelineItem = () => {
    const next: TimelineItem = { phase: "", start: "", end: "" }
    updateFormData("timeline", [...formData.timeline, next])
  }

  const updateTimelineItem = <K extends keyof TimelineItem>(
    index: number,
    key: K,
    value: TimelineItem[K],
  ) => {
    const copy = [...formData.timeline]
    copy[index] = { ...copy[index], [key]: value }
    updateFormData("timeline", copy)
  }

  const removeTimelineItem = (index: number) => {
    const copy = formData.timeline.filter((_, i) => i !== index)
    updateFormData("timeline", copy)
  }

  // ---- Pricing helpers ----
  const addPricingItem = () => {
    const next: PricingItem = { item: "", qty: "", rate: "" }
    updateFormData("pricing", [...formData.pricing, next])
  }

  const updatePricingItem = <K extends keyof PricingItem>(
    index: number,
    key: K,
    value: PricingItem[K],
  ) => {
    const copy = [...formData.pricing]
    copy[index] = { ...copy[index], [key]: value }
    updateFormData("pricing", copy)
  }

  const removePricingItem = (index: number) => {
    const copy = formData.pricing.filter((_, i) => i !== index)
    updateFormData("pricing", copy)
  }

  // ---- DOCX export ----
  function buildProposalDocJson(data: ProposalFormData) {
    const clientLabel = [data.clientName, data.clientCompany].filter(Boolean).join(" at ")
    const currency = data.currency || "USD ($)"

    const heading = (level: number, text: string) => ({
      type: "heading",
      attrs: { level },
      content: [{ type: "text", text }],
    })

    const paragraph = (text: string) =>
      text.trim()
        ? {
            type: "paragraph",
            content: [{ type: "text", text }],
          }
        : null

    const multilineParagraphs = (text: string) =>
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => paragraph(line)!)
        .filter(Boolean)

    const content: any[] = []

    content.push(
      heading(1, data.projectName || "Project Proposal"),
      paragraph(`Prepared for ${clientLabel || "your client"}.`),
    )

    content.push(heading(2, "Project overview"))
    content.push(
      paragraph(
        `This proposal outlines the scope, timeline, and investment for ${
          data.projectName || "this project"
        } for ${clientLabel || "your client"}.`,
      ),
    )

    content.push(heading(2, "Scope of work"))
    content.push(
      ...(data.scope
        ? multilineParagraphs(data.scope)
        : [paragraph("The scope of work will be defined for this project.")!]),
    )

    content.push(heading(2, "Deliverables"))
    content.push(
      ...(data.deliverables
        ? multilineParagraphs(data.deliverables)
        : [paragraph("Key deliverables will be listed here.")!]),
    )

    content.push(heading(2, "Timeline & milestones"))
    if (data.timeline.length) {
      for (const t of data.timeline) {
        const line = `${t.phase || "Phase"} — ${t.start || "Start"} to ${t.end || "End"}`
        content.push(paragraph(line))
      }
    } else {
      content.push(
        paragraph("Timeline and milestones will be agreed together with the client."),
      )
    }

    content.push(heading(2, "Investment"))
    if (data.pricing.length) {
      let total = 0
      for (const p of data.pricing) {
        if (!p.item.trim()) continue
        const qty = Number(p.qty) || 0
        const rate = Number(p.rate) || 0
        const lineTotal = qty * rate
        total += lineTotal

        const line = lineTotal
          ? `${p.item}: ${qty} × ${currency} ${rate.toLocaleString()} = ${currency} ${lineTotal.toLocaleString()}`
          : p.item

        content.push(paragraph(line))
      }
      if (total > 0) {
        content.push(
          paragraph(`Total investment: ${currency} ${total.toLocaleString()}`),
        )
      }
    } else {
      content.push(paragraph("Investment details will be added here."))
    }

    content.push(heading(2, "Terms & conditions"))
    content.push(
      ...(data.terms
        ? multilineParagraphs(data.terms)
        : [paragraph("Terms and conditions for this project will be added here.")!]),
    )

    // 7. Signatures (for Word export)
    content.push(heading(2, "7. Signatures"))
    content.push({
      type: "signaturesBlock",
      attrs: {
        leftTitle: "Client Acceptance",
        rightTitle: "Service Provider",
      },
    })

    return {
      type: "doc",
      content: content.filter(Boolean),
    }
  }

  async function handleGenerateDocx() {
    try {
      setDownloading(true);

      const safeBaseName =
        (formData.projectName || "project-proposal")
          .replace(/[\\/:*?"<>|]+/g, " ")
          .replace(/\s+/g, "-")
          .trim() || "project-proposal";

      const res = await fetch("/api/proposal-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate DOCX");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeBaseName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "DOCX downloaded",
        description: "Your proposal has been generated.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Could not generate DOCX",
        description: "Please try again or check your connection.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  }

  const handleReset = () => {
    setFormData(DEFAULT_FORM_DATA)
    toast({ title: "Reset", description: "Restored example proposal." })
  }

  // -------- UI --------
  return (
    <section className="relative">
      {/* soft background glow behind the whole playground */}
      <div className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-56 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.28),_transparent_60%)]" />

      <div
        className="
          rounded-[32px]
          border border-border/70
          bg-card/95 backdrop-blur-md
          shadow-[0_22px_70px_rgba(15,23,42,0.18)]
          px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8
        "
      >
        <div
          className="
            grid gap-8
            lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]
            items-start
          "
        >
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Client & project details */}
            <Card className="rounded-2xl border-border/70 shadow-sm bg-card/95">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Client &amp; project details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client name</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => updateFormData("clientName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientCompany">Company</Label>
                    <Input
                      id="clientCompany"
                      value={formData.clientCompany}
                      onChange={(e) => updateFormData("clientCompany", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectName">Project name</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => updateFormData("projectName", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(val) => updateFormData("currency", val)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD ($)">USD ($)</SelectItem>
                        <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                        <SelectItem value="INR (₹)">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectValue">Project value (optional)</Label>
                    <Input
                      id="projectValue"
                      value={formData.projectValue}
                      onChange={(e) => updateFormData("projectValue", e.target.value)}
                      placeholder="e.g. 15000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scope & deliverables */}
            <Card className="rounded-2xl border-border/70 shadow-sm bg-card/95">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Project scope
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scope">Scope of work</Label>
                  <Textarea
                    id="scope"
                    rows={5}
                    value={formData.scope}
                    onChange={(e) => updateFormData("scope", e.target.value)}
                    placeholder="List the main project objectives and scope..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliverables">Deliverables</Label>
                  <Textarea
                    id="deliverables"
                    rows={5}
                    value={formData.deliverables}
                    onChange={(e) => updateFormData("deliverables", e.target.value)}
                    placeholder="List all project deliverables..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="rounded-2xl border-border/70 shadow-sm bg-card/95">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Timeline &amp; milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phase</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.timeline.map((t, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            value={t.phase}
                            onChange={(e) =>
                              updateTimelineItem(idx, "phase", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={t.start}
                            onChange={(e) =>
                              updateTimelineItem(idx, "start", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={t.end}
                            onChange={(e) =>
                              updateTimelineItem(idx, "end", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeTimelineItem(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button variant="outline" size="sm" onClick={addTimelineItem}>
                  Add phase
                </Button>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="rounded-2xl border-border/70 shadow-sm bg-card/95">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Pricing breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-32">Rate</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.pricing.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            value={p.item}
                            onChange={(e) =>
                              updatePricingItem(idx, "item", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={p.qty}
                            onChange={(e) =>
                              updatePricingItem(idx, "qty", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={p.rate}
                            onChange={(e) =>
                              updatePricingItem(idx, "rate", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removePricingItem(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button variant="outline" size="sm" onClick={addPricingItem}>
                  Add item
                </Button>
              </CardContent>
            </Card>

            {/* Terms */}
            <Card className="rounded-2xl border-border/70 shadow-sm bg-card/95">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Terms &amp; conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="terms">Terms</Label>
                <Textarea
                  id="terms"
                  rows={5}
                  value={formData.terms}
                  onChange={(e) => updateFormData("terms", e.target.value)}
                  placeholder="Payment terms, revision policy, responsibilities..."
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleReset}>
                Reset to example
              </Button>
              <Button onClick={handleGenerateDocx} disabled={downloading}>
                {downloading ? "Generating..." : "Generate DOCX"}
              </Button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            <div className="relative">
              {/* glow behind preview */}
              <div className="pointer-events-none absolute -inset-x-6 -top-6 -bottom-6 -z-10 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.26),_transparent_60%)]" />
              <div
                className="
                  rounded-3xl border border-indigo-100/80
                  bg-card/95 backdrop-blur
                  shadow-[0_22px_70px_rgba(15,23,42,0.22)]
                  p-3 sm:p-4 lg:p-5
                  motion-safe:animate-[float_7s_ease-in-out_infinite]
                  motion-reduce:animate-none
                "
              >
                <ProposalPreview formData={formData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
