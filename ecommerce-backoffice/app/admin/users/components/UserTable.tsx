// app/users/components/UserTable.tsx
"use client";
import { User } from "../types/user";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, User as UserIcon, UserCheck, UserX, Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  loading?: boolean;
}

// Update your User type to include supervisor object
interface UserWithSupervisor extends User {
  supervisor?: {
    id: number;
    full_name: string;
    role: string;
  } | Array<{
    id: number;
    full_name: string;
    role: string;
  }>;
}

export default function UserTable({ 
  users, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  loading = false 
}: UserTableProps) {
  // Type cast users to include supervisor
  const typedUsers = users as UserWithSupervisor[];

  // Helper function to get supervisor names
  const getSupervisorNames = (user: UserWithSupervisor) => {
    if (!user.supervisor_id) return "None";
    
    // If supervisor object exists, use it
    if (user.supervisor) {
      const supervisors = Array.isArray(user.supervisor) ? user.supervisor : [user.supervisor];
      if (supervisors.length > 0) {
        return supervisors.map(s => s.full_name).join(", ");
      }
    }
    
    // Fallback: search in users array
    const ids = Array.isArray(user.supervisor_id) ? user.supervisor_id : [user.supervisor_id];
    if (ids.length === 0) return "None";
    
    const names = ids.map(id => {
      const supervisor = typedUsers.find(u => u.id === id);
      return supervisor ? supervisor.full_name : `ID: ${id}`;
    });
    
    return names.join(", ");
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      director: "bg-purple-100 text-purple-800",
      general_manager: "bg-blue-100 text-blue-800",
      supervisor: "bg-green-100 text-green-800",
      worker: "bg-gray-100 text-gray-800"
    };
    
    const roleLabels = {
      director: "Director",
      general_manager: "General Manager",
      supervisor: "Supervisor",
      worker: "Worker"
    };
    
    return (
      <Badge className={variants[role as keyof typeof variants] || variants.worker}>
        {roleLabels[role as keyof typeof roleLabels] || role}
      </Badge>
    );
  };

  if (loading && typedUsers.length === 0) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-4 font-medium text-gray-700">Name</th>
            <th className="text-left p-4 font-medium text-gray-700">Phone</th>
            <th className="text-left p-4 font-medium text-gray-700">Role</th>
            <th className="text-left p-4 font-medium text-gray-700">Supervisor</th>
            <th className="text-left p-4 font-medium text-gray-700">Status</th>
            <th className="text-left p-4 font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {typedUsers.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-gray-500">
                No users found
              </td>
            </tr>
          ) : (
            typedUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium block">{user.full_name}</span>
                      <span className="text-xs text-gray-500">ID: {user.id}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{user.phone}</span>
                  </div>
                </td>
                <td className="p-4">{getRoleBadge(user.role)}</td>
                <td className="p-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-gray-600">
                      {getSupervisorNames(user)}
                    </span>
                    {user.supervisor && (
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(user.supervisor) ? user.supervisor : [user.supervisor]).map((s) => (
                          <Badge key={s.id} variant="outline" className="text-xs">
                            {s.role} (ID: {s.id})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => onToggleStatus(user.id, user.is_active)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        user.is_active
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                      disabled={loading}
                    >
                      {user.is_active ? (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={loading}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(user.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}