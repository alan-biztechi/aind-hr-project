import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLeave, getLeaves, getLeavesByEmployee } from "@/api/leaves";

const LEAVES_KEY = ["leaves"] as const;

export function useLeaves(employeeId?: number) {
  return useQuery({
    queryKey:
      employeeId != null
        ? ([...LEAVES_KEY, { employeeId }] as const)
        : LEAVES_KEY,
    queryFn: () =>
      employeeId != null ? getLeavesByEmployee(employeeId) : getLeaves(),
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLeave,
    onSuccess: () => qc.invalidateQueries({ queryKey: LEAVES_KEY }),
  });
}
