package com.aind.hr.model.entity;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class LeaveRequest {
    private Integer id;
    private Integer employeeId;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String status;
    private Integer approverId;
    // 의도적 불일치: DB 컬럼 created_at이지만 여기는 requestDate로 매핑됨
    private LocalDateTime requestDate;
    private LocalDateTime updatedAt;
}
