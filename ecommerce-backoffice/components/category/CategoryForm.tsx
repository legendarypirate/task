"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  parentId: number | null;
  onSubmit: (name: string, parentId: number | null) => void;
  onCancel: () => void;
}

export default function CategoryForm({ parentId, onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");

  return (
    <div className="flex gap-2 mt-2">
      <Input
        placeholder="Category name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button onClick={() => onSubmit(name, parentId)}>Save</Button>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
