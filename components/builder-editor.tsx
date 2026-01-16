"use client";

import { useEffect, useState } from "react";
import Editor from "@/components/Editor";

type BuilderEditorProps = {
  initialContent: string;
  onChange: (value: string) => void;
};

export default function BuilderEditor({ initialContent, onChange }: BuilderEditorProps) {
  const [value, setValue] = useState(initialContent);

  useEffect(() => {
    setValue(initialContent);
  }, [initialContent]);

  const handleChange = (content: string) => {
    setValue(content);
    onChange(content);
  };

  return <Editor content={value} onChange={handleChange} />;
}
