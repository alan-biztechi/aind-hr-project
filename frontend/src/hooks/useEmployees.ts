import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  getEmployeesByDepartment,
  updateEmployee,
} from "@/api/employees";

const EMPLOYEES_KEY = ["employees"] as const;

export function useEmployees(departmentId?: number) {
  return useQuery({
    queryKey:
      departmentId != null
        ? ([...EMPLOYEES_KEY, { departmentId }] as const)
        : EMPLOYEES_KEY,
    queryFn: () =>
      departmentId != null
        ? getEmployeesByDepartment(departmentId)
        : getEmployees(),
  });
}

function useInvalidateEmployees() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: EMPLOYEES_KEY });
}

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({ mutationFn: createEmployee, onSuccess: invalidate });
}

export function useUpdateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({ mutationFn: updateEmployee, onSuccess: invalidate });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({ mutationFn: deleteEmployee, onSuccess: invalidate });
}
