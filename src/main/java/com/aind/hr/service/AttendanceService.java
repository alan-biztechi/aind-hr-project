package com.aind.hr.service;

import com.aind.hr.constant.ErrorCode;
import com.aind.hr.constant.SuccessFlag;
import com.aind.hr.exception.CustomException;
import com.aind.hr.model.entity.Attendance;
import com.aind.hr.model.entity.Employee;
import com.aind.hr.model.response.AttendanceResponse;
import com.aind.hr.model.response.UpdateResponse;
import com.aind.hr.repository.AttendanceRepository;
import com.aind.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * 전체 출퇴근 기록을 직원/부서 정보와 함께 조회합니다 (JOIN 사용).
     */
    public List<AttendanceResponse> getAttendanceListWithEmployee() {
        return attendanceRepository.selectAllWithEmployee();
    }

    /**
     * 특정 날짜의 출퇴근 기록을 직원 이름과 함께 조회합니다.
     *
     * [의도적 N+1 결함] 각 출퇴근 레코드마다 직원 정보를 개별 쿼리로 조회합니다.
     * Copilot Lab 2 실습에서 이 문제를 발견하고 JOIN으로 최적화하는 과제입니다.
     */
    public List<AttendanceResponse> getAttendanceByDate(LocalDate workDate) {
        List<Attendance> attendances = attendanceRepository.selectByWorkDate(workDate);
        List<AttendanceResponse> result = new ArrayList<>();

        for (Attendance a : attendances) {
            AttendanceResponse response = new AttendanceResponse();
            response.setId(a.getId());
            response.setEmployeeId(a.getEmployeeId());
            response.setWorkDate(a.getWorkDate());
            response.setCheckIn(a.getCheckIn());
            response.setCheckOut(a.getCheckOut());
            response.setStatus(a.getStatus());
            response.setNote(a.getNote());
            response.setCreatedAt(a.getCreatedAt());

            // N+1: 루프 안에서 직원을 개별 조회
            Employee emp = employeeRepository.selectById(a.getEmployeeId());
            if (emp != null) {
                response.setEmployeeName(emp.getName());
            }

            result.add(response);
        }
        return result;
    }

    public List<Attendance> getAttendanceByEmployee(Integer employeeId) {
        return attendanceRepository.selectByEmployeeId(employeeId);
    }

    public UpdateResponse checkIn(Attendance attendance) {
        LocalTime standardTime = LocalTime.of(9, 0);
        if (attendance.getCheckIn().isAfter(standardTime)) {
            attendance.setStatus("LATE");
        } else {
            attendance.setStatus("NORMAL");
        }

        int cnt;
        try {
            cnt = attendanceRepository.insert(attendance);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.DUPLICATE_ATTENDANCE);
        }
        if (cnt == 1) {
            return new UpdateResponse(SuccessFlag.YES, "출근 등록 성공", attendance.getId());
        }
        throw new CustomException(ErrorCode.ATTENDANCE_CREATION_FAILED);
    }

    public UpdateResponse checkOut(Integer id, LocalTime checkOut) {
        Attendance attendance = Optional.ofNullable(attendanceRepository.selectById(id))
                .orElseThrow(() -> new CustomException(ErrorCode.ATTENDANCE_NOT_FOUND));

        if (checkOut.isBefore(LocalTime.of(18, 0))) {
            attendance.setStatus("EARLY_LEAVE");
            attendanceRepository.updateCheckOut(id, checkOut);
        } else {
            attendanceRepository.updateCheckOut(id, checkOut);
        }
        return new UpdateResponse(SuccessFlag.YES, "퇴근 등록 성공", id);
    }
}
