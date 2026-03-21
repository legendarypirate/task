"use client";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { Category } from "../types/category";

interface Props {
  category: Category;
  onAddChild: (parentId: number) => void;
  onDelete: (id: number) => void;
}

export default function CategoryItem({ category, onAddChild, onDelete }: Props) {
  return (
    <div className="ml-4 border-l pl-4 mt-2">
      <div className="flex items-center justify-between">
        <span>{category.name}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onAddChild(category.id)}>
            <Plus size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(category.id)}>
            <Trash2 size={14} className="text-red-500" />
          </Button>
        </div>
      </div>

      {category.children?.map((child) => (
        <CategoryItem
          key={child.id}
          category={child}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
