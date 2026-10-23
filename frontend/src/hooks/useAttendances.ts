import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkIn,
  checkOut,
  getAttendances,
  getAttendancesByDate,
} from "@/api/attendances";

const ATTENDANCES_KEY = ["attendances"] as const;

export function useAttendances(workDate?: string) {
  return useQuery({
    queryKey: workDate
      ? ([...ATTENDANCES_KEY, { workDate }] as const)
      : ATTENDANCES_KEY,
    queryFn: () =>
      workDate ? getAttendancesByDate(workDate) : getAttendances(),
  });
}

function useInvalidateAttendances() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ATTENDANCES_KEY });
}

export function useCheckIn() {
  const invalidate = useInvalidateAttendances();
  return useMutation({ mutationFn: checkIn, onSuccess: invalidate });
}

export function useCheckOut() {
  const invalidate = useInvalidateAttendances();
  return useMutation({
    mutationFn: ({ id, checkOutTime }: { id: number; checkOutTime: string }) =>
      checkOut(id, checkOutTime),
    onSuccess: invalidate,
  });
}
