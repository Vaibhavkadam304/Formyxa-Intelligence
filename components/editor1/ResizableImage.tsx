"use client";

import React, { useCallback, useState } from "react";
import ImageExt from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  NodeViewProps,
} from "@tiptap/react";

type Alignment = "left" | "center" | "right";

const ResizableImageComponent: React.FC<NodeViewProps> = ({
  node,
  selected,
  updateAttributes,
}) => {
  const { src, alt, width, alignment }: {
    src: string;
    alt?: string;
    width?: number | null;
    alignment?: Alignment;
  } = node.attrs;

  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = typeof width === "number" ? width : 400;

      const handleMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const nextWidth = Math.max(120, startWidth + deltaX); // min 120px
        updateAttributes({ width: nextWidth });
      };

      const handleUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      setIsResizing(true);
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [updateAttributes, width],
  );

  const alignClass =
    alignment === "left"
      ? "justify-start"
      : alignment === "right"
      ? "justify-end"
      : "justify-center";

  return (
    <NodeViewWrapper
      className={`my-3 flex ${alignClass}`}
      data-node-type="resizable-image-wrapper"
    >
      <div className="relative inline-block">
        <img
          src={src}
          alt={alt || ""}
          style={width ? { width: `${width}px` } : undefined}
          className={`rounded-sm ${
            selected ? "outline outline-2 outline-sky-400" : ""
          }`}
          draggable={false}
        />

        {selected && (
          <div
            onMouseDown={startResize}
            className="absolute bottom-0 right-0 translate-x-1 translate-y-1 w-3 h-3 rounded-full border border-sky-500 bg-white cursor-se-resize"
          />
        )}

        {selected && isResizing && width && (
          <div className="absolute -top-6 right-0 bg-slate-800 text-[10px] text-white px-1.5 py-0.5 rounded">
            {Math.round(width)}px
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

/**
 * Image extension with:
 * - width (px)
 * - alignment: left / center / right
 * - React NodeView for resize handle
 */
export const ResizableImage = ImageExt.extend({
  name: "image",

  addAttributes() {
    const parentAttrs = this.parent?.() ?? {};
    return {
      ...parentAttrs,
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const styleWidth = el.style.width;
          if (styleWidth && styleWidth.endsWith("px")) {
            return parseInt(styleWidth.replace("px", ""), 10);
          }
          const dataWidth = el.getAttribute("data-width");
          return dataWidth ? parseInt(dataWidth, 10) : null;
        },
        renderHTML: (attrs: { width?: number | null }) => {
          if (!attrs.width) return {};
          return {
            style: `width: ${attrs.width}px`,
            "data-width": String(attrs.width),
          };
        },
      },
      alignment: {
        default: "center",
        parseHTML: (el: HTMLElement) =>
          (el.getAttribute("data-align") as Alignment | null) || "center",
        renderHTML: (attrs: { alignment?: Alignment }) => ({
          "data-align": attrs.alignment ?? "center",
        }),
      },
    };
  },

  draggable: true,

  addCommands() {
    const parentCommands = this.parent?.() ?? {};
    return {
      ...parentCommands,
      setImageAlign:
        (alignment: Alignment) =>
        ({ commands }) =>
          commands.updateAttributes("image", { alignment }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
