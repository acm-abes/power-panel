/** @format */

"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RoleAssignmentForm } from "@/components/role-assignment-form";
import { Search, X } from "lucide-react";
import { removeRole } from "@/actions/assign-roles";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  userRoles: Array<{
    id: string;
    role: {
      id: string;
      name: string;
    };
  }>;
}

interface UserManagementTableProps {
  users: User[];
  availableRoles: string[];
}

export function UserManagementTable({
  users,
  availableRoles,
}: UserManagementTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      removeRole(userId, roleName),
    onSuccess: () => {
      router.refresh();
      toast.success("Role removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove role");
    },
  });

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const name = (user.name || "").toLowerCase();
    const email = user.email.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const handleRemoveRole = (userId: string, roleName: string) => {
    removeRoleMutation.mutate({ userId, roleName });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Roles</TableHead>
              <TableHead>Manage Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {searchQuery ? "No users found" : "No users yet"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name || "No name"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {user.userRoles.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          No roles
                        </span>
                      ) : (
                        user.userRoles.map((ur) => {
                          return (
                            <Badge
                              key={ur.id}
                              variant="secondary"
                              className="gap-1"
                            >
                              {ur.role.name}
                              <button
                                onClick={() =>
                                  handleRemoveRole(user.id, ur.role.name)
                                }
                                disabled={removeRoleMutation.isPending}
                                className="hover:text-destructive disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleAssignmentForm
                      userId={user.id}
                      currentRoles={user.userRoles.map((ur) => ur.role.name)}
                      availableRoles={availableRoles}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Found {filteredUsers.length} user(s)
        </p>
      )}
    </div>
  );
}
