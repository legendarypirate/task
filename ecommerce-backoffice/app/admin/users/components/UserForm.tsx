// app/users/components/UserForm.tsx
"use client";
import { useState, useEffect } from "react";
import { User } from "../types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface UserFormProps {
  user?: User;
  onSubmit: (userData: Omit<User, "id">) => void;
  onCancel: () => void;
  loading: boolean;
  supervisors?: User[]; // Supervisors for dropdown
}

export default function UserForm({ 
  user, 
  onSubmit, 
  onCancel, 
  loading,
  supervisors = []
}: UserFormProps) {
  function initialState() {
    const sup = user?.supervisor_id;
    const supervisorList: number[] =
      sup === undefined || sup === null
        ? []
        : Array.isArray(sup)
          ? sup.map((n) => Number(n)).filter((n) => Number.isFinite(n))
          : Number.isFinite(Number(sup))
            ? [Number(sup)]
            : [];
    return {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      password: "",
      role: user?.role || "worker",
      supervisor_id: supervisorList,
      is_active: user?.is_active ?? true,
    };
  }

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    setFormData(initialState());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset form when editing user / new user changes
  }, [user?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      supervisor_id: [...formData.supervisor_id],
    };
    if (user && !submitData.password) {
      delete (submitData as { password?: string }).password;
    }

    onSubmit(submitData as Omit<User, "id">);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Format role for display
  const formatRole = (role: string) => {
    const roleLabels: Record<string, string> = {
      director: "Director",
      general_manager: "General Manager",
      supervisor: "Supervisor",
      worker: "Worker"
    };
    return roleLabels[role] || role;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="Enter full name"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter phone number"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password {!user && "*"}
          {user && <span className="text-gray-500 text-sm ml-2">(Leave empty to keep current)</span>}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter password"
          required={!user}
          minLength={6}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({...formData, role: value as User['role']})}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="director">Director</SelectItem>
            <SelectItem value="general_manager">General Manager</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="worker">Worker</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Supervisors</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto p-3 border rounded-md bg-gray-50 dark:bg-neutral-800">
          {supervisors.map((supervisor) => (
            <label key={supervisor.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 p-1 rounded transition-colors">
              <input
                type="checkbox"
                checked={Array.isArray(formData.supervisor_id) && formData.supervisor_id.includes(supervisor.id)}
                onChange={(e) => {
                  setFormData((prev) => {
                    const current = prev.supervisor_id;
                    const next = e.target.checked
                      ? current.includes(supervisor.id)
                        ? current
                        : [...current, supervisor.id]
                      : current.filter((id) => id !== supervisor.id);
                    return { ...prev, supervisor_id: next };
                  });
                }}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {supervisor.full_name} ({formatRole(supervisor.role)})
              </span>
            </label>
          ))}
          {supervisors.length === 0 && (
            <p className="text-sm text-gray-500 italic">No available supervisors</p>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Choose who supervises this user ({formData.supervisor_id.length} selected). Director, general
          manager, and supervisor accounts appear here.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {user ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
}