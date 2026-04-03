package com.aind.hr.controller;

import com.aind.hr.model.entity.LeaveRequest;
import com.aind.hr.model.request.LeaveRequestCreateRequest;
import com.aind.hr.model.response.UpdateResponse;
import com.aind.hr.service.LeaveRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/v1/leaves")
@Tag(name = "leave-request", description = "휴가 신청 API")
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "휴가 신청 목록", description = "전체 휴가 신청 목록을 조회합니다.")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequestList() {
        return ResponseEntity.ok(leaveRequestService.getLeaveRequestList());
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "휴가 신청 상세", description = "휴가 신청 상세 정보를 조회합니다.")
    public ResponseEntity<LeaveRequest> getLeaveRequest(@PathVariable Integer id) {
        return ResponseEntity.ok(leaveRequestService.getLeaveRequest(id));
    }

    @GetMapping(value = "/employee/{employeeId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "직원별 휴가 신청", description = "특정 직원의 휴가 신청 목록을 조회합니다.")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequestsByEmployee(
            @PathVariable Integer employeeId) {
        return ResponseEntity.ok(leaveRequestService.getLeaveRequestsByEmployee(employeeId));
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "휴가 신청", description = "새로운 휴가를 신청합니다.")
    public ResponseEntity<UpdateResponse> createLeaveRequest(
            @Valid @RequestBody LeaveRequestCreateRequest request) {
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployeeId(request.getEmployeeId());
        leaveRequest.setLeaveType(request.getLeaveType());
        leaveRequest.setStartDate(request.getStartDate());
        leaveRequest.setEndDate(request.getEndDate());
        leaveRequest.setReason(request.getReason());
        return new ResponseEntity<>(leaveRequestService.createLeaveRequest(leaveRequest), HttpStatus.CREATED);
    }
}
