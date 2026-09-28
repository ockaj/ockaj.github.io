interface MdxAstNode {
  type: string;
  value?: string;
  children?: MdxAstNode[];
  data?: {
    estree?: {
      type: string;
      sourceType: string;
      body: unknown[];
    };
  };
}

interface MdxFile {
  stem?: string;
}

export function remarkMdxMetadata() {
  return (tree: MdxAstNode, file: MdxFile) => {
    let text = "";
    function walk(node: MdxAstNode) {
      if (node.type === "text" && typeof node.value === "string") {
        text += " " + node.value;
      }
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(tree);

    const clean = text.replace(/\s+/g, " ").trim();
    const words = clean ? clean.split(" ").length : 0;
    const readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;
    const excerpt = clean.slice(0, 160) + (clean.length > 160 ? "..." : "");
    const id = file.stem ? String(file.stem).toLowerCase() : "article";

    if (!Array.isArray(tree.children)) {
      tree.children = [];
    }

    tree.children.unshift({
      type: "mdxjsEsm",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ExportNamedDeclaration",
              specifiers: [],
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: "readTime" },
                    init: { type: "Literal", value: readTime },
                  },
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: "excerpt" },
                    init: { type: "Literal", value: excerpt },
                  },
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: "id" },
                    init: { type: "Literal", value: id },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  };
}
