import React from 'react';
import { FolderIcon, FileIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

interface FileTreeProps {
  tree: TreeNode[];
}

const FileTreeNode: React.FC<{ node: TreeNode; level: number }> = ({ node, level }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const toggleOpen = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <div onClick={toggleOpen} className="flex items-center cursor-pointer py-1">
        {node.type === 'directory' && (
          isOpen ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />
        )}
        {node.type === 'directory' ? (
          <FolderIcon size={16} className="mr-2 text-yellow-500" />
        ) : (
          <FileIcon size={16} className="mr-2 text-blue-500" />
        )}
        <span>{node.name}</span>
      </div>
      {node.type === 'directory' && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ tree }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">File Tree</h3>
      {tree.map((node, index) => (
        <FileTreeNode key={index} node={node} level={0} />
      ))}
    </div>
  );
};

export default FileTree;