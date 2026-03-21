// app/users/page.tsx
"use client";
import { useState, useEffect } from "react";
import { User } from "./types/user";
import UserTable from "./components/UserTable";
import UserForm from "./components/UserForm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error fetching users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Register new user
  const handleAdd = async (userData: Omit<User, "id">) => {
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("User registered successfully");
        setShowForm(false);
        fetchUsers(); // Refresh the list
      } else {
        toast.error(result.message || "Failed to register user");
      }
    } catch (error) {
      console.error("Error registering user:", error);
      toast.error("Error registering user");
    } finally {
      setFormLoading(false);
    }
  };

  // Update user
  const handleEdit = async (userData: Omit<User, "id">) => {
    if (!editingUser) return;
    
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("User updated successfully");
        setEditingUser(null);
        setShowForm(false);
        fetchUsers(); // Refresh the list
      } else {
        toast.error(result.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error updating user");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        fetchUsers(); // Refresh the list
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user");
    } finally {
      setLoading(false);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
        fetchUsers(); // Refresh the list
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Error updating user status");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  // Get potential supervisors (only users with role "supervisor")
  const getPotentialSupervisors = () => {
    return users.filter(user => {
      // When editing, exclude the current user from supervisor options
      if (editingUser && user.id === editingUser.id) return false;
      // Only include active users
      if (!user.is_active) return false;
      // Only include users with role "supervisor"
      if (user.role !== "supervisor") return false;
      return true;
    });
  };

  return (
    <div className="w-full mt-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage system users and their permissions</p>
        </div>
        <Button 
          onClick={() => { 
            setEditingUser(null); 
            setShowForm(true); 
          }}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          Add New User
        </Button>
      </div>

      {/* Form Drawer */}
      {showForm && (
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingUser ? "Update user information" : "Create a new user account"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFormClose}
              className="h-9 w-9 rounded-full hover:bg-gray-100"
              disabled={formLoading}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
            <UserForm
              user={editingUser || undefined}
              onSubmit={editingUser ? handleEdit : handleAdd}
              onCancel={handleFormClose}
              loading={formLoading}
              supervisors={getPotentialSupervisors()} // Pass filtered supervisors
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <UserTable 
          users={users} 
          onEdit={(user) => { 
            setEditingUser(user); 
            setShowForm(true); 
          }} 
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          loading={loading}
        />
      </div>
    </div>
  );
}