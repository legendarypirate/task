"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button"; // centralized button component

// --- Type ---
export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  children?: Category[];
}

// --- Category Item (Recursive) ---
interface CategoryItemProps {
  category: Category;
  onAddChild: (parentId: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, newName: string) => void;
}

function CategoryItem({ category, onAddChild, onDelete, onEdit }: CategoryItemProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  return (
    <div className="ml-4 border-l pl-4 mt-2">
      <div className="flex items-center justify-between">
        {editing ? (
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border px-2 py-1 rounded"
            />
            <Button
              size="sm"
              onClick={() => {
                onEdit(category.id, name);
                setEditing(false);
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <span>{category.name}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => onAddChild(category.id)}>
                <Plus size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Edit2 size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(category.id)}>
                <Trash2 size={14} className="text-red-500" />
              </Button>
            </div>
          </>
        )}
      </div>

      {category.children?.map((child) => (
        <CategoryItem
          key={child.id}
          category={child}
          onAddChild={onAddChild}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

// --- Category Tree ---
interface CategoryTreeProps {
  categories: Category[];
  onAdd: (name: string, parentId: number | null) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, newName: string) => void;
}

function CategoryTree({ categories, onAdd, onDelete, onEdit }: CategoryTreeProps) {
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [newName, setNewName] = useState("");

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Categories</h2>
        <Button onClick={() => setAddingTo(0)}>Add Root</Button>
      </div>

      {addingTo === 0 && (
        <div className="flex gap-2 mt-2">
          <input
            placeholder="Category name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <Button
            onClick={() => {
              onAdd(newName, null);
              setAddingTo(null);
              setNewName("");
            }}
          >
            Save
          </Button>
          <Button variant="outline" onClick={() => setAddingTo(null)}>
            Cancel
          </Button>
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat.id}>
          <CategoryItem
            category={cat}
            onAddChild={(id) => setAddingTo(id)}
            onDelete={onDelete}
            onEdit={onEdit}
          />
          {addingTo === cat.id && (
            <div className="flex gap-2 mt-2 ml-8">
              <input
                placeholder="Category name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border px-2 py-1 rounded"
              />
              <Button
                onClick={() => {
                  onAdd(newName, cat.id);
                  setAddingTo(null);
                  setNewName("");
                }}
              >
                Save
              </Button>
              <Button variant="outline" onClick={() => setAddingTo(null)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Helper: Build tree from flat array ---
function buildTree(flat: Category[]): Category[] {
  const map = new Map<number, Category>();
  const roots: Category[] = [];

  flat.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  map.forEach((cat) => {
    if (cat.parent_id === null) {
      roots.push(cat);
    } else {
      const parent = map.get(cat.parent_id);
      if (parent) parent.children!.push(cat);
    }
  });

  return roots;
}

// --- Page ---
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);

  // Seed static data
  useEffect(() => {
    const seed: Category[] = [
      { id: 1, name: "Electronics", parent_id: null },
      { id: 2, name: "Computers", parent_id: 1 },
      { id: 3, name: "Laptops", parent_id: 2 },
      { id: 4, name: "Smartphones", parent_id: 1 },
      { id: 5, name: "Clothing", parent_id: null },
    ];
    setFlatCategories(seed);
    setCategories(buildTree(seed));
  }, []);

  // --- CRUD Handlers ---
  const handleAdd = (name: string, parentId: number | null) => {
    const newCat: Category = {
      id: Math.max(0, ...flatCategories.map((c) => c.id)) + 1,
      name,
      parent_id: parentId,
    };
    const newFlat = [...flatCategories, newCat];
    setFlatCategories(newFlat);
    setCategories(buildTree(newFlat));
  };

  const handleDelete = (id: number) => {
    const newFlat = flatCategories.filter((c) => c.id !== id && c.parent_id !== id);
    setFlatCategories(newFlat);
    setCategories(buildTree(newFlat));
  };

  const handleEdit = (id: number, newName: string) => {
    const newFlat = flatCategories.map((c) => (c.id === id ? { ...c, name: newName } : c));
    setFlatCategories(newFlat);
    setCategories(buildTree(newFlat));
  };

  return (
<div className="w-full max-w-full mt-6 px-4">
  <CategoryTree
    categories={categories}
    onAdd={handleAdd}
    onDelete={handleDelete}
    onEdit={handleEdit}
  />
</div>

  );
}
