/** @format */

"use client";

import { useState } from "react";
import { assignRole, removeRole } from "@/actions/assign-roles";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableToAdd = availableRoles.filter(
    (role) => !currentRoles.includes(role),
  );

  const handleAssignRole = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    setError(null);

    try {
      await assignRole(userId, selectedRole);
      setSelectedRole("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRole = async (roleName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await removeRole(userId, roleName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Select
          value={selectedRole}
          onValueChange={setSelectedRole}
          disabled={isLoading || availableToAdd.length === 0}
        >
          <SelectTrigger className="w-[180px]">
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
          disabled={!selectedRole || isLoading}
          size="sm"
        >
          {isLoading ? "..." : "Add"}
        </Button>
      </div>
    </div>
  );
}
