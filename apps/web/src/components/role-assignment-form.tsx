/** @format */

"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { assignRole } from "@/actions/assign-roles";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface RoleAssignmentFormProps {
  userId: string;
  currentRoles: string[];
  availableRoles: string[];
}

export function RoleAssignmentForm({
  userId,
  currentRoles,
  availableRoles,
}: RoleAssignmentFormProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const router = useRouter();

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      assignRole(userId, roleName),
    onSuccess: () => {
      router.refresh();
      setSelectedRole("");
      toast.success("Role assigned successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to assign role");
    },
  });

  const availableToAdd = availableRoles.filter(
    (role) => !currentRoles.includes(role),
  );

  const handleAssignRole = () => {
    if (!selectedRole) return;
    assignRoleMutation.mutate({ userId, roleName: selectedRole });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={selectedRole}
          onValueChange={setSelectedRole}
          disabled={assignRoleMutation.isPending || availableToAdd.length === 0}
        >
          <SelectTrigger className="w-45">
            <SelectValue
              placeholder={
                availableToAdd.length === 0 ? "All assigned" : "Add role"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableToAdd.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleAssignRole}
          disabled={!selectedRole || assignRoleMutation.isPending}
          size="sm"
        >
          {assignRoleMutation.isPending ? "..." : "Add"}
        </Button>
      </div>
    </div>
  );
}
