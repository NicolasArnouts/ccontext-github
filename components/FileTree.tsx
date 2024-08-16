import React from "react";
import {
  FolderIcon,
  FileIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react";

interface TreeNode {
  name: string;
  type: "file" | "directory";
  children?: TreeNode[];
  size?: number;
}

interface FileTreeProps {
  markdownContent: string;
}

const parseFileTree = (markdownContent: string): TreeNode[] => {
  const fileTreeRegex = /## FILE TREE ##([\s\S]*?)## END FILE TREE ##/;
  const match = markdownContent.match(fileTreeRegex);

  if (!match) {
    return [];
  }

  const fileTreeContent = match[1];
  const lines = fileTreeContent.trim().split("\n");
  const root: TreeNode = { type: "directory", name: "root", children: [] };
  const stack: TreeNode[] = [root];

  lines.forEach((line) => {
    const level = line.match(/^-+/)?.[0].length ?? 0;
    const isFile = line.includes("📄") || line.includes("◆");
    const isDirectory =
      line.includes("📁") || line.includes("▼") || line.includes("▶");

    if (isFile || isDirectory) {
      while (stack.length > level / 4 + 1) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];

      // Updated regex to capture file name and size
      const fileMatch = line.match(
        /[📁📄▼▶◆]\s*(\d+)?\s*(.+?)(?:\s*\(#.*\))?$/
      );
      if (fileMatch) {
        const size = fileMatch[1] ? parseInt(fileMatch[1]) : undefined;
        let name = fileMatch[2].trim();

        // Remove any remaining brackets and everything after '#'
        name = name
          .replace(/[\[\]]/g, "")
          .split("#")[0]
          .trim();

        const newNode: TreeNode = {
          type: isFile ? "file" : "directory",
          name,
          ...(size !== undefined && { size }),
          ...(isDirectory && { children: [] }),
        };

        parent.children = parent.children || [];
        parent.children.push(newNode);

        if (isDirectory) {
          stack.push(newNode);
        }
      }
    }
  });

  return root.children || [];
};

const FileTreeNode: React.FC<{ node: TreeNode; level: number }> = ({
  node,
  level,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const toggleOpen = () => {
    if (node.type === "directory") {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <div
        onClick={toggleOpen}
        className="flex items-center cursor-pointer py-1 text-foreground"
      >
        {node.type === "directory" &&
          (isOpen ? (
            <ChevronDownIcon size={16} />
          ) : (
            <ChevronRightIcon size={16} />
          ))}
        {node.type === "directory" ? (
          <FolderIcon size={16} className="mr-2 text-yellow-500" />
        ) : (
          <FileIcon size={16} className="mr-2 text-blue-500" />
        )}
        <span>{node.name}</span>
        {node.size !== undefined && (
          <span className="ml-2 text-sm text-muted-foreground">
            ({node.size} bytes)
          </span>
        )}
      </div>
      {node.type === "directory" && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ markdownContent }) => {
  const tree = parseFileTree(markdownContent);

  return (
    <div className="bg-background border border-border p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-foreground">File Tree</h3>
      {tree.map((node, index) => (
        <FileTreeNode key={index} node={node} level={0} />
      ))}
    </div>
  );
};

export function extractFileTreeContent(markdownContent: string): string | null {
  const fileTreeRegex = /## FILE TREE ##([\s\S]*?)## END FILE TREE ##/;
  const match = markdownContent.match(fileTreeRegex);

  if (match) {
    return match[1].trim();
  }

  return null;
}

export default FileTree;
