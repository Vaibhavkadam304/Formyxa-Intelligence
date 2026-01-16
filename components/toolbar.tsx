"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const formatOptions = [
  { id: "heading", label: "Heading", icon: "H" },
  { id: "subheading", label: "Subheading", icon: "h2" },
  { id: "body", label: "Body Text", icon: "P" },
  { id: "quote", label: "Quote", icon: '"' },
  { id: "code", label: "Code", icon: "<>" },
  { id: "list", label: "List", icon: "•" },
  { id: "table", label: "Table", icon: "▦" },
]

interface ToolbarProps {
  onFormatChange: (format: string) => void
}

export default function Toolbar({ onFormatChange }: ToolbarProps) {
  return (
    <div className="p-4 space-y-4">
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">Formatting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {formatOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="w-full justify-start text-left bg-transparent"
              onClick={() => onFormatChange(option.id)}
            >
              <span className="text-primary font-bold mr-2 w-6 text-center">{option.icon}</span>
              {option.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">Styles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start text-left bg-transparent">
            Professional
          </Button>
          <Button variant="outline" className="w-full justify-start text-left bg-transparent">
            Modern
          </Button>
          <Button variant="outline" className="w-full justify-start text-left bg-transparent">
            Academic
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
