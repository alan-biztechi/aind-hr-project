package com.aind.hr.service;

import com.aind.hr.constant.ErrorCode;
import com.aind.hr.constant.SuccessFlag;
import com.aind.hr.exception.CustomException;
import com.aind.hr.model.entity.LeaveRequest;
import com.aind.hr.model.response.UpdateResponse;
import com.aind.hr.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;

    public List<LeaveRequest> getLeaveRequestList() {
        return leaveRequestRepository.selectAll();
    }

    public List<LeaveRequest> getLeaveRequestsByEmployee(Integer employeeId) {
        return leaveRequestRepository.selectByEmployeeId(employeeId);
    }

    public LeaveRequest getLeaveRequest(Integer id) {
        return Optional.ofNullable(leaveRequestRepository.selectById(id))
                .orElseThrow(() -> new CustomException(ErrorCode.LEAVE_REQUEST_NOT_FOUND));
    }

    public UpdateResponse createLeaveRequest(LeaveRequest leaveRequest) {
        if (leaveRequest.getEndDate().isBefore(leaveRequest.getStartDate())) {
            throw new CustomException(ErrorCode.INVALID_INPUT, "종료일은 시작일 이후여야 합니다.");
        }
        int cnt;
        try {
            cnt = leaveRequestRepository.insert(leaveRequest);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.LEAVE_REQUEST_CREATION_FAILED);
        }
        if (cnt == 1) {
            return new UpdateResponse(SuccessFlag.YES, "휴가 신청 성공", leaveRequest.getId());
        }
        throw new CustomException(ErrorCode.LEAVE_REQUEST_CREATION_FAILED);
    }
}
