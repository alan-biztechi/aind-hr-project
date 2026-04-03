package com.aind.hr.controller;

import com.aind.hr.model.entity.Attendance;
import com.aind.hr.model.request.AttendanceCheckInRequest;
import com.aind.hr.model.response.AttendanceResponse;
import com.aind.hr.model.response.UpdateResponse;
import com.aind.hr.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/v1/attendances")
@Tag(name = "attendance", description = "출퇴근 API")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "출퇴근 전체 조회", description = "전체 출퇴근 기록을 직원/부서 정보와 함께 조회합니다.")
    public ResponseEntity<List<AttendanceResponse>> getAttendanceList() {
        return ResponseEntity.ok(attendanceService.getAttendanceListWithEmployee());
    }

    @GetMapping(value = "/date/{workDate}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "날짜별 출퇴근 조회", description = "특정 날짜의 출퇴근 기록을 조회합니다.")
    public ResponseEntity<List<AttendanceResponse>> getAttendanceByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate) {
        return ResponseEntity.ok(attendanceService.getAttendanceByDate(workDate));
    }

    @GetMapping(value = "/employee/{employeeId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "직원별 출퇴근 조회", description = "특정 직원의 출퇴근 기록을 조회합니다.")
    public ResponseEntity<List<Attendance>> getAttendanceByEmployee(@PathVariable Integer employeeId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByEmployee(employeeId));
    }

    @PostMapping(value = "/check-in", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "출근 등록", description = "출근 시각을 등록합니다. 09:00 이후면 LATE 처리됩니다.")
    public ResponseEntity<UpdateResponse> checkIn(
            @Valid @RequestBody AttendanceCheckInRequest request) {
        Attendance attendance = new Attendance();
        attendance.setEmployeeId(request.getEmployeeId());
        attendance.setWorkDate(request.getWorkDate());
        attendance.setCheckIn(request.getCheckIn());
        return new ResponseEntity<>(attendanceService.checkIn(attendance), HttpStatus.CREATED);
    }

    @PatchMapping(value = "/{id}/check-out", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "퇴근 등록", description = "퇴근 시각을 등록합니다. 18:00 이전이면 EARLY_LEAVE 처리됩니다.")
    public ResponseEntity<UpdateResponse> checkOut(
            @PathVariable Integer id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime checkOut) {
        return ResponseEntity.ok(attendanceService.checkOut(id, checkOut));
    }
}
